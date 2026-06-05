// ============================================================
// AI Governance Controller — Phase 6
// Handles all AI governance, model, prompt, risk, trust APIs
// ============================================================
import AIGovernanceService from '../../application/services/AIGovernanceService.js';
import AIModelRegistryService from '../../application/services/AIModelRegistryService.js';
import PromptGovernanceService from '../../application/services/PromptGovernanceService.js';
import PromptSecurityService from '../../application/services/PromptSecurityService.js';
import AIRiskService from '../../application/services/AIRiskService.js';
import HallucinationDetectionService from '../../application/services/HallucinationDetectionService.js';
import ExplainabilityService from '../../application/services/ExplainabilityService.js';
import AIApprovalService from '../../application/services/AIApprovalService.js';
import AIUsageAnalyticsService from '../../application/services/AIUsageAnalyticsService.js';
import AIPolicyEngine from '../../application/services/AIPolicyEngine.js';
import AITrustScoringService from '../../application/services/AITrustScoringService.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';

// ══════════════════════════════════════════
// GOVERNANCE CENTER
// ══════════════════════════════════════════

export const getGovernanceDashboard = async (req, res) => {
  const dashboard = await AIGovernanceService.getGovernanceDashboard(req.organizationId);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, 'VIEW_GOVERNANCE_DASHBOARD', 'Dashboard', null, {}, req.ip);
  res.json({ success: true, dashboard });
};

export const getGovernanceAuditTrail = async (req, res) => {
  const { limit = 50 } = req.query;
  const trail = await AIGovernanceService.getAuditTrail(req.organizationId, parseInt(limit));
  res.json({ success: true, auditTrail: trail, total: trail.length });
};

// ══════════════════════════════════════════
// MODEL REGISTRY
// ══════════════════════════════════════════

export const getModels = async (req, res) => {
  const data = await AIModelRegistryService.getModels(req.organizationId);
  res.json({ success: true, ...data });
};

export const registerModel = async (req, res) => {
  const { modelName } = req.body;
  if (!modelName?.trim()) throw createError('Model name is required.', 400);
  const model = await AIModelRegistryService.registerModel(req.organizationId, req.user.id, req.body);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, 'REGISTER_MODEL', 'AIModel', model.id, { modelName }, req.ip);
  res.status(201).json({ success: true, model, message: 'Model registered successfully.' });
};

export const updateModelStatus = async (req, res) => {
  const { modelId } = req.params;
  const { status } = req.body;
  if (!status) throw createError('Status is required.', 400);
  const model = await AIModelRegistryService.updateModelStatus(modelId, req.organizationId, status);
  if (!model) throw createError('Model not found.', 404);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, 'UPDATE_MODEL_STATUS', 'AIModel', modelId, { status }, req.ip);
  res.json({ success: true, model });
};

export const getModelVersions = async (req, res) => {
  const versions = await AIModelRegistryService.getModelVersions(req.params.modelId, req.organizationId);
  res.json({ success: true, versions });
};

export const getModelPerformance = async (req, res) => {
  const performance = await AIModelRegistryService.getModelPerformance(req.params.modelId, req.organizationId);
  res.json({ success: true, performance });
};

// ══════════════════════════════════════════
// PROMPT GOVERNANCE
// ══════════════════════════════════════════

export const getPrompts = async (req, res) => {
  const prompts = await PromptGovernanceService.getPrompts(req.organizationId);
  const categories = PromptGovernanceService.getCategories();
  res.json({ success: true, prompts, categories, total: prompts.length });
};

export const createPrompt = async (req, res) => {
  const { promptName } = req.body;
  if (!promptName?.trim()) throw createError('Prompt name is required.', 400);
  const prompt = await PromptGovernanceService.createPrompt(req.organizationId, req.user.id, req.body);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, 'CREATE_PROMPT', 'AIPrompt', prompt.id, { promptName }, req.ip);
  res.status(201).json({ success: true, prompt });
};

export const addPromptVersion = async (req, res) => {
  const { promptId } = req.params;
  const { version, promptText } = req.body;
  if (!version || !promptText) throw createError('Version and prompt text are required.', 400);

  // Security scan first
  const security = PromptSecurityService.analyzeText(promptText);
  if (!security.isSafe) {
    logger.warn(`Prompt injection detected in version upload by ${req.user.email}`);
    return res.status(400).json({ success: false, security, message: 'Prompt failed security scan. Injection threats detected.' });
  }

  const promptVersion = await PromptGovernanceService.addPromptVersion(req.organizationId, req.user.id, promptId, req.body);
  res.status(201).json({ success: true, promptVersion, security });
};

export const approvePrompt = async (req, res) => {
  const { promptId } = req.params;
  const { decision, notes } = req.body;
  if (!decision) throw createError('Decision is required.', 400);
  const result = await PromptGovernanceService.approvePrompt(promptId, req.organizationId, req.user.id, decision, notes);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, `PROMPT_${decision.toUpperCase()}`, 'AIPrompt', promptId, { decision, notes }, req.ip);
  res.json({ success: true, ...result });
};

export const getPromptVersions = async (req, res) => {
  const versions = await PromptGovernanceService.getPromptVersions(req.params.promptId, req.organizationId);
  res.json({ success: true, versions });
};

// ══════════════════════════════════════════
// PROMPT SECURITY
// ══════════════════════════════════════════

export const analyzePromptSecurity = async (req, res) => {
  const { promptText } = req.body;
  if (!promptText) throw createError('Prompt text is required.', 400);

  const analysis = PromptSecurityService.analyzeText(promptText);

  if (!analysis.isSafe) {
    await PromptSecurityService.logSecurityEvent(req.organizationId, null, req.user.id, {
      ...analysis,
      originalText: promptText
    }, req.ip);
  }

  res.json({ success: true, analysis });
};

export const getSecurityEvents = async (req, res) => {
  const { limit = 50 } = req.query;
  const events = await PromptSecurityService.getSecurityEvents(req.organizationId, parseInt(limit));
  res.json({ success: true, events, total: events.length });
};

// ══════════════════════════════════════════
// AI RISKS
// ══════════════════════════════════════════

export const getRisks = async (req, res) => {
  const { status, severity, riskType } = req.query;
  const risks = await AIRiskService.getRisks(req.organizationId, { status, severity, riskType });
  res.json({ success: true, risks, total: risks.length });
};

export const getRiskReport = async (req, res) => {
  const report = await AIRiskService.generateRiskReport(req.organizationId);
  res.json({ success: true, report });
};

export const updateRiskStatus = async (req, res) => {
  const { riskId } = req.params;
  const { status } = req.body;
  if (!status) throw createError('Status is required.', 400);
  const risk = await AIRiskService.updateRiskStatus(riskId, req.organizationId, status);
  if (!risk) throw createError('Risk not found.', 404);
  res.json({ success: true, risk });
};

// ══════════════════════════════════════════
// HALLUCINATION MONITORING
// ══════════════════════════════════════════

export const getHallucinationAnalytics = async (req, res) => {
  const analytics = await HallucinationDetectionService.getHallucinationAnalytics(req.organizationId);
  res.json({ success: true, analytics });
};

// ══════════════════════════════════════════
// AI TRUST SCORING
// ══════════════════════════════════════════

export const getTrustScore = async (req, res) => {
  const { modelId } = req.query;
  const trust = await AITrustScoringService.getOrganizationTrust(req.organizationId);
  if (modelId) {
    const modelScore = await AITrustScoringService.computeTrustScore(req.organizationId, modelId);
    return res.json({ success: true, trust, modelScore });
  }
  res.json({ success: true, trust });
};

export const computeTrustScore = async (req, res) => {
  const { modelId } = req.params;
  const score = await AITrustScoringService.computeTrustScore(req.organizationId, modelId);
  res.json({ success: true, trustScore: score });
};

// ══════════════════════════════════════════
// EXPLAINABILITY
// ══════════════════════════════════════════

export const getExplanations = async (req, res) => {
  const { limit = 50 } = req.query;
  const explanations = await ExplainabilityService.getExplanations(req.organizationId, parseInt(limit));
  res.json({ success: true, explanations, total: explanations.length });
};

export const getExplanation = async (req, res) => {
  const explanation = await ExplainabilityService.getExplanation(req.params.explanationId, req.organizationId);
  if (!explanation) throw createError('Explanation not found.', 404);
  res.json({ success: true, explanation });
};

export const explainDecision = async (req, res) => {
  const { requestId, question, responseText, contextDocuments } = req.body;
  if (!question) throw createError('Question is required.', 400);
  const explanation = await ExplainabilityService.explain(req.organizationId, requestId, question, responseText || '', contextDocuments || []);
  res.json({ success: true, explanation });
};

// ══════════════════════════════════════════
// HUMAN APPROVALS
// ══════════════════════════════════════════

export const getApprovals = async (req, res) => {
  const { status } = req.query;
  const approvals = await AIApprovalService.getApprovals(req.organizationId, status || null);
  const stats = await AIApprovalService.getApprovalStats(req.organizationId);
  res.json({ success: true, approvals, stats, total: approvals.length });
};

export const submitForApproval = async (req, res) => {
  const { responseId } = req.body;
  if (!responseId) throw createError('Response ID is required.', 400);
  const approval = await AIApprovalService.submitForApproval(req.organizationId, req.user.id, responseId, req.body);
  res.status(201).json({ success: true, approval });
};

export const reviewApproval = async (req, res) => {
  const { approvalId } = req.params;
  const { decision, notes } = req.body;
  if (!decision) throw createError('Decision is required.', 400);
  const approval = await AIApprovalService.reviewApproval(approvalId, req.organizationId, req.user.id, decision, notes);
  if (!approval) throw createError('Approval not found.', 404);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, `APPROVAL_${decision.toUpperCase()}`, 'AIApproval', approvalId, { decision, notes }, req.ip);
  res.json({ success: true, approval });
};

// ══════════════════════════════════════════
// AI USAGE ANALYTICS
// ══════════════════════════════════════════

export const getUsageAnalytics = async (req, res) => {
  const dashboard = await AIUsageAnalyticsService.getAdoptionDashboard(req.organizationId);
  res.json({ success: true, dashboard });
};

export const getExecutiveDashboard = async (req, res) => {
  const dashboard = await AIUsageAnalyticsService.getExecutiveDashboard(req.organizationId);
  res.json({ success: true, dashboard });
};

// ══════════════════════════════════════════
// POLICY MANAGEMENT
// ══════════════════════════════════════════

export const getPolicies = async (req, res) => {
  const policies = await AIPolicyEngine.getPolicies(req.organizationId);
  res.json({ success: true, policies, total: policies.length });
};

export const createPolicy = async (req, res) => {
  const { policyName } = req.body;
  if (!policyName?.trim()) throw createError('Policy name is required.', 400);
  const policy = await AIPolicyEngine.createPolicy(req.organizationId, req.user.id, req.body);
  await AIGovernanceService.logAuditEvent(req.organizationId, req.user.id, 'CREATE_POLICY', 'AIPolicy', policy.id, { policyName }, req.ip);
  res.status(201).json({ success: true, policy });
};

export const getPolicyViolations = async (req, res) => {
  const { limit = 100 } = req.query;
  const violations = await AIPolicyEngine.getViolations(req.organizationId, parseInt(limit));
  res.json({ success: true, violations, total: violations.length });
};

export const getRoutingRules = async (req, res) => {
  const rules = await AIPolicyEngine.getRoutingRules(req.organizationId);
  res.json({ success: true, rules });
};
