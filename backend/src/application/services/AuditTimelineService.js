// ============================================================
// Service: AuditTimelineService
// Generates preparation, evidence, review and remediation milestones.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditTimelineService {
  async generateTimeline(planId, organizationId) {
    try {
      const existing = await query(
        `SELECT * FROM audit_timelines
         WHERE audit_plan_id = $1 AND organization_id = $2
         ORDER BY due_date ASC`,
        [planId, organizationId]
      );
      if (existing.rows.length > 0) return existing.rows;

      const milestones = [
        { milestoneType: 'Planning', title: 'Finalize audit scope and framework mapping', days: 3 },
        { milestoneType: 'Evidence', title: 'Collect and map required evidence', days: 10 },
        { milestoneType: 'Review', title: 'Complete control owner verification', days: 17 },
        { milestoneType: 'Remediation', title: 'Close high-risk findings', days: 24 },
        { milestoneType: 'Package', title: 'Generate final auditor package', days: 30 }
      ];

      const rows = [];
      for (const milestone of milestones) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + milestone.days);
        const saved = await query(
          `INSERT INTO audit_timelines
           (organization_id, audit_plan_id, milestone_type, title, due_date, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            organizationId,
            planId,
            milestone.milestoneType,
            milestone.title,
            dueDate.toISOString().slice(0, 10),
            JSON.stringify({ offsetDays: milestone.days })
          ]
        );
        rows.push(saved.rows[0]);
      }
      return rows;
    } catch (err) {
      logger.error('Audit timeline generation failed:', err);
      return [];
    }
  }
}

export default new AuditTimelineService();
