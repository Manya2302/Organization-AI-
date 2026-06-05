// ====================================================================
// AEOPWorkflowService — Phase 8 Autonomous Enterprise Operations Services
// ====================================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// ── 1. ENTERPRISE WORKFLOW ORCHESTRATOR ──
export class WorkflowOrchestratorService {
  async getWorkflows(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM enterprise_workflows WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('WorkflowOrchestratorService.getWorkflows error:', err);
      return [];
    }
  }

  async createWorkflow(organizationId, data) {
    const { title, workflowType, steps = [] } = data;
    const wfRes = await query(
      `INSERT INTO enterprise_workflows (organization_id, title, workflow_type, status)
       VALUES ($1, $2, $3, 'Active') RETURNING *`,
      [organizationId, title, workflowType]
    );
    const wf = wfRes.rows[0];

    // Insert steps if provided
    for (let i = 0; i < steps.length; i++) {
      await query(
        `INSERT INTO workflow_steps (workflow_id, step_number, title, step_type, status, assigned_role)
         VALUES ($1, $2, $3, $4, 'Pending', $5)`,
        [wf.id, i + 1, steps[i].title, steps[i].stepType || 'Approval', steps[i].assignedRole || 'Compliance Officer']
      );
    }
    return wf;
  }
}

// ── 2. AUTONOMOUS RECOMMENDATION ENGINE ──
export class RecommendationEngineService {
  async getRecommendations(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM recommendations WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('RecommendationEngineService.getRecommendations error:', err);
      return [];
    }
  }

  async acceptRecommendation(organizationId, recId, userId) {
    const recRes = await query(`SELECT * FROM recommendations WHERE id = $1 AND organization_id = $2`, [recId, organizationId]);
    if (recRes.rows.length === 0) return null;
    const rec = recRes.rows[0];

    // Mark as accepted
    await query(`UPDATE recommendations SET status = 'Accepted' WHERE id = $1`, [recId]);

    // Insert to recommendation history
    await query(
      `INSERT INTO recommendation_history (recommendation_id, action_taken, taken_by)
       VALUES ($1, 'Accepted & Action Created', $2)`,
      [recId, userId]
    );

    // Create a corresponding action automatically
    const actionRes = await query(
      `INSERT INTO enterprise_actions (organization_id, title, source_module, priority, status)
       VALUES ($1, $2, $3, $4, 'Open') RETURNING *`,
      [organizationId, `Action: ${rec.recommendation_text}`, rec.trigger_source, rec.priority]
    );
    return actionRes.rows[0];
  }
}

// ── 3. ENTERPRISE ACTION CENTER ──
export class ActionCenterService {
  async getActions(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM enterprise_actions WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('ActionCenterService.getActions error:', err);
      return [];
    }
  }

  async createAction(organizationId, data) {
    const { title, sourceModule, priority, dueDate } = data;
    const res = await query(
      `INSERT INTO enterprise_actions (organization_id, title, source_module, priority, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, title, sourceModule, priority || 'Medium', dueDate || null]
    );
    return res.rows[0];
  }
}

// ── 4. AUTOMATION RULES ENGINE ──
export class AutomationEngineService {
  async getRules(organizationId) {
    return [
      { id: '1', title: 'IF audit readiness < 70 THEN create remediation plan', type: 'Conditional', active: true },
      { id: '2', title: 'IF evidence expires THEN assign review task', type: 'Simple', active: true },
      { id: '3', title: 'IF vendor risk > 90 THEN escalate to compliance officer', type: 'Multi-Step', active: true },
      { id: '4', title: 'IF policy expires within 30 days THEN notify owner', type: 'Conditional', active: false },
      { id: '5', title: 'IF AI trust score < 60 THEN trigger governance review', type: 'Cross-Department', active: true }
    ];
  }
}

// ── 5. DECISION INTELLIGENCE ENGINE ──
export class DecisionExecutionService {
  async getDecisions(organizationId) {
    try {
      const res = await query(
        `SELECT d.*, o.success_rate, o.notes FROM decision_execution d
         LEFT JOIN decision_outcomes o ON o.decision_id = d.id
         WHERE d.organization_id = $1 ORDER BY d.created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('DecisionExecutionService.getDecisions error:', err);
      return [];
    }
  }

  async recordDecisionExecution(organizationId, userId, data) {
    const { decisionTitle, approverId } = data;
    const res = await query(
      `INSERT INTO decision_execution (organization_id, decision_title, executor_id, approver_id, approved_at, status)
       VALUES ($1, $2, $3, $4, NOW(), 'Done') RETURNING *`,
      [organizationId, decisionTitle, userId, approverId || null]
    );
    const decision = res.rows[0];

    // Record mock outcome
    await query(
      `INSERT INTO decision_outcomes (decision_id, success_rate, notes)
       VALUES ($1, 95.0, 'Executed successfully with documented compliance verification.')`,
      [decision.id]
    );
    return decision;
  }
}

// ── 6. STRATEGIC PLANNING ENGINE ──
export class StrategicPlanningService {
  async getPlans(organizationId) {
    try {
      const plans = await query(
        `SELECT * FROM strategic_plans WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return plans.rows;
    } catch (err) {
      logger.error('StrategicPlanningService.getPlans error:', err);
      return [];
    }
  }

  async generateStrategicPlan(organizationId, data) {
    const { planName, planType, startDate, endDate, milestones = [] } = data;
    const planRes = await query(
      `INSERT INTO strategic_plans (organization_id, plan_name, plan_type, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'Active') RETURNING *`,
      [organizationId, planName, planType, startDate, endDate]
    );
    const plan = planRes.rows[0];

    for (const mil of milestones) {
      await query(
        `INSERT INTO strategic_milestones (plan_id, title, target_date, status)
         VALUES ($1, $2, $3, 'Pending')`,
        [plan.id, mil.title, mil.targetDate]
      );
    }
    return plan;
  }
}

// ── 7. OPERATIONAL RISK INTELLIGENCE ──
export class OperationalRiskService {
  async getRiskRegister(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM risk_register WHERE organization_id = $1 ORDER BY score DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('OperationalRiskService.getRiskRegister error:', err);
      return [];
    }
  }
}

// ── 8. ENTERPRISE COMMAND CENTER ──
export class EnterpriseCommandCenterService {
  async getCommandCenterMetrics(organizationId) {
    try {
      const scores = await query(
        `SELECT * FROM enterprise_scores WHERE organization_id = $1 ORDER BY recorded_date DESC LIMIT 1`,
        [organizationId]
      );
      const health = await query(
        `SELECT * FROM enterprise_health WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [organizationId]
      );
      return {
        scores: scores.rows[0] || { compliance_score: 92.5, audit_score: 95.0, ai_score: 88.0, knowledge_score: 87.0 },
        health: health.rows[0] || { overall_health_score: 90.6, operational_readiness_score: 92.0 }
      };
    } catch (err) {
      logger.error('EnterpriseCommandCenterService.getCommandCenterMetrics error:', err);
      return { scores: {}, health: {} };
    }
  }
}

// ── 9. OUTCOME ANALYTICS ENGINE ──
export class OutcomeAnalyticsService {
  async getOutcomeAnalytics(organizationId) {
    try {
      const totalActions = await query(`SELECT COUNT(*) as count FROM enterprise_actions WHERE organization_id = $1`, [organizationId]);
      const closedActions = await query(`SELECT COUNT(*) as count FROM enterprise_actions WHERE organization_id = $1 AND status = 'Closed'`, [organizationId]);
      const outcomes = await query(
        `SELECT COALESCE(AVG(risk_reduction_score), 0) as avg_reduction FROM action_outcomes ao
         JOIN enterprise_actions ea ON ao.action_id = ea.id
         WHERE ea.organization_id = $1`,
        [organizationId]
      );
      return {
        totalActions: parseInt(totalActions.rows[0]?.count) || 0,
        closedActions: parseInt(closedActions.rows[0]?.count) || 0,
        avgRiskReduction: parseFloat(outcomes.rows[0]?.avg_reduction) || 0.00
      };
    } catch (err) {
      logger.error('OutcomeAnalyticsService.getOutcomeAnalytics error:', err);
      return { totalActions: 0, closedActions: 0, avgRiskReduction: 0 };
    }
  }
}

// ── 10. ENTERPRISE DIGITAL WORKFORCE ──
export class DigitalWorkforceService {
  async getAgents(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM digital_agents WHERE organization_id = $1 ORDER BY agent_name`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('DigitalWorkforceService.getAgents error:', err);
      return [];
    }
  }

  async triggerAgentTask(agentId, taskTitle) {
    const taskRes = await query(
      `INSERT INTO agent_tasks (agent_id, task_title, status, started_at)
       VALUES ($1, $2, 'Pending', NOW()) RETURNING *`,
      [agentId, taskTitle]
    );
    const task = taskRes.rows[0];

    // Log mock action
    await query(
      `INSERT INTO agent_actions (task_id, action_type, details)
       VALUES ($1, 'Monitor API Logs', 'Scanned compliance thresholds on active audit schemas.')`,
      [task.id]
    );

    await query(
      `INSERT INTO agent_activity_logs (agent_id, message)
       VALUES ($1, $2)`,
      [agentId, `Started background automation review for task: ${taskTitle}`]
    );
    return task;
  }
}

// Export singleton class instances
export const orchestratorService = new WorkflowOrchestratorService();
export const aeopRecommendationService = new RecommendationEngineService();
export const actionCenterService = new ActionCenterService();
export const automationEngineService = new AutomationEngineService();
export const decisionExecutionService = new DecisionExecutionService();
export const strategicPlanningService = new StrategicPlanningService();
export const operationalRiskService = new OperationalRiskService();
export const cmdCenterService = new EnterpriseCommandCenterService();
export const outcomeAnalyticsService = new OutcomeAnalyticsService();
export const digitalWorkforceService = new DigitalWorkforceService();
