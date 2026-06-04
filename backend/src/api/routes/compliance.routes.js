// ============================================================
// Routes: Compliance Intelligence & Audit Readiness — Phase 4
// /api/v1/compliance/*
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import complianceIntelligenceService from '../../application/services/ComplianceIntelligenceService.js';
import complianceRegistryService from '../../application/services/ComplianceRegistryService.js';
import controlManagementService from '../../application/services/ControlManagementService.js';
import evidenceCollectionService from '../../application/services/EvidenceCollectionService.js';
import evidenceValidationService from '../../application/services/EvidenceValidationService.js';
import complianceMappingService from '../../application/services/ComplianceMappingService.js';
import auditReadinessService from '../../application/services/AuditReadinessService.js';
import auditPackageGeneratorService from '../../application/services/AuditPackageGeneratorService.js';
import complianceGapService from '../../application/services/ComplianceGapService.js';
import policyComplianceService from '../../application/services/PolicyComplianceService.js';
import controlEffectivenessService from '../../application/services/ControlEffectivenessService.js';
import complianceReportingService from '../../application/services/ComplianceReportingService.js';

const router = Router();
router.use(authenticate);

// ─── DASHBOARD ───────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  const { organizationId } = req;
  const result = await complianceIntelligenceService.getDashboardMetrics(organizationId);
  res.json(result);
});

router.get('/dashboard/frameworks', async (req, res) => {
  const { organizationId } = req;
  const result = await complianceIntelligenceService.getFrameworkCoverage(organizationId);
  res.json(result);
});

router.get('/dashboard/scorecard', async (req, res) => {
  const { organizationId } = req;
  const result = await complianceReportingService.getFrameworkScorecard(organizationId);
  res.json(result);
});

// ─── FRAMEWORKS ──────────────────────────────────────────────
router.get('/frameworks', async (req, res) => {
  const result = await complianceRegistryService.getFrameworks(req.organizationId);
  res.json(result);
});

router.post('/frameworks/initialize', async (req, res) => {
  const { organizationId } = req;
  await complianceRegistryService.initializeFrameworks(organizationId);
  await controlManagementService.seedStandardControls(organizationId);
  await complianceMappingService.autoMapControlsToFrameworks(organizationId);
  await policyComplianceService.autoMapDocuments(organizationId);
  await evidenceCollectionService.autoCollectFromDocuments(organizationId);
  res.json({ success: true, message: 'Compliance platform initialized with frameworks, controls, and auto-mapped evidence.' });
});

// ─── CONTROLS ────────────────────────────────────────────────
router.get('/controls', async (req, res) => {
  const { status, riskLevel, frameworkId } = req.query;
  const result = await complianceRegistryService.getControls(req.organizationId, { status, riskLevel, frameworkId });
  res.json(result);
});

router.post('/controls', async (req, res) => {
  const result = await complianceRegistryService.createControl(req.organizationId, req.body);
  res.json(result);
});

router.put('/controls/:id', async (req, res) => {
  const result = await controlManagementService.updateControl(req.organizationId, req.params.id, req.body);
  res.json(result);
});

router.post('/controls/seed', async (req, res) => {
  const result = await controlManagementService.seedStandardControls(req.organizationId);
  res.json(result);
});

router.get('/controls/effectiveness', async (req, res) => {
  const { organizationId } = req;
  await controlEffectivenessService.evaluateAll(organizationId);
  const result = await controlEffectivenessService.getEffectivenessOverview(organizationId);
  res.json(result);
});

router.post('/controls/:id/review', async (req, res) => {
  const { organizationId, user } = req;
  const result = await controlManagementService.submitReview(
    organizationId, req.params.id, user.id, req.body
  );
  res.json(result);
});

// ─── TASKS ───────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  const { organizationId, user } = req;
  const { status, priority, assignedToMe } = req.query;
  const userId = assignedToMe === 'true' ? user.id : null;
  const result = await controlManagementService.getTasks(organizationId, userId, { status, priority });
  res.json(result);
});

router.post('/tasks', async (req, res) => {
  const result = await controlManagementService.createTask(req.organizationId, req.body, req.user.id);
  res.json(result);
});

router.post('/tasks/:id/complete', async (req, res) => {
  const result = await controlManagementService.completeTask(req.organizationId, req.params.id);
  res.json(result);
});

// ─── RISKS ───────────────────────────────────────────────────
router.get('/risks', async (req, res) => {
  const { status } = req.query;
  const result = await controlManagementService.getRisks(req.organizationId, { status });
  res.json(result);
});

router.post('/risks', async (req, res) => {
  const result = await controlManagementService.createRisk(req.organizationId, req.body, req.user.id);
  res.json(result);
});

// ─── GAPS ─────────────────────────────────────────────────────
router.get('/gaps', async (req, res) => {
  const { organizationId } = req;
  const { severity, status, gapType } = req.query;
  await complianceGapService.detectGaps(organizationId);
  const result = await complianceGapService.getGaps(organizationId, { severity, status, gapType });
  res.json(result);
});

router.get('/gaps/summary', async (req, res) => {
  const result = await complianceGapService.getGapSummary(req.organizationId);
  res.json(result);
});

router.post('/gaps/:id/resolve', async (req, res) => {
  const result = await complianceGapService.resolveGap(req.organizationId, req.params.id);
  res.json(result);
});

// ─── READINESS ────────────────────────────────────────────────
router.get('/readiness', async (req, res) => {
  const { frameworkId } = req.query;
  const result = await auditReadinessService.calculateReadiness(req.organizationId, frameworkId);
  res.json({ success: true, ...result });
});

// ─── EVIDENCE ────────────────────────────────────────────────
router.get('/evidence', async (req, res) => {
  const { search, category, status, expiryStatus } = req.query;
  const result = await evidenceCollectionService.getEvidence(req.organizationId, { search, category, status, expiryStatus });
  res.json(result);
});

router.post('/evidence', async (req, res) => {
  const result = await evidenceCollectionService.collectEvidence(
    req.organizationId, { ...req.body, owner_id: req.user.id }
  );
  res.json(result);
});

router.post('/evidence/auto-collect', async (req, res) => {
  const result = await evidenceCollectionService.autoCollectFromDocuments(req.organizationId);
  res.json(result);
});

router.post('/evidence/refresh-expiry', async (req, res) => {
  const result = await evidenceCollectionService.refreshExpiryStatus(req.organizationId);
  res.json(result);
});

router.post('/evidence/validate-all', async (req, res) => {
  const result = await evidenceValidationService.validateAllEvidence(req.organizationId);
  res.json(result);
});

router.post('/evidence/:id/map', async (req, res) => {
  const { controlId } = req.body;
  const result = await evidenceCollectionService.mapEvidenceToControl(
    req.organizationId, req.params.id, controlId, req.user.id
  );
  res.json(result);
});

router.post('/evidence/:id/validate', async (req, res) => {
  const result = await evidenceValidationService.validateEvidence(req.organizationId, req.params.id);
  res.json(result);
});

router.get('/evidence/expiry-report', async (req, res) => {
  const result = await evidenceValidationService.getExpiryReport(req.organizationId);
  res.json(result);
});

router.get('/evidence/validation-history', async (req, res) => {
  const result = await evidenceValidationService.getValidationHistory(req.organizationId);
  res.json(result);
});

// ─── AUDITS ───────────────────────────────────────────────────
router.get('/audits', async (req, res) => {
  const result = await auditReadinessService.getAuditPackages(req.organizationId);
  res.json(result);
});

router.post('/audits/generate', async (req, res) => {
  const result = await auditPackageGeneratorService.generateFullPackage(
    req.organizationId, { ...req.body, createdBy: req.user.id }
  );
  res.json(result);
});

// ─── POLICIES ─────────────────────────────────────────────────
router.get('/policies', async (req, res) => {
  const result = await policyComplianceService.getPolicyCoverage(req.organizationId);
  res.json(result);
});

router.post('/policies/auto-map', async (req, res) => {
  await complianceMappingService.autoMapDocumentsToFrameworks(req.organizationId);
  const result = await policyComplianceService.autoMapDocuments(req.organizationId);
  res.json(result);
});

router.post('/policies/:id/approve', async (req, res) => {
  const result = await policyComplianceService.approvePolicy(
    req.organizationId, req.params.id, req.user.id
  );
  res.json(result);
});

router.post('/policies/map', async (req, res) => {
  const { documentId, frameworkId } = req.body;
  const result = await policyComplianceService.mapPolicyToFramework(
    req.organizationId, documentId, frameworkId, req.user.id
  );
  res.json(result);
});

// ─── REQUIREMENTS ─────────────────────────────────────────────
router.get('/requirements', async (req, res) => {
  const { frameworkId } = req.query;
  const result = await complianceRegistryService.getRequirements(req.organizationId, frameworkId);
  res.json(result);
});

// ─── MAPPINGS ─────────────────────────────────────────────────
router.get('/mappings/document/:documentId', async (req, res) => {
  const result = await complianceMappingService.getMappingsForDocument(
    req.organizationId, req.params.documentId
  );
  res.json(result);
});

router.get('/mappings/control/:controlId', async (req, res) => {
  const result = await complianceMappingService.getMappingsForControl(
    req.organizationId, req.params.controlId
  );
  res.json(result);
});

router.get('/mappings/matrix', async (req, res) => {
  const result = await complianceMappingService.getFrameworkCoverageMatrix(req.organizationId);
  res.json(result);
});

router.post('/mappings/auto-map', async (req, res) => {
  const [docsResult, ctrlResult] = await Promise.all([
    complianceMappingService.autoMapDocumentsToFrameworks(req.organizationId),
    complianceMappingService.autoMapControlsToFrameworks(req.organizationId)
  ]);
  res.json({ success: true, documentsMapped: docsResult.mapped, controlsMapped: ctrlResult.mapped });
});

// ─── REPORTS ──────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  const result = await complianceReportingService.getReports(req.organizationId);
  res.json(result);
});

router.post('/reports/generate', async (req, res) => {
  const result = await complianceReportingService.generateSummaryReport(req.organizationId, req.user.id);
  res.json(result);
});

// ─── REVIEW ───────────────────────────────────────────────────
router.post('/review', async (req, res) => {
  const { controlId, status, notes, rating } = req.body;
  if (!controlId) return res.status(400).json({ success: false, message: 'controlId required' });
  const result = await controlManagementService.submitReview(
    req.organizationId, controlId, req.user.id, { status, notes, rating }
  );
  res.json(result);
});

// ─── AI COMPLIANCE ASSISTANT ──────────────────────────────────
router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ success: false, message: 'Question is required' });
  const result = await complianceIntelligenceService.answerComplianceQuestion(req.organizationId, question);
  res.json({ success: true, ...result });
});

export default router;
