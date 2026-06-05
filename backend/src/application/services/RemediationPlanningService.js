// ============================================================
// Service: RemediationPlanningService
// Turns findings into owner-based action plans with effort and timeline.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import remediationService from './RemediationService.js';

class RemediationPlanningService {
  async buildPlan(planId, organizationId) {
    try {
      const remediations = await remediationService.recommendForPlan(planId, organizationId);
      const enriched = [];

      for (const remediation of remediations) {
        const finding = await query(
          `SELECT * FROM audit_findings WHERE id = $1 AND organization_id = $2`,
          [remediation.finding_id, organizationId]
        );
        const severity = finding.rows[0]?.severity || remediation.priority || 'MEDIUM';
        const actionPlan = this.createActionPlan(finding.rows[0], remediation);
        const estimatedEffort = severity === 'CRITICAL' ? 'High - 3 to 5 working days' :
          severity === 'HIGH' ? 'Medium - 2 to 3 working days' : 'Low - 1 to 2 working days';

        const updated = await query(
          `UPDATE audit_remediation
           SET action_plan = $1, estimated_effort = $2, updated_at = NOW()
           WHERE id = $3 AND organization_id = $4
           RETURNING *`,
          [JSON.stringify(actionPlan), estimatedEffort, remediation.id, organizationId]
        );

        const start = new Date();
        for (let i = 0; i < actionPlan.length; i++) {
          const due = new Date(start);
          due.setDate(due.getDate() + actionPlan[i].dueInDays);
          await query(
            `INSERT INTO audit_remediation_tasks
             (organization_id, remediation_id, task_name, assigned_to, due_date, priority)
             SELECT $1, $2, $3, $4, $5, $6
             WHERE NOT EXISTS (
               SELECT 1 FROM audit_remediation_tasks
               WHERE organization_id = $1 AND remediation_id = $2 AND task_name = $3
             )`,
            [
              organizationId,
              remediation.id,
              actionPlan[i].task,
              remediation.suggested_owner_id,
              due.toISOString().slice(0, 10),
              remediation.priority
            ]
          );
        }

        enriched.push(updated.rows[0]);
      }

      return enriched;
    } catch (err) {
      logger.error('AI remediation planning failed:', err);
      return [];
    }
  }

  createActionPlan(finding, remediation) {
    const title = finding?.title || 'Audit finding';
    const baseDays = remediation.priority === 'CRITICAL' ? 2 : remediation.priority === 'HIGH' ? 4 : 7;
    return [
      {
        step: 1,
        task: `Confirm root cause for ${title}`,
        ownerRole: 'Finding owner',
        dueInDays: baseDays,
        outcome: 'Root cause documented'
      },
      {
        step: 2,
        task: `Implement corrective action for ${title}`,
        ownerRole: 'Control owner',
        dueInDays: baseDays + 5,
        outcome: 'Corrective control or evidence update completed'
      },
      {
        step: 3,
        task: `Validate remediation evidence for ${title}`,
        ownerRole: 'Compliance reviewer',
        dueInDays: baseDays + 8,
        outcome: 'Evidence reviewed and finding ready for closure'
      }
    ];
  }
}

export default new RemediationPlanningService();
