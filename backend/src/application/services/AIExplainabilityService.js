import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AIExplainabilityService {
  static async createExplanation({
    organizationId,
    entityType,
    entityId,
    explanationText,
    confidenceScore,
    evidence = '',
    supportingData = {},
    generatedModel = 'qwen3:8b'
  }) {
    try {
      const res = await query(
        `INSERT INTO ai_explanations 
         (organization_id, entity_type, entity_id, explanation_text, confidence_score, evidence, supporting_data, generated_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [organizationId, entityType, entityId, explanationText, confidenceScore, evidence, JSON.stringify(supportingData), generatedModel]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('Error creating AI explanation record:', err);
    }
  }

  static async getExplanation(entityId) {
    const res = await query(
      `SELECT * FROM ai_explanations 
       WHERE entity_id = $1 
       ORDER BY generated_at DESC LIMIT 1`,
      [entityId]
    );
    return res.rows[0] || null;
  }

  static async listExplanations(organizationId) {
    const res = await query(
      `SELECT * FROM ai_explanations 
       WHERE organization_id = $1 
       ORDER BY generated_at DESC LIMIT 50`,
      [organizationId]
    );
    return res.rows;
  }
}
