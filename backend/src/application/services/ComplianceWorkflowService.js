import pool from '../../infrastructure/database/connection.js';

class ComplianceWorkflowService {
  async createWorkflow(organizationId, { title, controlId, assignedUserId, deadline }) {
    const query = `
      INSERT INTO compliance_workflows (organization_id, title, control_id, assigned_user_id, status, deadline, created_at)
      VALUES ($1, $2, $3, $4, 'Draft', $5, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, title, controlId, assignedUserId, deadline]);
    return result.rows[0];
  }

  async addWorkflowStep(organizationId, workflowId, { stepName, assignedUserId, status }) {
    const query = `
      INSERT INTO workflow_steps (organization_id, workflow_id, step_name, assigned_user_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, workflowId, stepName, assignedUserId, status]);
    return result.rows[0];
  }

  async submitApproval(organizationId, workflowId, { userId, isApproved, notes }) {
    const query = `
      INSERT INTO workflow_approvals (organization_id, workflow_id, user_id, is_approved, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, workflowId, userId, isApproved, notes]);
    
    // Update main workflow status based on approval
    const newStatus = isApproved ? 'Approved' : 'Remediation';
    await pool.query(
      `UPDATE compliance_workflows SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [newStatus, workflowId, organizationId]
    );

    return result.rows[0];
  }

  async addComment(organizationId, workflowId, { userId, commentText }) {
    const query = `
      INSERT INTO workflow_comments (organization_id, workflow_id, user_id, comment_text, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, workflowId, userId, commentText]);
    return result.rows[0];
  }

  async getWorkflowDetails(organizationId, workflowId) {
    const workflow = await pool.query(
      `SELECT * FROM compliance_workflows WHERE id = $1 AND organization_id = $2`,
      [workflowId, organizationId]
    );
    if (!workflow.rows[0]) return null;

    const steps = await pool.query(
      `SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY created_at ASC`,
      [workflowId]
    );
    const approvals = await pool.query(
      `SELECT * FROM workflow_approvals WHERE workflow_id = $1 ORDER BY created_at ASC`,
      [workflowId]
    );
    const comments = await pool.query(
      `SELECT * FROM workflow_comments WHERE workflow_id = $1 ORDER BY created_at ASC`,
      [workflowId]
    );

    return {
      ...workflow.rows[0],
      steps: steps.rows,
      approvals: approvals.rows,
      comments: comments.rows
    };
  }

  async checkSLAViolations(organizationId) {
    const query = `
      SELECT * FROM compliance_workflows 
      WHERE organization_id = $1 
        AND deadline < NOW() 
        AND status NOT IN ('Approved', 'Closure')
    `;
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }
}

export default new ComplianceWorkflowService();
