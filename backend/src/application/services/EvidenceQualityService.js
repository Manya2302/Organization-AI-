// ============================================================
// Service: EvidenceQualityService
// Scores evidence completeness, freshness, ownership, review and trust.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class EvidenceQualityService {
  scoreRecommendation(item) {
    const hasDocument = Boolean(item.matching_document_id);
    const completeness = hasDocument ? 100 : 0;
    const confidence = Number(item.match_confidence || 0);
    const reviewStatus = item.status === 'Mapped' ? 100 : item.status === 'Recommended' ? 70 : 20;
    const freshness = hasDocument ? 90 : 25;
    const ownership = hasDocument ? 85 : 35;
    const validity = hasDocument && confidence >= 70 ? 95 : confidence >= 40 ? 60 : 25;
    const qualityScore = Math.round(
      completeness * 0.25 + freshness * 0.15 + ownership * 0.15 +
      reviewStatus * 0.15 + validity * 0.15 + confidence * 0.15
    );
    const trustScore = Math.round(qualityScore * 0.65 + validity * 0.35);
    const readinessScore = Math.round(completeness * 0.5 + trustScore * 0.5);

    return {
      evidenceRecommendationId: item.id,
      controlCode: item.control_code,
      evidenceName: item.recommended_evidence_name,
      completeness,
      freshness,
      ownership,
      reviewStatus,
      validity,
      confidence,
      qualityScore,
      trustScore,
      readinessScore,
      status: item.status
    };
  }

  async analyzePlan(planId, organizationId) {
    try {
      const res = await query(
        `SELECT * FROM audit_evidence_recommendations
         WHERE audit_plan_id = $1 AND organization_id = $2
         ORDER BY control_code, recommended_evidence_name`,
        [planId, organizationId]
      );
      const items = res.rows.map((row) => this.scoreRecommendation(row));
      const avg = (key) => items.length
        ? Math.round(items.reduce((sum, item) => sum + item[key], 0) / items.length)
        : 0;

      return {
        totals: {
          evidenceCount: items.length,
          mappedCount: items.filter((item) => item.completeness === 100).length,
          missingCount: items.filter((item) => item.completeness === 0).length
        },
        scores: {
          qualityScore: avg('qualityScore'),
          trustScore: avg('trustScore'),
          readinessScore: avg('readinessScore'),
          freshnessScore: avg('freshness')
        },
        items
      };
    } catch (err) {
      logger.error('Evidence quality analysis failed:', err);
      return { totals: {}, scores: {}, items: [] };
    }
  }
}

export default new EvidenceQualityService();
