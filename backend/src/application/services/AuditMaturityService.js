// ============================================================
// Service: AuditMaturityService
// Converts readiness into enterprise audit maturity levels.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditReadinessServiceV2 from './AuditReadinessServiceV2.js';
import evidenceQualityService from './EvidenceQualityService.js';

class AuditMaturityService {
  async calculateMaturity(planId, organizationId) {
    try {
      const readiness = await auditReadinessServiceV2.calculatePlanReadiness(planId, organizationId);
      const evidence = await evidenceQualityService.analyzePlan(planId, organizationId);
      const remediation = await query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status IN ('Completed', 'Closed'))::int AS completed
         FROM audit_remediation
         WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const predictions = await query(
        `SELECT COUNT(*)::int AS total FROM audit_predictions
         WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      const remediationTotal = remediation.rows[0]?.total || 0;
      const remediationCompleted = remediation.rows[0]?.completed || 0;
      const remediationScore = remediationTotal === 0 ? 70 : Math.round((remediationCompleted / remediationTotal) * 100);
      const predictionScore = predictions.rows[0]?.total > 0 ? 90 : 40;
      const maturityScore = Math.round(
        (Number(readiness.readinessScore || 0) * 0.35) +
        (Number(evidence.scores?.trustScore || 0) * 0.25) +
        (remediationScore * 0.20) +
        (predictionScore * 0.20)
      );
      const maturityLevel = this.levelForScore(maturityScore);
      const factors = {
        readiness,
        evidence: evidence.scores,
        remediation: { total: remediationTotal, completed: remediationCompleted, score: remediationScore },
        prediction: { total: predictions.rows[0]?.total || 0, score: predictionScore }
      };

      const saved = await query(
        `INSERT INTO audit_maturity_scores
         (organization_id, audit_plan_id, maturity_score, maturity_level, readiness_score,
          evidence_score, remediation_score, prediction_score, factors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          organizationId,
          planId,
          maturityScore,
          maturityLevel,
          readiness.readinessScore || 0,
          evidence.scores?.trustScore || 0,
          remediationScore,
          predictionScore,
          JSON.stringify(factors)
        ]
      );
      return saved.rows[0];
    } catch (err) {
      logger.error('Audit maturity scoring failed:', err);
      return {
        maturity_score: 0,
        maturity_level: 'Initial',
        factors: {}
      };
    }
  }

  async getLatest(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const planFilter = planId ? 'AND audit_plan_id = $2' : '';
    const res = await query(
      `SELECT * FROM audit_maturity_scores
       WHERE organization_id = $1 ${planFilter}
       ORDER BY calculated_at DESC LIMIT 1`,
      params
    );
    return res.rows[0] || null;
  }

  levelForScore(score) {
    if (score >= 90) return 'Optimized';
    if (score >= 75) return 'Managed';
    if (score >= 60) return 'Defined';
    if (score >= 40) return 'Developing';
    return 'Initial';
  }
}

export default new AuditMaturityService();
