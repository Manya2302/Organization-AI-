// ============================================================
// Service: AuditScopeService
// Defines audit boundaries and scope rules
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditScopeService {
  async getScopeByPlan(planId, organizationId) {
    try {
      const res = await query(
        `SELECT * FROM audit_scopes WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      return res.rows[0] || null;
    } catch (err) {
      logger.error('Failed to get audit scope:', err);
      return null;
    }
  }

  async updateScope(planId, organizationId, scopeData) {
    const { scope_type, value, affected_controls, affected_evidence, affected_policies, affected_risks } = scopeData;
    try {
      const checkRes = await query(
        `SELECT id FROM audit_scopes WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      let result;
      if (checkRes.rows.length === 0) {
        result = await query(
          `INSERT INTO audit_scopes
           (organization_id, audit_plan_id, scope_type, value, affected_controls, affected_evidence, affected_policies, affected_risks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            organizationId, planId, scope_type, value,
            JSON.stringify(affected_controls || []),
            JSON.stringify(affected_evidence || []),
            JSON.stringify(affected_policies || []),
            JSON.stringify(affected_risks || [])
          ]
        );
      } else {
        result = await query(
          `UPDATE audit_scopes
           SET scope_type = $3, value = $4,
               affected_controls = $5, affected_evidence = $6,
               affected_policies = $7, affected_risks = $8,
               updated_at = NOW()
           WHERE audit_plan_id = $1 AND organization_id = $2 RETURNING *`,
          [
            planId, organizationId, scope_type, value,
            JSON.stringify(affected_controls || []),
            JSON.stringify(affected_evidence || []),
            JSON.stringify(affected_policies || []),
            JSON.stringify(affected_risks || [])
          ]
        );
      }

      return result.rows[0];
    } catch (err) {
      logger.error('Failed to update scope:', err);
      throw err;
    }
  }
}

export default new AuditScopeService();
