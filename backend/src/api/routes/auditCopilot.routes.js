// ============================================================
// Routes: Audit Copilot Foundation & Planning Engine — Phase 5
// /api/v1/audit/copilot/*
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import auditPlanningService from '../../application/services/AuditPlanningService.js';
import auditScopeService from '../../application/services/AuditScopeService.js';
import auditEvidenceService from '../../application/services/AuditEvidenceService.js';
import auditControlAnalyzer from '../../application/services/AuditControlAnalyzer.js';
import auditRiskEngine from '../../application/services/AuditRiskEngine.js';
import auditReadinessServiceV2 from '../../application/services/AuditReadinessServiceV2.js';
import auditTemplateEngine from '../../application/services/AuditTemplateEngine.js';
import auditCopilotService from '../../application/services/AuditCopilotService.js';
import evidenceIntelligenceService from '../../application/services/EvidenceIntelligenceService.js';
import evidenceCorrelationService from '../../application/services/EvidenceCorrelationService.js';
import evidenceQualityService from '../../application/services/EvidenceQualityService.js';
import evidencePackageService from '../../application/services/EvidencePackageService.js';
import evidenceFreshnessService from '../../application/services/EvidenceFreshnessService.js';
import auditFindingsService from '../../application/services/AuditFindingsService.js';
import remediationService from '../../application/services/RemediationService.js';
import controlPredictionService from '../../application/services/ControlPredictionService.js';
import auditSimulationService from '../../application/services/AuditSimulationService.js';
import auditTimelineService from '../../application/services/AuditTimelineService.js';
import autonomousAuditCopilotService from '../../application/services/AutonomousAuditCopilotService.js';
import executiveAuditReportingService from '../../application/services/ExecutiveAuditReportingService.js';
import externalAuditorPortalService from '../../application/services/ExternalAuditorPortalService.js';
import auditOrchestratorService from '../../application/services/AuditOrchestratorService.js';
import auditKnowledgeGraphService from '../../application/services/AuditKnowledgeGraphService.js';
import auditMaturityService from '../../application/services/AuditMaturityService.js';
import remediationPlanningService from '../../application/services/RemediationPlanningService.js';
import oneClickAuditorPackageService from '../../application/services/OneClickAuditorPackageService.js';
import { query } from '../../infrastructure/database/connection.js';

const router = Router();

// Public, token-protected read-only auditor package review.
router.get('/public/share/:token', async (req, res) => {
  const result = await externalAuditorPortalService.getSharedPackage(req.params.token);
  if (!result) return res.status(404).json({ success: false, message: 'Share not found or expired' });
  res.json({ success: true, ...result });
});

router.use(authenticate);

// 1. GET /templates
router.get('/templates', async (req, res) => {
  const result = await auditTemplateEngine.getTemplates(req.organizationId);
  res.json({ success: true, templates: result });
});

// 2. GET /plans (list plans)
router.get('/plans', async (req, res) => {
  const plans = await auditPlanningService.getPlans(req.organizationId);
  res.json({ success: true, plans });
});

// 3. GET /plan/:id (individual plan details)
router.get('/plan/:id', async (req, res) => {
  const plan = await auditPlanningService.getPlanById(req.params.id, req.organizationId);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  res.json({ success: true, plan });
});

// 4. POST /plan (create plan)
router.post('/plan', async (req, res) => {
  const plan = await auditPlanningService.createPlan(req.organizationId, req.user.id, req.body);
  // Auto-run analysis to generate initial metrics and checklists
  await auditCopilotService.runFullAuditAnalysis(plan.id, req.organizationId);
  
  res.json({ success: true, plan });
});

// 5. POST /scope (update scope boundaries)
router.post('/scope', async (req, res) => {
  const { planId, scopeData } = req.body;
  const scope = await auditScopeService.updateScope(planId, req.organizationId, scopeData);
  res.json({ success: true, scope });
});

// 6. GET /readiness (get readiness metrics & snapshots)
router.get('/readiness', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });
  
  const score = await auditReadinessServiceV2.calculatePlanReadiness(planId, req.organizationId);
  const history = await auditReadinessServiceV2.getReadinessHistory(planId, req.organizationId);
  res.json({ success: true, score, history });
});

// 7. GET /risks (pre-audit risks scanning)
router.get('/risks', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const risks = await auditRiskEngine.getRiskAssessments(planId, req.organizationId);
  res.json({ success: true, risks });
});

// 8. GET /evidence (evidence checklist / missing check)
router.get('/evidence', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const recommendations = await auditEvidenceService.getEvidenceRecommendations(planId, req.organizationId);
  const scores = await auditEvidenceService.calculateEvidenceScores(planId, req.organizationId);
  res.json({ success: true, recommendations, scores });
});

// 9. POST /evidence/map (map document to recommendation)
router.post('/evidence/map', async (req, res) => {
  const { planId, recommendationId, documentId } = req.body;
  const mapped = await auditEvidenceService.mapDocumentToEvidence(planId, recommendationId, documentId, req.organizationId);
  // Recompute scores on changes
  await auditCopilotService.runFullAuditAnalysis(planId, req.organizationId);
  res.json({ success: true, mapped });
});

// 10. GET /checklist (get planning checklist)
router.get('/checklist', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const resChecklist = await query(
    `SELECT * FROM audit_checklists WHERE audit_plan_id = $1 AND organization_id = $2`,
    [planId, req.organizationId]
  );
  res.json({ success: true, checklist: resChecklist.rows });
});

// 11. POST /checklist/verify (verify status check)
router.post('/checklist/verify', async (req, res) => {
  const { planId, checklistId, status, comments } = req.body;
  
  await query(
    `UPDATE audit_checklists 
     SET status = $1, comments = $2, verified_by = $3, verified_at = NOW(), updated_at = NOW()
     WHERE id = $4 AND audit_plan_id = $5 AND organization_id = $6`,
    [status, comments, req.user.id, checklistId, planId, req.organizationId]
  );

  // Trigger analyzer
  await auditCopilotService.runFullAuditAnalysis(planId, req.organizationId);
  
  res.json({ success: true });
});

// 12. GET /controls (get control analyzer score details)
router.get('/controls', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const controls = await query(
    `SELECT * FROM audit_control_analysis WHERE audit_plan_id = $1 AND organization_id = $2`,
    [planId, req.organizationId]
  );
  const metrics = await auditControlAnalyzer.getControlMetrics(planId, req.organizationId);
  
  res.json({ success: true, controls: controls.rows, metrics });
});

// 13. POST /analyze (run fresh evaluation scan)
router.post('/analyze', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const result = await auditCopilotService.runFullAuditAnalysis(planId, req.organizationId);
  res.json(result);
});

// 14. POST /chat (AI assistant conversation handler)
router.post('/chat', async (req, res) => {
  const { message, planId } = req.body;
  const reply = await auditCopilotService.handleQuery(req.organizationId, message, planId);
  res.json({ success: true, reply });
});

// 15. GET /evidence/intelligence (Phase 5 Part 2)
router.get('/evidence/intelligence', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const intelligence = await evidenceIntelligenceService.analyzePlan(planId, req.organizationId);
  res.json({ success: true, intelligence });
});

// 16. GET /evidence/relationships
router.get('/evidence/relationships', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const result = await evidenceCorrelationService.correlatePlan(planId, req.organizationId);
  res.json({ success: true, ...result });
});

// 17. GET /evidence/quality
router.get('/evidence/quality', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const quality = await evidenceQualityService.analyzePlan(planId, req.organizationId);
  res.json({ success: true, quality });
});

// 18. GET /evidence/freshness
router.get('/evidence/freshness', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const freshness = await evidenceFreshnessService.getFreshnessAlerts(planId, req.organizationId);
  res.json({ success: true, freshness });
});

// 19. POST /packages/build
router.post('/packages/build', async (req, res) => {
  const { planId, ...options } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const result = await evidencePackageService.buildPackage(planId, req.organizationId, req.user.id, options);
  res.json({ success: true, ...result });
});

// 20. GET /packages
router.get('/packages', async (req, res) => {
  const packages = await evidencePackageService.getPackages(req.organizationId, req.query.planId || null);
  res.json({ success: true, packages });
});

// 21. POST /findings/generate
router.post('/findings/generate', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const findings = await auditFindingsService.generateFindings(planId, req.organizationId);
  res.json({ success: true, findings });
});

// 22. GET /findings
router.get('/findings', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const findings = await auditFindingsService.getFindings(planId, req.organizationId);
  res.json({ success: true, findings });
});

// 23. POST /remediation/recommend
router.post('/remediation/recommend', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const remediation = await remediationService.recommendForPlan(planId, req.organizationId);
  res.json({ success: true, remediation });
});

// 24. GET /remediation
router.get('/remediation', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const remediation = await remediationService.getRemediation(planId, req.organizationId);
  res.json({ success: true, remediation });
});

// 25. POST /predictions/run
router.post('/predictions/run', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const predictions = await controlPredictionService.predictPlan(planId, req.organizationId);
  res.json({ success: true, predictions });
});

// 26. GET /predictions
router.get('/predictions', async (req, res) => {
  const { planId } = req.query;
  if (!planId) return res.status(400).json({ success: false, message: 'planId query required' });

  const predictions = await controlPredictionService.getPredictions(planId, req.organizationId);
  res.json({ success: true, predictions });
});

// 27. POST /simulation/run
router.post('/simulation/run', async (req, res) => {
  const simulation = await auditSimulationService.runSimulation(req.organizationId, req.user.id, req.body);
  res.json({ success: true, simulation });
});

// 28. POST /timeline/generate
router.post('/timeline/generate', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const timeline = await auditTimelineService.generateTimeline(planId, req.organizationId);
  res.json({ success: true, timeline });
});

// 29. POST /autonomous/run
router.post('/autonomous/run', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const result = await autonomousAuditCopilotService.runAutonomousCycle(req.organizationId, req.user.id, planId);
  res.json(result);
});

// 30. POST /autonomous/chat
router.post('/autonomous/chat', async (req, res) => {
  const { message, planId } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'message required' });

  const result = await autonomousAuditCopilotService.handleWorkspaceMessage(req.organizationId, req.user.id, message, planId || null);
  res.json({ success: true, ...result });
});

// 31. POST /executive-report
router.post('/executive-report', async (req, res) => {
  const report = await executiveAuditReportingService.generateReport(
    req.organizationId,
    req.user.id,
    req.body.planId || null,
    req.body.reportType || 'Executive Summary'
  );
  res.json({ success: true, report });
});

// 32. GET /executive-dashboard
router.get('/executive-dashboard', async (req, res) => {
  const dashboard = await executiveAuditReportingService.getDashboard(req.organizationId, req.query.planId || null);
  res.json({ success: true, dashboard });
});

// 33. POST /auditor-share
router.post('/auditor-share', async (req, res) => {
  const { packageId, ...options } = req.body;
  if (!packageId) return res.status(400).json({ success: false, message: 'packageId required' });

  const share = await externalAuditorPortalService.createShare(req.organizationId, req.user.id, packageId, options);
  res.json({ success: true, share });
});

// 34. POST /orchestrator/run (final Phase 5 multi-step workflow)
router.post('/orchestrator/run', async (req, res) => {
  const { planId, request = {} } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const result = await auditOrchestratorService.executeAuditRequest(req.organizationId, req.user.id, planId, request);
  res.json(result);
});

// 35. POST /knowledge-graph/build
router.post('/knowledge-graph/build', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const graph = await auditKnowledgeGraphService.buildAuditGraph(planId, req.organizationId);
  res.json({ success: graph.success, graph });
});

// 36. POST /maturity/calculate
router.post('/maturity/calculate', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const maturity = await auditMaturityService.calculateMaturity(planId, req.organizationId);
  res.json({ success: true, maturity });
});

// 37. GET /maturity
router.get('/maturity', async (req, res) => {
  const maturity = await auditMaturityService.getLatest(req.organizationId, req.query.planId || null);
  res.json({ success: true, maturity });
});

// 38. POST /remediation/plan
router.post('/remediation/plan', async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const remediationPlan = await remediationPlanningService.buildPlan(planId, req.organizationId);
  res.json({ success: true, remediationPlan });
});

// 39. POST /packages/one-click
router.post('/packages/one-click', async (req, res) => {
  const { planId, ...options } = req.body;
  if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

  const result = await oneClickAuditorPackageService.generate(planId, req.organizationId, req.user.id, options);
  res.json({ success: true, ...result });
});

export default router;
