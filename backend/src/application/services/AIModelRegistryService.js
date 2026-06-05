// ============================================================
// AIModelRegistryService — Phase 6: Model Registry
// Manages AI model inventory, versions, and performance
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AIModelRegistryService {

  // ── Get all models ──
  async getModels(organizationId) {
    try {
      const result = await query(
        `SELECT m.*, u.name as owner_name,
                COUNT(mv.id) as version_count,
                AVG(mm.trust_score) as avg_trust_score,
                AVG(mm.hallucination_rate) as avg_hallucination_rate
         FROM ai_models m
         LEFT JOIN users u ON m.owner_id = u.id
         LEFT JOIN ai_model_versions mv ON mv.model_id = m.id
         LEFT JOIN ai_model_metrics mm ON mm.model_id = m.id AND mm.metric_date >= CURRENT_DATE - 30
         WHERE m.organization_id = $1
         GROUP BY m.id, u.name
         ORDER BY m.created_at DESC`,
        [organizationId]
      );

      // Also return built-in system models
      const systemModels = this._getSystemModels();
      return { models: result.rows, systemModels };
    } catch (err) {
      logger.error('AIModelRegistryService.getModels error:', err);
      return { models: [], systemModels: this._getSystemModels() };
    }
  }

  // ── Register a new model ──
  async registerModel(organizationId, userId, modelData) {
    const { modelName, version, provider, deploymentDate, ownerId, riskLevel, description, capabilities } = modelData;
    const result = await query(
      `INSERT INTO ai_models (organization_id, model_name, version, provider, deployment_date, owner_id, risk_level, description, capabilities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [organizationId, modelName, version || '1.0.0', provider || 'Ollama', deploymentDate || new Date(), ownerId || userId, riskLevel || 'LOW', description || '', JSON.stringify(capabilities || [])]
    );
    return result.rows[0];
  }

  // ── Update model status ──
  async updateModelStatus(modelId, organizationId, status) {
    const result = await query(
      `UPDATE ai_models SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [status, modelId, organizationId]
    );
    return result.rows[0];
  }

  // ── Get model versions ──
  async getModelVersions(modelId, organizationId) {
    try {
      const result = await query(
        `SELECT mv.*, u.name as promoted_by_name
         FROM ai_model_versions mv
         LEFT JOIN users u ON mv.promoted_by = u.id
         WHERE mv.model_id = $1 AND mv.organization_id = $2
         ORDER BY mv.created_at DESC`,
        [modelId, organizationId]
      );
      return result.rows;
    } catch (err) {
      logger.error('AIModelRegistryService.getModelVersions error:', err);
      return [];
    }
  }

  // ── Record model metrics ──
  async recordMetrics(modelId, organizationId, metrics) {
    try {
      await query(
        `INSERT INTO ai_model_metrics (organization_id, model_id, total_requests, avg_latency_ms, avg_confidence, hallucination_rate, trust_score, error_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [organizationId, modelId, metrics.totalRequests || 0, metrics.avgLatencyMs || 0, metrics.avgConfidence || 0, metrics.hallucinationRate || 0, metrics.trustScore || 0, metrics.errorRate || 0]
      );
    } catch (err) {
      logger.warn('Failed to record model metrics:', err.message);
    }
  }

  // ── Get model performance over time ──
  async getModelPerformance(modelId, organizationId) {
    try {
      const result = await query(
        `SELECT metric_date, avg_latency_ms, trust_score, hallucination_rate, total_requests, error_rate
         FROM ai_model_metrics
         WHERE model_id = $1 AND organization_id = $2
         ORDER BY metric_date DESC
         LIMIT 30`,
        [modelId, organizationId]
      );
      return result.rows;
    } catch (err) {
      return [];
    }
  }

  _getSystemModels() {
    return [
      { id: 'sys-qwen3-8b', model_name: 'Qwen3 8B', version: '3.0', provider: 'Ollama/Alibaba', status: 'Active', risk_level: 'LOW', description: 'Primary reasoning model for document analysis and audit', is_system: true },
      { id: 'sys-deepseek-7b', model_name: 'DeepSeek 7B', version: '2.0', provider: 'Ollama/DeepSeek', status: 'Available', risk_level: 'LOW', description: 'Code and technical document analysis', is_system: true },
      { id: 'sys-gemma-7b', model_name: 'Gemma 7B', version: '2.0', provider: 'Ollama/Google', status: 'Available', risk_level: 'LOW', description: 'Lightweight fast inference model', is_system: true },
      { id: 'sys-llama-8b', model_name: 'Llama 3.1 8B', version: '3.1', provider: 'Ollama/Meta', status: 'Available', risk_level: 'LOW', description: 'General purpose conversational AI', is_system: true },
      { id: 'sys-mistral-7b', model_name: 'Mistral 7B', version: '0.3', provider: 'Ollama/Mistral AI', status: 'Available', risk_level: 'LOW', description: 'European enterprise AI model', is_system: true },
      { id: 'sys-nomic-embed', model_name: 'Nomic Embed Text', version: '1.5', provider: 'Ollama/Nomic', status: 'Active', risk_level: 'LOW', description: 'Embedding model for vector search', is_system: true }
    ];
  }
}

export default new AIModelRegistryService();
