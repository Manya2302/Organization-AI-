// ====================================================================
// AEOPRoutes — Phase 8 Autonomous Enterprise Operations Routes
// ====================================================================
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getWorkflows,
  createWorkflow,
  getActions,
  createAction,
  getRecommendations,
  acceptRecommendation,
  getAutomationRules,
  getDecisions,
  executeDecision,
  getPlanningRoadmaps,
  generatePlan,
  getOperationalRisks,
  getCommandCenter,
  getOutcomes,
  getDigitalWorkforce,
  triggerAgentTask,
  getNotifications
} from '../controllers/aeop.controller.js';

const router = express.Router();

// Enforce auth & tenant parameters
router.use(authenticate);

router.route('/workflows')
  .get(getWorkflows)
  .post(createWorkflow);

router.route('/actions')
  .get(getActions)
  .post(createAction);

router.route('/recommendations')
  .get(getRecommendations)
  .post(acceptRecommendation);

router.get('/automation', getAutomationRules);

router.route('/decisions')
  .get(getDecisions)
  .post(executeDecision);

router.route('/planning')
  .get(getPlanningRoadmaps)
  .post(generatePlan);

router.get('/risks', getOperationalRisks);
router.get('/command-center', getCommandCenter);
router.get('/outcomes', getOutcomes);

router.route('/agents')
  .get(getDigitalWorkforce)
  .post(triggerAgentTask);

router.get('/notifications', getNotifications);

export default router;
