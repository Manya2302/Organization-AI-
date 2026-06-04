// ============================================================
// Service: ControlEffectivenessService
// Evaluates control effectiveness scores based on evidence & reviews
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class ControlEffectivenessService {
  async evaluateAll(organizationId) {
    try {
      const controlsRes = await query(
        `SELECT * FROM compliance_controls WHERE organization_id = $1`,
        [organizationId]
      );

      const results = [];
      for (const ctrl of controlsRes.rows) {
        const score = await this.evaluateControl(organizationId, ctrl.id);
        results.push({ control_id: ctrl.id, control_code: ctrl.control_code, ...score });
      }

      return { success: true, results };
    } catch (err) {
      logger.error('Failed to evaluate all controls:', err);
      return { success: false, results: [] };
    }
  }

  async evaluateControl(organizationId, controlId) {
    try {
      const evidenceCount = await query(
        `SELECT COUNT(*) as count FROM evidence_mappings WHERE control_id = $1 AND organization_id = $2`,
        [controlId, organizationId]
      );

      const reviewCount = await query(
        `SELECT COUNT(*) as count, AVG(effectiveness_rating) as avg_rating
         FROM control_reviews WHERE control_id = $1 AND organization_id = $2`,
        [controlId, organizationId]
      );

      const ctrl = await query(
        `SELECT status, risk_level FROM compliance_controls WHERE id = $1`,
        [controlId]
      );

      const evCount = parseInt(evidenceCount.rows[0]?.count || 0);
      const avgRating = parseFloat(reviewCount.rows[0]?.avg_rating || 0);
      const reviewsComplete = parseInt(reviewCount.rows[0]?.count || 0);
      const status = ctrl.rows[0]?.status || 'Not Started';

      const evidenceCoverage = Math.min(100, evCount * 25);
      const reviewCompletion = Math.min(100, reviewsComplete * 33.3);
      const implementationScore = status === 'Implemented' ? 100 : status === 'Partially Implemented' ? 60 : 20;
      const riskReduction = avgRating > 0 ? avgRating * 20 : 50;

      const effectivenessScore = parseFloat((
        evidenceCoverage * 0.35 + reviewCompletion * 0.25 +
        implementationScore * 0.25 + riskReduction * 0.15
      ).toFixed(2));

      await query(
        `INSERT INTO control_effectiveness
         (organization_id, control_id, effectiveness_score, evidence_coverage, review_completion, risk_reduction_score)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, controlId, effectivenessScore, evidenceCoverage, reviewCompletion, riskReduction]
      );

      await query(
        `UPDATE compliance_controls SET effectiveness = $1, updated_at = NOW() WHERE id = $2`,
        [effectivenessScore >= 80 ? 'Effective' : effectivenessScore >= 50 ? 'Partially Effective' : 'Ineffective', controlId]
      );

      return { effectivenessScore, evidenceCoverage, reviewCompletion, implementationScore, riskReduction };
    } catch (err) {
      logger.error('Failed to evaluate control:', err);
      return { effectivenessScore: 0, evidenceCoverage: 0, reviewCompletion: 0 };
    }
  }

  async getEffectivenessOverview(organizationId) {
    try {
      const res = await query(
        `SELECT ce.*, cc.control_code, cc.title, cc.status, cc.risk_level
         FROM control_effectiveness ce
         JOIN compliance_controls cc ON ce.control_id = cc.id
         WHERE ce.organization_id = $1
         ORDER BY ce.effectiveness_score ASC`,
        [organizationId]
      );
      return { success: true, effectiveness: res.rows };
    } catch (err) {
      logger.error('Failed to get effectiveness overview:', err);
      return { success: false, effectiveness: [] };
    }
  }
}

export default new ControlEffectivenessService();
