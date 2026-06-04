// ============================================================
// Service: MemoryEvolutionService
// Tracks growth, structure, and history of organization memory
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class MemoryEvolutionService {
  async logEvolutionEvent(organizationId, changeType, entityType, entityId, description, prevState = {}, newState = {}) {
    try {
      await query(
        `INSERT INTO memory_evolution (organization_id, change_type, entity_type, entity_id, description, previous_state, new_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [organizationId, changeType, entityType, entityId, description, JSON.stringify(prevState), JSON.stringify(newState)]
      );
      return { success: true };
    } catch (err) {
      logger.error('Failed to log memory evolution event:', err);
      return { success: false, message: err.message };
    }
  }

  async getEvolutionTimeline(organizationId, limit = 20) {
    try {
      const res = await query(
        'SELECT * FROM memory_evolution WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2',
        [organizationId, limit]
      );
      return { success: true, timeline: res.rows };
    } catch (err) {
      logger.error('Failed to get memory evolution timeline:', err);
      return { success: false, timeline: [] };
    }
  }

  async getGrowthStats(organizationId) {
    try {
      const res = await query(
        `SELECT date_trunc('day', created_at) as date, COUNT(*) as count, change_type 
         FROM memory_evolution 
         WHERE organization_id = $1
         GROUP BY date, change_type 
         ORDER BY date ASC`,
        [organizationId]
      );
      return { success: true, growthStats: res.rows };
    } catch (err) {
      logger.error('Failed to load memory growth stats:', err);
      return { success: false, growthStats: [] };
    }
  }
}

export default new MemoryEvolutionService();
