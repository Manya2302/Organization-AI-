// ============================================================
// Database Migration — Phase 4: Compliance Intelligence
// SecureVault AI — Compliance, Controls, Evidence, Audit Tables
// Run: node src/infrastructure/database/migrate_phase4_compliance.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // 1. compliance_frameworks
  `CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    regulatory_body VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE,
    last_reviewed_at TIMESTAMPTZ,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, short_name)
  )`,

  // 2. compliance_requirements
  `CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    risk_level VARCHAR(50) DEFAULT 'MEDIUM',
    is_mandatory BOOLEAN DEFAULT TRUE,
    review_frequency_days INTEGER DEFAULT 365,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. compliance_controls
  `CREATE TABLE IF NOT EXISTS compliance_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    control_type VARCHAR(100) DEFAULT 'Preventive',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Not Started',
    effectiveness VARCHAR(50) DEFAULT 'Unknown',
    risk_level VARCHAR(50) DEFAULT 'MEDIUM',
    review_frequency_days INTEGER DEFAULT 90,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    implementation_notes TEXT,
    evidence_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, control_code)
  )`,

  // 4. control_assignments
  `CREATE TABLE IF NOT EXISTS control_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. control_reviews
  `CREATE TABLE IF NOT EXISTS control_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_status VARCHAR(50) DEFAULT 'Pending',
    review_notes TEXT,
    effectiveness_rating INTEGER DEFAULT 0,
    next_review_date DATE,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. control_effectiveness
  `CREATE TABLE IF NOT EXISTS control_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE,
    effectiveness_score DECIMAL(5,2) DEFAULT 0.00,
    evidence_coverage DECIMAL(5,2) DEFAULT 0.00,
    review_completion DECIMAL(5,2) DEFAULT 0.00,
    risk_reduction_score DECIMAL(5,2) DEFAULT 0.00,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. evidence_repository
  `CREATE TABLE IF NOT EXISTS evidence_repository (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(100) DEFAULT 'Document',
    source_type VARCHAR(100) DEFAULT 'Manual',
    source_id VARCHAR(255),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(255),
    compliance_category VARCHAR(255),
    collection_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    review_status VARCHAR(50) DEFAULT 'Pending',
    confidence_score DECIMAL(5,2) DEFAULT 100.00,
    file_path TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. evidence_mappings
  `CREATE TABLE IF NOT EXISTS evidence_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence_repository(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    relevance_score DECIMAL(5,2) DEFAULT 80.00,
    mapped_by UUID REFERENCES users(id) ON DELETE SET NULL,
    mapped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, evidence_id, control_id)
  )`,

  // 9. evidence_reviews
  `CREATE TABLE IF NOT EXISTS evidence_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence_repository(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_outcome VARCHAR(50) DEFAULT 'Accepted',
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. audit_packages
  `CREATE TABLE IF NOT EXISTS audit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    audit_type VARCHAR(100) DEFAULT 'Internal',
    status VARCHAR(50) DEFAULT 'Draft',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    audit_period_start DATE,
    audit_period_end DATE,
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    total_controls INTEGER DEFAULT 0,
    passing_controls INTEGER DEFAULT 0,
    failing_controls INTEGER DEFAULT 0,
    total_evidence INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. audit_findings
  `CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_package_id UUID REFERENCES audit_packages(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE SET NULL,
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

  // 12. audit_readiness_metrics
  `CREATE TABLE IF NOT EXISTS audit_readiness_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    overall_readiness_score DECIMAL(5,2) DEFAULT 0.00,
    control_coverage_score DECIMAL(5,2) DEFAULT 0.00,
    evidence_coverage_score DECIMAL(5,2) DEFAULT 0.00,
    policy_coverage_score DECIMAL(5,2) DEFAULT 0.00,
    review_completion_score DECIMAL(5,2) DEFAULT 0.00,
    documentation_score DECIMAL(5,2) DEFAULT 0.00,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    readiness_level VARCHAR(50) DEFAULT 'Poor',
    total_controls INTEGER DEFAULT 0,
    implemented_controls INTEGER DEFAULT 0,
    missing_evidence_count INTEGER DEFAULT 0,
    expired_controls_count INTEGER DEFAULT 0,
    open_findings_count INTEGER DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 13. policy_compliance
  `CREATE TABLE IF NOT EXISTS policy_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    policy_name VARCHAR(500),
    compliance_status VARCHAR(50) DEFAULT 'Under Review',
    coverage_score DECIMAL(5,2) DEFAULT 0.00,
    expiry_date TIMESTAMPTZ,
    last_reviewed_at TIMESTAMPTZ,
    next_review_date DATE,
    review_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, document_id, framework_id)
  )`,

  // 14. compliance_gaps
  `CREATE TABLE IF NOT EXISTS compliance_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE SET NULL,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
    gap_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    recommended_action TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 15. compliance_tasks
  `CREATE TABLE IF NOT EXISTS compliance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(100) DEFAULT 'Review',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE SET NULL,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 16. compliance_risks
  `CREATE TABLE IF NOT EXISTS compliance_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    risk_title VARCHAR(500) NOT NULL,
    risk_description TEXT,
    risk_category VARCHAR(100),
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE SET NULL,
    likelihood VARCHAR(50) DEFAULT 'MEDIUM',
    impact VARCHAR(50) DEFAULT 'MEDIUM',
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    inherent_risk_score DECIMAL(5,2) DEFAULT 0.00,
    residual_risk_score DECIMAL(5,2) DEFAULT 0.00,
    risk_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    mitigation_strategy TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 17. compliance_actions
  `CREATE TABLE IF NOT EXISTS compliance_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action_title VARCHAR(500) NOT NULL,
    action_type VARCHAR(100) DEFAULT 'Remediation',
    target_entity_type VARCHAR(100),
    target_entity_id VARCHAR(255),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 18. compliance_reports
  `CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_name VARCHAR(500) NOT NULL,
    report_type VARCHAR(100) DEFAULT 'Summary',
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    report_period_start DATE,
    report_period_end DATE,
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    key_findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 19. framework_mappings
  `CREATE TABLE IF NOT EXISTS framework_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    target_framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    source_requirement_code VARCHAR(100),
    target_requirement_code VARCHAR(100),
    mapping_strength VARCHAR(50) DEFAULT 'Full',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, source_framework_id, target_framework_id, source_requirement_code, target_requirement_code)
  )`,

  // 20. control_mappings
  `CREATE TABLE IF NOT EXISTS control_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
    mapping_type VARCHAR(100) DEFAULT 'Supports',
    relevance_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, control_id, document_id, framework_id)
  )`,

  // 21. evidence_expiry_tracking
  `CREATE TABLE IF NOT EXISTS evidence_expiry_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence_repository(id) ON DELETE CASCADE,
    expiry_date TIMESTAMPTZ NOT NULL,
    days_until_expiry INTEGER,
    expiry_status VARCHAR(50) DEFAULT 'Valid',
    notification_sent BOOLEAN DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, evidence_id)
  )`,

  // Performance indexes
  `CREATE INDEX IF NOT EXISTS idx_comp_frameworks_org ON compliance_frameworks(organization_id, is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_comp_requirements_org ON compliance_requirements(organization_id, framework_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comp_controls_org ON compliance_controls(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_evidence_repo_org ON evidence_repository(organization_id, review_status)`,
  `CREATE INDEX IF NOT EXISTS idx_evidence_mappings_org ON evidence_mappings(organization_id, control_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_packages_org ON audit_packages(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_findings_org ON audit_findings(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_readiness_org ON audit_readiness_metrics(organization_id, calculated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_policy_compliance_org ON policy_compliance(organization_id, compliance_status)`,
  `CREATE INDEX IF NOT EXISTS idx_compliance_gaps_org ON compliance_gaps(organization_id, status, severity)`,
  `CREATE INDEX IF NOT EXISTS idx_compliance_tasks_org ON compliance_tasks(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_compliance_risks_org ON compliance_risks(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_evidence_expiry_org ON evidence_expiry_tracking(organization_id, expiry_status)`
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🛡️  Running Phase 4 Compliance Intelligence migrations...');
    logger.info(`   Total migrations: ${migrations.length}`);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.match(/CREATE (?:TABLE|INDEX)(?: IF NOT EXISTS)?\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ (${i+1}/${migrations.length}) ${name}`);
        created++;
      } catch (err) {
        logger.warn(`  ⚠️  (${i+1}/${migrations.length}) Skipped ${name}: ${err.message}`);
        skipped++;
      }
    }

    logger.info(`\n✅ Phase 4 Compliance Migration complete!`);
    logger.info(`   Created: ${created} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Phase 4 Compliance migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
