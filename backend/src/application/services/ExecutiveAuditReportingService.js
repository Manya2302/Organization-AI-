// ============================================================
// Service: ExecutiveAuditReportingService
// Builds executive, board, risk and framework audit reports.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditReadinessServiceV2 from './AuditReadinessServiceV2.js';
import evidenceQualityService from './EvidenceQualityService.js';
import auditMaturityService from './AuditMaturityService.js';

class ExecutiveAuditReportingService {
  async generateReport(organizationId, userId, planId = null, reportType = 'Executive Summary') {
    try {
      let readiness = { readinessScore: 0, controlReadiness: 0, evidenceReadiness: 0 };
      let evidence = { scores: { readinessScore: 0 }, totals: {} };
      let openFindings = 0;
      let riskExposure = 0;
      let framework = 'All Frameworks';

      if (planId) {
        const plan = await query(
          `SELECT framework FROM audit_plans WHERE id = $1 AND organization_id = $2`,
          [planId, organizationId]
        );
        framework = plan.rows[0]?.framework || framework;
        readiness = await auditReadinessServiceV2.calculatePlanReadiness(planId, organizationId);
        evidence = await evidenceQualityService.analyzePlan(planId, organizationId);
        const findingCounts = await query(
          `SELECT COUNT(*)::int AS open_findings,
                  COALESCE(AVG(risk_score), 0)::float AS risk_exposure
           FROM audit_findings
           WHERE organization_id = $1 AND audit_plan_id = $2 AND status != 'Resolved'`,
          [organizationId, planId]
        );
        openFindings = findingCounts.rows[0]?.open_findings || 0;
        riskExposure = Math.round(findingCounts.rows[0]?.risk_exposure || 0);
      } else {
        const orgCounts = await query(
          `SELECT COUNT(*)::int AS open_findings,
                  COALESCE(AVG(risk_score), 0)::float AS risk_exposure
           FROM audit_findings
           WHERE organization_id = $1 AND status != 'Resolved'`,
          [organizationId]
        );
        openFindings = orgCounts.rows[0]?.open_findings || 0;
        riskExposure = Math.round(orgCounts.rows[0]?.risk_exposure || 0);
      }

      const payload = {
        framework,
        readiness,
        evidence: evidence.scores,
        openFindings,
        riskExposure,
        executiveSummary: this.summarize(readiness.readinessScore, openFindings, riskExposure),
        exportFormats: ['PDF', 'Excel', 'PowerPoint']
      };

      const saved = await query(
        `INSERT INTO audit_executive_reports
         (organization_id, audit_plan_id, report_type, title, readiness_score,
          risk_exposure, evidence_coverage, control_coverage, open_findings,
          report_payload, generated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          organizationId,
          planId,
          reportType,
          `${reportType} - ${framework}`,
          readiness.readinessScore || 0,
          riskExposure,
          evidence.scores?.readinessScore || readiness.evidenceReadiness || 0,
          readiness.controlReadiness || 0,
          openFindings,
          JSON.stringify(payload),
          userId
        ]
      );
      return saved.rows[0];
    } catch (err) {
      logger.error('Executive audit report generation failed:', err);
      throw err;
    }
  }

  async getDashboard(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const reports = await query(
      `SELECT * FROM audit_executive_reports
       WHERE organization_id = $1 ${planFilter}
       ORDER BY generated_at DESC LIMIT 10`,
      params
    );
    const findings = await query(
      `SELECT severity, COUNT(*)::int AS count
       FROM audit_findings
       WHERE organization_id = $1 ${planFilter} AND status != 'Resolved'
       GROUP BY severity`,
      params
    );
    const packages = await query(
      `SELECT COUNT(*)::int AS count FROM audit_packages WHERE organization_id = $1 ${planFilter}`,
      params
    );
    const [
      maturity,
      departmentReadinessRanking,
      frameworkReadinessRanking,
      topRisks,
      criticalFindings,
      remediationProgress,
      auditForecast
    ] = await Promise.all([
      auditMaturityService.getLatest(organizationId, planId),
      this.getDepartmentReadinessRanking(organizationId, planId),
      this.getFrameworkReadinessRanking(organizationId),
      this.getTopRisks(organizationId, planId),
      this.getCriticalFindings(organizationId, planId),
      this.getRemediationProgress(organizationId, planId),
      this.getAuditForecast(organizationId, planId)
    ]);

    return {
      latestReport: reports.rows[0] || null,
      reports: reports.rows,
      openFindingsBySeverity: findings.rows,
      generatedPackages: packages.rows[0]?.count || 0,
      maturity,
      departmentReadinessRanking,
      frameworkReadinessRanking,
      topRisks,
      criticalFindings,
      remediationProgress,
      auditForecast
    };
  }

  async getDepartmentReadinessRanking(organizationId, planId = null) {
    if (planId) {
      const res = await query(
        `SELECT COALESCE(ap.department, 'Organization') AS department,
                ROUND(AVG(ap.readiness_score), 2) AS readiness_score,
                COUNT(*)::int AS audit_count
         FROM audit_plans ap
         WHERE ap.organization_id = $1 AND ap.id = $2
         GROUP BY COALESCE(ap.department, 'Organization')
         ORDER BY readiness_score DESC`,
        [organizationId, planId]
      );
      return res.rows;
    }

    const res = await query(
      `SELECT COALESCE(department, 'Organization') AS department,
              ROUND(AVG(readiness_score), 2) AS readiness_score,
              COUNT(*)::int AS audit_count
       FROM audit_plans
       WHERE organization_id = $1
       GROUP BY COALESCE(department, 'Organization')
       ORDER BY readiness_score DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async getFrameworkReadinessRanking(organizationId) {
    const res = await query(
      `SELECT framework,
              ROUND(AVG(readiness_score), 2) AS readiness_score,
              COUNT(*)::int AS audit_count
       FROM audit_plans
       WHERE organization_id = $1
       GROUP BY framework
       ORDER BY readiness_score DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async getTopRisks(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const res = await query(
      `SELECT risk_type, title, severity, status, created_at
       FROM audit_risk_assessments
       WHERE organization_id = $1 ${planFilter} AND status != 'Closed'
       ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC
       LIMIT 10`,
      params
    );
    return res.rows;
  }

  async getCriticalFindings(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const res = await query(
      `SELECT title, severity, status, recommendation, risk_score
       FROM audit_findings
       WHERE organization_id = $1 ${planFilter}
         AND severity IN ('CRITICAL', 'HIGH')
         AND status != 'Resolved'
       ORDER BY risk_score DESC, created_at DESC
       LIMIT 10`,
      params
    );
    return res.rows;
  }

  async getRemediationProgress(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const res = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status IN ('Completed', 'Closed'))::int AS completed,
         COUNT(*) FILTER (WHERE status IN ('Open', 'Pending'))::int AS open,
         COUNT(*) FILTER (WHERE priority IN ('CRITICAL', 'HIGH'))::int AS high_priority
       FROM audit_remediation
       WHERE organization_id = $1 ${planFilter}`,
      params
    );
    const row = res.rows[0] || { total: 0, completed: 0, open: 0, high_priority: 0 };
    const total = Number(row.total || 0);
    return {
      ...row,
      completionRate: total === 0 ? 100 : Math.round((Number(row.completed || 0) / total) * 100)
    };
  }

  async getAuditForecast(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const res = await query(
      `SELECT
         COALESCE(AVG(failure_probability), 0)::float AS avg_failure_probability,
         COALESCE(MAX(failure_probability), 0)::float AS max_failure_probability,
         COUNT(*) FILTER (WHERE failure_probability >= 70)::int AS high_risk_controls
       FROM audit_predictions
       WHERE organization_id = $1 ${planFilter}`,
      params
    );
    const row = res.rows[0] || {};
    const avgFailure = Math.round(row.avg_failure_probability || 0);
    return {
      averageFailureProbability: avgFailure,
      maxFailureProbability: Math.round(row.max_failure_probability || 0),
      highRiskControls: row.high_risk_controls || 0,
      forecast: avgFailure >= 70 ? 'High audit failure risk' : avgFailure >= 40 ? 'Moderate audit risk' : 'Favorable audit outlook'
    };
  }

  summarize(score, findings, risk) {
    if (score >= 80 && findings === 0) return 'Audit readiness is strong with no open critical blockers.';
    if (risk >= 70 || findings > 5) return 'Audit readiness requires executive attention due to elevated risk and open findings.';
    return 'Audit readiness is progressing, with targeted remediation needed before auditor review.';
  }
}

export default new ExecutiveAuditReportingService();
