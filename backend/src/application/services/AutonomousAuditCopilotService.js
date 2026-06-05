// ============================================================
// Service: AutonomousAuditCopilotService
// Orchestrates planning, evidence, package, risk, findings and reporting.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditCopilotService from './AuditCopilotService.js';
import evidenceIntelligenceService from './EvidenceIntelligenceService.js';
import evidencePackageService from './EvidencePackageService.js';
import auditFindingsService from './AuditFindingsService.js';
import remediationService from './RemediationService.js';
import controlPredictionService from './ControlPredictionService.js';
import auditSimulationService from './AuditSimulationService.js';
import auditTimelineService from './AuditTimelineService.js';
import executiveAuditReportingService from './ExecutiveAuditReportingService.js';
import auditOrchestratorService from './AuditOrchestratorService.js';
import oneClickAuditorPackageService from './OneClickAuditorPackageService.js';
import auditMaturityService from './AuditMaturityService.js';

class AutonomousAuditCopilotService {
  async runAutonomousCycle(organizationId, userId, planId) {
    try {
      const analysis = await auditCopilotService.runFullAuditAnalysis(planId, organizationId);
      const evidence = await evidenceIntelligenceService.analyzePlan(planId, organizationId);
      const findings = await auditFindingsService.generateFindings(planId, organizationId);
      const remediation = await remediationService.recommendForPlan(planId, organizationId);
      const predictions = await controlPredictionService.predictPlan(planId, organizationId);
      const timeline = await auditTimelineService.generateTimeline(planId, organizationId);
      const report = await executiveAuditReportingService.generateReport(organizationId, userId, planId, 'Autonomous Audit Report');

      return {
        success: true,
        analysis,
        evidence,
        findings,
        remediation,
        predictions,
        timeline,
        report
      };
    } catch (err) {
      logger.error('Autonomous audit cycle failed:', err);
      throw err;
    }
  }

  async handleWorkspaceMessage(organizationId, userId, message, planId = null) {
    const session = await this.ensureSession(organizationId, userId, planId);
    await this.saveMessage(organizationId, userId, session.id, 'user', message);

    const normalized = message.toLowerCase();
    let content;
    let metadata = {};

    if (normalized.includes('orchestrate') || normalized.includes('workflow') || normalized.includes('complete audit')) {
      const run = await auditOrchestratorService.executeAuditRequest(organizationId, userId, planId, { source: 'AI Auditor Workspace' });
      content = `Full autonomous audit workflow completed with ${run.completedSteps} steps. The workflow ran scope detection, evidence collection, validation, findings, remediation, maturity scoring, executive reporting and one-click package generation.`;
      metadata = { runId: run.runId, completedSteps: run.completedSteps };
    } else if (normalized.includes('one-click') || normalized.includes('zip')) {
      const pack = await oneClickAuditorPackageService.generate(planId, organizationId, userId, {});
      content = `Generated one-click auditor package "${pack.package.name}" as ${pack.zip.filename}. Integrity hash: ${pack.zip.integrityHash}.`;
      metadata = { packageId: pack.package.id };
    } else if (normalized.includes('package')) {
      const pack = await evidencePackageService.buildPackage(planId, organizationId, userId, {});
      content = `Generated auditor package "${pack.package.name}" with ${pack.items.length} evidence items and integrity hash ${pack.package.integrity_hash}.`;
      metadata = { packageId: pack.package.id };
    } else if (normalized.includes('finding') || normalized.includes('missing')) {
      const findings = await auditFindingsService.generateFindings(planId, organizationId);
      content = findings.length
        ? `Detected ${findings.length} audit findings. Highest priority: ${findings[0].title}.`
        : 'No open audit findings were detected for the selected plan.';
      metadata = { findingCount: findings.length };
    } else if (normalized.includes('remediation') || normalized.includes('roadmap')) {
      const remediation = await remediationService.recommendForPlan(planId, organizationId);
      content = `Generated ${remediation.length} remediation recommendations with owner suggestions and estimated resolution windows.`;
      metadata = { remediationCount: remediation.length };
    } else if (normalized.includes('predict') || normalized.includes('risk')) {
      const predictions = await controlPredictionService.predictPlan(planId, organizationId);
      const top = predictions[0];
      content = top
        ? `Highest predicted failure risk is ${top.control_code} at ${top.failure_probability}%.`
        : 'No control prediction records were generated for this plan.';
      metadata = { predictionCount: predictions.length };
    } else if (normalized.includes('simulate') || normalized.includes('mock')) {
      const simulation = await auditSimulationService.runSimulation(organizationId, userId, { planId });
      content = `Mock audit complete. Expected audit score: ${simulation.expected_score}%.`;
      metadata = { simulationId: simulation.id };
    } else if (normalized.includes('executive') || normalized.includes('report')) {
      const report = await executiveAuditReportingService.generateReport(organizationId, userId, planId, 'Executive Audit Summary');
      content = `Executive audit report generated: ${report.title}. Readiness ${report.readiness_score}%, open findings ${report.open_findings}.`;
      metadata = { reportId: report.id };
    } else if (normalized.includes('maturity')) {
      const maturity = await auditMaturityService.calculateMaturity(planId, organizationId);
      content = `Audit maturity calculated: ${maturity.maturity_level} (${maturity.maturity_score}%).`;
      metadata = { maturityId: maturity.id, maturityLevel: maturity.maturity_level };
    } else {
      const cycle = planId ? await this.runAutonomousCycle(organizationId, userId, planId) : null;
      content = cycle
        ? `Autonomous audit cycle complete. Readiness ${cycle.analysis.readiness.readinessScore}%, findings ${cycle.findings.length}, predictions ${cycle.predictions.length}.`
        : 'Select an audit plan, then ask me to prepare an audit, generate a package, find missing evidence, predict failures, run a simulation, or create an executive report.';
      metadata = { autonomousCycle: Boolean(cycle) };
    }

    const assistant = await this.saveMessage(organizationId, userId, session.id, 'assistant', content, metadata);
    return { sessionId: session.id, reply: { role: 'assistant', content, timestamp: assistant.created_at, metadata } };
  }

  async ensureSession(organizationId, userId, planId) {
    const existing = await query(
      `SELECT * FROM audit_ai_sessions
       WHERE organization_id = $1 AND user_id = $2 AND (($3::uuid IS NULL AND audit_plan_id IS NULL) OR audit_plan_id = $3)
       ORDER BY updated_at DESC LIMIT 1`,
      [organizationId, userId, planId]
    );
    if (existing.rows[0]) return existing.rows[0];
    const created = await query(
      `INSERT INTO audit_ai_sessions (organization_id, user_id, audit_plan_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [organizationId, userId, planId]
    );
    return created.rows[0];
  }

  async saveMessage(organizationId, userId, sessionId, role, content, metadata = {}) {
    await query(`UPDATE audit_ai_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);
    const saved = await query(
      `INSERT INTO audit_ai_messages (organization_id, session_id, user_id, role, content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organizationId, sessionId, userId, role, content, JSON.stringify(metadata)]
    );
    return saved.rows[0];
  }
}

export default new AutonomousAuditCopilotService();
