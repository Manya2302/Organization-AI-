// ============================================================
// Service: EvidenceIntelligenceService
// Central evidence discovery, classification, validation and trust layer.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import evidenceCorrelationService from './EvidenceCorrelationService.js';
import evidenceQualityService from './EvidenceQualityService.js';
import evidenceFreshnessService from './EvidenceFreshnessService.js';

class EvidenceIntelligenceService {
  async analyzePlan(planId, organizationId) {
    try {
      const [quality, correlation, freshness] = await Promise.all([
        evidenceQualityService.analyzePlan(planId, organizationId),
        evidenceCorrelationService.correlatePlan(planId, organizationId),
        evidenceFreshnessService.getFreshnessAlerts(planId, organizationId)
      ]);

      const recommendations = quality.items
        .filter((item) => item.readinessScore < 75)
        .map((item) => ({
          controlCode: item.controlCode,
          evidenceName: item.evidenceName,
          recommendation: item.completeness === 0
            ? 'Upload or map evidence for this control before auditor review.'
            : 'Review evidence quality and increase confidence before package generation.',
          priority: item.completeness === 0 ? 'HIGH' : 'MEDIUM'
        }));

      return {
        discovery: await this.discoverEvidenceCandidates(planId, organizationId),
        classification: this.classifyEvidence(quality.items),
        validation: quality,
        correlation,
        freshness,
        recommendations,
        trust: quality.scores
      };
    } catch (err) {
      logger.error('Evidence intelligence analysis failed:', err);
      return { discovery: [], classification: {}, validation: {}, correlation: {}, freshness: {}, recommendations: [] };
    }
  }

  async discoverEvidenceCandidates(planId, organizationId) {
    const candidates = await query(
      `SELECT aer.id AS recommendation_id, aer.control_code, aer.recommended_evidence_name,
              d.id AS document_id, d.name AS document_name, d.category, d.department, d.updated_at
       FROM audit_evidence_recommendations aer
       LEFT JOIN documents d
         ON d.organization_id = aer.organization_id
        AND d.is_deleted = FALSE
        AND (
          d.name ILIKE '%' || split_part(aer.recommended_evidence_name, ' ', 1) || '%'
          OR COALESCE(d.ocr_text, '') ILIKE '%' || split_part(aer.recommended_evidence_name, ' ', 1) || '%'
        )
       WHERE aer.audit_plan_id = $1 AND aer.organization_id = $2
       ORDER BY aer.control_code, d.updated_at DESC NULLS LAST`,
      [planId, organizationId]
    );
    return candidates.rows;
  }

  classifyEvidence(items) {
    return {
      mapped: items.filter((item) => item.status === 'Mapped'),
      recommended: items.filter((item) => item.status === 'Recommended'),
      missing: items.filter((item) => item.status === 'Missing'),
      lowTrust: items.filter((item) => item.trustScore < 60)
    };
  }
}

export default new EvidenceIntelligenceService();
