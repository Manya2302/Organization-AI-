// ============================================================
// Service: ComplianceReportingService
// Generates compliance reports, summaries, and executive dashboards
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class ComplianceReportingService {
  async generateSummaryReport(organizationId, generatedBy = null) {
    try {
      const [frameworksRes, controlsRes, evidenceRes, gapsRes, risksRes, packagesRes] = await Promise.all([
        query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active FROM compliance_frameworks WHERE organization_id = $1`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN status = 'Implemented' THEN 1 END) as implemented,
                 COUNT(CASE WHEN status = 'Partially Implemented' THEN 1 END) as partial,
                 COUNT(CASE WHEN status = 'Not Started' THEN 1 END) as not_started,
                 COUNT(CASE WHEN risk_level IN ('HIGH','CRITICAL') THEN 1 END) as high_risk
               FROM compliance_controls WHERE organization_id = $1`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN review_status = 'Approved' THEN 1 END) as approved,
                 COUNT(CASE WHEN expiry_status = 'Expired' THEN 1 END) as expired
               FROM evidence_repository er
               LEFT JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
               WHERE er.organization_id = $1 AND er.is_archived = FALSE`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
                 COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high
               FROM compliance_gaps WHERE organization_id = $1 AND status = 'Open'`, [organizationId]),
        query(`SELECT AVG(risk_score) as avg_risk, COUNT(*) as total FROM compliance_risks WHERE organization_id = $1 AND status = 'Open'`, [organizationId]),
        query(`SELECT overall_score FROM audit_packages WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`, [organizationId])
      ]);

      const ctrl = controlsRes.rows[0];
      const totalCtrl = parseInt(ctrl.total) || 1;
      const implCtrl = parseInt(ctrl.implemented) || 0;
      const controlCoverage = parseFloat(((implCtrl / totalCtrl) * 100).toFixed(1));

      const ev = evidenceRes.rows[0];
      const totalEv = parseInt(ev.total) || 0;
      const approvedEv = parseInt(ev.approved) || 0;

      const gaps = gapsRes.rows[0];
      const totalGaps = parseInt(gaps.total) || 0;
      const criticalGaps = parseInt(gaps.critical) || 0;

      const avgRisk = parseFloat(risksRes.rows[0]?.avg_risk || 0).toFixed(1);
      const auditScore = parseFloat(packagesRes.rows[0]?.overall_score || 0);

      const overallScore = parseFloat((
        controlCoverage * 0.35 +
        (totalEv > 0 ? (approvedEv / totalEv) * 100 : 0) * 0.30 +
        Math.max(0, 100 - totalGaps * 3) * 0.20 +
        Math.max(0, 100 - criticalGaps * 10) * 0.15
      ).toFixed(1));

      const complianceLevel = overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' :
                               overallScore >= 55 ? 'Improving' : overallScore >= 35 ? 'Needs Attention' : 'Critical';

      const keyFindings = [];
      if (criticalGaps > 0) keyFindings.push(`${criticalGaps} critical compliance gaps require immediate action`);
      if (parseInt(ctrl.not_started) > 0) keyFindings.push(`${ctrl.not_started} controls have not been implemented`);
      if (parseInt(ev.expired) > 0) keyFindings.push(`${ev.expired} evidence items have expired and need renewal`);
      if (parseFloat(avgRisk) > 60) keyFindings.push(`High average risk score of ${avgRisk}/100 detected`);
      if (controlCoverage < 50) keyFindings.push('Control implementation coverage is below 50%');

      const recommendations = [];
      if (criticalGaps > 0) recommendations.push('Immediately remediate all CRITICAL severity compliance gaps');
      if (parseInt(ctrl.not_started) > 0) recommendations.push('Assign owners and begin implementation of unstarted controls');
      if (parseInt(ev.expired) > 0) recommendations.push('Renew or replace expired evidence items');
      recommendations.push('Schedule quarterly compliance reviews for all active frameworks');
      if (auditScore < 70) recommendations.push('Generate and review an audit package to identify specific gaps');

      const report = await query(
        `INSERT INTO compliance_reports
         (organization_id, report_name, report_type, generated_by, overall_score, key_findings, recommendations)
         VALUES ($1, $2, 'Summary', $3, $4, $5, $6) RETURNING *`,
        [
          organizationId,
          `Compliance Summary Report — ${new Date().toLocaleDateString()}`,
          generatedBy,
          overallScore,
          JSON.stringify(keyFindings),
          JSON.stringify(recommendations)
        ]
      );

      return {
        success: true,
        report: report.rows[0],
        summary: {
          overallScore, complianceLevel, controlCoverage,
          totalControls: parseInt(ctrl.total),
          implementedControls: implCtrl,
          highRiskControls: parseInt(ctrl.high_risk),
          totalEvidence: totalEv, approvedEvidence: approvedEv,
          expiredEvidence: parseInt(ev.expired),
          openGaps: totalGaps, criticalGaps,
          avgRiskScore: parseFloat(avgRisk),
          openRisks: parseInt(risksRes.rows[0]?.total || 0),
          lastAuditScore: auditScore
        },
        keyFindings, recommendations
      };
    } catch (err) {
      logger.error('Failed to generate summary report:', err);
      return { success: false, message: err.message };
    }
  }

  async getReports(organizationId) {
    try {
      const res = await query(
        `SELECT cr.*, u.name as generated_by_name, cf.short_name as framework_name
         FROM compliance_reports cr
         LEFT JOIN users u ON cr.generated_by = u.id
         LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id
         WHERE cr.organization_id = $1
         ORDER BY cr.generated_at DESC`,
        [organizationId]
      );
      return { success: true, reports: res.rows };
    } catch (err) {
      logger.error('Failed to get reports:', err);
      return { success: false, reports: [] };
    }
  }

  async getFrameworkScorecard(organizationId) {
    try {
      const res = await query(
        `SELECT cf.id, cf.name, cf.short_name,
                COUNT(DISTINCT ca.control_id) as controls_mapped,
                COUNT(DISTINCT CASE WHEN cc.status = 'Implemented' THEN ca.control_id END) as controls_implemented,
                COUNT(DISTINCT em.evidence_id) as evidence_items,
                COUNT(DISTINCT pc.id) as policies_mapped,
                COUNT(DISTINCT cg.id) as open_gaps
         FROM compliance_frameworks cf
         LEFT JOIN control_assignments ca ON ca.framework_id = cf.id AND ca.organization_id = $1
         LEFT JOIN compliance_controls cc ON ca.control_id = cc.id
         LEFT JOIN evidence_mappings em ON em.framework_id = cf.id AND em.organization_id = $1
         LEFT JOIN policy_compliance pc ON pc.framework_id = cf.id AND pc.organization_id = $1
         LEFT JOIN compliance_gaps cg ON cg.framework_id = cf.id AND cg.organization_id = $1 AND cg.status = 'Open'
         WHERE cf.organization_id = $1 AND cf.is_active = TRUE
         GROUP BY cf.id, cf.name, cf.short_name`,
        [organizationId]
      );

      const scorecard = res.rows.map(fw => {
        const mapped = parseInt(fw.controls_mapped) || 0;
        const implemented = parseInt(fw.controls_implemented) || 0;
        const coverage = mapped > 0 ? parseFloat(((implemented / mapped) * 100).toFixed(1)) : 0;
        return { ...fw, coverage };
      });

      return { success: true, scorecard };
    } catch (err) {
      logger.error('Failed to get framework scorecard:', err);
      return { success: false, scorecard: [] };
    }
  }
}

export default new ComplianceReportingService();
