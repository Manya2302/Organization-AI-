// ============================================================
// Database Migration — Phase 2 Architecture Refinements
// SecureVault AI — SAAS Multi-Tenant & Graph Ready Foundation
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // ── 1. Document Schema Extensions (Compliance Metadata) ───────
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS compliance_relevance VARCHAR(100) DEFAULT 'none'`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_period INTEGER DEFAULT 365`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_required BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_sensitive_data BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS audit_relevant BOOLEAN DEFAULT FALSE`,

  // ── 2. Knowledge Graph Preparation Queue ───────────────────────
  `CREATE TABLE IF NOT EXISTS graph_preparation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_node_id VARCHAR(255) NOT NULL,
    source_node_type VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(255) NOT NULL,
    target_node_type VARCHAR(100) NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 3. Department Intelligence Metrics ────────────────────────
  `CREATE TABLE IF NOT EXISTS department_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    documentation_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_coverage DECIMAL(5,2) DEFAULT 0.00,
    missing_documentation JSONB DEFAULT '[]',
    upload_trends JSONB DEFAULT '{}',
    search_trends JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, department)
  )`,

  // ── 4. Document Lifecycle Tracking ───────────────────────────
  `CREATE TABLE IF NOT EXISTS document_lifecycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) DEFAULT 'Uploaded',
    stage_history JSONB DEFAULT '[]',
    last_updated TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 5. AI Quality Monitoring ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(100) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    user_comments TEXT,
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 6. Future Event System ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 7. AI Model Registry ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(100) DEFAULT 'ollama',
    version VARCHAR(50) DEFAULT 'latest',
    active BOOLEAN DEFAULT TRUE,
    purpose VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Seed default models
  `INSERT INTO ai_models (model_name, provider, version, active, purpose)
   VALUES 
     ('qwen3:8b', 'ollama', 'latest', true, 'summarization_and_chat'),
     ('nomic-embed-text', 'ollama', 'latest', true, 'embeddings'),
     ('deepseek-r1:8b', 'ollama', 'latest', false, 'reasoning'),
     ('mistral:7b', 'ollama', 'latest', false, 'fallback')
   ON CONFLICT (model_name) DO NOTHING`
];

const runRefinementMigrations = async () => {
  try {
    await connectDB();
    logger.info('🗄️  Running Phase 2 Refinement migrations...');
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)|ALTER TABLE\s+(\w+)|INSERT INTO\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ Refinement ${i+1}/${migrations.length}: ${name}`);
      } catch (err) {
        logger.warn(`  ⚠️ Refinement ${i+1} warning: ${err.message}`);
      }
    }
    logger.info('✅ Phase 2 Refinement migrations complete.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runRefinementMigrations();
