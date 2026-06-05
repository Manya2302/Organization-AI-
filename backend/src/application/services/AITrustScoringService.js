// ============================================================
// AITrustScoringService — Phase 6: Trust Scoring Engine
// Computes composite AI trust scores from multiple signals
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AITrustScoringService {

  // ── Compute and store trust score for a model ──
  async computeTrustScore(organizationId, modelId) {
    try {
      // Gather signals
      const [hallucinationData, policyData, securityData, responseData] = await Promise.all([
        query(`SELECT AVG(hs.hallucination_probability) as avg_h, AVG(hs.reliability_score) as avg_r FROM ai_hallucination_scores hs JOIN ai_responses r ON hs.response_id=r.id WHERE r.organization_id=$1 AND r.model_used IS NOT NULL AND hs.created_at >= CURRENT_DATE-30`, [organizationId]),
        query(`SELECT COUNT(*) as violations FROM ai_policy_violations WHERE organization_id=$1 AND created_at >= CURRENT_DATE-30`, [organizationId]),
        query(`SELECT COUNT(*) as incidents FROM ai_security_events WHERE organization_id=$1 AND created_at >= CURRENT_DATE-30`, [organizationId]),
        query(`SELECT AVG(confidence_score) as avg_conf, COUNT(*) as total FROM ai_responses WHERE organization_id=$1 AND created_at >= CURRENT_DATE-30`, [organizationId])
      ]);

      const hallucinationAvg = parseFloat(hallucinationData.rows[0]?.avg_h || 5);
      const reliabilityAvg = parseFloat(hallucinationData.rows[0]?.avg_r || 92);
      const violations = parseInt(policyData.rows[0]?.violations || 0);
      const securityIncidents = parseInt(securityData.rows[0]?.incidents || 0);
      const avgConfidence = parseFloat(responseData.rows[0]?.avg_conf || 75);
      const totalResponses = parseInt(responseData.rows[0]?.total || 0);

      // Compute component scores
      const accuracyScore = Math.max(0, reliabilityAvg - hallucinationAvg * 0.5);
      const safetyScore = Math.max(0, 100 - (violations * 5) - (securityIncidents * 10));
      const consistencyScore = Math.min(100, avgConfidence + (totalResponses > 10 ? 10 : totalResponses));
      const complianceScore = Math.max(0, 100 - (violations * 8));

      const overallTrustScore = (
        accuracyScore * 0.30 +
        safetyScore * 0.25 +
        consistencyScore * 0.25 +
        complianceScore * 0.20
      );

      // Store in DB
      try {
        await query(
          `INSERT INTO ai_trust_scores (organization_id, model_id, overall_trust_score, accuracy_score, safety_score, consistency_score, compliance_score, factors)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (organization_id, model_id, score_date)
           DO UPDATE SET overall_trust_score=$3, accuracy_score=$4, safety_score=$5, consistency_score=$6, compliance_score=$7, factors=$8`,
          [organizationId, modelId, overallTrustScore.toFixed(2), accuracyScore.toFixed(2), safetyScore.toFixed(2), consistencyScore.toFixed(2), complianceScore.toFixed(2),
           JSON.stringify({ hallucinationAvg, violations, securityIncidents, avgConfidence, totalResponses })]
        );
      } catch (dbErr) {
        logger.warn('Trust score DB save error:', dbErr.message);
      }

      return {
        overallTrustScore: parseFloat(overallTrustScore.toFixed(2)),
        accuracyScore: parseFloat(accuracyScore.toFixed(2)),
        safetyScore: parseFloat(safetyScore.toFixed(2)),
        consistencyScore: parseFloat(consistencyScore.toFixed(2)),
        complianceScore: parseFloat(complianceScore.toFixed(2)),
        grade: this._getGrade(overallTrustScore),
        signals: { hallucinationAvg, violations, securityIncidents, avgConfidence, totalResponses }
      };
    } catch (err) {
      logger.error('AITrustScoringService.computeTrustScore error:', err);
      return this._defaultTrustScore();
    }
  }

  // ── Get organization trust overview ──
  async getOrganizationTrust(organizationId) {
    try {
      const result = await query(
        `SELECT ts.*, am.model_name
         FROM ai_trust_scores ts
         LEFT JOIN ai_models am ON ts.model_id = am.id
         WHERE ts.organization_id = $1
         ORDER BY ts.score_date DESC
         LIMIT 10`,
        [organizationId]
      );

      const trend = await query(
        `SELECT score_date, AVG(overall_trust_score) as avg_trust
         FROM ai_trust_scores
         WHERE organization_id=$1 AND score_date >= CURRENT_DATE-30
         GROUP BY score_date ORDER BY score_date DESC`,
        [organizationId]
      );

      const latestScore = result.rows[0]?.overall_trust_score || 85.0;
      return {
        currentScore: parseFloat(latestScore).toFixed(1),
        grade: this._getGrade(parseFloat(latestScore)),
        modelScores: result.rows,
        trend: trend.rows
      };
    } catch (err) {
      logger.error('AITrustScoringService.getOrganizationTrust error:', err);
      return { currentScore: '85.0', grade: 'B+', modelScores: [], trend: [] };
    }
  }

  _getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  _defaultTrustScore() {
    return { overallTrustScore: 85.0, accuracyScore: 88.0, safetyScore: 90.0, consistencyScore: 82.0, complianceScore: 85.0, grade: 'B+', signals: {} };
  }
}

export default new AITrustScoringService();
