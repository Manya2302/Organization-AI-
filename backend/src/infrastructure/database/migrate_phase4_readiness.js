// ============================================================
// Database Migration — Phase 4 Readiness
// SecureVault AI — Neo4j Integration & Org Graph Tables
// Run: node src/infrastructure/database/migrate_phase4_readiness.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // 1. neo4j_sync_logs
  `CREATE TABLE IF NOT EXISTS neo4j_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sync_status VARCHAR(50) NOT NULL, -- 'success', 'failed'
    nodes_synced INTEGER DEFAULT 0,
    relationships_synced INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. knowledge_freshness
  `CREATE TABLE IF NOT EXISTS knowledge_freshness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL, -- 'Document', 'Policy', 'Contract', etc.
    entity_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    review_frequency_days INTEGER DEFAULT 180,
    freshness_status VARCHAR(50) DEFAULT 'Fresh', -- 'Fresh', 'Aging', 'Stale', 'Critical'
    freshness_score DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
  )`,

  // 3. knowledge_ownership
  `CREATE TABLE IF NOT EXISTS knowledge_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    steward_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
  )`,

  // 4. knowledge_confidence_metrics
  `CREATE TABLE IF NOT EXISTS knowledge_confidence_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(5,2) DEFAULT 100.00,
    human_validation_factor DECIMAL(5,2) DEFAULT 0.00,
    source_count INTEGER DEFAULT 1,
    usage_frequency INTEGER DEFAULT 0,
    freshness_factor DECIMAL(5,2) DEFAULT 100.00,
    relationship_coverage DECIMAL(5,2) DEFAULT 0.00,
    entity_coverage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
  )`,

  // 5. dependency_mappings
  `CREATE TABLE IF NOT EXISTS dependency_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(100) DEFAULT 'REQUIRED', -- 'REQUIRED', 'SUGGESTED', 'BLOCKED_BY'
    criticality VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    dependency_risk_score DECIMAL(5,2) DEFAULT 0.00,
    is_single_point_of_failure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, source_type, source_id, target_type, target_id)
  )`,

  // 6. successor_recommendations
  `CREATE TABLE IF NOT EXISTS successor_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    primary_employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    successor_employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    successor_score DECIMAL(5,2) DEFAULT 0.00,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    overlapping_projects JSONB DEFAULT '[]',
    similar_expertise_domains JSONB DEFAULT '[]',
    recommendations_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, primary_employee_id, successor_employee_id)
  )`,

  // 7. critical_knowledge
  `CREATE TABLE IF NOT EXISTS critical_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    critical_knowledge_score DECIMAL(5,2) DEFAULT 0.00,
    business_impact_score DECIMAL(5,2) DEFAULT 0.00,
    access_frequency_score DECIMAL(5,2) DEFAULT 0.00,
    owner_availability_score DECIMAL(5,2) DEFAULT 0.00,
    compliance_relevance_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entity_type, entity_id)
  )`,

  // 8. memory_evolution
  `CREATE TABLE IF NOT EXISTS memory_evolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL, -- 'node_created', 'edge_created', 'expertise_boost', 'department_intel'
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    description TEXT,
    previous_state JSONB DEFAULT '{}',
    new_state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 9. graph_health_metrics
  `CREATE TABLE IF NOT EXISTS graph_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    neo4j_connected BOOLEAN DEFAULT FALSE,
    total_nodes INTEGER DEFAULT 0,
    total_relationships INTEGER DEFAULT 0,
    dangling_nodes_count INTEGER DEFAULT 0,
    disconnected_subgraphs_count INTEGER DEFAULT 0,
    sync_readiness_ratio DECIMAL(5,2) DEFAULT 0.00,
    graph_health_score DECIMAL(5,2) DEFAULT 0.00,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. organizational_memory_health
  `CREATE TABLE IF NOT EXISTS organizational_memory_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    memory_health_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_freshness_score DECIMAL(5,2) DEFAULT 0.00,
    dependency_risk_score DECIMAL(5,2) DEFAULT 0.00,
    knowledge_confidence_score DECIMAL(5,2) DEFAULT 0.00,
    succession_coverage DECIMAL(5,2) DEFAULT 0.00,
    ownership_coverage DECIMAL(5,2) DEFAULT 0.00,
    graph_health_score DECIMAL(5,2) DEFAULT 0.00,
    total_entities INTEGER DEFAULT 0,
    total_stale_entities INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes for optimal querying
  `CREATE INDEX IF NOT EXISTS idx_neo4j_sync_org ON neo4j_sync_logs(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_freshness_org ON knowledge_freshness(organization_id, freshness_status)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_ownership_org ON knowledge_ownership(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_conf_org ON knowledge_confidence_metrics(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_dependency_mappings_org ON dependency_mappings(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_successor_recs_org ON successor_recommendations(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_critical_knowledge_org ON critical_knowledge(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_memory_evolution_org ON memory_evolution(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_graph_health_org ON graph_health_metrics(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_org_mem_health_org ON organizational_memory_health(organization_id, created_at DESC)`
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🧬 Running Phase 4 Readiness migrations...');
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

    logger.info(`\n✅ Phase 4 Readiness Migration complete!`);
    logger.info(`   Created: ${created} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Phase 4 Readiness migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
