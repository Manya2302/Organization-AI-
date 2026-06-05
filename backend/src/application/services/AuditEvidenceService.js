// ============================================================
// Service: AuditEvidenceService
// Evaluates quality, freshness, and completeness of audit evidence
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditEvidenceService {
  async getEvidenceRecommendations(planId, organizationId) {
    try {
      const res = await query(
        `SELECT * FROM audit_evidence_recommendations 
         WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('Failed to get evidence recommendations:', err);
      return [];
    }
  }

  async calculateEvidenceScores(planId, organizationId) {
    try {
      const items = await this.getEvidenceRecommendations(planId, organizationId);
      if (items.length === 0) {
        return { readinessScore: 0, completenessScore: 0, qualityScore: 0 };
      }

      const total = items.length;
      const mapped = items.filter(i => i.matching_document_id !== null).length;
      const recommended = items.filter(i => i.status === 'Recommended').length;
      const missing = items.filter(i => i.status === 'Missing').length;

      // Quality rating based on match confidence
      const totalConfidence = items.reduce((sum, item) => sum + (item.match_confidence || 0), 0);
      const qualityScore = Math.round(totalConfidence / total);

      const completenessScore = Math.round((mapped / total) * 100);
      const readinessScore = Math.round((completenessScore * 0.7) + (qualityScore * 0.3));

      return {
        readinessScore,
        completenessScore,
        qualityScore
      };
    } catch (err) {
      logger.error('Failed to calculate evidence scores:', err);
      return { readinessScore: 0, completenessScore: 0, qualityScore: 0 };
    }
  }

  async mapDocumentToEvidence(planId, recommendationId, documentId, organizationId) {
    try {
      const docRes = await query(
        `SELECT name FROM documents WHERE id = $1 AND organization_id = $2`,
        [documentId, organizationId]
      );
      if (docRes.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }

      const docName = docRes.rows[0].name;

      const result = await query(
        `UPDATE audit_evidence_recommendations
         SET matching_document_id = $1,
             matching_document_name = $2,
             match_confidence = 100,
             status = 'Mapped',
             updated_at = NOW()
         WHERE id = $3 AND audit_plan_id = $4 AND organization_id = $5
         RETURNING *`,
        [documentId, docName, recommendationId, planId, organizationId]
      );

      return result.rows[0];
    } catch (err) {
      logger.error('Failed to map document to evidence recommendation:', err);
      throw err;
    }
  }
}

export default new AuditEvidenceService();
