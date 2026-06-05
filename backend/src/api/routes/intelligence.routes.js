// ============================================================
// Routes: Document Intelligence (Phase 2 Refinements)
// AI Summarization, Classification, Similarity, Insights, Comparison, Queue, Feedback
// ============================================================
import express from 'express';
import {
  analyzeDocument,
  summarizeDocument,
  getSummary,
  classifyDocumentHandler,
  getDocumentIntelligence,
  getSimilarDocuments,
  scanDuplicates,
  getInsights,
  generateMetadata,
  compareDocuments,
  extractEntitiesHandler,
  getKnowledgeMetrics,
  getDocumentRelationshipsHandler,
  getSensitivity,
  getProcessingStatus,
  getQueueStatus,
  compareRevisionsHandler,
  submitFeedbackHandler,
  getRecommendationsHandler,
  getGapAnalysisHandler,
  getAIModelsHandler,
  getSearchStatsHandler,
  getKnowledgeTimelineHandler,
  runRetentionScanHandler,
  getFailureRecoveryHandler,
  retryFailedJobHandler,
  getGraphReadiness,
  getKnowledgeHealth,
  getKnowledgeRisk,
  getDepartmentRankingsController,
  getIntelligenceScore,
  validateAIFeedback,
  getAIExplanation,
  getEntityDeduplication,
  getValidationLogsController
} from '../controllers/intelligence.controller.js';
import {
  getKnowledgeFabric,
  getEntities,
  getRelationships,
  getDecisions,
  createDecision,
  getExecutiveReport,
  getPredictions,
  getWorkforceSummary,
  getVendors,
  getProjects,
  getDigitalTwinSnapshot
} from '../controllers/eios.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All intelligence routes require authentication + org access
router.use(authenticate);

// ── Queue Status, Knowledge Metrics, & Gap Analysis ───────────
router.get('/queue', getQueueStatus);
router.get('/knowledge', getKnowledgeMetrics);
router.get('/insights', getInsights);
router.get('/gap-analysis', getGapAnalysisHandler);

// ── Hardening Pass: Registry, Timeline, Search Stats, Expirations & Failures ──
router.get('/models', getAIModelsHandler);
router.get('/search-evaluation', getSearchStatsHandler);
router.get('/timeline', getKnowledgeTimelineHandler);
router.post('/retention-scan', runRetentionScanHandler);
router.get('/failures', getFailureRecoveryHandler);
router.post('/failures/retry', retryFailedJobHandler);

// ── Phase 2 Final Upgrades Routes ──
router.get('/graph-readiness', getGraphReadiness);
router.get('/knowledge-health', getKnowledgeHealth);
router.get('/knowledge-risk', getKnowledgeRisk);
router.get('/department-rankings', getDepartmentRankingsController);
router.get('/intelligence-score', getIntelligenceScore);
router.post('/validate', validateAIFeedback);
router.get('/validation-logs', getValidationLogsController);
router.get('/explanations/:id', getAIExplanation);
router.get('/entity-deduplication', getEntityDeduplication);

// ── Comparison, Extraction & Feedback ───────────────────────
router.post('/compare', compareDocuments);
router.post('/version-compare', compareRevisionsHandler);
router.post('/feedback', submitFeedbackHandler);
router.post('/extract', extractEntitiesHandler);

// ── Document Intelligence Pipeline ────────────────────────────
router.post('/analyze/:docId', analyzeDocument);
router.get('/status/:documentId', getProcessingStatus);
router.get('/intelligence/:docId', getDocumentIntelligence);
router.get('/recommendations/:docId', getRecommendationsHandler);

// ── Individual Stage Overrides ────────────────────────────────
router.post('/summarize/:docId', summarizeDocument);
router.get('/summary/:docId', getSummary);
router.post('/classify/:docId', classifyDocumentHandler);
router.post('/metadata/:docId', generateMetadata);

// ── Relationships & Sensitivity ────────────────────────────────
router.get('/relationships/:documentId', getDocumentRelationshipsHandler);
router.get('/similar/:docId', getSimilarDocuments);
router.get('/duplicates', scanDuplicates);
router.get('/sensitivity/:documentId', getSensitivity);

// ── Phase 7 Enterprise Intelligence OS (EIOS) Endpoints ──
router.get('/fabric', getKnowledgeFabric);
router.get('/entities', getEntities);
router.get('/relationships', getRelationships);
router.get('/decisions', getDecisions);
router.post('/decisions', createDecision);
router.get('/executive', getExecutiveReport);
router.get('/predictions', getPredictions);
router.get('/workforce', getWorkforceSummary);
router.get('/vendors', getVendors);
router.get('/projects', getProjects);
router.get('/digital-twin', getDigitalTwinSnapshot);

export default router;
