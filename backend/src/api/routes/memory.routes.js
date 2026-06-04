// ============================================================
// Routes: Organizational Memory & Successor Intelligence
// /api/v1/memory/*
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import knowledgeFreshnessService from '../../application/services/KnowledgeFreshnessService.js';
import knowledgeOwnershipService from '../../application/services/KnowledgeOwnershipService.js';
import knowledgeConfidenceService from '../../application/services/KnowledgeConfidenceService.js';
import successorRecommendationService from '../../application/services/SuccessorRecommendationService.js';
import criticalKnowledgeService from '../../application/services/CriticalKnowledgeService.js';
import memoryEvolutionService from '../../application/services/MemoryEvolutionService.js';

const router = Router();
router.use(authenticate);

// GET /freshness — Get knowledge freshness details
router.get('/freshness', async (req, res) => {
  const { organizationId } = req;
  await knowledgeFreshnessService.calculateFreshness(organizationId);
  const result = await knowledgeFreshnessService.getFreshnessOverview(organizationId);
  res.json(result);
});

// GET /ownership — Get knowledge ownership framework metrics
router.get('/ownership', async (req, res) => {
  const { organizationId } = req;
  const result = await knowledgeOwnershipService.getOwnershipCoverage(organizationId);
  res.json({ success: true, ...result });
});

// GET /confidence — Get knowledge confidence details
router.get('/confidence', async (req, res) => {
  const { organizationId } = req;
  await knowledgeConfidenceService.calculateConfidence(organizationId);
  const result = await knowledgeConfidenceService.getConfidenceOverview(organizationId);
  res.json(result);
});

// GET /succession — Get successor recommendation candidates
router.get('/succession', async (req, res) => {
  const { organizationId } = req;
  await successorRecommendationService.generateRecommendations(organizationId);
  const result = await successorRecommendationService.getRecommendationsOverview(organizationId);
  res.json(result);
});

// GET /critical — Get critical knowledge registry
router.get('/critical', async (req, res) => {
  const { organizationId } = req;
  await criticalKnowledgeService.evaluateCriticalAssets(organizationId);
  const result = await criticalKnowledgeService.getCriticalRegistry(organizationId);
  res.json(result);
});

// GET /evolution — Get memory evolution history and timelines
router.get('/evolution', async (req, res) => {
  const { organizationId } = req;
  const timelineRes = await memoryEvolutionService.getEvolutionTimeline(organizationId);
  const statsRes = await memoryEvolutionService.getGrowthStats(organizationId);
  res.json({
    success: true,
    timeline: timelineRes.timeline,
    growthStats: statsRes.growthStats
  });
});

export default router;
