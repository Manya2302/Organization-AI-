// ============================================================
// Service: KnowledgeConfidenceService
// Computes credibility score based on verification and usage
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class KnowledgeConfidenceService {
  async calculateConfidence(organizationId) {
    try {
      const docsRes = await query(
        'SELECT id, name, updated_at FROM documents WHERE organization_id = $1 AND is_deleted = FALSE',
        [organizationId]
      );

      const docs = docsRes.rows;
      if (docs.length === 0) {
        return { averageConfidence: 100.00 };
      }

      let totalConfidenceSum = 0;

      for (const doc of docs) {
        // Factors
        // 1. Human Validation: Check if verified in knowledge_relationships or elsewhere
        const relsRes = await query(
          "SELECT COUNT(*) as count, SUM(CASE WHEN human_verified THEN 1 ELSE 0 END) as verified_count FROM knowledge_relationships WHERE organization_id = $1 AND (source_id = $2 OR target_id = $2)",
          [organizationId, doc.id]
        );
        const relCount = parseInt(relsRes.rows[0]?.count || '0');
        const verCount = parseInt(relsRes.rows[0]?.verified_count || '0');

        const humanValidationFactor = relCount > 0 ? (verCount / relCount) * 100.00 : 50.00;

        // 2. Usage frequency (dummy lookup, e.g. how many times queried or read)
        const usageRes = await query(
          "SELECT COUNT(*) as count FROM audit_logs WHERE organization_id = $1 AND resource_id = $2",
          [organizationId, doc.id]
        );
        const usageFrequency = parseInt(usageRes.rows[0]?.count || '0');

        // 3. Freshness factor
        const freshRes = await query(
          "SELECT freshness_score FROM knowledge_freshness WHERE organization_id = $1 AND entity_id = $2 LIMIT 1",
          [organizationId, doc.id]
        );
        const freshnessFactor = parseFloat(freshRes.rows[0]?.freshness_score || '85.00');

        // Relationship coverage
        const relationshipCoverage = relCount > 0 ? Math.min(100.00, relCount * 10.00) : 10.00;

        // Weighted confidence calculation
        const confidenceScore = Math.min(100.00, 
          (humanValidationFactor * 0.40) + 
          (freshnessFactor * 0.35) + 
          (Math.min(10.00, usageFrequency) * 1.50) + 
          (relationshipCoverage * 0.10)
        );

        totalConfidenceSum += confidenceScore;

        // Save into knowledge_confidence_metrics table
        await query(
          `INSERT INTO knowledge_confidence_metrics (organization_id, entity_type, entity_id, confidence_score, human_validation_factor, source_count, usage_frequency, freshness_factor, relationship_coverage, entity_coverage)
           VALUES ($1, 'Document', $2, $3, $4, 1, $5, $6, $7, 100.00)
           ON CONFLICT (organization_id, entity_type, entity_id)
           DO UPDATE SET confidence_score = EXCLUDED.confidence_score, human_validation_factor = EXCLUDED.human_validation_factor, usage_frequency = EXCLUDED.usage_frequency, freshness_factor = EXCLUDED.freshness_factor, relationship_coverage = EXCLUDED.relationship_coverage, updated_at = NOW()`,
          [organizationId, doc.id, confidenceScore, humanValidationFactor, usageFrequency, freshnessFactor, relationshipCoverage]
        );
      }

      const overallConfidence = totalConfidenceSum / docs.length;

      return {
        averageConfidence: parseFloat(overallConfidence.toFixed(2))
      };
    } catch (err) {
      logger.error('Failed to calculate knowledge confidence score:', err);
      return { averageConfidence: 100.00 };
    }
  }

  async getConfidenceOverview(organizationId) {
    try {
      const res = await query(
        `SELECT kcm.*, d.name as entity_name 
         FROM knowledge_confidence_metrics kcm
         JOIN documents d ON kcm.entity_id = d.id::text
         WHERE kcm.organization_id = $1
         ORDER BY kcm.confidence_score ASC`,
        [organizationId]
      );
      return { success: true, confidenceMetrics: res.rows };
    } catch (err) {
      logger.error('Failed to get confidence overview:', err);
      return { success: false, confidenceMetrics: [] };
    }
  }
}

export default new KnowledgeConfidenceService();
