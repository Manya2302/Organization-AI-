// ============================================================
// Service: AuditPlanningService
// Automatically builds audit plans, checklists, recommendations
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditTemplateEngine from './AuditTemplateEngine.js';

class AuditPlanningService {
  async createPlan(organizationId, userId, data) {
    const { name, framework, auditType, scope = 'Organization', department = null } = data;
    
    try {
      const template = await auditTemplateEngine.getTemplateByCode(framework);
      if (!template) {
        throw new Error(`Unsupported framework template: ${framework}`);
      }

      // 1. Create the main audit plan
      const planResult = await query(
        `INSERT INTO audit_plans 
         (organization_id, name, framework, audit_type, scope, department, status, readiness_score, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'Draft', 0.00, $7)
         RETURNING *`,
        [organizationId, name, framework, auditType, scope, department, userId]
      );
      const plan = planResult.rows[0];

      // 2. Create scope mapping
      await query(
        `INSERT INTO audit_scopes
         (organization_id, audit_plan_id, scope_type, value, affected_controls, affected_evidence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId, 
          plan.id, 
          scope, 
          department || 'All', 
          JSON.stringify(template.template_data.controls), 
          JSON.stringify(template.template_data.required_evidence)
        ]
      );

      // 3. Create checklist rows
      for (const ctrl of template.template_data.controls) {
        await query(
          `INSERT INTO audit_checklists
           (organization_id, audit_plan_id, control_code, requirement, status)
           VALUES ($1, $2, $3, $4, 'Pending')`,
          [organizationId, plan.id, ctrl.code, ctrl.title]
        );

        // 4. Create control analysis record
        await query(
          `INSERT INTO audit_control_analysis
           (organization_id, audit_plan_id, control_code, readiness_score, health_score, risk_score)
           VALUES ($1, $2, $3, 0.00, 50.00, 50.00)`,
          [organizationId, plan.id, ctrl.code]
        );
      }

      // 5. Create evidence recommendations
      for (const reqEv of template.template_data.required_evidence) {
        // Query database to see if we have matches in document table
        const matchingDoc = await query(
          `SELECT id, name FROM documents 
           WHERE organization_id = $1 AND name ILIKE $2 AND is_deleted = FALSE 
           LIMIT 1`,
          [organizationId, `%${reqEv.name.split(' ')[0]}%`]
        );
        
        const docId = matchingDoc.rows[0]?.id || null;
        const docName = matchingDoc.rows[0]?.name || null;
        const confidence = docId ? 85 : 0;
        const status = docId ? 'Recommended' : 'Missing';

        await query(
          `INSERT INTO audit_evidence_recommendations
           (organization_id, audit_plan_id, control_code, recommended_evidence_name, matching_document_id, matching_document_name, match_confidence, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [organizationId, plan.id, reqEv.control, reqEv.name, docId, docName, confidence, status]
        );
      }

      // 6. Generate prep tasks and timeline
      const tasks = [
        { name: `Review Policies for ${framework} controls`, dueDays: 7, priority: 'HIGH' },
        { name: `Collect evidence documents for controls`, dueDays: 14, priority: 'HIGH' },
        { name: `Validate evidence integrity & audit logs`, dueDays: 21, priority: 'MEDIUM' },
        { name: `Self-verify readiness controls`, dueDays: 30, priority: 'CRITICAL' }
      ];

      for (const task of tasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.dueDays);

        await query(
          `INSERT INTO audit_preparation_tasks
           (organization_id, audit_plan_id, task_name, assignee_id, due_date, status, priority)
           VALUES ($1, $2, $3, $4, $5, 'Pending', $6)`,
          [organizationId, plan.id, task.name, userId, dueDate.toISOString(), task.priority]
        );
      }

      // 7. Seed preparation status
      const phases = ['Requirements Parsing', 'Control Mapping', 'Evidence Discovery', 'Auditor Verification'];
      for (let i = 0; i < phases.length; i++) {
        await query(
          `INSERT INTO audit_preparation_status
           (organization_id, audit_plan_id, phase_name, completion_percentage, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [organizationId, plan.id, phases[i], i === 0 ? 100 : 0, i === 0 ? 'Completed' : 'Not Started']
        );
      }

      // 8. Generate pre-audit risks
      await query(
        `INSERT INTO audit_risk_assessments
         (organization_id, audit_plan_id, risk_type, title, description, severity, status)
         VALUES ($1, $2, 'Missing Evidence', 'Missing recommended evidence documentation', 'Critical evidence sheets have not been mapped to framework controls.', 'HIGH', 'Open')`,
        [organizationId, plan.id]
      );

      return plan;
    } catch (err) {
      logger.error('Failed to create audit plan:', err);
      throw err;
    }
  }

  async getPlans(organizationId) {
    try {
      const result = await query(
        `SELECT ap.*, u.name as creator_name 
         FROM audit_plans ap
         LEFT JOIN users u ON ap.created_by = u.id
         WHERE ap.organization_id = $1 ORDER BY ap.created_at DESC`,
        [organizationId]
      );
      return result.rows;
    } catch (err) {
      logger.error('Failed to get plans:', err);
      return [];
    }
  }

  async getPlanById(planId, organizationId) {
    try {
      const planRes = await query(
        `SELECT * FROM audit_plans WHERE id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      if (planRes.rows.length === 0) return null;
      
      const plan = planRes.rows[0];

      const scope = await query(
        `SELECT * FROM audit_scopes WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const checklists = await query(
        `SELECT * FROM audit_checklists WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const evidence = await query(
        `SELECT * FROM audit_evidence_recommendations WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const controls = await query(
        `SELECT * FROM audit_control_analysis WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const risks = await query(
        `SELECT * FROM audit_risk_assessments WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const tasks = await query(
        `SELECT * FROM audit_preparation_tasks WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const prepStatus = await query(
        `SELECT * FROM audit_preparation_status WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      return {
        ...plan,
        scope: scope.rows[0] || null,
        checklists: checklists.rows,
        evidence: evidence.rows,
        controls: controls.rows,
        risks: risks.rows,
        tasks: tasks.rows,
        preparation_status: prepStatus.rows
      };
    } catch (err) {
      logger.error(`Failed to get plan details for ${planId}:`, err);
      throw err;
    }
  }
}

export default new AuditPlanningService();
