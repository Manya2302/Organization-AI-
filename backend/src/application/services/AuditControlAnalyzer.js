// ============================================================
// Service: AuditControlAnalyzer
// Analyzes control readiness, health, risk, and owner status
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditControlAnalyzer {
  async analyzeControls(planId, organizationId) {
    try {
      const controlsRes = await query(
        `SELECT ac.*, cf.status as checklist_status
         FROM audit_control_analysis ac
         LEFT JOIN audit_checklists cf ON ac.audit_plan_id = cf.audit_plan_id AND ac.control_code = cf.control_code
         WHERE ac.audit_plan_id = $1 AND ac.organization_id = $2`,
        [planId, organizationId]
      );

      const analyzed = [];
      for (const row of controlsRes.rows) {
        // Calculate health and risk based on checklists and evidence
        const checklistStatus = row.checklist_status || 'Pending';
        let healthScore = 50.00;
        let riskScore = 50.00;
        let readinessScore = 0.00;

        if (checklistStatus === 'Passed') {
          healthScore = 95.00;
          riskScore = 10.00;
          readinessScore = 100.00;
        } else if (checklistStatus === 'Failed') {
          healthScore = 10.00;
          riskScore = 90.00;
          readinessScore = 0.00;
        }

        // Validate ownership: Check if owner exists for the control in compliance_controls
        const complianceControl = await query(
          `SELECT owner_id FROM compliance_controls 
           WHERE control_code = $1 AND organization_id = $2`,
          [row.control_code, organizationId]
        );
        const hasOwner = complianceControl.rows[0]?.owner_id ? true : false;
        const ownershipStatus = hasOwner ? 'Valid' : 'Gapped';

        // Update analyzer records
        const updated = await query(
          `UPDATE audit_control_analysis
           SET health_score = $1, risk_score = $2, readiness_score = $3, ownership_status = $4, updated_at = NOW()
           WHERE id = $5 RETURNING *`,
          [healthScore, riskScore, readinessScore, ownershipStatus, row.id]
        );
        analyzed.push(updated.rows[0]);
      }

      return analyzed;
    } catch (err) {
      logger.error('Failed to analyze controls:', err);
      return [];
    }
  }

  async getControlMetrics(planId, organizationId) {
    try {
      const res = await query(
        `SELECT 
           COALESCE(AVG(readiness_score), 0) as avg_readiness,
           COALESCE(AVG(health_score), 0) as avg_health,
           COALESCE(AVG(risk_score), 0) as avg_risk,
           COUNT(CASE WHEN ownership_status = 'Gapped' THEN 1 END) as owner_gaps
         FROM audit_control_analysis
         WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('Failed to get control metrics:', err);
      return { avg_readiness: 0, avg_health: 0, avg_risk: 0, owner_gaps: 0 };
    }
  }
}

export default new AuditControlAnalyzer();
