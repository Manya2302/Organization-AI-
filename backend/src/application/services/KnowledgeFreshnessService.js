// ============================================================
// Service: KnowledgeFreshnessService
// Measures documentation decay, review history, and freshness scores
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class KnowledgeFreshnessService {
  async calculateFreshness(organizationId) {
    try {
      // Load all documents from database
      const docsRes = await query(
        'SELECT id, name, category, updated_at FROM documents WHERE organization_id = $1 AND is_deleted = FALSE',
        [organizationId]
      );

      const docs = docsRes.rows;
      if (docs.length === 0) {
        return { freshnessScore: 100.00, staleCount: 0, criticalCount: 0 };
      }

      let staleCount = 0;
      let criticalCount = 0;
      let agingCount = 0;
      let freshCount = 0;
      let totalScoreSum = 0;

      for (const doc of docs) {
        const lastUpdated = new Date(doc.updated_at);
        const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        let status = 'Fresh';
        let score = 100.00;

        if (ageDays > 365) {
          status = 'Critical';
          score = Math.max(10.00, 100.00 - (ageDays * 0.15));
          criticalCount++;
        } else if (ageDays > 180) {
          status = 'Stale';
          score = Math.max(40.00, 100.00 - (ageDays * 0.12));
          staleCount++;
        } else if (ageDays > 90) {
          status = 'Aging';
          score = Math.max(70.00, 100.00 - (ageDays * 0.10));
          agingCount++;
        } else {
          freshCount++;
        }

        totalScoreSum += score;

        // Upsert into knowledge_freshness table
        await query(
          `INSERT INTO knowledge_freshness (organization_id, entity_type, entity_id, entity_name, last_updated_at, freshness_status, freshness_score, review_frequency_days, last_reviewed_at)
           VALUES ($1, 'Document', $2, $3, $4, $5, $6, 180, NOW())
           ON CONFLICT (organization_id, entity_type, entity_id) 
           DO UPDATE SET freshness_status = EXCLUDED.freshness_status, freshness_score = EXCLUDED.freshness_score, last_updated_at = EXCLUDED.last_updated_at, updated_at = NOW()`,
          [organizationId, doc.id, doc.name, doc.updated_at, status, score]
        );
      }

      const overallScore = totalScoreSum / docs.length;

      // Update organizational memory health snapshot
      await query(
        `INSERT INTO organizational_memory_health (organization_id, knowledge_freshness_score, total_entities, total_stale_entities, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [organizationId, overallScore, docs.length, staleCount + criticalCount]
      );

      return {
        freshnessScore: parseFloat(overallScore.toFixed(2)),
        freshCount,
        agingCount,
        staleCount,
        criticalCount
      };
    } catch (err) {
      logger.error('Failed to calculate knowledge freshness details:', err);
      return { freshnessScore: 100.00, staleCount: 0, criticalCount: 0 };
    }
  }

  async getFreshnessOverview(organizationId) {
    try {
      const summary = await query(
        `SELECT freshness_status, COUNT(*) as count, AVG(freshness_score) as avg_score 
         FROM knowledge_freshness 
         WHERE organization_id = $1 
         GROUP BY freshness_status`,
        [organizationId]
      );

      const items = await query(
        'SELECT * FROM knowledge_freshness WHERE organization_id = $1 ORDER BY freshness_score ASC LIMIT 10',
        [organizationId]
      );

      return {
        success: true,
        summary: summary.rows,
        staleItems: items.rows
      };
    } catch (err) {
      logger.error('Failed to load freshness overview data:', err);
      return { success: false, summary: [], staleItems: [] };
    }
  }
}

export default new KnowledgeFreshnessService();
