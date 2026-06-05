// ============================================================
// Database Migration — Phase 7: Enterprise Intelligence Operating System
// SecureVault AI — EIOS Schema Migration
// Run: node src/infrastructure/database/migrate_phase7_eios.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // 1. enterprise_entities
  `CREATE TABLE IF NOT EXISTS enterprise_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- 'Employee', 'Department', 'Project', 'Vendor', 'Customer', 'Policy', 'Asset'
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. enterprise_relationships
  `CREATE TABLE IF NOT EXISTS enterprise_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_entity_id UUID REFERENCES enterprise_entities(id) ON DELETE CASCADE,
    target_entity_id UUID REFERENCES enterprise_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- 'belongs_to', 'owns', 'depends_on', 'manages', 'mitigates'
    strength DECIMAL(3,2) DEFAULT 1.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. decision_registry
  `CREATE TABLE IF NOT EXISTS decision_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    decision_type VARCHAR(100) DEFAULT 'Strategic',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Approved',
    reasoning TEXT,
    outcome TEXT,
    decision_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 4. decision_evidence
  `CREATE TABLE IF NOT EXISTS decision_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES decision_registry(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. decision_approvals
  `CREATE TABLE IF NOT EXISTS decision_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES decision_registry(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Approved', -- 'Pending', 'Approved', 'Rejected'
    notes TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. executive_insights
  `CREATE TABLE IF NOT EXISTS executive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Risk', 'Knowledge Gap', 'Adoption', 'Vendor'
    content TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    is_actioned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. executive_reports
  `CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    report_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. organizational_forecasts
  `CREATE TABLE IF NOT EXISTS organizational_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_type VARCHAR(100) NOT NULL, -- 'AuditFailure', 'ComplianceFailure', 'KnowledgeLoss', 'VendorRisk'
    probability DECIMAL(5,2) DEFAULT 0.00,
    impact_score DECIMAL(5,2) DEFAULT 0.00,
    timeframe VARCHAR(100) DEFAULT 'Q3',
    factors JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 9. knowledge_fabric
  `CREATE TABLE IF NOT EXISTS knowledge_fabric (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    coverage_score DECIMAL(5,2) DEFAULT 0.00,
    freshness_score DECIMAL(5,2) DEFAULT 0.00,
    redundancy_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_gap_severity VARCHAR(50) DEFAULT 'LOW',
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. knowledge_dependencies
  `CREATE TABLE IF NOT EXISTS knowledge_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_domain VARCHAR(255) NOT NULL,
    target_domain VARCHAR(255) NOT NULL,
    criticality VARCHAR(50) DEFAULT 'MEDIUM',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. workforce_intelligence
  `CREATE TABLE IF NOT EXISTS workforce_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_experts INTEGER DEFAULT 0,
    knowledge_loss_risk DECIMAL(5,2) DEFAULT 0.00,
    succession_readiness DECIMAL(5,2) DEFAULT 0.00,
    critical_role_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 12. employee_expertise
  `CREATE TABLE IF NOT EXISTS employee_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    expertise_level VARCHAR(50) DEFAULT 'Intermediate', -- 'Expert', 'Intermediate', 'Novice'
    score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 13. employee_risk_profiles
  `CREATE TABLE IF NOT EXISTS employee_risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_man_risk VARCHAR(50) DEFAULT 'LOW', -- 'HIGH', 'MEDIUM', 'LOW'
    knowledge_gap_score DECIMAL(5,2) DEFAULT 0.00,
    succession_plan_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 14. vendor_registry
  `CREATE TABLE IF NOT EXISTS vendor_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    service_provided VARCHAR(255),
    contact_email VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 15. vendor_assessments
  `CREATE TABLE IF NOT EXISTS vendor_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor_registry(id) ON DELETE CASCADE,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    health_score DECIMAL(5,2) DEFAULT 0.00,
    compliance_score DECIMAL(5,2) DEFAULT 0.00,
    assessment_date DATE DEFAULT CURRENT_DATE,
    findings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 16. vendor_relationships
  `CREATE TABLE IF NOT EXISTS vendor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor_registry(id) ON DELETE CASCADE,
    department_id UUID REFERENCES enterprise_entities(id) ON DELETE CASCADE,
    dependency_level VARCHAR(50) DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 17. project_registry
  `CREATE TABLE IF NOT EXISTS project_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'On Hold', 'Completed'
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 18. project_dependencies
  `CREATE TABLE IF NOT EXISTS project_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES project_registry(id) ON DELETE CASCADE,
    depends_on_project_id UUID REFERENCES project_registry(id) ON DELETE CASCADE,
    criticality VARCHAR(50) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 19. project_forecasts
  `CREATE TABLE IF NOT EXISTS project_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES project_registry(id) ON DELETE CASCADE,
    completion_probability DECIMAL(5,2) DEFAULT 0.00,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    estimated_delay_days INTEGER DEFAULT 0,
    forecast_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 20. digital_twin_snapshots
  `CREATE TABLE IF NOT EXISTS digital_twin_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    metrics_summary JSONB DEFAULT '{}',
    graph_snapshot JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes for Phase 7
  `CREATE INDEX IF NOT EXISTS idx_enterprise_entities_org ON enterprise_entities(organization_id, entity_type)`,
  `CREATE INDEX IF NOT EXISTS idx_enterprise_relationships_src ON enterprise_relationships(source_entity_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enterprise_relationships_tgt ON enterprise_relationships(target_entity_id)`,
  `CREATE INDEX IF NOT EXISTS idx_decision_registry_org ON decision_registry(organization_id, decision_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_vendor_registry_org ON vendor_registry(organization_id, status)`
];

export const migrateEIOS = async () => {
  logger.info('🚀 Starting Phase 7 EIOS migrations...');
  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (err) {
      logger.error('EIOS Migration step failed:', err.message);
      throw err;
    }
  }
  logger.info('✅ Phase 7 EIOS tables migrated successfully.');
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('migrate_phase7_eios.js')) {
  (async () => {
    try {
      await connectDB();
      await migrateEIOS();
      process.exit(0);
    } catch (err) {
      logger.error('EIOS Migration script failed:', err);
      process.exit(1);
    }
  })();
}
