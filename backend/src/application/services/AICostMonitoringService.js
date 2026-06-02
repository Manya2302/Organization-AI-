// ============================================================
// Service: AI Cost & Performance Monitoring Layer
// Tracks model execution latency, CPU/memory costs, and tokens
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import os from 'os';

/**
 * Log performance metrics for an AI model execution
 */
export const logAIPerformance = async ({
  organizationId, documentId, modelUsed, responseTimeMs, tokensGenerated = 0, tokensProcessed = 0
}) => {
  try {
    // Get simple system metrics
    const memoryUsage = process.memoryUsage().heapUsed; // Heap memory used by Node.js process
    
    // Estimate CPU usage based on load average (normalized by CPU count)
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpuUsage = Math.min(100.00, parseFloat(((loadAvg / cpus) * 100).toFixed(2)));

    const res = await query(
      `INSERT INTO ai_performance_metrics (
         organization_id, document_id, model_used, response_time, memory_usage, cpu_usage, tokens_generated, tokens_processed
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [organizationId, documentId || null, modelUsed, responseTimeMs, memoryUsage, cpuUsage, tokensGenerated, tokensProcessed]
    );

    return res.rows[0].id;
  } catch (err) {
    logger.error(`Error logging AI performance metric: ${err.message}`);
    return null;
  }
};

/**
 * Fetch total AI performance summary for compliance tracking
 */
export const getAIPerformanceSummary = async (organizationId) => {
  try {
    const res = await query(
      `SELECT 
         model_used,
         COUNT(*) as total_calls,
         AVG(response_time) as avg_response_time,
         AVG(cpu_usage) as avg_cpu_usage,
         AVG(memory_usage) as avg_memory_usage,
         SUM(tokens_generated) as total_tokens_generated,
         SUM(tokens_processed) as total_tokens_processed
       FROM ai_performance_metrics
       WHERE organization_id = $1
       GROUP BY model_used`,
      [organizationId]
    );
    return res.rows;
  } catch (err) {
    logger.error(`Error fetching AI performance summary: ${err.message}`);
    return [];
  }
};

export default { logAIPerformance, getAIPerformanceSummary };
