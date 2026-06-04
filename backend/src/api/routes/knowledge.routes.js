// ============================================================
// Phase 3: Knowledge Brain API Routes
// /api/v1/knowledge/*
// ============================================================
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { logger } from '../../infrastructure/logging/logger.js';
import organizationalMemoryService from '../../application/services/OrganizationalMemoryService.js';
import expertDiscoveryService from '../../application/services/ExpertDiscoveryService.js';
import knowledgeBrainService from '../../application/services/KnowledgeBrainService.js';
import knowledgeGraphService from '../../application/services/KnowledgeGraphService.js';
import departmentIntelligenceService from '../../application/services/DepartmentIntelligenceService.js';
import memoryAnalyticsService from '../../application/services/MemoryAnalyticsService.js';


const router = express.Router();

// ── 1. Search Experts ─────────────────────────────────────────
router.get('/experts', authenticate, async (req, res) => {
  const { q } = req.query;
  const { organizationId, user } = req;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, experts: [] });
  }

  const experts = await expertDiscoveryService.searchExperts(organizationId, q.trim(), user);
  res.json({ success: true, experts, query: q });
});

// ── 2. List All Experts ───────────────────────────────────────
router.get('/experts/all', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const experts = await expertDiscoveryService.getAllExperts(organizationId, user);
  res.json({ success: true, experts });
});

// ── 3. Expert Profile ─────────────────────────────────────────
router.get('/experts/:expertId', authenticate, async (req, res) => {
  const { organizationId } = req;
  const { expertId } = req.params;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(expertId)) {
    return res.status(400).json({ success: false, message: 'Invalid expert ID' });
  }

  const profile = await expertDiscoveryService.getExpertProfile(organizationId, expertId);
  if (!profile) return res.status(404).json({ success: false, message: 'Expert not found' });
  res.json({ success: true, profile });
});

// ── 4. Recompute All Expertise Scores ────────────────────────
router.post('/experts/recompute', authenticate, authorize('EnterpriseAdmin', 'SuperAdmin'), async (req, res) => {
  const { organizationId } = req;
  const result = await expertDiscoveryService.recomputeAllExpertise(organizationId);
  res.json({ success: true, ...result });
});

// ── 5. Knowledge Chat (Brain AI) ─────────────────────────────
router.post('/chat', authenticate, async (req, res) => {
  const { message, sessionId } = req.body;
  const { organizationId, user } = req;

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Message required' });
  }

  const result = await knowledgeBrainService.chat(
    organizationId,
    user.id,
    user.department,
    user.role,
    message.trim(),
    sessionId || null
  );

  res.json({ success: true, ...result });
});

// ── 6. Get Knowledge Sessions ─────────────────────────────────
router.get('/sessions', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const sessions = await knowledgeBrainService.getUserSessions(organizationId, user.id);
  res.json({ success: true, sessions });
});

// ── 7. Get Session by ID ──────────────────────────────────────
router.get('/sessions/:sessionId', authenticate, async (req, res) => {
  const { organizationId } = req;
  const { sessionId } = req.params;
  const session = await knowledgeBrainService.getSession(sessionId, organizationId);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({ success: true, session });
});

// ── 8. Organizational Memory ──────────────────────────────────
router.get('/memory', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const [summary, snapshot] = await Promise.all([
    organizationalMemoryService.getMemorySummary(organizationId),
    organizationalMemoryService.getOrCreateSnapshot(organizationId)
  ]);
  res.json({ success: true, summary, snapshot });
});

// ── 9. Knowledge Timeline ─────────────────────────────────────
router.get('/timeline', authenticate, async (req, res) => {
  const { organizationId } = req;
  const { limit = 50 } = req.query;
  const timeline = await organizationalMemoryService.getKnowledgeTimeline(organizationId, parseInt(limit));
  res.json({ success: true, timeline });
});

// ── 10. Build Organizational Memory ───────────────────────────
router.post('/memory/build', authenticate, authorize('EnterpriseAdmin', 'SuperAdmin'), async (req, res) => {
  const { organizationId } = req;
  const result = await organizationalMemoryService.buildOrganizationalMemory(organizationId);
  res.json({ success: true, ...result });
});

// ── 11. Knowledge Graph Stats ─────────────────────────────────
router.get('/graph', authenticate, async (req, res) => {
  const { organizationId } = req;
  const { mode = 'stats' } = req.query;

  if (mode === 'data') {
    const data = await knowledgeGraphService.getGraphData(organizationId, 150);
    return res.json({ success: true, ...data });
  }

  const stats = await knowledgeGraphService.getGraphStats(organizationId);
  res.json({ success: true, ...stats });
});

// ── 12. Build Knowledge Graph ─────────────────────────────────
router.post('/graph/build', authenticate, authorize('EnterpriseAdmin', 'SuperAdmin'), async (req, res) => {
  const { organizationId } = req;
  const result = await knowledgeGraphService.buildGraph(organizationId);
  res.json({ success: true, ...result });
});

// ── 13. Knowledge Recommendations ────────────────────────────
router.get('/recommendations', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const recs = await knowledgeBrainService.generateRecommendations(
    organizationId, user.id, user.department
  );
  res.json({ success: true, recommendations: recs });
});

// ── 14. Department Intelligence ───────────────────────────────
router.get('/departments', authenticate, async (req, res) => {
  const { organizationId } = req;
  const rankings = await departmentIntelligenceService.getDepartmentRankings(organizationId);
  res.json({ success: true, departments: rankings });
});

// ── 15. Department Profile ────────────────────────────────────
router.get('/departments/:dept', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const { dept } = req.params;
  const profile = await departmentIntelligenceService.getDepartmentProfile(
    organizationId, dept, user.role, user.department
  );
  if (!profile) return res.status(403).json({ success: false, message: 'Access denied to this department' });
  res.json({ success: true, ...profile });
});

// ── 16. Knowledge Brain Metrics ───────────────────────────────
router.get('/metrics', authenticate, async (req, res) => {
  const { organizationId } = req;
  const metrics = await knowledgeBrainService.getBrainMetrics(organizationId);
  res.json({ success: true, metrics });
});

// ── 17. Knowledge Contributions ───────────────────────────────
router.get('/contributions', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const timeline = await organizationalMemoryService.getKnowledgeTimeline(organizationId, 30);
  res.json({ success: true, contributions: timeline });
});

// ── 18. Record Contribution ───────────────────────────────────
router.post('/contributions', authenticate, async (req, res) => {
  const { organizationId, user } = req;
  const { type, documentId, domain, description } = req.body;
  await organizationalMemoryService.recordContribution(organizationId, user.id, {
    type, documentId, domain, description
  });
  res.json({ success: true, message: 'Contribution recorded' });
});

// ── 19. Memory Analytics Dashboard ───────────────────────────
router.get('/analytics', authenticate, async (req, res) => {
  const { organizationId } = req;
  const analytics = await memoryAnalyticsService.getDashboardAnalytics(organizationId);
  res.json({ success: true, ...analytics });
});

// ── 20. Knowledge Growth Trend ────────────────────────────────
router.get('/analytics/growth', authenticate, async (req, res) => {
  const { organizationId } = req;
  const { days = 30 } = req.query;
  const trend = await memoryAnalyticsService.getKnowledgeGrowthTrend(organizationId, parseInt(days));
  res.json({ success: true, trend });
});

// ── 21. Department Comparison ─────────────────────────────────
router.get('/analytics/departments', authenticate, authorize('EnterpriseAdmin', 'SuperAdmin'), async (req, res) => {
  const { organizationId } = req;
  const comparison = await memoryAnalyticsService.getDepartmentComparison(organizationId);
  res.json({ success: true, departments: comparison });
});

// ── 22. Seed Knowledge Brain (bootstrap for new orgs) ─────────
// Builds memory, graph, expertise scores and snapshot in one call
router.post('/seed', authenticate, authorize('EnterpriseAdmin', 'SuperAdmin'), async (req, res) => {
  const { organizationId } = req;
  logger.info(`🧠 Seeding Knowledge Brain for org ${organizationId}...`);

  const [memResult, graphResult, expertResult, snapshot] = await Promise.allSettled([
    organizationalMemoryService.buildOrganizationalMemory(organizationId),
    knowledgeGraphService.buildGraph(organizationId),
    expertDiscoveryService.recomputeAllExpertise(organizationId),
    organizationalMemoryService.getOrCreateSnapshot(organizationId)
  ]);

  const metrics = await knowledgeBrainService.getBrainMetrics(organizationId);

  res.json({
    success: true,
    message: 'Knowledge Brain seeded successfully',
    results: {
      memory: memResult.status === 'fulfilled' ? memResult.value : { error: memResult.reason?.message },
      graph: graphResult.status === 'fulfilled' ? graphResult.value : { error: graphResult.reason?.message },
      expertise: expertResult.status === 'fulfilled' ? expertResult.value : { error: expertResult.reason?.message },
    },
    metrics
  });
});

// ── 23. Search Knowledge (unified) ───────────────────────────
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  const { organizationId, user } = req;
  if (!q) return res.json({ success: true, results: { experts: [], documents: [], relationships: [] } });

  const [experts] = await Promise.allSettled([
    expertDiscoveryService.searchExperts(organizationId, q, user)
  ]);

  res.json({
    success: true,
    query: q,
    results: {
      experts: experts.status === 'fulfilled' ? experts.value : []
    }
  });
});

export default router;

