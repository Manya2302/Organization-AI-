// ============================================================
// Database Migration — Phase 2 Final Complete Schema Updates
// SecureVault AI — Knowledge Graph Readiness & AI Explanations
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // ── 1. Graph Readiness Metrics ──
  `CREATE TABLE IF NOT EXISTS graph_readiness_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_documents INTEGER DEFAULT 0,
    classified_documents INTEGER DEFAULT 0,
    documents_with_entities INTEGER DEFAULT 0,
    documents_with_relationships INTEGER DEFAULT 0,
    documents_with_summaries INTEGER DEFAULT 0,
    documents_with_sensitivity_analysis INTEGER DEFAULT 0,
    graph_readiness_score DECIMAL(5,2) DEFAULT 0.00,
    readiness_level VARCHAR(50) DEFAULT 'LOW' CHECK (readiness_level IN ('LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE_READY')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 2. Global Entity Deduplication Registry ──
  `CREATE TABLE IF NOT EXISTS entity_deduplication_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL, -- 'Employee', 'Department', 'Project', 'Policy', 'Contract', 'Vendor'
    canonical_name VARCHAR(255) NOT NULL,
    aliases JSONB DEFAULT '[]',
    confidence_score DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, entity_type, canonical_name)
  )`,

  // ── 3. Department Knowledge Metrics ──
  `CREATE TABLE IF NOT EXISTS department_knowledge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    knowledge_coverage DECIMAL(5,2) DEFAULT 0.00,
    knowledge_quality DECIMAL(5,2) DEFAULT 0.00,
    knowledge_growth DECIMAL(5,2) DEFAULT 0.00,
    knowledge_activity DECIMAL(5,2) DEFAULT 0.00,
    search_effectiveness DECIMAL(5,2) DEFAULT 0.00,
    documentation_completeness DECIMAL(5,2) DEFAULT 0.00,
    health_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, department)
  )`,

  // ── 4. Knowledge Risk Metrics ──
  `CREATE TABLE IF NOT EXISTS knowledge_risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    missing_sop_risk DECIMAL(5,2) DEFAULT 0.00,
    missing_policy_risk DECIMAL(5,2) DEFAULT 0.00,
    knowledge_concentration_risk DECIMAL(5,2) DEFAULT 0.00,
    employee_dependency_risk DECIMAL(5,2) DEFAULT 0.00,
    documentation_gap_risk DECIMAL(5,2) DEFAULT 0.00,
    department_knowledge_risk DECIMAL(5,2) DEFAULT 0.00,
    knowledge_risk_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_risk_level VARCHAR(50) DEFAULT 'LOW' CHECK (knowledge_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 5. AI Explanations Table ──
  `CREATE TABLE IF NOT EXISTS ai_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL, -- 'classification', 'relationship', 'entity', 'sensitivity', 'summary'
    entity_id UUID NOT NULL,
    explanation_text TEXT NOT NULL,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    evidence TEXT,
    supporting_data JSONB DEFAULT '{}',
    generated_model VARCHAR(100) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 6. Human Validation Logs ──
  `CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_type VARCHAR(100) NOT NULL, -- 'classification', 'relationship', 'entity', 'summary'
    target_id UUID NOT NULL,
    field_name VARCHAR(100),
    validation_feedback VARCHAR(50) NOT NULL, -- 'approved', 'rejected'
    validation_reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 7. Organizational Memory Candidates ──
  `CREATE TABLE IF NOT EXISTS organizational_memory_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_type VARCHAR(100) NOT NULL, -- 'Employee', 'Project', 'Department', 'Policy', 'Process', 'Vendor', 'Contract', 'Knowledge Asset'
    candidate_name VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    confidence_score DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 8. Document Relationships Upgrades ──
  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS relationship_strength DECIMAL(3,2) DEFAULT 0.50`,
  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected'))`,
  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS human_verified BOOLEAN DEFAULT FALSE`,

  // ── 9. Enterprise Intelligence Maturity Score ──
  `CREATE TABLE IF NOT EXISTS organization_intelligence_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    intelligence_score DECIMAL(5,2) DEFAULT 0.00,
    maturity_level VARCHAR(50) DEFAULT 'Starter' CHECK (maturity_level IN ('Starter', 'Developing', 'Advanced', 'Enterprise', 'Knowledge Driven')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🗄️  Running Phase 2 Final Complete Schema migrations...');
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)|ALTER TABLE\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ Migration ${i+1}/${migrations.length}: ${name}`);
      } catch (err) {
        logger.warn(`  ⚠️ Migration ${i+1} warning: ${err.message}`);
      }
    }
    logger.info('✅ Phase 2 Final migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
