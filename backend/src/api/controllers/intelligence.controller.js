// ============================================================
// API Controller: Document Intelligence (Phase 2)
// AI Summarization, Classification, Similarity, Insights, Comparison, Queue
// ============================================================
import {
  generateDocumentSummary,
  classifyDocument,
  generateSmartMetadata,
  runFullAnalysisPipeline
} from '../../infrastructure/ai/DocumentIntelligenceService.js';
import {
  findSimilarDocuments,
  findOrganizationDuplicates
} from '../../infrastructure/ai/SimilarityService.js';
import { detectSensitiveData } from '../../infrastructure/ai/SensitiveDataService.js';
import { extractEntities } from '../../infrastructure/ai/EntityExtractionService.js';
import { getQueueStats, getJobStatus } from '../../infrastructure/jobs/AIQueueService.js';
import aiRepository from '../../infrastructure/repositories/AIRepository.js';
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { query } from '../../infrastructure/database/connection.js';
import { generateRAGResponse } from '../../infrastructure/ai/OllamaService.js';

// Refinements imports
import { verifyTenantAccess, verifyDocumentAccess } from '../../infrastructure/security/TenantAccessService.js';
import { compareVersions } from '../../infrastructure/ai/VersionComparisonService.js';
import { detectKnowledgeGaps } from '../../infrastructure/ai/KnowledgeGapService.js';
import { getDocumentRecommendations } from '../../infrastructure/ai/RecommendationService.js';

// Hardening Service Imports
import { getSearchQualityStats } from '../../application/services/SearchEvaluationService.js';
import { getKnowledgeTimeline } from '../../application/services/KnowledgeTimelineService.js';
import { checkDocumentRetentionAndExpirations } from '../../application/services/DocumentRetentionService.js';
import { getFailedJobs, retryFailedJob } from '../../application/services/JobRecoveryService.js';

// Phase 2 Final Upgrade Service Imports
import { GraphReadinessService } from '../../application/services/GraphReadinessService.js';
import { EntityDeduplicationService } from '../../application/services/EntityDeduplicationService.js';
import { DepartmentKnowledgeService } from '../../application/services/DepartmentKnowledgeService.js';
import { KnowledgeRiskService } from '../../application/services/KnowledgeRiskService.js';
import { AIExplainabilityService } from '../../application/services/AIExplainabilityService.js';
import { HumanValidationService } from '../../application/services/HumanValidationService.js';
import { MaturityModelService } from '../../application/services/MaturityModelService.js';


// ─── Helper: Get document and validate access ─────────────────
const getDocumentOrFail = async (docId, user) => {
  return await verifyDocumentAccess(docId, user);
};

// ─────────────────────────────────────────────────────────────────
// POST /intelligence/analyze/:docId
// Full AI analysis pipeline: summary + classification + metadata
// ─────────────────────────────────────────────────────────────────
export const analyzeDocument = async (req, res) => {
  const { docId } = req.params;
  const doc = await getDocumentOrFail(docId, req.user);

  logger.info(`🤖 Full AI analysis for: ${doc.name} (${docId})`);

  if (!doc.ocrText || doc.ocrText.trim().length < 30) {
    return res.status(422).json({
      success: false,
      message: 'Document has no extractable text. Please ensure OCR processing is complete.',
      ocrStatus: doc.ocrStatus
    });
  }

  const pipelineResult = await runFullAnalysisPipeline(doc.name, doc.ocrText);

  // Save summary
  let savedSummary = null;
  if (pipelineResult.summary?.success && pipelineResult.summary.data) {
    savedSummary = await aiRepository.saveSummary(docId, req.organizationId, pipelineResult.summary.data);
  }

  // Save classification
  let savedClassification = null;
  if (pipelineResult.classification?.success && pipelineResult.classification.data) {
    savedClassification = await aiRepository.saveClassification(docId, req.organizationId, pipelineResult.classification.data);
  }

  // Run sensitivity scan too
  const sensitivityResult = detectSensitiveData(doc.ocrText);
  await query(
    `INSERT INTO document_sensitivity (document_id, organization_id, sensitivity_score, risk_level, detected_entities, summary)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (document_id) DO UPDATE SET
       sensitivity_score=EXCLUDED.sensitivity_score, risk_level=EXCLUDED.risk_level,
       detected_entities=EXCLUDED.detected_entities, summary=EXCLUDED.summary, updated_at=NOW()`,
    [docId, req.organizationId, sensitivityResult.sensitivityScore, sensitivityResult.riskLevel, JSON.stringify(sensitivityResult.detectedEntities), sensitivityResult.summary]
  );

  // Log AI interaction
  await aiRepository.logAIInteraction({
    organizationId: req.organizationId,
    userId: req.user.id,
    documentId: docId,
    interactionType: 'analyze',
    latencyMs: pipelineResult.totalLatencyMs,
    status: 'success',
    metadata: { documentName: doc.name }
  });

  res.json({
    success: true,
    documentId: docId,
    documentName: doc.name,
    summary: savedSummary,
    classification: savedClassification,
    sensitivity: sensitivityResult,
    metadata: pipelineResult.metadata?.data || {},
    totalLatencyMs: pipelineResult.totalLatencyMs
  });
};

// ─────────────────────────────────────────────────────────────────
// POST /intelligence/summarize/:docId
// Generate/regenerate AI summary only
// ─────────────────────────────────────────────────────────────────
export const summarizeDocument = async (req, res) => {
  const { docId } = req.params;
  const doc = await getDocumentOrFail(docId, req.user);

  if (!doc.ocrText || doc.ocrText.trim().length < 30) {
    return res.status(422).json({
      success: false,
      message: 'Document text not available for summarization.'
    });
  }

  const start = Date.now();
  const result = await generateDocumentSummary(doc.name, doc.ocrText);
  const latencyMs = Date.now() - start;

  if (!result.success) {
    return res.status(503).json({
      success: false,
      message: 'AI summarization failed. Ensure Ollama is running.',
      error: result.error
    });
  }

  const saved = await aiRepository.saveSummary(docId, req.organizationId, result.data);

  await aiRepository.logAIInteraction({
    organizationId: req.organizationId,
    userId: req.user.id,
    documentId: docId,
    interactionType: 'summarize',
    latencyMs,
    status: 'success'
  });

  res.json({ success: true, summary: saved, latencyMs });
};

// ─────────────────────────────────────────────────────────────────
// GET /intelligence/summary/:docId
// Retrieve stored summary for a document
// ─────────────────────────────────────────────────────────────────
export const getSummary = async (req, res) => {
  const { docId } = req.params;
  await getDocumentOrFail(docId, req.user); // Access check

  const summary = await aiRepository.getSummaryByDocumentId(docId, req.organizationId);

  res.json({
    success: true,
    hasSummary: !!summary,
    summary: summary || null
  });
};

// ─────────────────────────────────────────────────────────────────
// POST /intelligence/classify/:docId
// Classify a document only
// ─────────────────────────────────────────────────────────────────
export const classifyDocumentHandler = async (req, res) => {
  const { docId } = req.params;
  const doc = await getDocumentOrFail(docId, req.user);

  const start = Date.now();
  const result = await classifyDocument(doc.name, doc.ocrText || '');
  const latencyMs = Date.now() - start;

  if (!result.success) {
    return res.status(503).json({
      success: false,
      message: 'Classification failed.',
      error: result.error
    });
  }

  const saved = await aiRepository.saveClassification(docId, req.organizationId, result.data);

  await aiRepository.logAIInteraction({
    organizationId: req.organizationId,
    userId: req.user.id,
    documentId: docId,
    interactionType: 'classify',
    latencyMs,
    status: 'success'
  });

  res.json({ success: true, classification: saved, latencyMs });
};

// ─────────────────────────────────────────────────────────────────
// GET /intelligence/intelligence/:docId
// Get full intelligence (summary + classification + relationships)
// ─────────────────────────────────────────────────────────────────
export const getDocumentIntelligence = async (req, res) => {
  const { docId } = req.params;
  const doc = await getDocumentOrFail(docId, req.organizationId);

  const intelligence = await aiRepository.getFullDocumentIntelligence(docId, req.organizationId);
  const sensitivityResult = await query(
    `SELECT * FROM document_sensitivity WHERE document_id = $1 AND organization_id = $2`,
    [docId, req.organizationId]
  );
  const entitiesResult = await query(
    `SELECT * FROM document_entities WHERE document_id = $1 AND organization_id = $2`,
    [docId, req.organizationId]
  );

  res.json({
    success: true,
    document: {
      id: doc.id,
      name: doc.name,
      category: doc.category,
      department: doc.department,
      fileSize: doc.fileSize,
      ocrStatus: doc.ocrStatus,
      hasOcrText: !!(doc.ocrText && doc.ocrText.length > 0)
    },
    intelligence: {
      ...intelligence,
      sensitivity: sensitivityResult.rows[0] || null,
      entities: entitiesResult.rows[0]?.entities || null
    }
  });
};

// ─── GET /intelligence/relationships/:documentId ─────────────────
export const getDocumentRelationshipsHandler = async (req, res) => {
  const { documentId } = req.params;
  await getDocumentOrFail(documentId, req.organizationId);

  const relationships = await aiRepository.getDocumentRelationships(documentId, req.organizationId);
  res.json({ success: true, relationships });
};

// ─────────────────────────────────────────────────────────────────
// GET /intelligence/similar/:docId
// Find similar/duplicate documents
// ─────────────────────────────────────────────────────────────────
export const getSimilarDocuments = async (req, res) => {
  const { docId } = req.params;
  const threshold = parseFloat(req.query.threshold) || 0.75;
  await getDocumentOrFail(docId, req.organizationId); // Access check

  const similar = await findSimilarDocuments(docId, req.organizationId, threshold);

  // Save relationships to DB
  for (const sim of similar) {
    await aiRepository.saveDocumentRelationship(
      docId, sim.documentId, req.organizationId,
      sim.relationshipType, sim.similarityScore
    );
  }

  await aiRepository.logAIInteraction({
    organizationId: req.organizationId,
    userId: req.user.id,
    documentId: docId,
    interactionType: 'similar',
    status: 'success',
    metadata: { foundCount: similar.length }
  });

  res.json({ success: true, similarDocuments: similar, count: similar.length });
};

// ─────────────────────────────────────────────────────────────────
// GET /intelligence/duplicates
// Scan entire organization for duplicates
// ─────────────────────────────────────────────────────────────────
export const scanDuplicates = async (req, res) => {
  const result = await findOrganizationDuplicates(req.organizationId);

  res.json({
    success: true,
    ...result,
    clusterCount: result.clusters.length
  });
};

// ─────────────────────────────────────────────────────────────────
// GET /intelligence/insights
// Organization knowledge insights & statistics
// ─────────────────────────────────────────────────────────────────
export const getInsights = async (req, res) => {
  const [stats, recentActivity] = await Promise.all([
    aiRepository.getOrganizationKnowledgeStats(req.organizationId),
    aiRepository.getRecentAIActivity(req.organizationId, 15)
  ]);

  res.json({
    success: true,
    stats,
    recentActivity,
    generatedAt: new Date().toISOString()
  });
};

// ─────────────────────────────────────────────────────────────────
// POST /intelligence/metadata/:docId
// Generate smart metadata only
// ─────────────────────────────────────────────────────────────────
export const generateMetadata = async (req, res) => {
  const { docId } = req.params;
  const doc = await getDocumentOrFail(docId, req.user);

  const result = await generateSmartMetadata(doc.name, doc.ocrText || '');

  if (!result.success) {
    return res.status(503).json({
      success: false,
      message: 'Metadata generation failed.',
      error: result.error
    });
  }

  res.json({ success: true, metadata: result.data, latencyMs: result.latencyMs });
};

// ─────────────────────────────────────────────────────────────────
// NEW ENDPOINTS (PHASE 2 UPGRADE SPECIFICATION)
// ─────────────────────────────────────────────────────────────────

// POST /api/v1/intelligence/compare
export const compareDocuments = async (req, res) => {
  const { docId1, docId2 } = req.body;
  if (!docId1 || !docId2) throw createError('Two document IDs are required.', 400);

  const doc1 = await getDocumentOrFail(docId1, req.user);
  const doc2 = await getDocumentOrFail(docId2, req.user);

  const prompt = `Compare these two corporate documents and output a structured comparison in JSON format (only JSON, no extra text):
Document A: "${doc1.name}"
Document A Content Excerpt: ${doc1.ocrText?.substring(0, 2000) || 'None'}

Document B: "${doc2.name}"
Document B Content Excerpt: ${doc2.ocrText?.substring(0, 2000) || 'None'}

JSON Schema response:
{
  "documentSimilarityScore": 0.85,
  "comparisonSummary": "Overview of differences and similarities",
  "matchingClauses": ["matching clause 1", "matching clause 2"],
  "conflictingClauses": ["conflicting clause 1", "conflicting clause 2"],
  "riskDifference": "risk assessment comparison details"
}`;

  const compareRes = await generateRAGResponse(prompt, [], []);
  let comparison = {};
  try {
    const jsonMatch = compareRes.content.match(/```json\s*([\s\S]*?)\s*```/) || compareRes.content.match(/\{[\s\S]*\}/);
    comparison = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : compareRes.content);
  } catch (err) {
    comparison = { raw: compareRes.content };
  }

  await aiRepository.logAIInteraction({
    organizationId: req.organizationId,
    userId: req.user.id,
    interactionType: 'chat',
    status: 'success',
    metadata: { docId1, docId2 }
  });

  res.json({ success: true, comparison });
};

// POST /api/v1/intelligence/extract
export const extractEntitiesHandler = async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) throw createError('documentId is required.', 400);

  const doc = await getDocumentOrFail(documentId, req.user);
  const result = await extractEntities(doc.name, doc.ocrText || '');

  if (result.success) {
    await query(
      `INSERT INTO document_entities (document_id, organization_id, entities)
       VALUES ($1,$2,$3) ON CONFLICT (document_id) DO UPDATE SET entities=EXCLUDED.entities, updated_at=NOW()`,
      [documentId, req.organizationId, JSON.stringify(result.entities)]
    );
  }

  res.json(result);
};

// GET /api/v1/intelligence/knowledge
export const getKnowledgeMetrics = async (req, res) => {
  const stats = await aiRepository.getOrganizationKnowledgeStats(req.organizationId);
  
  // Calculate knowledge scoring metrics for organizational maturity
  const summarizedPct = stats.totalDocuments > 0 ? (stats.summarizedDocuments / stats.totalDocuments) * 100 : 0;
  const classifiedPct = stats.totalDocuments > 0 ? (stats.classifiedDocuments / stats.totalDocuments) * 100 : 0;
  
  const organizationKnowledgeScore = parseFloat(((summarizedPct + classifiedPct) / 2).toFixed(2));
  const knowledgeRiskLevel = stats.riskBreakdown.some(r => r.risk_level === 'critical' && r.count > 0) ? 'high' : 'low';

  res.json({
    success: true,
    stats: {
      ...stats,
      organizationKnowledgeScore,
      knowledgeRiskLevel,
      documentationCoverage: parseFloat(summarizedPct.toFixed(2)),
      knowledgeGrowthRate: 12.5 // Mock growth rate
    }
  });
};

// GET /api/v1/intelligence/sensitivity/:documentId
export const getSensitivity = async (req, res) => {
  const { documentId } = req.params;
  await getDocumentOrFail(documentId, req.user);

  const result = await query(
    `SELECT * FROM document_sensitivity WHERE document_id = $1 AND organization_id = $2`,
    [documentId, req.organizationId]
  );

  res.json({
    success: true,
    sensitivity: result.rows[0] || { sensitivity_score: 0, risk_level: 'low', detected_entities: [], summary: 'No sensitive data detected or scanning pending.' }
  });
};

// GET /api/v1/intelligence/status/:documentId
export const getProcessingStatus = async (req, res) => {
  const { documentId } = req.params;
  await getDocumentOrFail(documentId, req.user); // Security validation
  const result = await query(
    `SELECT * FROM processing_jobs WHERE document_id = $1 AND organization_id = $2 ORDER BY queued_at DESC LIMIT 1`,
    [documentId, req.organizationId]
  );
  res.json({ success: true, job: result.rows[0] || null });
};

// GET /api/v1/intelligence/queue
export const getQueueStatus = async (req, res) => {
  const stats = await getQueueStats();
  res.json({ success: true, stats });
};

// ── Refinement Endpoint: Compare Revisions (Version Intelligence) ──
export const compareRevisionsHandler = async (req, res) => {
  const { docIdA, docIdB } = req.body;
  if (!docIdA || !docIdB) throw createError('Two document IDs are required for version comparison.', 400);
  
  // Enforce tenant isolation validation
  await verifyDocumentAccess(docIdA, req.user);
  await verifyDocumentAccess(docIdB, req.user);

  const result = await compareVersions(docIdA, docIdB, req.organizationId);
  res.json({ success: true, comparison: result });
};

// ── Refinement Endpoint: Submit AI Quality Feedback ─────────────────
export const submitFeedbackHandler = async (req, res) => {
  const { documentId, feature, feedbackType, userComments, modelUsed } = req.body;
  if (!feature || !feedbackType) throw createError('Feature and feedback type are required.', 400);

  if (documentId) {
    await verifyDocumentAccess(documentId, req.user);
  }

  await query(
    `INSERT INTO ai_quality_metrics (organization_id, document_id, user_id, feature, feedback_type, user_comments, model_used)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.organizationId, documentId || null, req.user.id, feature, feedbackType, userComments || '', modelUsed || 'qwen3:8b']
  );

  res.json({ success: true, message: 'AI Quality feedback recorded successfully.' });
};

// ── Refinement Endpoint: Get Document Recommendations ──────────────
export const getRecommendationsHandler = async (req, res) => {
  const { docId } = req.params;
  await getDocumentOrFail(docId, req.user);
  
  const result = await getDocumentRecommendations(docId, req.organizationId);
  res.json({ success: true, ...result });
};

// ── Refinement Endpoint: Get Knowledge Gap Analysis ──────────────────
export const getGapAnalysisHandler = async (req, res) => {
  const result = await detectKnowledgeGaps(req.organizationId);
  res.json({ success: true, ...result });
};

// ── Hardening Endpoints: Models, Search Evaluation, Timeline, Failures ──

export const getAIModelsHandler = async (req, res) => {
  const result = await query(`SELECT * FROM ai_models ORDER BY active DESC, model_name ASC`);
  res.json({ success: true, models: result.rows });
};

export const getSearchStatsHandler = async (req, res) => {
  const stats = await getSearchQualityStats(req.organizationId);
  res.json({ success: true, stats });
};

export const getKnowledgeTimelineHandler = async (req, res) => {
  const limit = parseInt(req.query.limit || 30);
  const timeline = await getKnowledgeTimeline(req.organizationId, limit);
  res.json({ success: true, timeline });
};

export const runRetentionScanHandler = async (req, res) => {
  const result = await checkDocumentRetentionAndExpirations(req.organizationId);
  res.json({ success: true, ...result });
};

export const getFailureRecoveryHandler = async (req, res) => {
  const failures = await getFailedJobs(req.organizationId);
  res.json({ success: true, failures });
};

export const retryFailedJobHandler = async (req, res) => {
  const { failureId } = req.body;
  if (!failureId) throw createError('Failure ID is required for retry.', 400);
  const result = await retryFailedJob(failureId, req.organizationId);
  res.json(result);
};

// ─── Phase 2 Final Upgrades Handlers ───

// GET /api/v1/intelligence/graph-readiness
export const getGraphReadiness = async (req, res) => {
  const metrics = await GraphReadinessService.getLatestMetrics(req.organizationId);
  res.json({ success: true, ...metrics });
};

// GET /api/v1/intelligence/knowledge-health
export const getKnowledgeHealth = async (req, res) => {
  const statsRes = await query(
    `SELECT COUNT(*) as total_docs,
            COUNT(*) FILTER(WHERE category IS NOT NULL AND category != 'General') as classified,
            COUNT(*) FILTER(WHERE metadata->'summary' IS NOT NULL) as summarized,
            COUNT(*) FILTER(WHERE metadata->'entities' IS NOT NULL) as entitied
     FROM documents WHERE organization_id = $1 AND is_deleted = FALSE`,
    [req.organizationId]
  );
  const docStats = statsRes.rows[0] || { total_docs: 0, classified: 0, summarized: 0, entitied: 0 };
  const total = parseInt(docStats.total_docs);
  
  res.json({
    success: true,
    totalDocuments: total,
    classifiedDocuments: parseInt(docStats.classified),
    summarizedDocuments: parseInt(docStats.summarized),
    entitiedDocuments: parseInt(docStats.entitied),
    healthScore: total > 0 ? Math.round(
      ((parseInt(docStats.classified) / total) * 30) +
      ((parseInt(docStats.summarized) / total) * 40) +
      ((parseInt(docStats.entitied) / total) * 30)
    ) : 70
  });
};

// GET /api/v1/intelligence/knowledge-risk
export const getKnowledgeRisk = async (req, res) => {
  const risk = await KnowledgeRiskService.getLatestRiskMetrics(req.organizationId);
  res.json({ success: true, risk });
};

// GET /api/v1/intelligence/department-rankings
export const getDepartmentRankingsController = async (req, res) => {
  const rankings = await DepartmentKnowledgeService.getDepartmentRankings(req.organizationId);
  res.json({ success: true, rankings });
};

// GET /api/v1/intelligence/intelligence-score
export const getIntelligenceScore = async (req, res) => {
  const score = await MaturityModelService.getMaturityMetrics(req.organizationId);
  res.json({ success: true, ...score });
};

// POST /api/v1/intelligence/validate
export const validateAIFeedback = async (req, res) => {
  const { targetType, targetId, fieldName, feedback, reason } = req.body;
  if (!targetType || !targetId || !feedback) {
    throw createError('targetType, targetId, and feedback are required.', 400);
  }
  const log = await HumanValidationService.validateFeedback({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    targetType,
    targetId,
    fieldName,
    feedback,
    reason
  });
  res.json({ success: true, log });
};

// GET /api/v1/intelligence/explanations/:id
export const getAIExplanation = async (req, res) => {
  const { id } = req.params;
  const explanation = await AIExplainabilityService.getExplanation(id);
  res.json({ success: true, explanation });
};

// GET /api/v1/intelligence/entity-deduplication
export const getEntityDeduplication = async (req, res) => {
  const registry = await EntityDeduplicationService.getDeduplicatedRegistry(req.organizationId);
  res.json({ success: true, registry });
};

// GET /api/v1/intelligence/validation-logs
export const getValidationLogsController = async (req, res) => {
  const logs = await HumanValidationService.getValidationLogs(req.organizationId);
  res.json({ success: true, logs });
};



