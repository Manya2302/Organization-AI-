// ============================================================
// Database Migration — Phase 3: Enterprise Knowledge Brain
// SecureVault AI — Organizational Memory & Expert Discovery
// Run: node src/infrastructure/database/migrate_phase3.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [

  // ── 1. Organizational Memory ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS organizational_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    -- 'Employee', 'Department', 'Project', 'Vendor', 'Policy', 'Contract', 'Knowledge Asset'
    entity_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    knowledge_domain VARCHAR(255),
    knowledge_description TEXT,
    associated_documents JSONB DEFAULT '[]',
    associated_employees JSONB DEFAULT '[]',
    associated_departments JSONB DEFAULT '[]',
    knowledge_score DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
  )`,

  // ── 2. Employee Expertise Profiles ───────────────────────────
  `CREATE TABLE IF NOT EXISTS employee_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expertise_domains JSONB DEFAULT '[]',
    -- Array of { domain, score, evidence_count }
    primary_domain VARCHAR(255),
    secondary_domain VARCHAR(255),
    documents_created INTEGER DEFAULT 0,
    policies_authored INTEGER DEFAULT 0,
    knowledge_contributions INTEGER DEFAULT 0,
    search_topics JSONB DEFAULT '[]',
    ai_interactions INTEGER DEFAULT 0,
    expertise_score DECIMAL(5,2) DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
  )`,

  // ── 3. Expertise Scores (searchable expert rankings) ─────────
  `CREATE TABLE IF NOT EXISTS expertise_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    topic VARCHAR(255) NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    evidence_count INTEGER DEFAULT 0,
    evidence_sources JSONB DEFAULT '[]',
    -- e.g. ['doc:uuid1', 'search:keyword', 'interaction:uuid2']
    is_primary_expert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 4. Knowledge Contributions ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS knowledge_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contribution_type VARCHAR(100) NOT NULL,
    -- 'document_upload', 'policy_authored', 'review', 'annotation', 'search', 'ai_query'
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    contribution_description TEXT,
    knowledge_domain VARCHAR(255),
    quality_score DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 5. Knowledge Recommendations ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS knowledge_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(100) NOT NULL,
    -- 'document', 'expert', 'department', 'policy', 'topic'
    target_id VARCHAR(255),
    target_type VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    relevance_score DECIMAL(5,2) DEFAULT 0.00,
    reason TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 6. Knowledge Brain Chat Sessions ─────────────────────────
  `CREATE TABLE IF NOT EXISTS knowledge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_title VARCHAR(500) DEFAULT 'Knowledge Chat',
    messages JSONB DEFAULT '[]',
    -- Array of { role, content, sources, reasoning, timestamp }
    entities_referenced JSONB DEFAULT '[]',
    documents_referenced JSONB DEFAULT '[]',
    experts_referenced JSONB DEFAULT '[]',
    total_queries INTEGER DEFAULT 0,
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 7. Knowledge Relationships (Graph Edges in PG) ───────────
  `CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    -- 'Employee','Department','Document','Policy','Vendor','Project','Contract'
    source_id VARCHAR(255) NOT NULL,
    source_name VARCHAR(255),
    relationship_type VARCHAR(100) NOT NULL,
    -- 'CREATED_BY','OWNS','WORKED_ON','BELONGS_TO','MANAGES','AUTHORED','REFERENCES','RELATED_TO','APPROVED_BY'
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    target_name VARCHAR(255),
    confidence DECIMAL(5,2) DEFAULT 1.00,
    evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    ai_inferred BOOLEAN DEFAULT FALSE,
    human_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 8. Graph Nodes (Neo4j-ready staging) ─────────────────────
  `CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    node_type VARCHAR(100) NOT NULL,
    -- 'Employee','Department','Document','Policy','Vendor','Project','Contract','Knowledge Asset'
    node_id VARCHAR(255) NOT NULL,
    node_label VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}',
    vector_embedding JSONB DEFAULT '[]',
    neo4j_synced BOOLEAN DEFAULT FALSE,
    neo4j_node_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, node_type, node_id)
  )`,

  // ── 9. Graph Edges (Neo4j-ready staging) ─────────────────────
  `CREATE TABLE IF NOT EXISTS graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.00,
    properties JSONB DEFAULT '{}',
    neo4j_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 10. Memory Snapshots ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS memory_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_employees INTEGER DEFAULT 0,
    total_experts_identified INTEGER DEFAULT 0,
    total_knowledge_entities INTEGER DEFAULT 0,
    total_relationships INTEGER DEFAULT 0,
    total_graph_nodes INTEGER DEFAULT 0,
    total_contributions INTEGER DEFAULT 0,
    knowledge_coverage_score DECIMAL(5,2) DEFAULT 0.00,
    expertise_coverage_score DECIMAL(5,2) DEFAULT 0.00,
    memory_health_score DECIMAL(5,2) DEFAULT 0.00,
    departments_coverage JSONB DEFAULT '{}',
    top_experts JSONB DEFAULT '[]',
    top_knowledge_domains JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, snapshot_date)
  )`,

  // ── 11. Expert Search History ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS expert_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    searched_by UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query VARCHAR(500) NOT NULL,
    results_count INTEGER DEFAULT 0,
    top_expert_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 12. Knowledge Brain Quality Metrics ───────────────────────
  `CREATE TABLE IF NOT EXISTS knowledge_brain_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    total_knowledge_entities INTEGER DEFAULT 0,
    total_relationships INTEGER DEFAULT 0,
    total_experts INTEGER DEFAULT 0,
    total_graph_nodes INTEGER DEFAULT 0,
    knowledge_coverage DECIMAL(5,2) DEFAULT 0.00,
    expertise_coverage DECIMAL(5,2) DEFAULT 0.00,
    relationship_density DECIMAL(5,2) DEFAULT 0.00,
    memory_health_score DECIMAL(5,2) DEFAULT 0.00,
    brain_maturity_level VARCHAR(50) DEFAULT 'Initializing'
      CHECK (brain_maturity_level IN ('Initializing','Learning','Developing','Advanced','Enterprise Brain')),
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Phase 3 Performance Indexes ───────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_org_memory_org_type ON organizational_memory(organization_id, entity_type)`,
  `CREATE INDEX IF NOT EXISTS idx_employee_expertise_org ON employee_expertise(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_employee_expertise_user ON employee_expertise(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expertise_scores_org_topic ON expertise_scores(organization_id, topic)`,
  `CREATE INDEX IF NOT EXISTS idx_expertise_scores_user ON expertise_scores(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_user ON knowledge_contributions(organization_id, user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_doc ON knowledge_contributions(document_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_recs_user ON knowledge_recommendations(organization_id, user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_sessions_user ON knowledge_sessions(organization_id, user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_rels_org ON knowledge_relationships(organization_id, relationship_type)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_rels_source ON knowledge_relationships(source_type, source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_rels_target ON knowledge_relationships(target_type, target_id)`,
  `CREATE INDEX IF NOT EXISTS idx_graph_nodes_org_type ON graph_nodes(organization_id, node_type)`,
  `CREATE INDEX IF NOT EXISTS idx_graph_edges_from ON graph_edges(from_node_id)`,
  `CREATE INDEX IF NOT EXISTS idx_graph_edges_to ON graph_edges(to_node_id)`,
  `CREATE INDEX IF NOT EXISTS idx_memory_snapshots_org ON memory_snapshots(organization_id, snapshot_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_expert_search_org ON expert_search_history(organization_id, created_at DESC)`,
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🧠 Running Phase 3 Enterprise Knowledge Brain migrations...');
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

    logger.info(`\n✅ Phase 3 Knowledge Brain Migration complete!`);
    logger.info(`   Created: ${created} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Phase 3 migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
