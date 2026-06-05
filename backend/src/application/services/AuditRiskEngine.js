// ============================================================
// Service: AuditRiskEngine
// Scans controls, evidence, and policies to detect pre-audit risks
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditRiskEngine {
  async detectRisks(planId, organizationId) {
    try {
      // Clear previous risks for this plan to avoid duplicates
      await query(
        `DELETE FROM audit_risk_assessments WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      const detectedRisks = [];

      // 1. Detect Missing/Expired Evidence
      const evidenceIssues = await query(
        `SELECT * FROM audit_evidence_recommendations 
         WHERE audit_plan_id = $1 AND organization_id = $2 AND (status = 'Missing' OR match_confidence < 50)`,
        [planId, organizationId]
      );

      for (const ev of evidenceIssues.rows) {
        const risk = await query(
          `INSERT INTO audit_risk_assessments
           (organization_id, audit_plan_id, risk_type, title, description, severity, status)
           VALUES ($1, $2, 'Missing Evidence', $3, $4, 'HIGH', 'Open')
           RETURNING *`,
          [
            organizationId,
            planId,
            `Evidence Missing: ${ev.recommended_evidence_name}`,
            `Recommended evidence for control ${ev.control_code} is not uploaded or mapped.`
          ]
        );
        detectedRisks.push(risk.rows[0]);
      }

      // 2. Detect Control Owner Gaps
      const ownerIssues = await query(
        `SELECT ac.* FROM audit_control_analysis ac
         WHERE ac.audit_plan_id = $1 AND ac.organization_id = $2 AND ac.ownership_status = 'Gapped'`,
        [planId, organizationId]
      );

      for (const ctrl of ownerIssues.rows) {
        const risk = await query(
          `INSERT INTO audit_risk_assessments
           (organization_id, audit_plan_id, risk_type, title, description, severity, status)
           VALUES ($1, $2, 'Ownership Gap', $3, $4, 'MEDIUM', 'Open')
           RETURNING *`,
          [
            organizationId,
            planId,
            `Owner Not Assigned: Control ${ctrl.control_code}`,
            `No employee has been assigned ownership of compliance control ${ctrl.control_code}.`
          ]
        );
        detectedRisks.push(risk.rows[0]);
      }

      // 3. Detect Failing Controls
      const failingChecklist = await query(
        `SELECT * FROM audit_checklists 
         WHERE audit_plan_id = $1 AND organization_id = $2 AND status = 'Failed'`,
        [planId, organizationId]
      );

      for (const chk of failingChecklist.rows) {
        const risk = await query(
          `INSERT INTO audit_risk_assessments
           (organization_id, audit_plan_id, risk_type, title, description, severity, status)
           VALUES ($1, $2, 'Failed Control', $3, $4, 'CRITICAL', 'Open')
           RETURNING *`,
          [
            organizationId,
            planId,
            `Control Verification Failed: ${chk.control_code}`,
            `Requirements check failed for requirement "${chk.requirement}": ${chk.comments || 'No explanation provided.'}`
          ]
        );
        detectedRisks.push(risk.rows[0]);
      }

      return detectedRisks;
    } catch (err) {
      logger.error('Failed to run audit risk engine:', err);
      return [];
    }
  }

  async getRiskAssessments(planId, organizationId) {
    try {
      const res = await query(
        `SELECT * FROM audit_risk_assessments WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('Failed to get risk assessments:', err);
      return [];
    }
  }
}

export default new AuditRiskEngine();
