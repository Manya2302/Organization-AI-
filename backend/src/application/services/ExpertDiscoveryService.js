// ============================================================
// Phase 3: Expert Discovery Service
// Identifies subject matter experts from document contributions,
// AI interaction patterns, and knowledge ownership signals.
// ============================================================
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class ExpertDiscoveryService {

  // ── Search for experts by topic / keyword ─────────────────────
  async searchExperts(organizationId, searchQuery, requestingUser) {
    if (isLocalJSONDb) return this._mockExperts(searchQuery);

    // Log the search
    await query(`
      INSERT INTO expert_search_history (organization_id, searched_by, search_query)
      VALUES ($1, $2, $3)
    `, [organizationId, requestingUser.id, searchQuery]).catch(() => {});

    const queryTerm = `%${searchQuery.toLowerCase()}%`;

    const result = await query(`
      SELECT DISTINCT
        u.id, u.name, u.email, u.department, u.designation, u.profile_photo,
        COALESCE(ee.expertise_score, 0) as expertise_score,
        COALESCE(ee.primary_domain, u.department) as primary_domain,
        COALESCE(ee.secondary_domain, '') as secondary_domain,
        COALESCE(ee.expertise_domains, '[]'::jsonb) as expertise_domains,
        COALESCE(ee.documents_created, 0) as documents_created,
        COALESCE(ee.policies_authored, 0) as policies_authored,
        COALESCE(ee.knowledge_contributions, 0) as knowledge_contributions,
        (
          SELECT COUNT(*) FROM documents d
          WHERE d.owner_id = u.id AND d.organization_id = $1 AND d.is_deleted = FALSE
            AND (LOWER(d.name) LIKE $3 OR LOWER(d.category) LIKE $3 OR LOWER(d.department) LIKE $3)
        ) as related_documents_count,
        (
          SELECT json_agg(json_build_object('name', d.name, 'category', d.category, 'id', d.id))
          FROM documents d
          WHERE d.owner_id = u.id AND d.organization_id = $1 AND d.is_deleted = FALSE
            AND (LOWER(d.name) LIKE $3 OR LOWER(d.category) LIKE $3)
          LIMIT 3
        ) as sample_documents
      FROM users u
      LEFT JOIN employee_expertise ee ON ee.user_id = u.id AND ee.organization_id = $1
      LEFT JOIN knowledge_contributions kc ON kc.user_id = u.id AND kc.organization_id = $1
      WHERE u.organization_id = $1
        AND u.role != 'SuperAdmin'
        AND u.is_active = TRUE
        AND (
          LOWER(u.name) LIKE $3
          OR LOWER(u.department) LIKE $3
          OR LOWER(u.designation) LIKE $3
          OR LOWER(COALESCE(ee.primary_domain, '')) LIKE $3
          OR LOWER(COALESCE(kc.knowledge_domain, '')) LIKE $3
          OR EXISTS (
            SELECT 1 FROM documents d
            WHERE d.owner_id = u.id AND d.organization_id = $1 AND d.is_deleted = FALSE
              AND (LOWER(d.name) LIKE $3 OR LOWER(d.category) LIKE $3 OR LOWER(d.department) LIKE $3)
          )
        )
        AND ($2 = 'SuperAdmin' OR $2 = 'EnterpriseAdmin' OR u.department = $4)
      ORDER BY expertise_score DESC, related_documents_count DESC
      LIMIT 20
    `, [organizationId, requestingUser.role, queryTerm, requestingUser.department]);

    return result.rows;
  }

  // ── Get all experts ranked ────────────────────────────────────
  async getAllExperts(organizationId, requestingUser) {
    if (isLocalJSONDb) return this._mockExperts('all');

    const deptFilter = ['SuperAdmin','EnterpriseAdmin'].includes(requestingUser.role)
      ? '' : `AND u.department = '${requestingUser.department}'`;

    const result = await query(`
      SELECT
        u.id, u.name, u.email, u.department, u.designation, u.profile_photo,
        COALESCE(ee.expertise_score, 0) as expertise_score,
        COALESCE(ee.primary_domain, u.department) as primary_domain,
        COALESCE(ee.secondary_domain, '') as secondary_domain,
        COALESCE(ee.expertise_domains, '[]'::jsonb) as expertise_domains,
        COALESCE(ee.documents_created, 0) as documents_created,
        COALESCE(ee.policies_authored, 0) as policies_authored,
        COALESCE(ee.knowledge_contributions, 0) as knowledge_contributions,
        COALESCE(ee.ai_interactions, 0) as ai_interactions,
        ee.last_updated_at
      FROM users u
      LEFT JOIN employee_expertise ee ON ee.user_id = u.id AND ee.organization_id = $1
      WHERE u.organization_id = $1 AND u.role != 'SuperAdmin' AND u.is_active = TRUE
      ${deptFilter}
      ORDER BY ee.expertise_score DESC NULLS LAST, ee.knowledge_contributions DESC NULLS LAST
    `, [organizationId]);

    return result.rows;
  }

  // ── Get expert profile by user ID ─────────────────────────────
  async getExpertProfile(organizationId, expertUserId) {
    if (isLocalJSONDb) return null;

    const [userRes, expertiseRes, docsRes, contribsRes] = await Promise.all([
      query(`
        SELECT u.*, o.name as org_name FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.id = $1 AND u.organization_id = $2
      `, [expertUserId, organizationId]),

      query(`
        SELECT * FROM employee_expertise WHERE user_id = $1 AND organization_id = $2
      `, [expertUserId, organizationId]),

      query(`
        SELECT id, name, category, department, created_at
        FROM documents
        WHERE owner_id = $1 AND organization_id = $2 AND is_deleted = FALSE
        ORDER BY created_at DESC LIMIT 10
      `, [expertUserId, organizationId]),

      query(`
        SELECT contribution_type, COUNT(*) as count, knowledge_domain
        FROM knowledge_contributions
        WHERE user_id = $1 AND organization_id = $2
        GROUP BY contribution_type, knowledge_domain
        ORDER BY count DESC
      `, [expertUserId, organizationId])
    ]);

    if (!userRes.rows[0]) return null;

    return {
      user: userRes.rows[0],
      expertise: expertiseRes.rows[0] || {},
      documents: docsRes.rows,
      contributions: contribsRes.rows
    };
  }

  // ── Recompute expertise scores for all employees ───────────────
  async recomputeAllExpertise(organizationId) {
    if (isLocalJSONDb) return { updated: 0 };

    // Get all employees
    const usersRes = await query(
      `SELECT id FROM users WHERE organization_id = $1 AND role != 'SuperAdmin'`,
      [organizationId]
    );

    let updated = 0;
    for (const user of usersRes.rows) {
      await this._computeExpertiseForUser(organizationId, user.id);
      updated++;
    }

    return { updated, message: `Expertise recomputed for ${updated} employees` };
  }

  // ── Private: Compute expertise profile for one user ───────────
  async _computeExpertiseForUser(organizationId, userId) {
    // Count document signals
    const [docsRes, contribsRes, searchRes] = await Promise.all([
      query(`
        SELECT category, COUNT(*) as count FROM documents
        WHERE owner_id = $1 AND organization_id = $2 AND is_deleted = FALSE
        GROUP BY category ORDER BY count DESC
      `, [userId, organizationId]),

      query(`
        SELECT knowledge_domain, contribution_type, COUNT(*) as count
        FROM knowledge_contributions
        WHERE user_id = $1 AND organization_id = $2
        GROUP BY knowledge_domain, contribution_type
        ORDER BY count DESC LIMIT 20
      `, [userId, organizationId]),

      query(`
        SELECT COUNT(*) as total FROM ai_interactions
        WHERE user_id = $1 AND organization_id = $2
      `, [userId, organizationId]).catch(() => ({ rows: [{ total: 0 }] }))
    ]);

    const totalDocs = docsRes.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const totalContribs = contribsRes.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const aiInteractions = parseInt(searchRes.rows[0]?.total || 0);

    const score = Math.min(100,
      (totalDocs * 5) + (totalContribs * 2) + (aiInteractions * 0.5)
    );

    const primaryDomain = docsRes.rows[0]?.category || null;
    const secondaryDomain = docsRes.rows[1]?.category || null;
    const expertiseDomains = docsRes.rows.slice(0, 5).map(r => ({
      domain: r.category, count: parseInt(r.count)
    }));

    await query(`
      INSERT INTO employee_expertise
        (organization_id, user_id, expertise_score, primary_domain, secondary_domain,
         expertise_domains, documents_created, knowledge_contributions, ai_interactions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (organization_id, user_id) DO UPDATE SET
        expertise_score = $3,
        primary_domain = $4,
        secondary_domain = $5,
        expertise_domains = $6,
        documents_created = $7,
        knowledge_contributions = $8,
        ai_interactions = $9,
        last_updated_at = NOW()
    `, [
      organizationId, userId, score.toFixed(2),
      primaryDomain, secondaryDomain,
      JSON.stringify(expertiseDomains),
      totalDocs, totalContribs, aiInteractions
    ]);
  }

  _mockExperts(query) {
    return [
      { id: '1', name: 'Alok Sharma', department: 'IT', designation: 'Director of IT', expertise_score: 92, primary_domain: 'Cloud Security', documents_created: 14, knowledge_contributions: 28 },
      { id: '2', name: 'Priya Patel', department: 'Legal', designation: 'Lead Legal Counsel', expertise_score: 85, primary_domain: 'Contract Law', documents_created: 9, knowledge_contributions: 18 },
      { id: '3', name: 'Rohan Verma', department: 'Finance', designation: 'Senior Accountant', expertise_score: 74, primary_domain: 'Audit & Taxation', documents_created: 7, knowledge_contributions: 12 },
    ];
  }
}

export default new ExpertDiscoveryService();
