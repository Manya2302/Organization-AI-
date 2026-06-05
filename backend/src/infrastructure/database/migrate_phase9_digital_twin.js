// ============================================================
// Database Migration — Phase 9: Cognitive Enterprise Digital Twin & Strategy Platform
// SecureVault AI — Digital Twin Schema Migration
// ============================================================
import { query } from './connection.js';
import { logger } from '../logging/logger.js';

const migrations = [
  // 1. digital_twin_entities
  `CREATE TABLE IF NOT EXISTS digital_twin_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- 'Employee', 'Department', 'Project', 'Policy', 'Control', 'Audit', 'Vendor', 'Customer', 'Asset', 'AI System', 'Risk', 'Workflow', 'Decision'
    status VARCHAR(50) DEFAULT 'Synced', -- 'Synced', 'Out_of_Sync', 'Archived'
    properties JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. digital_twin_relationships
  `CREATE TABLE IF NOT EXISTS digital_twin_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_entity_id UUID REFERENCES digital_twin_entities(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES digital_twin_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- 'depends_on', 'reports_to', 'controls', 'audits', 'owns', 'uses', 'affects'
    strength DECIMAL(3,2) DEFAULT 1.00,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. digital_twin_sync
  `CREATE TABLE IF NOT EXISTS digital_twin_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sync_status VARCHAR(50) DEFAULT 'Completed', -- 'Completed', 'Failed', 'In_Progress'
    entities_count INTEGER DEFAULT 0,
    relationships_count INTEGER DEFAULT 0,
    details TEXT,
    sync_duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 4. simulation_scenarios
  `CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(100) NOT NULL, -- 'Employee Departure', 'Vendor Failure', 'Compliance Violation', 'Audit Failure', 'Policy Change', 'Project Delay', 'Department Expansion', 'Acquisition', 'Business Growth', 'Data Breach', 'System Outage'
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. simulation_runs
  `CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES simulation_scenarios(id) ON DELETE SET NULL,
    simulation_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Completed', -- 'Completed', 'Failed', 'Running'
    run_by UUID REFERENCES users(id) ON DELETE SET NULL,
    impact_analysis JSONB DEFAULT '{}',
    affected_departments JSONB DEFAULT '[]',
    affected_projects JSONB DEFAULT '[]',
    affected_controls JSONB DEFAULT '[]',
    affected_knowledge JSONB DEFAULT '[]',
    affected_revenue DECIMAL(15,2) DEFAULT 0.00,
    resilience_score DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. scenario_results
  `CREATE TABLE IF NOT EXISTS scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
    run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
    summary TEXT,
    risk_assessment JSONB DEFAULT '{}',
    cost_forecast JSONB DEFAULT '{}',
    impact_forecast JSONB DEFAULT '{}',
    success_probability DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. forecast_models
  `CREATE TABLE IF NOT EXISTS forecast_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    target_metric VARCHAR(100) NOT NULL, -- 'Compliance Readiness', 'Audit Readiness', 'Risk Exposure', 'Project Delivery', 'Vendor Performance', 'Knowledge Loss', 'AI Governance Health', 'Workforce Stability', 'Department Growth'
    algorithm VARCHAR(100) DEFAULT 'Time Series Prophet',
    accuracy DECIMAL(5,2) DEFAULT 92.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. forecast_results
  `CREATE TABLE IF NOT EXISTS forecast_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_id UUID REFERENCES forecast_models(id) ON DELETE CASCADE,
    target_metric VARCHAR(100) NOT NULL,
    forecast_30d JSONB DEFAULT '{}',
    forecast_90d JSONB DEFAULT '{}',
    forecast_1y JSONB DEFAULT '{}',
    forecast_3y JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 9. strategic_recommendations
  `CREATE TABLE IF NOT EXISTS strategic_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'Twin Analysis', 'Risk Forecast', 'AI Council'
    priority VARCHAR(50) DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    status VARCHAR(50) DEFAULT 'Proposed', -- 'Proposed', 'Approved', 'Dismissed', 'Executed'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. strategic_opportunities
  `CREATE TABLE IF NOT EXISTS strategic_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    potential_benefit TEXT,
    feasibility VARCHAR(50) DEFAULT 'High', -- 'High', 'Medium', 'Low'
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. strategic_risks
  `CREATE TABLE IF NOT EXISTS strategic_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    mitigation TEXT,
    severity VARCHAR(50) DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    probability VARCHAR(50) DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 12. decision_simulations
  `CREATE TABLE IF NOT EXISTS decision_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    decision_proposal TEXT NOT NULL,
    simulated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cost_impact DECIMAL(15,2) DEFAULT 0.00,
    risk_impact VARCHAR(100) DEFAULT 'Low',
    compliance_impact VARCHAR(100) DEFAULT 'Positive',
    operational_impact VARCHAR(100) DEFAULT 'Stable',
    knowledge_impact VARCHAR(100) DEFAULT 'Minimal',
    success_probability DECIMAL(5,2) DEFAULT 100.00,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 13. decision_outcomes (note: CREATE TABLE IF NOT EXISTS handles existence gracefully, we append columns or leave as-is)
  `CREATE TABLE IF NOT EXISTS decision_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID,
    success_rate DECIMAL(5,2),
    notes TEXT,
    audit_ready BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 14. resilience_metrics
  `CREATE TABLE IF NOT EXISTS resilience_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enterprise_score DECIMAL(5,2) DEFAULT 100.00,
    business_continuity DECIMAL(5,2) DEFAULT 100.00,
    operational_stability DECIMAL(5,2) DEFAULT 100.00,
    compliance_stability DECIMAL(5,2) DEFAULT 100.00,
    vendor_stability DECIMAL(5,2) DEFAULT 100.00,
    knowledge_stability DECIMAL(5,2) DEFAULT 100.00,
    ai_stability DECIMAL(5,2) DEFAULT 100.00,
    recovery_capability DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 15. resilience_history
  `CREATE TABLE IF NOT EXISTS resilience_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE DEFAULT CURRENT_DATE,
    score_type VARCHAR(100) NOT NULL, -- 'Enterprise', 'Department', 'Risk', 'Recovery'
    score DECIMAL(5,2) DEFAULT 100.00,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 16. executive_warroom
  `CREATE TABLE IF NOT EXISTS executive_warroom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Green', -- 'Green', 'Yellow', 'Red'
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 17. executive_alerts
  `CREATE TABLE IF NOT EXISTS executive_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT,
    severity VARCHAR(50) DEFAULT 'Info', -- 'Critical', 'Warning', 'Info'
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 18. ai_council_sessions
  `CREATE TABLE IF NOT EXISTS ai_council_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    debate_log JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 19. ai_council_recommendations
  `CREATE TABLE IF NOT EXISTS ai_council_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ai_council_sessions(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL, -- 'Compliance Advisor', 'Audit Advisor', 'Risk Advisor', 'Knowledge Advisor', 'Workforce Advisor', 'Vendor Advisor', 'AI Governance Advisor', 'Strategy Advisor'
    recommendation TEXT NOT NULL,
    confidence DECIMAL(5,2) DEFAULT 90.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 20. enterprise_strategy
  `CREATE TABLE IF NOT EXISTS enterprise_strategy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    strategy_type VARCHAR(100) NOT NULL, -- 'Compliance Strategy', 'Audit Strategy', 'Knowledge Strategy', 'Workforce Strategy', 'Vendor Strategy', 'AI Governance Strategy'
    title VARCHAR(255) NOT NULL,
    roadmap_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 21. strategy_milestones (using unique name to avoid conflicts if needed, or CREATE TABLE IF NOT EXISTS strategy_milestones)
  `CREATE TABLE IF NOT EXISTS strategy_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES enterprise_strategy(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'In_Progress', 'Completed', 'Delayed'
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes for Phase 9 Performance
  `CREATE INDEX IF NOT EXISTS idx_twin_entities_org ON digital_twin_entities(organization_id, entity_type)`,
  `CREATE INDEX IF NOT EXISTS idx_twin_relationships_src ON digital_twin_relationships(source_entity_id)`,
  `CREATE INDEX IF NOT EXISTS idx_simulation_runs_org ON simulation_runs(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_forecast_results_org ON forecast_results(organization_id)`
];

export async function migratePhase9DigitalTwin() {
  logger.info('🚀 Starting Phase 9 Digital Twin & Strategy Platform DDL migrations...');

  for (const q of migrations) {
    try {
      await query(q);
    } catch (err) {
      logger.error(`Failed to execute migration query: ${q.substring(0, 100)}`, err);
      throw err;
    }
  }

  logger.info('✅ Phase 9 Digital Twin & Strategy tables migrated successfully.');
}
