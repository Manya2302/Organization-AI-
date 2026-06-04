// ============================================================
// Phase 3: Department Intelligence Service
// Department-level knowledge coverage, rankings, and gap analysis
// ============================================================
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class DepartmentIntelligenceService {

  // ── Get intelligence for all departments ──────────────────────
  async getDepartmentRankings(organizationId) {
    if (isLocalJSONDb) return this._mockRankings();

    const result = await query(`
      SELECT
        d.department,
        COUNT(DISTINCT d.id) as document_count,
        COUNT(DISTINCT d.owner_id) as active_contributors,
        COUNT(DISTINCT CASE WHEN dc.primary_category IS NOT NULL THEN d.id END) as classified_count,
        COUNT(DISTINCT CASE WHEN ds.short_summary IS NOT NULL THEN d.id END) as summarized_count,
        COUNT(DISTINCT CASE WHEN d.ocr_status = 'completed' THEN d.id END) as ocr_count,
        AVG(COALESCE(dc.confidence_score, 0)) as avg_classification_confidence,
        MAX(d.created_at) as last_activity,
        COUNT(DISTINCT u.id) as total_employees
      FROM documents d
      LEFT JOIN document_classifications dc ON dc.document_id = d.id
      LEFT JOIN document_summaries ds ON ds.document_id = d.id
      LEFT JOIN users u ON u.organization_id = $1 AND u.department = d.department AND u.is_active = TRUE
      WHERE d.organization_id = $1 AND d.is_deleted = FALSE AND d.department IS NOT NULL
      GROUP BY d.department
      ORDER BY document_count DESC
    `, [organizationId]);

    return result.rows.map((dept, index) => {
      const docCount = parseInt(dept.document_count) || 0;
      const classified = parseInt(dept.classified_count) || 0;
      const summarized = parseInt(dept.summarized_count) || 0;
      const ocrDone = parseInt(dept.ocr_count) || 0;
      const employees = parseInt(dept.total_employees) || 1;

      const coverage = docCount > 0 ? Math.round((classified / docCount) * 100) : 0;
      const quality = docCount > 0 ? Math.round(((classified + summarized + ocrDone) / (docCount * 3)) * 100) : 0;
      const perCapita = parseFloat((docCount / employees).toFixed(1));
      const healthScore = Math.round((coverage + quality) / 2);

      return {
        rank: index + 1,
        department: dept.department,
        document_count: docCount,
        active_contributors: parseInt(dept.active_contributors),
        total_employees: parseInt(dept.total_employees) || 0,
        classified_count: classified,
        summarized_count: summarized,
        ocr_count: ocrDone,
        coverage_score: coverage,
        quality_score: quality,
        knowledge_health: healthScore,
        docs_per_capita: perCapita,
        last_activity: dept.last_activity,
        avg_confidence: parseFloat(parseFloat(dept.avg_classification_confidence || 0).toFixed(2))
      };
    });
  }

  // ── Get single department deep-dive ──────────────────────────
  async getDepartmentProfile(organizationId, department, role, userDepartment) {
    if (isLocalJSONDb) return this._mockDeptProfile(department);

    // Access control: Employees can only see their own department
    if (role === 'Employee' && department !== userDepartment) {
      return null;
    }

    const [docsRes, expertsRes, timelineRes, gapsRes] = await Promise.all([
      query(`
        SELECT d.id, d.name, d.category, d.created_at,
               u.name as uploaded_by,
               dc.primary_category, dc.risk_level,
               ds.short_summary
        FROM documents d
        LEFT JOIN users u ON u.id = d.owner_id
        LEFT JOIN document_classifications dc ON dc.document_id = d.id
        LEFT JOIN document_summaries ds ON ds.document_id = d.id
        WHERE d.organization_id = $1 AND d.department = $2 AND d.is_deleted = FALSE
        ORDER BY d.created_at DESC LIMIT 20
      `, [organizationId, department]),

      query(`
        SELECT u.name, u.designation, u.profile_photo,
               COALESCE(ee.expertise_score, 0) as expertise_score,
               COALESCE(ee.primary_domain, $2) as primary_domain,
               COALESCE(ee.documents_created, 0) as docs_created
        FROM users u
        LEFT JOIN employee_expertise ee ON ee.user_id = u.id AND ee.organization_id = $1
        WHERE u.organization_id = $1 AND u.department = $2 AND u.is_active = TRUE
        ORDER BY expertise_score DESC
      `, [organizationId, department]),

      query(`
        SELECT kc.contribution_type, kc.knowledge_domain, kc.created_at,
               u.name as user_name
        FROM knowledge_contributions kc
        JOIN users u ON u.id = kc.user_id
        WHERE kc.organization_id = $1 AND u.department = $2
        ORDER BY kc.created_at DESC LIMIT 15
      `, [organizationId, department]),

      // Identify knowledge gaps: categories with < 3 docs
      query(`
        SELECT category, COUNT(*) as count FROM documents
        WHERE organization_id = $1 AND department = $2 AND is_deleted = FALSE
        GROUP BY category HAVING COUNT(*) < 3
        ORDER BY count ASC
      `, [organizationId, department])
    ]);

    const totalDocs = docsRes.rows.length;
    const classifiedCount = docsRes.rows.filter(d => d.primary_category).length;
    const coverageScore = totalDocs > 0 ? Math.round((classifiedCount / totalDocs) * 100) : 0;

    return {
      department,
      documents: docsRes.rows,
      experts: expertsRes.rows,
      recentActivity: timelineRes.rows,
      knowledgeGaps: gapsRes.rows,
      stats: {
        total_documents: totalDocs,
        classified_count: classifiedCount,
        coverage_score: coverageScore,
        total_employees: expertsRes.rows.length
      }
    };
  }

  // ── Generate department summary for all depts ─────────────────
  async generateAllDeptSummaries(organizationId) {
    if (isLocalJSONDb) return [];

    const deptsRes = await query(`
      SELECT DISTINCT department FROM documents
      WHERE organization_id = $1 AND department IS NOT NULL AND is_deleted = FALSE
    `, [organizationId]);

    const summaries = [];
    for (const { department } of deptsRes.rows) {
      const profile = await this.getDepartmentProfile(organizationId, department, 'EnterpriseAdmin', null);
      summaries.push(profile);
    }

    return summaries;
  }

  // ── Mocks ─────────────────────────────────────────────────────
  _mockRankings() {
    return [
      { rank: 1, department: 'Legal', document_count: 8, coverage_score: 90, knowledge_health: 85, docs_per_capita: 4.0 },
      { rank: 2, department: 'Finance', document_count: 6, coverage_score: 75, knowledge_health: 70, docs_per_capita: 3.0 },
      { rank: 3, department: 'HR', document_count: 4, coverage_score: 60, knowledge_health: 58, docs_per_capita: 2.0 },
    ];
  }

  _mockDeptProfile(department) {
    return { department, documents: [], experts: [], recentActivity: [], knowledgeGaps: [], stats: { total_documents: 0, classified_count: 0, coverage_score: 0, total_employees: 0 } };
  }
}

export default new DepartmentIntelligenceService();
