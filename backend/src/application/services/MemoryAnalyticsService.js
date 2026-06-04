// ============================================================
// Phase 3: Memory Analytics Service
// Aggregates knowledge brain metrics, snapshots, and trends.
// ============================================================
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class MemoryAnalyticsService {

  // ── Full analytics dashboard for org ─────────────────────────
  async getDashboardAnalytics(organizationId) {
    if (isLocalJSONDb) return this._mockAnalytics();

    const [brainRes, snapshotsRes, topExpertsRes, domainRes, riskRes] = await Promise.all([
      // Brain metrics
      query(`SELECT * FROM knowledge_brain_metrics WHERE organization_id = $1`, [organizationId]),

      // Last 30 days snapshots for trend
      query(`
        SELECT snapshot_date, memory_health_score, expertise_coverage_score,
               total_knowledge_entities, total_experts_identified, total_contributions
        FROM memory_snapshots WHERE organization_id = $1
        ORDER BY snapshot_date DESC LIMIT 30
      `, [organizationId]),

      // Top experts
      query(`
        SELECT u.name, u.department, u.designation, u.profile_photo,
               ee.expertise_score, ee.primary_domain, ee.documents_created,
               ee.knowledge_contributions
        FROM employee_expertise ee
        JOIN users u ON u.id = ee.user_id
        WHERE ee.organization_id = $1
        ORDER BY ee.expertise_score DESC LIMIT 8
      `, [organizationId]),

      // Knowledge domain distribution
      query(`
        SELECT knowledge_domain, COUNT(*) as count
        FROM knowledge_contributions
        WHERE organization_id = $1 AND knowledge_domain IS NOT NULL
        GROUP BY knowledge_domain ORDER BY count DESC LIMIT 10
      `, [organizationId]),

      // Knowledge risk signals
      query(`
        SELECT
          COUNT(*) FILTER (WHERE expertise_score < 30) as low_expertise_employees,
          COUNT(*) FILTER (WHERE expertise_score > 80) as high_expertise_employees,
          COUNT(*) as total_employees
        FROM employee_expertise WHERE organization_id = $1
      `, [organizationId])
    ]);

    const brain = brainRes.rows[0] || {};
    const risk = riskRes.rows[0] || {};
    const concentration = risk.total_employees > 0
      ? parseFloat((parseInt(risk.high_expertise_employees) / parseInt(risk.total_employees) * 100).toFixed(1))
      : 0;

    return {
      brain,
      snapshots: snapshotsRes.rows.reverse(),
      topExperts: topExpertsRes.rows,
      knowledgeDomains: domainRes.rows,
      riskSignals: {
        concentrationRisk: concentration < 15,
        lowExpertiseCount: parseInt(risk.low_expertise_employees) || 0,
        highExpertiseCount: parseInt(risk.high_expertise_employees) || 0,
        concentrationPercent: concentration
      }
    };
  }

  // ── Get knowledge growth trend ────────────────────────────────
  async getKnowledgeGrowthTrend(organizationId, days = 30) {
    if (isLocalJSONDb) return [];

    const result = await query(`
      SELECT snapshot_date, total_knowledge_entities, total_contributions,
             memory_health_score, expertise_coverage_score
      FROM memory_snapshots WHERE organization_id = $1
        AND snapshot_date >= NOW() - INTERVAL '${parseInt(days)} days'
      ORDER BY snapshot_date ASC
    `, [organizationId]);

    return result.rows;
  }

  // ── Compare departments ────────────────────────────────────────
  async getDepartmentComparison(organizationId) {
    if (isLocalJSONDb) return [];

    const result = await query(`
      SELECT
        u.department,
        COUNT(DISTINCT u.id) as employee_count,
        COALESCE(AVG(ee.expertise_score), 0) as avg_expertise,
        COALESCE(SUM(ee.documents_created), 0) as total_docs,
        COALESCE(SUM(ee.knowledge_contributions), 0) as total_contributions,
        COUNT(DISTINCT CASE WHEN ee.expertise_score > 70 THEN u.id END) as expert_count
      FROM users u
      LEFT JOIN employee_expertise ee ON ee.user_id = u.id AND ee.organization_id = $1
      WHERE u.organization_id = $1 AND u.department IS NOT NULL
        AND u.role != 'SuperAdmin' AND u.is_active = TRUE
      GROUP BY u.department
      ORDER BY avg_expertise DESC
    `, [organizationId]);

    return result.rows;
  }

  _mockAnalytics() {
    return {
      brain: { memory_health_score: 0, brain_maturity_level: 'Initializing', total_experts: 0 },
      snapshots: [], topExperts: [], knowledgeDomains: [],
      riskSignals: { concentrationRisk: false, lowExpertiseCount: 0, highExpertiseCount: 0 }
    };
  }
}

export default new MemoryAnalyticsService();
