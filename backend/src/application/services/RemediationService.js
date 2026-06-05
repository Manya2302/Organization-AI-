// ============================================================
// Service: RemediationService
// Recommends owners, priority and remediation tasks for findings.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class RemediationService {
  async recommendForPlan(planId, organizationId) {
    try {
      const findings = await query(
        `SELECT * FROM audit_findings
         WHERE audit_plan_id = $1 AND organization_id = $2 AND status != 'Resolved'`,
        [planId, organizationId]
      );
      const recommendations = [];
      for (const finding of findings.rows) {
        recommendations.push(await this.createRecommendation(planId, organizationId, finding));
      }
      return recommendations;
    } catch (err) {
      logger.error('Remediation recommendation failed:', err);
      return [];
    }
  }

  async createRecommendation(planId, organizationId, finding) {
    const owner = await query(
      `SELECT id FROM users
       WHERE organization_id = $1 AND is_active = TRUE
       ORDER BY CASE role WHEN 'EnterpriseAdmin' THEN 1 WHEN 'DepartmentManager' THEN 2 ELSE 3 END
       LIMIT 1`,
      [organizationId]
    );
    const suggestedOwnerId = owner.rows[0]?.id || null;
    const estimatedDays = finding.severity === 'CRITICAL' ? 7 : finding.severity === 'HIGH' ? 14 : 30;
    const priority = finding.severity === 'CRITICAL' ? 'CRITICAL' : finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

    const existing = await query(
      `SELECT * FROM audit_remediation WHERE organization_id = $1 AND audit_plan_id = $2 AND finding_id = $3 LIMIT 1`,
      [organizationId, planId, finding.id]
    );
    if (existing.rows[0]) return existing.rows[0];

    const remediation = await query(
      `INSERT INTO audit_remediation
       (organization_id, audit_plan_id, finding_id, recommended_action, suggested_owner_id,
        priority, estimated_impact, estimated_resolution_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        organizationId,
        planId,
        finding.id,
        finding.recommendation || 'Review and remediate the audit finding.',
        suggestedOwnerId,
        priority,
        finding.severity === 'CRITICAL' ? 'High' : 'Medium',
        estimatedDays
      ]
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + estimatedDays);
    await query(
      `INSERT INTO audit_remediation_tasks
       (organization_id, remediation_id, task_name, assigned_to, due_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        remediation.rows[0].id,
        `Resolve: ${finding.title}`,
        suggestedOwnerId,
        dueDate.toISOString().slice(0, 10),
        priority
      ]
    );

    return remediation.rows[0];
  }

  async getRemediation(planId, organizationId) {
    const res = await query(
      `SELECT ar.*, af.title AS finding_title, af.severity
       FROM audit_remediation ar
       LEFT JOIN audit_findings af ON af.id = ar.finding_id
       WHERE ar.audit_plan_id = $1 AND ar.organization_id = $2
       ORDER BY ar.created_at DESC`,
      [planId, organizationId]
    );
    return res.rows;
  }
}

export default new RemediationService();
