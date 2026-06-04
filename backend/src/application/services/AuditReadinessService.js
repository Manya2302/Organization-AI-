// ============================================================
// Service: AuditReadinessService
// Measures and generates audit readiness scores & packages
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditReadinessService {
  async calculateReadiness(organizationId, frameworkId = null) {
    try {
      const controlRes = await query(
        `SELECT COUNT(*) as total,
           COUNT(CASE WHEN status = 'Implemented' THEN 1 END) as implemented,
           COUNT(CASE WHEN status = 'Partially Implemented' THEN 1 END) as partial,
           COUNT(CASE WHEN next_review_at < NOW() THEN 1 END) as expired_review
         FROM compliance_controls WHERE organization_id = $1`,
        [organizationId]
      );
      const ctrl = controlRes.rows[0];
      const totalControls = parseInt(ctrl.total) || 1;
      const implementedControls = parseInt(ctrl.implemented) || 0;
      const partialControls = parseInt(ctrl.partial) || 0;
      const expiredControls = parseInt(ctrl.expired_review) || 0;
      const controlCoverage = Math.min(100, ((implementedControls + partialControls * 0.5) / totalControls) * 100);

      const evidenceRes = await query(
        `SELECT COUNT(DISTINCT cc.id) as controls_with_evidence
         FROM compliance_controls cc
         JOIN evidence_mappings em ON em.control_id = cc.id AND em.organization_id = $1
         WHERE cc.organization_id = $1`,
        [organizationId]
      );
      const evidenceCoverage = Math.min(100, (parseInt(evidenceRes.rows[0]?.controls_with_evidence || 0) / totalControls) * 100);

      const policyRes = await query(
        `SELECT COUNT(*) as total,
           COUNT(CASE WHEN compliance_status = 'Compliant' THEN 1 END) as compliant
         FROM policy_compliance WHERE organization_id = $1`,
        [organizationId]
      );
      const totalPolicies = parseInt(policyRes.rows[0]?.total) || 1;
      const policyCoverage = Math.min(100, (parseInt(policyRes.rows[0]?.compliant || 0) / totalPolicies) * 100);

      const findingsRes = await query(
        `SELECT COUNT(*) as open_count,
           COUNT(CASE WHEN severity IN ('HIGH','CRITICAL') THEN 1 END) as critical_count
         FROM audit_findings WHERE organization_id = $1 AND status = 'Open'`,
        [organizationId]
      );
      const openFindings = parseInt(findingsRes.rows[0]?.open_count || 0);
      const criticalFindings = parseInt(findingsRes.rows[0]?.critical_count || 0);

      const gapsRes = await query(
        `SELECT COUNT(*) as gap_count FROM compliance_gaps WHERE organization_id = $1 AND status = 'Open'`,
        [organizationId]
      );
      const openGaps = parseInt(gapsRes.rows[0]?.gap_count || 0);

      const documentationScore = Math.max(0, 100 - openGaps * 5);
      const reviewCompletion = Math.max(0, 100 - expiredControls * 10);
      const riskScore = Math.max(0, 100 - criticalFindings * 15 - openFindings * 3);

      const overallReadiness = parseFloat((
        controlCoverage * 0.30 + evidenceCoverage * 0.25 +
        policyCoverage * 0.20 + reviewCompletion * 0.15 + documentationScore * 0.10
      ).toFixed(2));

      const readinessLevel =
        overallReadiness >= 90 ? 'Audit Ready' :
        overallReadiness >= 75 ? 'Good' :
        overallReadiness >= 55 ? 'Moderate' :
        overallReadiness >= 35 ? 'Poor' : 'Critical';

      try {
        await query(
          `INSERT INTO audit_readiness_metrics
           (organization_id, framework_id, overall_readiness_score, control_coverage_score,
            evidence_coverage_score, policy_coverage_score, review_completion_score,
            documentation_score, risk_score, readiness_level, total_controls,
            implemented_controls, expired_controls_count, open_findings_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [organizationId, frameworkId, overallReadiness,
           parseFloat(controlCoverage.toFixed(2)), parseFloat(evidenceCoverage.toFixed(2)),
           parseFloat(policyCoverage.toFixed(2)), parseFloat(reviewCompletion.toFixed(2)),
           parseFloat(documentationScore.toFixed(2)), parseFloat(riskScore.toFixed(2)),
           readinessLevel, totalControls, implementedControls, expiredControls, openFindings]
        );
      } catch (saveErr) {
        logger.warn('Could not save readiness metrics:', saveErr.message);
      }

      return {
        overallReadiness, readinessLevel, controlCoverage, evidenceCoverage,
        policyCoverage, reviewCompletion, documentationScore, riskScore,
        totalControls, implementedControls, openFindings, openGaps, expiredControls
      };
    } catch (err) {
      logger.error('Failed to calculate audit readiness:', err);
      return { overallReadiness: 0, readinessLevel: 'Critical' };
    }
  }

  async generateAuditPackage(organizationId, { name, frameworkId, auditType, createdBy } = {}) {
    try {
      const readiness = await this.calculateReadiness(organizationId, frameworkId);
      const controlsRes = await query(
        `SELECT * FROM compliance_controls WHERE organization_id = $1 ORDER BY risk_level DESC`,
        [organizationId]
      );
      const evidenceCount = await query(
        `SELECT COUNT(*) as count FROM evidence_repository WHERE organization_id = $1 AND is_archived = FALSE`,
        [organizationId]
      );
      const passingControls = controlsRes.rows.filter(c => c.status === 'Implemented').length;
      const failingControls = controlsRes.rows.filter(c => c.status === 'Not Started').length;

      const pkg = await query(
        `INSERT INTO audit_packages
         (organization_id, name, description, framework_id, audit_type, status, created_by,
          overall_score, total_controls, passing_controls, failing_controls, total_evidence, generated_at)
         VALUES ($1,$2,$3,$4,$5,'Generated',$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
        [
          organizationId, name || `Audit Package — ${new Date().toLocaleDateString()}`,
          `Auto-generated compliance audit package.`,
          frameworkId || null, auditType || 'Internal', createdBy || null,
          readiness.overallReadiness, controlsRes.rows.length,
          passingControls, failingControls, parseInt(evidenceCount.rows[0]?.count || 0)
        ]
      );

      const findingsRes = await query(
        `SELECT * FROM audit_findings WHERE organization_id = $1 AND status = 'Open' ORDER BY severity DESC LIMIT 20`,
        [organizationId]
      );

      return { success: true, package: pkg.rows[0], readiness, findings: findingsRes.rows };
    } catch (err) {
      logger.error('Failed to generate audit package:', err);
      return { success: false, message: err.message };
    }
  }

  async getLatestReadiness(organizationId) {
    try {
      const res = await query(
        `SELECT arm.*, cf.name as framework_name, cf.short_name
         FROM audit_readiness_metrics arm
         LEFT JOIN compliance_frameworks cf ON arm.framework_id = cf.id
         WHERE arm.organization_id = $1
         ORDER BY arm.calculated_at DESC LIMIT 1`,
        [organizationId]
      );
      return res.rows[0] || null;
    } catch (err) {
      logger.error('Failed to get latest readiness:', err);
      return null;
    }
  }

  async getAuditPackages(organizationId) {
    try {
      const res = await query(
        `SELECT ap.*, u.name as created_by_name, cf.name as framework_name
         FROM audit_packages ap
         LEFT JOIN users u ON ap.created_by = u.id
         LEFT JOIN compliance_frameworks cf ON ap.framework_id = cf.id
         WHERE ap.organization_id = $1 ORDER BY ap.created_at DESC`,
        [organizationId]
      );
      return { success: true, packages: res.rows };
    } catch (err) {
      logger.error('Failed to get audit packages:', err);
      return { success: false, packages: [] };
    }
  }
}

export default new AuditReadinessService();
