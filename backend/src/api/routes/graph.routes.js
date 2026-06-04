// ============================================================
// Routes: Graph Intelligence (Neo4j Sync & Health)
// /api/v1/graph/*
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import neo4jHealthService from '../../application/services/Neo4jHealthService.js';
import dependencyGraphService from '../../application/services/DependencyGraphService.js';
import neo4jSyncService from '../../application/services/Neo4jSyncService.js';
import knowledgeGraphService from '../../application/services/KnowledgeGraphService.js';

const router = Router();
router.use(authenticate);

// GET /health — Check Neo4j health and load database metrics
router.get('/health', async (req, res) => {
  const { organizationId } = req;
  const status = await neo4jHealthService.checkHealth(organizationId);
  res.json({ success: true, status });
});

// GET /dependencies — Retrieve mapping of organizational dependencies
router.get('/dependencies', async (req, res) => {
  const { organizationId } = req;
  // Trigger calculation first to ensure fresh data
  await dependencyGraphService.analyzeDependencies(organizationId);
  const result = await dependencyGraphService.getDependenciesOverview(organizationId);
  res.json(result);
});

// GET /search — Retrieve graph data search and filters
router.get('/search', async (req, res) => {
  const { organizationId } = req;
  const { limit = 100 } = req.query;
  const data = await knowledgeGraphService.getGraphData(organizationId, parseInt(limit));
  res.json({ success: true, ...data });
});

// POST /sync — Trigger incremental sync of Postgres staging nodes/edges to Neo4j
router.post('/sync', async (req, res) => {
  const { organizationId } = req;
  const result = await neo4jSyncService.syncAll(organizationId);
  res.json(result);
});

export default router;
