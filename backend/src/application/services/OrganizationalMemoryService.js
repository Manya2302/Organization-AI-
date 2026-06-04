// ============================================================
// Phase 3: Organizational Memory Service
// Tracks employee knowledge contributions, ownership, and
// preserves institutional knowledge against employee exits.
// ============================================================
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class OrganizationalMemoryService {

  // ── Build/refresh memory for the entire organization ──────────
  async buildOrganizationalMemory(organizationId) {
    if (isLocalJSONDb) return this._buildLocalMemory(organizationId);

    // 1. Seed employee nodes from users table
    await query(`
      INSERT INTO organizational_memory (organization_id, entity_type, entity_id, entity_name, knowledge_domain)
      SELECT $1, 'Employee', id::text, name, department
      FROM users
      WHERE organization_id = $1 AND role != 'SuperAdmin' AND is_active = TRUE
      ON CONFLICT (organization_id, entity_type, entity_id) DO UPDATE
        SET entity_name = EXCLUDED.entity_name,
            knowledge_domain = EXCLUDED.knowledge_domain,
            last_activity_at = NOW()
    `, [organizationId]);

    // 2. Seed department nodes
    await query(`
      INSERT INTO organizational_memory (organization_id, entity_type, entity_id, entity_name, knowledge_domain)
      SELECT DISTINCT $1, 'Department', department, department, 'Department Knowledge'
      FROM documents
      WHERE organization_id = $1 AND department IS NOT NULL AND is_deleted = FALSE
      ON CONFLICT (organization_id, entity_type, entity_id) DO UPDATE
        SET last_activity_at = NOW()
    `, [organizationId]);

    // 3. Seed document knowledge nodes
    await query(`
      INSERT INTO organizational_memory (organization_id, entity_type, entity_id, entity_name, knowledge_domain, knowledge_description)
      SELECT $1, 'Document', id::text, name, category, SUBSTRING(ocr_text, 1, 500)
      FROM documents
      WHERE organization_id = $1 AND is_deleted = FALSE
      ON CONFLICT (organization_id, entity_type, entity_id) DO UPDATE
        SET entity_name = EXCLUDED.entity_name,
            knowledge_description = EXCLUDED.knowledge_description,
            last_activity_at = NOW()
    `, [organizationId]);

    // 4. Update knowledge scores based on document count per employee
    await query(`
      UPDATE organizational_memory om
      SET knowledge_score = (
        SELECT LEAST(100, COUNT(*) * 10.0)
        FROM knowledge_contributions kc
        WHERE kc.user_id::text = om.entity_id
          AND kc.organization_id = om.organization_id
      ),
      updated_at = NOW()
      WHERE om.organization_id = $1 AND om.entity_type = 'Employee'
    `, [organizationId]);

    return { success: true, message: 'Organizational memory built successfully' };
  }

  // ── Get organizational memory summary ─────────────────────────
  async getMemorySummary(organizationId) {
    if (isLocalJSONDb) return this._getLocalMemorySummary(organizationId);

    const [entitiesRes, timelineRes, topContributorsRes] = await Promise.all([
      query(`
        SELECT entity_type, COUNT(*) as count, AVG(knowledge_score) as avg_score
        FROM organizational_memory
        WHERE organization_id = $1 AND is_active = TRUE
        GROUP BY entity_type
        ORDER BY count DESC
      `, [organizationId]),

      query(`
        SELECT kc.contribution_type,
               u.name as user_name, u.department,
               kc.created_at
        FROM knowledge_contributions kc
        JOIN users u ON u.id = kc.user_id
        WHERE kc.organization_id = $1
        ORDER BY kc.created_at DESC
        LIMIT 20
      `, [organizationId]),

      query(`
        SELECT u.name, u.department, u.designation,
               COUNT(kc.id) as contributions,
               COALESCE(ee.expertise_score, 0) as expertise_score,
               COALESCE(ee.primary_domain, u.department) as primary_domain
        FROM users u
        LEFT JOIN knowledge_contributions kc ON kc.user_id = u.id AND kc.organization_id = $1
        LEFT JOIN employee_expertise ee ON ee.user_id = u.id AND ee.organization_id = $1
        WHERE u.organization_id = $1 AND u.role != 'SuperAdmin' AND u.is_active = TRUE
        GROUP BY u.id, u.name, u.department, u.designation, ee.expertise_score, ee.primary_domain
        ORDER BY contributions DESC, expertise_score DESC
        LIMIT 10
      `, [organizationId])
    ]);

    return {
      entities: entitiesRes.rows,
      recentActivity: timelineRes.rows,
      topContributors: topContributorsRes.rows
    };
  }

  // ── Record a knowledge contribution ──────────────────────────
  async recordContribution(organizationId, userId, { type, documentId, domain, description, qualityScore }) {
    if (isLocalJSONDb) return;

    await query(`
      INSERT INTO knowledge_contributions
        (organization_id, user_id, contribution_type, document_id, knowledge_domain, contribution_description, quality_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [organizationId, userId, type, documentId || null, domain || null, description || null, qualityScore || 1.0]);

    // Update employee expertise score
    await this._updateExpertiseScore(organizationId, userId);
  }

  // ── Get knowledge timeline ────────────────────────────────────
  async getKnowledgeTimeline(organizationId, limit = 50) {
    if (isLocalJSONDb) return [];

    const result = await query(`
      SELECT
        kc.id,
        kc.contribution_type,
        kc.knowledge_domain,
        kc.contribution_description,
        kc.created_at,
        u.name as user_name,
        u.department,
        u.profile_photo,
        d.name as document_name,
        d.category as document_category
      FROM knowledge_contributions kc
      JOIN users u ON u.id = kc.user_id
      LEFT JOIN documents d ON d.id = kc.document_id
      WHERE kc.organization_id = $1
      ORDER BY kc.created_at DESC
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows;
  }

  // ── Get memory snapshot (or create one) ──────────────────────
  async getOrCreateSnapshot(organizationId) {
    if (isLocalJSONDb) return this._localSnapshot(organizationId);

    const today = new Date().toISOString().split('T')[0];
    const existing = await query(
      `SELECT * FROM memory_snapshots WHERE organization_id = $1 AND snapshot_date = $2`,
      [organizationId, today]
    );
    if (existing.rows[0]) return existing.rows[0];

    // Compute snapshot
    const [counts, topExperts, domains] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE organization_id = $1 AND role != 'SuperAdmin' AND is_active = TRUE) as employees,
          (SELECT COUNT(*) FROM employee_expertise WHERE organization_id = $1 AND expertise_score > 50) as experts,
          (SELECT COUNT(*) FROM organizational_memory WHERE organization_id = $1) as knowledge_entities,
          (SELECT COUNT(*) FROM knowledge_relationships WHERE organization_id = $1) as relationships,
          (SELECT COUNT(*) FROM graph_nodes WHERE organization_id = $1) as graph_nodes,
          (SELECT COUNT(*) FROM knowledge_contributions WHERE organization_id = $1) as contributions
      `, [organizationId]),

      query(`
        SELECT u.name, u.department, ee.expertise_score, ee.primary_domain
        FROM employee_expertise ee
        JOIN users u ON u.id = ee.user_id
        WHERE ee.organization_id = $1
        ORDER BY ee.expertise_score DESC LIMIT 5
      `, [organizationId]),

      query(`
        SELECT knowledge_domain, COUNT(*) as count
        FROM knowledge_contributions
        WHERE organization_id = $1 AND knowledge_domain IS NOT NULL
        GROUP BY knowledge_domain ORDER BY count DESC LIMIT 10
      `, [organizationId])
    ]);

    const c = counts.rows[0];
    const totalEmployees = parseInt(c.employees) || 1;
    const expertsCoverage = Math.min(100, (parseInt(c.experts) / totalEmployees) * 100);
    const memoryCoverage = Math.min(100, (parseInt(c.knowledge_entities) / Math.max(parseInt(c.employees) * 5, 1)) * 100);

    const snapshot = await query(`
      INSERT INTO memory_snapshots
        (organization_id, snapshot_date, total_employees, total_experts_identified,
         total_knowledge_entities, total_relationships, total_graph_nodes,
         total_contributions, knowledge_coverage_score, expertise_coverage_score,
         memory_health_score, top_experts, top_knowledge_domains)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (organization_id, snapshot_date) DO UPDATE
        SET total_employees = EXCLUDED.total_employees,
            memory_health_score = EXCLUDED.memory_health_score
      RETURNING *
    `, [
      organizationId, today,
      c.employees, c.experts, c.knowledge_entities,
      c.relationships, c.graph_nodes, c.contributions,
      memoryCoverage.toFixed(2), expertsCoverage.toFixed(2),
      ((memoryCoverage + expertsCoverage) / 2).toFixed(2),
      JSON.stringify(topExperts.rows),
      JSON.stringify(domains.rows)
    ]);

    return snapshot.rows[0];
  }

  // ── Private: Update expertise score for a user ────────────────
  async _updateExpertiseScore(organizationId, userId) {
    const contribsRes = await query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE contribution_type = 'document_upload') as docs,
             COUNT(*) FILTER (WHERE contribution_type = 'policy_authored') as policies,
             COUNT(*) FILTER (WHERE contribution_type = 'ai_query') as queries
      FROM knowledge_contributions
      WHERE organization_id = $1 AND user_id = $2
    `, [organizationId, userId]);

    const c = contribsRes.rows[0];
    const score = Math.min(100,
      (parseInt(c.docs) * 5) +
      (parseInt(c.policies) * 15) +
      (parseInt(c.queries) * 1)
    );

    await query(`
      INSERT INTO employee_expertise (organization_id, user_id, expertise_score, knowledge_contributions, documents_created, policies_authored)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (organization_id, user_id) DO UPDATE
        SET expertise_score = $3,
            knowledge_contributions = $4,
            documents_created = $5,
            policies_authored = $6,
            last_updated_at = NOW()
    `, [organizationId, userId, score, c.total, c.docs, c.policies]);
  }

  // ── Local JSON fallbacks ──────────────────────────────────────
  _buildLocalMemory(organizationId) {
    return { success: true, message: 'Memory built (local mode)' };
  }
  _getLocalMemorySummary(organizationId) {
    return { entities: [], recentActivity: [], topContributors: [] };
  }
  _localSnapshot(organizationId) {
    return {
      total_employees: 0, total_experts_identified: 0,
      memory_health_score: 0, expertise_coverage_score: 0
    };
  }
}

export default new OrganizationalMemoryService();
