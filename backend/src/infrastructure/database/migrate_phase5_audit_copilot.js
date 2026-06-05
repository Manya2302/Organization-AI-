// ============================================================
// Database Migration — Phase 5: Audit Copilot Foundation
// SecureVault AI — Audit Planning, Risk, Checklist & Scopes
// Run: node src/infrastructure/database/migrate_phase5_audit_copilot.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // 1. audit_plans
  `CREATE TABLE IF NOT EXISTS audit_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    framework VARCHAR(100) NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    scope VARCHAR(100) DEFAULT 'Organization',
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Draft',
    timeline JSONB,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. audit_scopes
  `CREATE TABLE IF NOT EXISTS audit_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    scope_type VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    affected_controls JSONB DEFAULT '[]',
    affected_evidence JSONB DEFAULT '[]',
    affected_policies JSONB DEFAULT '[]',
    affected_risks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. audit_checklists
  `CREATE TABLE IF NOT EXISTS audit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    control_code VARCHAR(100) NOT NULL,
    requirement VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    evidence_id UUID,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 4. audit_evidence_recommendations
  `CREATE TABLE IF NOT EXISTS audit_evidence_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    control_code VARCHAR(100) NOT NULL,
    requirement_code VARCHAR(100),
    recommended_evidence_name VARCHAR(255) NOT NULL,
    matching_document_id UUID,
    matching_document_name VARCHAR(255),
    match_confidence INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Recommended',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. audit_control_analysis
  `CREATE TABLE IF NOT EXISTS audit_control_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    control_code VARCHAR(100) NOT NULL,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    health_score DECIMAL(5,2) DEFAULT 0.00,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    ownership_status VARCHAR(50) DEFAULT 'Valid',
    implementation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. audit_risk_assessments
  `CREATE TABLE IF NOT EXISTS audit_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    risk_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'Open',
    remediation_plan TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. audit_preparation_tasks
  `CREATE TABLE IF NOT EXISTS audit_preparation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. audit_preparation_status
  `CREATE TABLE IF NOT EXISTS audit_preparation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    phase_name VARCHAR(100) NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Not Started',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 9. audit_planning_sessions
  `CREATE TABLE IF NOT EXISTS audit_planning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    messages JSONB DEFAULT '[]',
    current_step VARCHAR(100) DEFAULT 'initial',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. audit_framework_templates
  `CREATE TABLE IF NOT EXISTS audit_framework_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    framework_code VARCHAR(100) NOT NULL UNIQUE,
    template_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. audit_readiness_snapshots
  `CREATE TABLE IF NOT EXISTS audit_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    controls_count INTEGER DEFAULT 0,
    policies_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 12. audit_readiness_history
  `CREATE TABLE IF NOT EXISTS audit_readiness_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Base audit package/finding tables can arrive from Phase 4. Keep Phase 5 bootstrapping self-contained.
  `CREATE TABLE IF NOT EXISTS audit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    audit_type VARCHAR(100) DEFAULT 'Internal',
    status VARCHAR(50) DEFAULT 'Draft',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    total_evidence INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    finding_type VARCHAR(100) DEFAULT 'Gap',
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    recommendation TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Phase 5 Parts 2-4 compatibility columns for tables introduced in Phase 4
  `ALTER TABLE audit_packages ADD COLUMN IF NOT EXISTS audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL`,
  `ALTER TABLE audit_packages ADD COLUMN IF NOT EXISTS package_type VARCHAR(100) DEFAULT 'Auditor'`,
  `ALTER TABLE audit_packages ADD COLUMN IF NOT EXISTS integrity_hash VARCHAR(128)`,
  `ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE`,
  `ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS finding_category VARCHAR(100)`,
  `ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) DEFAULT 0.00`,

  // Phase 5 Part 2: Evidence Intelligence
  `CREATE TABLE IF NOT EXISTS audit_package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_package_id UUID REFERENCES audit_packages(id) ON DELETE CASCADE,
    evidence_recommendation_id UUID REFERENCES audit_evidence_recommendations(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    control_code VARCHAR(100),
    item_name VARCHAR(500) NOT NULL,
    item_type VARCHAR(100) DEFAULT 'Evidence',
    trust_score DECIMAL(5,2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_evidence_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    evidence_recommendation_id UUID REFERENCES audit_evidence_recommendations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    control_code VARCHAR(100),
    policy_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    requirement_code VARCHAR(100),
    framework VARCHAR(100),
    relationship_strength DECIMAL(5,2) DEFAULT 0.00,
    relationship_type VARCHAR(100) DEFAULT 'Supports Control',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, audit_plan_id, evidence_recommendation_id)
  )`,

  // Phase 5 Part 3: Findings, remediation, prediction, simulation, timelines
  `CREATE TABLE IF NOT EXISTS audit_finding_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES audit_findings(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_remediation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES audit_findings(id) ON DELETE CASCADE,
    recommended_action TEXT NOT NULL,
    suggested_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    estimated_impact VARCHAR(100) DEFAULT 'Medium',
    estimated_resolution_days INTEGER DEFAULT 14,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_remediation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    remediation_id UUID REFERENCES audit_remediation(id) ON DELETE CASCADE,
    task_name VARCHAR(500) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    control_code VARCHAR(100) NOT NULL,
    failure_probability DECIMAL(5,2) DEFAULT 0.00,
    control_risk_score DECIMAL(5,2) DEFAULT 0.00,
    factors JSONB DEFAULT '[]',
    prediction_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL,
    framework VARCHAR(100),
    department VARCHAR(255),
    scope VARCHAR(100),
    expected_score DECIMAL(5,2) DEFAULT 0.00,
    expected_findings JSONB DEFAULT '[]',
    expected_risks JSONB DEFAULT '[]',
    readiness_analysis JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE CASCADE,
    milestone_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Phase 5 Part 4: autonomous copilot, external reviews, shares and reports
  `CREATE TABLE IF NOT EXISTS audit_external_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_package_id UUID REFERENCES audit_packages(id) ON DELETE CASCADE,
    reviewer_email VARCHAR(255) NOT NULL,
    reviewer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Invited',
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_package_id UUID REFERENCES audit_packages(id) ON DELETE CASCADE,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    access_level VARCHAR(50) DEFAULT 'ReadOnly',
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL,
    report_type VARCHAR(100) DEFAULT 'Executive Summary',
    title VARCHAR(500) NOT NULL,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    risk_exposure DECIMAL(5,2) DEFAULT 0.00,
    evidence_coverage DECIMAL(5,2) DEFAULT 0.00,
    control_coverage DECIMAL(5,2) DEFAULT 0.00,
    open_findings INTEGER DEFAULT 0,
    report_payload JSONB DEFAULT '{}',
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_framework_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_framework VARCHAR(100) NOT NULL,
    source_control_code VARCHAR(100) NOT NULL,
    target_framework VARCHAR(100) NOT NULL,
    target_control_code VARCHAR(100) NOT NULL,
    mapping_strength VARCHAR(50) DEFAULT 'Partial',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL,
    title VARCHAR(500) DEFAULT 'Audit AI Session',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES audit_ai_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Local graph staging required by AuditKnowledgeGraphService and Neo4j sync helpers.
  `CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    node_type VARCHAR(100) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_label VARCHAR(500) NOT NULL,
    properties JSONB DEFAULT '{}',
    neo4j_synced BOOLEAN DEFAULT FALSE,
    neo4j_node_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, node_type, node_id)
  )`,

  `CREATE TABLE IF NOT EXISTS graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(100) NOT NULL,
    weight DECIMAL(8,4) DEFAULT 1.0000,
    properties JSONB DEFAULT '{}',
    neo4j_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Final Phase 5 enterprise completion: orchestrated workflows and maturity snapshots
  `CREATE TABLE IF NOT EXISTS audit_orchestrator_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    workflow_name VARCHAR(255) DEFAULT 'Autonomous Audit Workflow',
    current_step VARCHAR(100) DEFAULT 'Audit Request',
    status VARCHAR(50) DEFAULT 'Running',
    steps JSONB DEFAULT '[]',
    result_payload JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS audit_maturity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_plan_id UUID REFERENCES audit_plans(id) ON DELETE SET NULL,
    maturity_score DECIMAL(5,2) DEFAULT 0.00,
    maturity_level VARCHAR(50) DEFAULT 'Initial',
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    evidence_score DECIMAL(5,2) DEFAULT 0.00,
    remediation_score DECIMAL(5,2) DEFAULT 0.00,
    prediction_score DECIMAL(5,2) DEFAULT 0.00,
    factors JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `ALTER TABLE audit_remediation ADD COLUMN IF NOT EXISTS action_plan JSONB DEFAULT '[]'`,
  `ALTER TABLE audit_remediation ADD COLUMN IF NOT EXISTS estimated_effort VARCHAR(100) DEFAULT 'Medium'`,

  `CREATE INDEX IF NOT EXISTS idx_audit_package_items_org ON audit_package_items(organization_id, audit_package_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_relationships_plan ON audit_evidence_relationships(organization_id, audit_plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_findings_plan ON audit_findings(organization_id, audit_plan_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_remediation_plan ON audit_remediation(organization_id, audit_plan_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_predictions_plan ON audit_predictions(organization_id, audit_plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_timelines_plan ON audit_timelines(organization_id, audit_plan_id, due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_reports_org ON audit_executive_reports(organization_id, generated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_orchestrator_plan ON audit_orchestrator_runs(organization_id, audit_plan_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_maturity_plan ON audit_maturity_scores(organization_id, audit_plan_id, calculated_at DESC)`
];

export const migrateAuditCopilot = async () => {
  logger.info('🚀 Starting Phase 5 Audit Copilot migrations...');
  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (err) {
      logger.error('Migration step failed:', err.message);
      throw err;
    }
  }
  logger.info('✅ Phase 5 Audit Copilot tables migrated.');
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('migrate_phase5_audit_copilot.js')) {
  (async () => {
    try {
      await connectDB();
      await migrateAuditCopilot();
      process.exit(0);
    } catch (err) {
      logger.error('Migration script failed:', err);
      process.exit(1);
    }
  })();
}
