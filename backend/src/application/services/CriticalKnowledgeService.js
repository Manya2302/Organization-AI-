// ============================================================
// Service: CriticalKnowledgeService
// Computes business critical score and logs critical knowledge assets
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class CriticalKnowledgeService {
  async evaluateCriticalAssets(organizationId) {
    try {
      // Fetch documents
      const docsRes = await query(
        "SELECT id, name, category, updated_at FROM documents WHERE organization_id = $1 AND is_deleted = FALSE",
        [organizationId]
      );

      const docs = docsRes.rows;
      if (docs.length === 0) {
        return [];
      }

      const results = [];

      for (const doc of docs) {
        // Calculate score factors
        // 1. Dependency count (edges referencing this document)
        const relRes = await query(
          "SELECT COUNT(*) as count FROM knowledge_relationships WHERE organization_id = $1 AND (source_id = $2 OR target_id = $2)",
          [organizationId, doc.id]
        );
        const relCount = parseInt(relRes.rows[0]?.count || '0');
        const dependencyScore = Math.min(100.00, relCount * 25.00);

        // 2. Access frequency (lookup logs)
        const logRes = await query(
          "SELECT COUNT(*) as count FROM audit_logs WHERE organization_id = $1 AND resource_id = $2",
          [organizationId, doc.id]
        );
        const logCount = parseInt(logRes.rows[0]?.count || '0');
        const accessScore = Math.min(100.00, logCount * 10.00);

        // 3. Compliance relevance based on category
        const complianceRelevanceScore = ['Legal', 'Compliance', 'Finance', 'Policy'].includes(doc.category) ? 90.00 : 30.00;

        // Overall Critical Knowledge Score
        const criticalScore = parseFloat(((dependencyScore * 0.35) + (accessScore * 0.30) + (complianceRelevanceScore * 0.35)).toFixed(2));
        const impactScore = parseFloat(((criticalScore * 0.8) + 20.0).toFixed(2));

        // Save into critical_knowledge table
        await query(
          `INSERT INTO critical_knowledge (organization_id, entity_type, entity_id, critical_knowledge_score, business_impact_score, access_frequency_score, owner_availability_score, compliance_relevance_score)
           VALUES ($1, 'Document', $2, $3, $4, $5, 80.00, $6)
           ON CONFLICT (organization_id, entity_type, entity_id)
           DO UPDATE SET critical_knowledge_score = EXCLUDED.critical_knowledge_score, business_impact_score = EXCLUDED.business_impact_score, access_frequency_score = EXCLUDED.access_frequency_score, compliance_relevance_score = EXCLUDED.compliance_relevance_score, updated_at = NOW()`,
          [organizationId, doc.id, criticalScore, impactScore, accessScore, complianceRelevanceScore]
        );

        results.push({
          id: doc.id,
          name: doc.name,
          criticalScore,
          impactScore
        });
      }

      return results;
    } catch (err) {
      logger.error('Failed to compute critical knowledge assets:', err);
      return [];
    }
  }

  async getCriticalRegistry(organizationId) {
    try {
      const res = await query(
        `SELECT ck.*, d.name as entity_name, d.category as entity_category
         FROM critical_knowledge ck
         JOIN documents d ON ck.entity_id = d.id::text
         WHERE ck.organization_id = $1
         ORDER BY ck.critical_knowledge_score DESC`,
        [organizationId]
      );
      return { success: true, registry: res.rows };
    } catch (err) {
      logger.error('Failed to fetch critical registry details:', err);
      return { success: false, registry: [] };
    }
  }
}

export default new CriticalKnowledgeService();
