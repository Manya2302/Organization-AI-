import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class DepartmentKnowledgeService {
  static async compileDepartmentMetrics(organizationId) {
    try {
      // Get all active departments represented in our documents or users
      const deptRes = await query(
        `SELECT DISTINCT department FROM users WHERE organization_id = $1 AND department IS NOT NULL
         UNION
         SELECT DISTINCT department FROM documents WHERE organization_id = $1 AND department IS NOT NULL AND is_deleted = FALSE`,
        [organizationId]
      );
      
      const departments = deptRes.rows.map(r => r.department);
      if (departments.length === 0) {
        // Fallback seed departments
        departments.push('HR', 'Legal', 'Finance', 'Engineering');
      }

      const results = [];
      for (const dept of departments) {
        // 1. Total documents in department
        const docRes = await query(
          `SELECT COUNT(*) as count FROM documents 
           WHERE organization_id = $1 AND department = $2 AND is_deleted = FALSE`,
          [organizationId, dept]
        );
        const docCount = parseInt(docRes.rows[0]?.count || 0);

        // 2. Documents with summary & entities (Quality)
        const qualRes = await query(
          `SELECT COUNT(*) as count FROM documents 
           WHERE organization_id = $1 AND department = $2 AND is_deleted = FALSE
             AND metadata->'summary' IS NOT NULL 
             AND metadata->'entities' IS NOT NULL`,
          [organizationId, dept]
        );
        const qualityCount = parseInt(qualRes.rows[0]?.count || 0);

        // 3. Document details filled in (Completeness)
        const completeRes = await query(
          `SELECT COUNT(*) as count FROM documents 
           WHERE organization_id = $1 AND department = $2 AND is_deleted = FALSE
             AND category IS NOT NULL AND category != 'General'`,
          [organizationId, dept]
        );
        const completeCount = parseInt(completeRes.rows[0]?.count || 0);

        // Compute coverage: percentage of documents this department owns relative to total org documents
        const totalDocsRes = await query(
          `SELECT COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE`,
          [organizationId]
        );
        const totalDocs = parseInt(totalDocsRes.rows[0]?.count || 1);
        const knowledgeCoverage = Math.round((docCount / totalDocs) * 100);

        const knowledgeQuality = docCount > 0 ? Math.round((qualityCount / docCount) * 100) : 75;
        const documentationCompleteness = docCount > 0 ? Math.round((completeCount / docCount) * 100) : 80;

        // Default or simulated stats for growth, activity, and search effectiveness
        const knowledgeGrowth = Math.min(10 + docCount * 4, 100); // simulated growth
        const knowledgeActivity = Math.min(25 + docCount * 8, 100); // simulated interaction rate
        const searchEffectiveness = 85; // baseline rating

        // Health score average
        const healthScore = Math.round(
          (knowledgeCoverage + knowledgeQuality + knowledgeGrowth + knowledgeActivity + searchEffectiveness + documentationCompleteness) / 6
        );

        // Update database table
        const upsertRes = await query(
          `INSERT INTO department_knowledge_metrics 
           (organization_id, department, knowledge_coverage, knowledge_quality, knowledge_growth, 
            knowledge_activity, search_effectiveness, documentation_completeness, health_score, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (organization_id, department) 
           DO UPDATE SET 
             knowledge_coverage = EXCLUDED.knowledge_coverage,
             knowledge_quality = EXCLUDED.knowledge_quality,
             knowledge_growth = EXCLUDED.knowledge_growth,
             knowledge_activity = EXCLUDED.knowledge_activity,
             search_effectiveness = EXCLUDED.search_effectiveness,
             documentation_completeness = EXCLUDED.documentation_completeness,
             health_score = EXCLUDED.health_score,
             updated_at = NOW()
           RETURNING *`,
          [organizationId, dept, knowledgeCoverage, knowledgeQuality, knowledgeGrowth, knowledgeActivity, searchEffectiveness, documentationCompleteness, healthScore]
        );

        results.push(upsertRes.rows[0]);
      }

      return results;
    } catch (err) {
      logger.error('Error compiling department metrics:', err);
      throw err;
    }
  }

  static async getDepartmentRankings(organizationId) {
    const list = await query(
      `SELECT * FROM department_knowledge_metrics 
       WHERE organization_id = $1 
       ORDER BY health_score DESC`,
      [organizationId]
    );
    if (list.rows.length === 0) {
      return await this.compileDepartmentMetrics(organizationId);
    }
    return list.rows;
  }
}
