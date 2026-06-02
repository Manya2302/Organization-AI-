// ============================================================
// Database Migration — Phase 2 Final Hardening Schema Updates
// SecureVault AI — Enterprise Hardening & Timeline Foundation
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // ── 1. AI Model Registry Completion ──
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS model_type VARCHAR(100) DEFAULT 'llm'`,
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_embeddings BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_chat BOOLEAN DEFAULT TRUE`,
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_summary BOOLEAN DEFAULT TRUE`,
  `ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_classification BOOLEAN DEFAULT TRUE`,

  // Update default models with types & statuses
  `UPDATE ai_models SET 
    model_type = 'llm', 
    supports_embeddings = false, 
    supports_chat = true, 
    supports_summary = true, 
    supports_classification = true 
    WHERE model_name = 'qwen3:8b'`,
    
  `UPDATE ai_models SET 
    model_type = 'embedding', 
    supports_embeddings = true, 
    supports_chat = false, 
    supports_summary = false, 
    supports_classification = false 
    WHERE model_name = 'nomic-embed-text'`,

  // ── 2. Processing Failure Recovery ──
  `CREATE TABLE IF NOT EXISTS document_job_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(50) NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    failed_stage VARCHAR(100) NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 3. Entity Relationship Confidence Layer ──
  `ALTER TABLE graph_preparation_queue ADD COLUMN IF NOT EXISTS relationship_confidence DECIMAL(5,2) DEFAULT 1.00`,
  `ALTER TABLE graph_preparation_queue ADD COLUMN IF NOT EXISTS relationship_source VARCHAR(100) DEFAULT 'ai'`,
  `ALTER TABLE graph_preparation_queue ADD COLUMN IF NOT EXISTS relationship_reasoning TEXT`,

  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS relationship_confidence DECIMAL(5,2) DEFAULT 1.00`,
  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS relationship_source VARCHAR(100) DEFAULT 'ai'`,
  `ALTER TABLE document_relationships ADD COLUMN IF NOT EXISTS relationship_reasoning TEXT`,

  // ── 4. Knowledge Timeline Engine ──
  `CREATE TABLE IF NOT EXISTS knowledge_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    timeline_type VARCHAR(100) NOT NULL, -- 'Document Created', 'Document Updated', 'Knowledge Added', 'Policy Revised', 'Department Growth'
    title VARCHAR(255) NOT NULL,
    details TEXT,
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 5. AI Search Evaluation Metrics ──
  `CREATE TABLE IF NOT EXISTS search_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query VARCHAR(500) NOT NULL,
    results_returned INTEGER DEFAULT 0,
    clicked_document UUID REFERENCES documents(id) ON DELETE SET NULL,
    success BOOLEAN DEFAULT TRUE,
    user_feedback VARCHAR(50) DEFAULT 'none', -- 'good', 'bad', 'none'
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 6. Department Knowledge Ranking Extensions ──
  `ALTER TABLE department_metrics ADD COLUMN IF NOT EXISTS knowledge_rank INTEGER DEFAULT 1`,
  `ALTER TABLE department_metrics ADD COLUMN IF NOT EXISTS documentation_rank INTEGER DEFAULT 1`,
  `ALTER TABLE department_metrics ADD COLUMN IF NOT EXISTS search_efficiency DECIMAL(5,2) DEFAULT 100.00`,
  `ALTER TABLE department_metrics ADD COLUMN IF NOT EXISTS knowledge_growth_score DECIMAL(5,2) DEFAULT 0.00`,

  // ── 7. AI Cost & Performance Monitoring Layer ──
  `CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    model_used VARCHAR(100) NOT NULL,
    response_time INTEGER DEFAULT 0, -- ms
    memory_usage BIGINT DEFAULT 0, -- bytes
    cpu_usage DECIMAL(5,2) DEFAULT 0.00, -- percent
    tokens_generated INTEGER DEFAULT 0,
    tokens_processed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 8. Knowledge Asset Inventory ──
  `CREATE TABLE IF NOT EXISTS knowledge_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    asset_type VARCHAR(100) NOT NULL, -- 'Policy', 'Contract', 'Vendor Record', 'Compliance Document', 'Training Document', 'SOP', 'HR Document'
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    indexed_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 9. Future Neo4j Migration Readiness ──
  `ALTER TABLE knowledge_metrics ADD COLUMN IF NOT EXISTS graph_export_status VARCHAR(50) DEFAULT 'pending'`,
  `ALTER TABLE knowledge_metrics ADD COLUMN IF NOT EXISTS graph_node_count INTEGER DEFAULT 0`,
  `ALTER TABLE knowledge_metrics ADD COLUMN IF NOT EXISTS graph_edge_count INTEGER DEFAULT 0`,

  // ── 10. Security Hardening Incidents ──
  `CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'Prompt Injection Attempt', 'Malicious File Upload', 'Oversized Document', 'Corrupted OCR Data', 'Unauthorized AI Query'
    severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`
];

const runHardeningMigrations = async () => {
  try {
    await connectDB();
    logger.info('🗄️  Running Phase 2 Hardening migrations...');
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const name = sql.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)|ALTER TABLE\s+(\w+)|UPDATE\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ Hardening ${i+1}/${migrations.length}: ${name}`);
      } catch (err) {
        logger.warn(`  ⚠️ Hardening ${i+1} warning: ${err.message}`);
      }
    }
    logger.info('✅ Phase 2 Hardening migrations complete.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runHardeningMigrations();
