// ============================================================
// Database Migration — Phase 2 Complete Schema
// SecureVault AI — AI Intelligence Foundation
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // ── 1. Document Summaries ────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    short_summary TEXT,
    detailed_summary TEXT,
    executive_summary TEXT,
    key_highlights JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    important_dates JSONB DEFAULT '[]',
    important_names JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    confidence_score DECIMAL(4,3) DEFAULT 0.000,
    reasoning_metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
  )`,

  // ── 2. Document Classifications ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    doc_type VARCHAR(100),
    primary_category VARCHAR(100),
    department VARCHAR(100),
    sub_category VARCHAR(150),
    keywords JSONB DEFAULT '[]',
    topics JSONB DEFAULT '[]',
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
    confidentiality_level VARCHAR(30) DEFAULT 'internal',
    importance_score DECIMAL(4,3) DEFAULT 0.500,
    language VARCHAR(10) DEFAULT 'en',
    sentiment VARCHAR(20) DEFAULT 'neutral',
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    confidence_score DECIMAL(4,3) DEFAULT 0.000,
    reasoning_metadata JSONB DEFAULT '{}',
    classified_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
  )`,

  // ── 3. Document Vector References ────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vector_provider VARCHAR(50) DEFAULT 'chromadb',
    vector_dimension INTEGER DEFAULT 768,
    vector_database_id VARCHAR(255),
    embedding_model VARCHAR(100) DEFAULT 'nomic-embed-text',
    embedding_version INTEGER DEFAULT 1,
    chunk_count INTEGER DEFAULT 1,
    indexed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
  )`,

  // ── 4. Document Relationships ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    target_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'similar' CHECK (relationship_type IN (
      'duplicate','similar','version','references','related_policy',
      'related_contract','related_vendor','related_project','parent','child'
    )),
    similarity_score DECIMAL(5,4) DEFAULT 0.0000,
    confidence_score DECIMAL(4,3) DEFAULT 0.000,
    created_by_ai BOOLEAN DEFAULT TRUE,
    relationship_explanation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_document_id, target_document_id)
  )`,

  // ── 5. Document Sensitivity ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_sensitivity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sensitivity_score INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
    detected_entities JSONB DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
  )`,

  // ── 6. Document Entities ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entities JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id)
  )`,

  // ── 7. AI Interactions (Enhanced) ───────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    document_id UUID REFERENCES documents(id),
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
      'summarize','classify','search','chat','similar','analyze',
      'metadata','sensitivity','entities','embed','queue'
    )),
    prompt_used TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    confidence_score DECIMAL(4,3),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failed','partial')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 8. Knowledge Metrics ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS knowledge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_documents INTEGER DEFAULT 0,
    summarized_documents INTEGER DEFAULT 0,
    classified_documents INTEGER DEFAULT 0,
    indexed_documents INTEGER DEFAULT 0,
    total_ai_queries INTEGER DEFAULT 0,
    department_scores JSONB DEFAULT '{}',
    organization_knowledge_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_risk_level VARCHAR(20) DEFAULT 'low',
    categories_breakdown JSONB DEFAULT '{}',
    top_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, metric_date)
  )`,

  // ── 9. Processing Jobs ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS processing_jobs (
    id VARCHAR(50) PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
    current_stage VARCHAR(50) DEFAULT 'queued',
    stages_completed JSONB DEFAULT '[]',
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
  )`,

  // ── Indexes ───────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_summaries_doc ON document_summaries(document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_summaries_org ON document_summaries(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_classifications_doc ON document_classifications(document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_classifications_org ON document_classifications(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_classifications_risk ON document_classifications(risk_level)`,
  `CREATE INDEX IF NOT EXISTS idx_relationships_source ON document_relationships(source_document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_relationships_org ON document_relationships(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sensitivity_doc ON document_sensitivity(document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sensitivity_risk ON document_sensitivity(risk_level)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_interactions_org ON ai_interactions(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_interactions_doc ON ai_interactions(document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status)`,
  `CREATE INDEX IF NOT EXISTS idx_processing_jobs_org ON processing_jobs(organization_id)`,
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🗄️  Running Phase 2 migrations...');
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.match(/CREATE (?:TABLE|INDEX)(?: IF NOT EXISTS)?\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ ${i+1}/${migrations.length}: ${name}`);
      } catch (err) {
        logger.warn(`  ⚠️  ${i+1} skipped: ${name} — ${err.message}`);
      }
    }
    logger.info('✅ Phase 2 schema ready.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
