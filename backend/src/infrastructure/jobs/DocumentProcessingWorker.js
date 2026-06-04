// DocumentProcessingWorker — Phase 3: Enterprise Knowledge Brain
// Background worker that processes the AI job queue stage by stage
import { logger } from '../logging/logger.js';
import { dequeueJob, updateJobStatus } from './AIQueueService.js';
import { runFullAnalysisPipeline, generateDocumentSummary, classifyDocument, generateSmartMetadata } from '../ai/DocumentIntelligenceService.js';
import { detectSensitiveData } from '../ai/SensitiveDataService.js';
import { extractEntities } from '../ai/EntityExtractionService.js';
import { generateEmbedding } from '../ai/OllamaService.js';
import { indexDocument } from '../ai/ChromaService.js';
import { findSimilarDocuments } from '../ai/SimilarityService.js';
import { extractTextFromFile } from '../ai/OCRService.js';
import aiRepository from '../repositories/AIRepository.js';
import documentRepository from '../repositories/DocumentRepository.js';
import { query } from '../database/connection.js';

// Phase 2 refinements imports
import { publishSystemEvent } from '../events/EventService.js';
import { prepareDocumentGraphLinks } from '../ai/GraphPreparationService.js';
import { logJobFailure } from '../../application/services/JobRecoveryService.js';
import { normalizeVendorName } from '../../application/services/VendorNormalizationService.js';
import { logTimelineEvent } from '../../application/services/KnowledgeTimelineService.js';
import { registerKnowledgeAsset } from '../../application/services/KnowledgeAssetService.js';
import { validateOCRText } from '../../application/services/SecurityHardeningService.js';

// Phase 3: Knowledge Brain imports
import organizationalMemoryService from '../../application/services/OrganizationalMemoryService.js';
import expertDiscoveryService from '../../application/services/ExpertDiscoveryService.js';
import knowledgeGraphService from '../../application/services/KnowledgeGraphService.js';

const processJob = async (job) => {
  const { id: jobId, documentId, organizationId, userId } = job;
  const completedStages = [];

  try {
    updateJobStatus(jobId, { status: 'processing', currentStage: 'fetch' });
    logger.info(`🔄 Processing job ${jobId} for doc ${documentId}`);

    // Fetch document metadata & content (Refined: select owner_id)
    const docResult = await query(
      `SELECT id, name, file_path, mime_type, ocr_text, ocr_status, category, department, tags, owner_id, created_at FROM documents WHERE id = $1 AND organization_id = $2`,
      [documentId, organizationId]
    );
    if (!docResult.rows[0]) {
      throw new Error('Document not found');
    }
    const doc = docResult.rows[0];
    let text = doc.ocr_text || '';

    // Stage 1: OCR Extraction
    updateJobStatus(jobId, { currentStage: 'ocr' });
    if (!text || text.trim().length < 10) {
      logger.info(`[Stage 1/10] Running OCR on doc: ${doc.name}`);
      const ocrResult = await extractTextFromFile(doc.file_path, doc.mime_type, doc.name);
      if (ocrResult?.text) {
        text = ocrResult.text;
        await documentRepository.updateOCR(documentId, text, ocrResult.wordCount);
        logger.info(`  OCR completed: ${ocrResult.wordCount} words.`);
      }
    }
    
    // Validate OCR output quality
    await validateOCRText(organizationId, documentId, doc.name, text);
    
    completedStages.push('ocr');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    if (!text || text.trim().length < 10) {
      throw new Error('Document text extraction returned empty content; aborting remaining AI stages.');
    }

    // Stage 2: Metadata Generation
    updateJobStatus(jobId, { currentStage: 'metadata' });
    logger.info(`[Stage 2/10] Running Smart Metadata on: ${doc.name}`);
    const metadataResult = await generateSmartMetadata(doc.name, text);
    if (metadataResult.success && metadataResult.data) {
      if (metadataResult.data.vendor) {
        metadataResult.data.vendor = normalizeVendorName(metadataResult.data.vendor);
      }
      await query(
        `UPDATE documents SET metadata = metadata || $1::jsonb WHERE id = $2`,
        [JSON.stringify(metadataResult.data), documentId]
      );
    }
    completedStages.push('metadata');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 3: Classification
    updateJobStatus(jobId, { currentStage: 'classify' });
    logger.info(`[Stage 3/10] Running Classification on: ${doc.name}`);
    const classResult = await classifyDocument(doc.name, text);
    if (classResult.success && classResult.data) {
      await aiRepository.saveClassification(documentId, organizationId, classResult.data);
      
      // Register knowledge asset if matched (Policies, SOPs, Contracts, HR, etc.)
      await registerKnowledgeAsset(
        organizationId,
        documentId,
        doc.name,
        classResult.data.primary_category,
        classResult.data.department
      );

      // Publish event
      await publishSystemEvent(organizationId, 'Document Classified', {
        documentId,
        category: classResult.data.primary_category,
        department: classResult.data.department
      }, userId);
    }
    completedStages.push('classify');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 4: Entity Extraction
    updateJobStatus(jobId, { currentStage: 'entities' });
    logger.info(`[Stage 4/10] Running Entity Extraction on: ${doc.name}`);
    const entityResult = await extractEntities(doc.name, text);
    if (entityResult.success) {
      await query(
        `INSERT INTO document_entities (document_id, organization_id, entities)
         VALUES ($1,$2,$3) ON CONFLICT (document_id) DO UPDATE SET entities=EXCLUDED.entities, updated_at=NOW()`,
        [documentId, organizationId, JSON.stringify(entityResult.entities)]
      );
    }
    completedStages.push('entities');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 5: Sensitivity Detection & Compliance Metadata Integration
    updateJobStatus(jobId, { currentStage: 'sensitivity' });
    logger.info(`[Stage 5/10] Running Sensitive Data Detection on: ${doc.name}`);
    const sensitivity = detectSensitiveData(text);
    await query(
      `INSERT INTO document_sensitivity (document_id, organization_id, sensitivity_score, risk_level, detected_entities, summary)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (document_id) DO UPDATE SET
         sensitivity_score=EXCLUDED.sensitivity_score, risk_level=EXCLUDED.risk_level,
         detected_entities=EXCLUDED.detected_entities, summary=EXCLUDED.summary, updated_at=NOW()`,
      [documentId, organizationId, sensitivity.sensitivityScore, sensitivity.riskLevel, JSON.stringify(sensitivity.detectedEntities), sensitivity.summary]
    );

    // Update compliance metadata on document
    const containsSensitive = ['critical', 'high', 'medium'].includes(sensitivity.riskLevel);
    const reviewRequired = ['critical', 'high'].includes(sensitivity.riskLevel);
    const complianceRelevance = (doc.category?.toLowerCase() === 'compliance' || doc.category?.toLowerCase() === 'contracts') ? 'high' : 'none';
    const retentionPeriod = (doc.category?.toLowerCase() === 'contracts' || doc.department?.toLowerCase() === 'finance') ? 1825 : 365;
    const auditRelevant = (doc.department?.toLowerCase() === 'legal' || doc.department?.toLowerCase() === 'finance' || doc.category?.toLowerCase() === 'compliance');
    
    await query(
      `UPDATE documents SET
         contains_sensitive_data = $1,
         review_required = $2,
         compliance_relevance = $3,
         retention_period = $4,
         audit_relevant = $5
       WHERE id = $6`,
      [containsSensitive, reviewRequired, complianceRelevance, retentionPeriod, auditRelevant, documentId]
    );

    // Publish event
    await publishSystemEvent(organizationId, 'Sensitivity Detected', {
      documentId,
      riskLevel: sensitivity.riskLevel,
      sensitivityScore: sensitivity.sensitivityScore
    }, userId);

    completedStages.push('sensitivity');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 6: Embedding Generation & Indexing
    updateJobStatus(jobId, { currentStage: 'embed' });
    logger.info(`[Stage 6/10] Running Embedding Generation for: ${doc.name}`);
    const embedding = await generateEmbedding(text);
    if (embedding) {
      await indexDocument(documentId, embedding, {
        name: doc.name,
        category: doc.category || 'General',
        department: doc.department || 'General',
        organizationId,
        tags: doc.tags || [],
        uploadedAt: doc.created_at
      }, text);
      await documentRepository.markVectorIndexed(documentId, documentId);

      // Save vector reference to Postgres (spec requirement: PostgreSQL stores references, raw vectors in ChromaDB)
      await query(
        `INSERT INTO document_vectors (document_id, organization_id, vector_provider, vector_dimension, vector_database_id)
         VALUES ($1, $2, 'chromadb', 768, $3)
         ON CONFLICT (document_id) DO NOTHING`,
        [documentId, organizationId, documentId]
      );
    }
    completedStages.push('embed');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 7: Relationship Mapping & Neo4j Preparation
    updateJobStatus(jobId, { currentStage: 'relationships' });
    logger.info(`[Stage 7/10] Running Relationship Engine for: ${doc.name}`);
    const similar = await findSimilarDocuments(documentId, organizationId, 0.65);
    for (const sim of similar) {
      await aiRepository.saveDocumentRelationship(
        documentId, sim.documentId, organizationId,
        sim.relationshipType || 'similar', sim.similarityScore || 0
      );

      // Publish event
      await publishSystemEvent(organizationId, 'Relationship Created', {
        source: documentId,
        target: sim.documentId,
        type: sim.relationshipType || 'similar'
      }, userId);
    }

    // Neo4j preparation queue integrations
    await prepareDocumentGraphLinks(documentId, organizationId, doc.owner_id, doc.department, {
      vendorName: metadataResult.data?.vendor,
      projectName: metadataResult.data?.project,
      policyReference: metadataResult.data?.policyReference
    });

    completedStages.push('relationships');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 8: Summary Generation
    updateJobStatus(jobId, { currentStage: 'summarize' });
    logger.info(`[Stage 8/10] Running Summary Generation for: ${doc.name}`);
    const summaryResult = await generateDocumentSummary(doc.name, text);
    if (summaryResult.success && summaryResult.data) {
      await aiRepository.saveSummary(documentId, organizationId, summaryResult.data);
      // Publish event
      await publishSystemEvent(organizationId, 'AI Summary Generated', {
        documentId,
        summaryLength: summaryResult.data.executive_summary?.length || 0
      }, userId);
    }
    completedStages.push('summarize');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Stage 9: Knowledge Scoring & Metrics Update
    updateJobStatus(jobId, { currentStage: 'knowledge' });
    logger.info(`[Stage 9/10] Updating Knowledge Metrics...`);
    const stats = await aiRepository.getOrganizationKnowledgeStats(organizationId);
    const summarizedPct = stats.totalDocuments > 0 ? (stats.summarizedDocuments / stats.totalDocuments) * 100 : 0;
    const classifiedPct = stats.totalDocuments > 0 ? (stats.classifiedDocuments / stats.totalDocuments) * 100 : 0;
    const organizationKnowledgeScore = parseFloat(((summarizedPct + classifiedPct) / 2).toFixed(2));
    const knowledgeRiskLevel = stats.riskBreakdown.some(r => r.risk_level === 'critical' && r.count > 0) ? 'high' : 'low';

    const todayStr = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO knowledge_metrics (organization_id, metric_date, total_documents, summarized_documents, classified_documents, organization_knowledge_score, knowledge_risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (organization_id, metric_date) DO UPDATE SET
         total_documents = EXCLUDED.total_documents,
         summarized_documents = EXCLUDED.summarized_documents,
         classified_documents = EXCLUDED.classified_documents,
         organization_knowledge_score = EXCLUDED.organization_knowledge_score,
         knowledge_risk_level = EXCLUDED.knowledge_risk_level`,
      [organizationId, todayStr, stats.totalDocuments, stats.summarizedDocuments, stats.classifiedDocuments, organizationKnowledgeScore, knowledgeRiskLevel]
    );

    // Update department metrics
    if (doc.department) {
      await query(
        `INSERT INTO department_metrics (organization_id, department, documentation_score, knowledge_coverage, missing_documentation, upload_trends)
         VALUES ($1, $2, $3, $4, '[]'::jsonb, '{"daily_uploads": 1}'::jsonb)
         ON CONFLICT (organization_id, department) DO UPDATE SET
           documentation_score = (department_metrics.documentation_score + $3) / 2,
           knowledge_coverage = (department_metrics.knowledge_coverage + $4) / 2,
           updated_at = NOW()`,
        [organizationId, doc.department, organizationKnowledgeScore, summarizedPct]
      );
    }

    completedStages.push('knowledge');
    updateJobStatus(jobId, { stagesCompleted: completedStages });

    // Track Document Lifecycle Stage (Stage 10: Complete)
    await query(
      `INSERT INTO document_lifecycle (document_id, organization_id, current_stage, stage_history)
       VALUES ($1, $2, 'Reviewed', $3::jsonb)
       ON CONFLICT (document_id) DO UPDATE SET 
         current_stage = 'Approved', 
         stage_history = document_lifecycle.stage_history || $4::jsonb,
         last_updated = NOW()`,
      [
        documentId, 
        organizationId, 
        JSON.stringify([{ stage: 'Uploaded', timestamp: new Date().toISOString() }, { stage: 'Reviewed', timestamp: new Date().toISOString() }]),
        JSON.stringify([{ stage: 'Approved', timestamp: new Date().toISOString() }])
      ]
    );

    // Log complete interaction
    await aiRepository.logAIInteraction({
      organizationId,
      userId,
      documentId,
      interactionType: 'analyze',
      status: 'success',
      metadata: { jobId, completedStages }
    });

    // Log timeline event for Organizational Memory
    await logTimelineEvent({
      organizationId,
      documentId,
      timelineType: 'Knowledge Added',
      title: `AI Intelligence Extracted: ${doc.name}`,
      details: `Successfully completed all processing pipelines including OCR text, sensitivity, and vector indexing. Mapped department: ${doc.department || 'General'}.`,
      triggeredBy: userId
    });

    // ── Phase 3: Record knowledge contribution & update expertise ──
    if (userId) {
      try {
        await organizationalMemoryService.recordContribution(organizationId, userId, {
          type: 'document_upload',
          documentId,
          domain: classResult?.data?.primary_category || doc.category || 'General',
          description: `Uploaded and processed: ${doc.name}`,
          qualityScore: 1.0
        });
        logger.info(`  📊 [Phase3] Knowledge contribution recorded for user ${userId}`);
      } catch (p3err) {
        logger.warn(`  Phase 3 contribution hook failed: ${p3err.message}`);
      }
    }

    // ── Phase 3: Update Knowledge Graph node for this document ──
    try {
      await knowledgeGraphService._upsertNode(organizationId, 'Document', documentId, doc.name, {
        category: doc.category, department: doc.department, processed: true
      });
      if (userId) {
        const docNode = await knowledgeGraphService._findNode(organizationId, 'Document', documentId);
        const userNode = await knowledgeGraphService._findNode(organizationId, 'Employee', userId);
        if (docNode && userNode) {
          await knowledgeGraphService._upsertEdge(organizationId, docNode.id, userNode.id, 'CREATED_BY', 1.0);
        }
      }
    } catch (graphErr) {
      logger.warn(`  Phase 3 graph hook failed: ${graphErr.message}`);
    }

    updateJobStatus(jobId, { status: 'completed', currentStage: 'done', completedAt: new Date().toISOString() });
    logger.info(`✅ Job ${jobId} completed successfully for doc ${documentId}`);
  } catch (err) {
    logger.error(`❌ Job ${jobId} failed at stage: ${job.currentStage} - ${err.message}`);
    updateJobStatus(jobId, { status: 'failed', error: err.message });
    
    // Log failed interaction
    await aiRepository.logAIInteraction({
      organizationId,
      userId,
      documentId,
      interactionType: 'analyze',
      status: 'failed',
      error_message: err.message,
      metadata: { jobId, completedStages }
    });

    // Log to job failures table for automatic recovery/resume
    await logJobFailure(jobId, documentId, job.currentStage || 'ocr', err.message);
  }
};

let workerRunning = false;

export const startWorker = () => {
  if (workerRunning) return;
  workerRunning = true;
  logger.info('🚀 AI Document Processing Worker started');

  const poll = async () => {
    while (workerRunning) {
      try {
        const job = await dequeueJob();
        if (job) {
          await processJob(job);
        } else {
          await new Promise(r => setTimeout(r, 3000)); // Poll every 3 seconds
        }
      } catch (err) {
        logger.error(`Worker error: ${err.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  poll().catch(err => logger.error(`Worker crashed: ${err.message}`));
};

export const stopWorker = () => { workerRunning = false; };

export default { startWorker, stopWorker };
