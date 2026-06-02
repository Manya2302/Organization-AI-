// ============================================================
// Service: AI Search Evaluation & Quality Metrics Service
// Evaluates RAG and semantic/full-text search query quality
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

/**
 * Log search query metrics after execution
 */
export const logSearchMetrics = async ({
  organizationId, userId, searchQuery, resultsReturned, success = true
}) => {
  try {
    const res = await query(
      `INSERT INTO search_quality_metrics (organization_id, user_id, query, results_returned, success)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [organizationId, userId || null, searchQuery, resultsReturned, success]
    );
    return res.rows[0].id;
  } catch (err) {
    logger.error(`Error logging search metrics: ${err.message}`);
    return null;
  }
};

/**
 * Track user clicked document from search results
 */
export const trackSearchClick = async (metricId, documentId) => {
  try {
    await query(
      `UPDATE search_quality_metrics 
       SET clicked_document = $1 
       WHERE id = $2`,
      [documentId, metricId]
    );
    return true;
  } catch (err) {
    logger.error(`Error tracking search click: ${err.message}`);
    return false;
  }
};

/**
 * Record feedback rating for search results
 */
export const recordSearchFeedback = async (metricId, feedback) => {
  try {
    await query(
      `UPDATE search_quality_metrics 
       SET user_feedback = $1 
       WHERE id = $2`,
      [feedback, metricId]
    );
    return true;
  } catch (err) {
    logger.error(`Error recording search feedback: ${err.message}`);
    return false;
  }
};

/**
 * Get search performance stats
 */
export const getSearchQualityStats = async (organizationId) => {
  try {
    const [totals, feedback] = await Promise.all([
      query(
        `SELECT COUNT(*) as total_searches, 
                AVG(results_returned) as avg_results, 
                SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate 
         FROM search_quality_metrics 
         WHERE organization_id = $1`,
        [organizationId]
      ),
      query(
        `SELECT user_feedback, COUNT(*) as count 
         FROM search_quality_metrics 
         WHERE organization_id = $1 
         GROUP BY user_feedback`,
        [organizationId]
      )
    ]);

    return {
      totalSearches: parseInt(totals.rows[0]?.total_searches || 0),
      avgResults: parseFloat(totals.rows[0]?.avg_results || 0).toFixed(1),
      successRate: parseFloat(totals.rows[0]?.success_rate || 0).toFixed(1),
      feedbackBreakdown: feedback.rows
    };
  } catch (err) {
    logger.error(`Error getting search quality stats: ${err.message}`);
    return { totalSearches: 0, avgResults: 0, successRate: 0, feedbackBreakdown: [] };
  }
};

export default { logSearchMetrics, trackSearchClick, recordSearchFeedback, getSearchQualityStats };
