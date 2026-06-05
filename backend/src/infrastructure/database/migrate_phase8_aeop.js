// ====================================================================
// Phase 8 DDL Migration: Autonomous Enterprise Operations Platform (AEOP)
// Creates 25 tables for workflows, actions, recommendations, rule automation,
// decision outcomes, digital agents, and command command telemetry.
// ====================================================================
import { query } from './connection.js';
import { logger } from '../logging/logger.js';

export async function migrateAEOP() {
  logger.info('🚀 Starting Phase 8 AEOP schema migrations...');

  const queries = [
    // 1. enterprise_workflows
    `CREATE TABLE IF NOT EXISTS enterprise_workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      workflow_type VARCHAR(100) NOT NULL, -- Compliance, Audit, Risk, Policy, etc.
      status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, Suspended, Completed
      created_by UUID,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 2. workflow_steps
    `CREATE TABLE IF NOT EXISTS workflow_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID REFERENCES enterprise_workflows(id) ON DELETE CASCADE,
      step_number INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      step_type VARCHAR(100) DEFAULT 'Approval', -- Action, Approval, Decision, Integration
      status VARCHAR(50) DEFAULT 'Pending', -- Pending, Active, Completed, Failed
      assigned_role VARCHAR(100),
      config JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 3. workflow_assignments
    `CREATE TABLE IF NOT EXISTS workflow_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID REFERENCES enterprise_workflows(id) ON DELETE CASCADE,
      step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'Assigned' -- Assigned, Done, Rejected
    )`,

    // 4. workflow_escalations
    `CREATE TABLE IF NOT EXISTS workflow_escalations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID REFERENCES enterprise_workflows(id) ON DELETE CASCADE,
      step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
      escalated_to UUID NOT NULL,
      reason TEXT,
      escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'Active'
    )`,

    // 5. workflow_templates
    `CREATE TABLE IF NOT EXISTS workflow_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      template_name VARCHAR(255) NOT NULL,
      workflow_type VARCHAR(100) NOT NULL,
      definition JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 6. enterprise_actions
    `CREATE TABLE IF NOT EXISTS enterprise_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      source_module VARCHAR(100) NOT NULL, -- Audit, Compliance, AI Governance, Risk
      priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Critical
      status VARCHAR(50) DEFAULT 'Open', -- Open, In_Progress, Pending_Verification, Closed
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 7. action_assignments
    `CREATE TABLE IF NOT EXISTS action_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action_id UUID REFERENCES enterprise_actions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE,
      notes TEXT
    )`,

    // 8. action_outcomes
    `CREATE TABLE IF NOT EXISTS action_outcomes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action_id UUID REFERENCES enterprise_actions(id) ON DELETE CASCADE,
      verified_by UUID,
      outcome_metrics JSONB DEFAULT '{}'::jsonb,
      evidence_ref VARCHAR(255),
      risk_reduction_score DECIMAL(5,2) DEFAULT 0.00,
      verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 9. recommendations
    `CREATE TABLE IF NOT EXISTS recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      trigger_source VARCHAR(100) NOT NULL,
      recommendation_text TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'Recommended', -- Recommended, Accepted, Dismissed
      estimated_impact DECIMAL(5,2) DEFAULT 0.00,
      estimated_effort VARCHAR(50) DEFAULT 'Medium',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 10. recommendation_history
    `CREATE TABLE IF NOT EXISTS recommendation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
      action_taken VARCHAR(100),
      taken_by UUID,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 11. decision_execution
    `CREATE TABLE IF NOT EXISTS decision_execution (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      decision_title VARCHAR(255) NOT NULL,
      executor_id UUID,
      approver_id UUID,
      approved_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'Pending_Approval', -- Pending_Approval, Executing, Done
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 12. decision_outcomes
    `CREATE TABLE IF NOT EXISTS decision_outcomes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      decision_id UUID REFERENCES decision_execution(id) ON DELETE CASCADE,
      success_rate DECIMAL(5,2),
      notes TEXT,
      audit_ready BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 13. strategic_plans
    `CREATE TABLE IF NOT EXISTS strategic_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      plan_name VARCHAR(255) NOT NULL,
      plan_type VARCHAR(100) NOT NULL, -- Audit Roadmap, Compliance Plan
      status VARCHAR(50) DEFAULT 'Draft',
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 14. strategic_milestones
    `CREATE TABLE IF NOT EXISTS strategic_milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id UUID REFERENCES strategic_plans(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      target_date TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'Pending'
    )`,

    // 15. risk_register
    `CREATE TABLE IF NOT EXISTS risk_register (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      risk_title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- Process, Vendor, Compliance, AI, Audit
      severity VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Critical
      score DECIMAL(5,2) DEFAULT 50.00,
      mitigation_plan TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 16. risk_events
    `CREATE TABLE IF NOT EXISTS risk_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      risk_id UUID REFERENCES risk_register(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      severity VARCHAR(50) NOT NULL,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 17. risk_forecasts
    `CREATE TABLE IF NOT EXISTS risk_forecasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      forecast_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      predicted_incidents_count INT DEFAULT 0,
      confidence_level DECIMAL(5,2) DEFAULT 80.00
    )`,

    // 18. enterprise_scores
    `CREATE TABLE IF NOT EXISTS enterprise_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      compliance_score DECIMAL(5,2) DEFAULT 100.00,
      audit_score DECIMAL(5,2) DEFAULT 100.00,
      ai_score DECIMAL(5,2) DEFAULT 100.00,
      knowledge_score DECIMAL(5,2) DEFAULT 100.00,
      recorded_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 19. enterprise_health
    `CREATE TABLE IF NOT EXISTS enterprise_health (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      overall_health_score DECIMAL(5,2) DEFAULT 100.00,
      operational_readiness_score DECIMAL(5,2) DEFAULT 100.00,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 20. digital_agents
    `CREATE TABLE IF NOT EXISTS digital_agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      agent_name VARCHAR(100) NOT NULL,
      role VARCHAR(100) NOT NULL, -- Compliance Agent, Audit Agent, etc.
      status VARCHAR(50) DEFAULT 'Idle', -- Idle, Active, Error
      capabilities JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 21. agent_tasks
    `CREATE TABLE IF NOT EXISTS agent_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES digital_agents(id) ON DELETE CASCADE,
      task_title VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE
    )`,

    // 22. agent_actions
    `CREATE TABLE IF NOT EXISTS agent_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
      action_type VARCHAR(100) NOT NULL,
      details TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 23. agent_activity_logs
    `CREATE TABLE IF NOT EXISTS agent_activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES digital_agents(id) ON DELETE CASCADE,
      log_level VARCHAR(50) DEFAULT 'INFO',
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 24. enterprise_notifications
    `CREATE TABLE IF NOT EXISTS enterprise_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 25. enterprise_escalations
    `CREATE TABLE IF NOT EXISTS enterprise_escalations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      action_id UUID REFERENCES enterprise_actions(id) ON DELETE CASCADE,
      escalated_to UUID NOT NULL,
      reason TEXT,
      escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP WITH TIME ZONE
    )`
  ];

  for (const q of queries) {
    try {
      const match = q.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      const tableName = match ? match[1] : 'unknown';
      const start = Date.now();
      await query(q);
      const duration = Date.now() - start;
      if (duration > 100) {
        logger.warn(`Slow query detected (${duration}ms): ${q.substring(0, 80)}...`);
      }
    } catch (err) {
      logger.error(`Failed to execute migration query: ${q.substring(0, 100)}`, err);
      throw err;
    }
  }

  // Create indexes for performance tuning
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_ent_workflows_org ON enterprise_workflows(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ent_actions_org ON enterprise_actions(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ent_recs_org ON recommendations(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ent_agents_org ON digital_agents(organization_id)`
  ];

  for (const idx of indexes) {
    try {
      await query(idx);
    } catch (err) {
      logger.warn(`Failed to create index: ${idx}`, err.message);
    }
  }

  logger.info('✅ Phase 8 AEOP tables migrated successfully.');
}
