import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class DecisionMemoryService {
  /**
   * Record a new simulated executive proposal.
   */
  async recordDecisionSimulation(organizationId, data) {
    try {
      const res = await query(
        `INSERT INTO decision_simulations (
          organization_id, decision_proposal, simulated_by, cost_impact, risk_impact,
          compliance_impact, operational_impact, knowledge_impact, success_probability, recommendation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          organizationId,
          data.proposal,
          data.userId,
          data.costImpact || 0.00,
          data.riskImpact || 'Medium',
          data.complianceImpact || 'Stable',
          data.operationalImpact || 'Stable',
          data.knowledgeImpact || 'Minimal',
          data.successProbability || 100.00,
          data.recommendation || 'No advisory comments.'
        ]
      );
      return { success: true, decision: res.rows[0] };
    } catch (err) {
      logger.error('[DecisionMemoryService] recordDecisionSimulation error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Log the actual post-implementation outcome for a decision to calculate prediction error margins.
   */
  async recordActualOutcome(organizationId, decisionSimulationId, actualSuccessRate, notes) {
    try {
      // 1. Fetch simulation record to compute deviation
      const simRes = await query(
        `SELECT id, success_probability, decision_proposal FROM decision_simulations WHERE id = $1 AND organization_id = $2`,
        [decisionSimulationId, organizationId]
      );

      if (simRes.rows.length === 0) {
        throw new Error('Simulation decision record not found.');
      }

      const sim = simRes.rows[0];
      const forecastError = Math.abs(parseFloat(sim.success_probability) - parseFloat(actualSuccessRate));

      // 2. Insert into decision_outcomes
      const outcomeRes = await query(
        `INSERT INTO decision_outcomes (decision_id, success_rate, notes, audit_ready, updated_at)
         VALUES ($1, $2, $3, TRUE, NOW()) RETURNING *`,
        [decisionSimulationId, actualSuccessRate, `Forecast Error Deviation: ${forecastError.toFixed(2)}%. Notes: ${notes}`]
      );

      logger.info(`[DecisionMemoryService] Logged actual outcome for decision ${sim.decision_proposal}. Forecast error: ${forecastError.toFixed(2)}%`);

      return {
        success: true,
        outcome: outcomeRes.rows[0],
        forecastError
      };
    } catch (err) {
      logger.error('[DecisionMemoryService] recordActualOutcome error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieve strategic decision history with forecast deviation mapping.
   */
  async getDecisionHistory(organizationId) {
    try {
      const res = await query(
        `SELECT s.*, o.success_rate as actual_success_rate, o.notes as outcome_notes, o.updated_at as outcome_logged_at
         FROM decision_simulations s
         LEFT JOIN decision_outcomes o ON s.id = o.decision_id
         WHERE s.organization_id = $1
         ORDER BY s.created_at DESC`,
        [organizationId]
      );

      // Calculate historical accuracy rating (100 - average error)
      let totalError = 0;
      let ratedDecisionsCount = 0;

      res.rows.forEach(row => {
        if (row.actual_success_rate !== null) {
          totalError += Math.abs(parseFloat(row.success_probability) - parseFloat(row.actual_success_rate));
          ratedDecisionsCount++;
        }
      });

      const averageError = ratedDecisionsCount > 0 ? totalError / ratedDecisionsCount : 0.00;
      const modelAccuracyRating = Math.max(0, 100 - averageError);

      return {
        success: true,
        decisions: res.rows,
        modelAccuracyRating: parseFloat(modelAccuracyRating.toFixed(2)),
        decisionsTrackedCount: res.rows.length,
        outcomesLogCount: ratedDecisionsCount
      };
    } catch (err) {
      logger.error('[DecisionMemoryService] getDecisionHistory error:', err);
      return { success: false, error: err.message };
    }
  }
}

export const decisionMemoryService = new DecisionMemoryService();
