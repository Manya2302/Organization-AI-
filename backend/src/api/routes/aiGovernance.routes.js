// ============================================================
// Routes: AI Governance Center — Phase 6
// All AI Governance, Model, Prompt, Risk, Trust APIs
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  // Governance
  getGovernanceDashboard,
  getGovernanceAuditTrail,
  // Models
  getModels,
  registerModel,
  updateModelStatus,
  getModelVersions,
  getModelPerformance,
  // Prompts
  getPrompts,
  createPrompt,
  addPromptVersion,
  approvePrompt,
  getPromptVersions,
  // Security
  analyzePromptSecurity,
  getSecurityEvents,
  // Risks
  getRisks,
  getRiskReport,
  updateRiskStatus,
  // Hallucination
  getHallucinationAnalytics,
  // Trust
  getTrustScore,
  computeTrustScore,
  // Explainability
  getExplanations,
  getExplanation,
  explainDecision,
  // Approvals
  getApprovals,
  submitForApproval,
  reviewApproval,
  // Usage Analytics
  getUsageAnalytics,
  getExecutiveDashboard,
  // Policies
  getPolicies,
  createPolicy,
  getPolicyViolations,
  getRoutingRules
} from '../controllers/aiGovernance.controller.js';

const router = Router();
router.use(authenticate);

// ── Governance Center ──
router.get('/governance', getGovernanceDashboard);
router.get('/governance/audit-trail', getGovernanceAuditTrail);

// ── Model Registry ──
router.get('/models', getModels);
router.post('/models/register', registerModel);
router.patch('/models/:modelId/status', updateModelStatus);
router.get('/models/:modelId/versions', getModelVersions);
router.get('/models/:modelId/performance', getModelPerformance);

// ── Prompt Governance ──
router.get('/prompts', getPrompts);
router.post('/prompts', createPrompt);
router.post('/prompts/:promptId/versions', addPromptVersion);
router.get('/prompts/:promptId/versions', getPromptVersions);
router.post('/prompts/:promptId/approve', approvePrompt);

// ── Security ──
router.post('/security/analyze', analyzePromptSecurity);
router.get('/security/events', getSecurityEvents);

// ── Risk Engine ──
router.get('/risks', getRisks);
router.get('/risks/report', getRiskReport);
router.patch('/risks/:riskId/status', updateRiskStatus);

// ── Hallucination Monitoring ──
router.get('/hallucination/analytics', getHallucinationAnalytics);

// ── Trust Scoring ──
router.get('/trust', getTrustScore);
router.post('/trust/:modelId/compute', computeTrustScore);

// ── Explainability ──
router.get('/explain', getExplanations);
router.get('/explain/:explanationId', getExplanation);
router.post('/explain', explainDecision);

// ── Human Approvals ──
router.get('/approvals', getApprovals);
router.post('/approve', submitForApproval);
router.patch('/approvals/:approvalId/review', reviewApproval);

// ── Usage Analytics ──
router.get('/usage', getUsageAnalytics);
router.get('/executive-dashboard', getExecutiveDashboard);

// ── Policies ──
router.get('/policy', getPolicies);
router.post('/policy', createPolicy);
router.get('/policy/violations', getPolicyViolations);
router.get('/policy/routing', getRoutingRules);

export default router;
