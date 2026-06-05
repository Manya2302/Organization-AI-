import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getTwinSnapshot,
  syncTwin,
  getSimulationRuns,
  runSimulation,
  getScenarios,
  createScenario,
  getForecasts,
  generateForecasts,
  getStrategyRoadmaps,
  generateStrategy,
  getDecisionSimulations,
  simulateDecision,
  getResilienceMetrics,
  getWarRoomStatus,
  createAlert,
  resolveAlert,
  getCouncilSessions,
  runCouncilSession,
  syncTwinIncremental,
  getSimulationTemplates,
  runTemplateSimulation,
  getStrategicRecommendations,
  getDecisionHistory,
  recordActualOutcome,
  getEnterpriseHealthIndex
} from '../controllers/digitalTwin.controller.js';

const router = express.Router();

// Enforce auth & tenant parameters
router.use(authenticate);

// ── 1. Digital Twin Core ──
router.get('/twin/entities', getTwinSnapshot);
router.post('/twin/sync', syncTwin);
router.route('/twin/simulate')
  .get(getSimulationRuns)
  .post(runSimulation);

// ── 2. Scenario Planning ──
router.route('/scenarios')
  .get(getScenarios)
  .post(createScenario);

// ── 3. Forecasting ──
router.route('/forecasts')
  .get(getForecasts)
  .post(generateForecasts);

// ── 4. Strategy Roadmaps ──
router.route('/strategy')
  .get(getStrategyRoadmaps)
  .post(generateStrategy);

// ── 5. Decision Simulation ──
router.route('/decisions/simulate')
  .get(getDecisionSimulations)
  .post(simulateDecision);

// ── 6. Resilience Engine ──
router.get('/resilience', getResilienceMetrics);

// ── 7. Executive War Room ──
router.get('/warroom', getWarRoomStatus);
router.post('/warroom/alert', createAlert);
router.post('/warroom/resolve', resolveAlert);

// ── 8. Cognitive AI Council ──
router.route('/council')
  .get(getCouncilSessions)
  .post(runCouncilSession);

// ── 9. Advanced Phase 9 Routes ──
router.post('/twin/sync-incremental', syncTwinIncremental);
router.get('/twin/simulation-templates', getSimulationTemplates);
router.post('/twin/simulate-template', runTemplateSimulation);
router.get('/twin/strategic-recommendations', getStrategicRecommendations);
router.get('/twin/decision-history', getDecisionHistory);
router.post('/twin/decision-actual', recordActualOutcome);
router.get('/twin/health-index', getEnterpriseHealthIndex);

export default router;
