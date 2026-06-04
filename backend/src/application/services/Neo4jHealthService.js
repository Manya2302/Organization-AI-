// ============================================================
// Service: Neo4jHealthService
// Handles Neo4j connection checks and database health metrics
// ============================================================
import fetch from 'node-fetch';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class Neo4jHealthService {
  constructor() {
    this.url = process.env.NEO4J_URI || 'http://localhost:7474';
    this.user = process.env.NEO4J_USER || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'password';
  }

  async checkHealth(organizationId) {
    const startTime = Date.now();
    let connected = false;
    let details = 'No connection configured';

    try {
      const auth = Buffer.from(`${this.user}:${this.password}`).toString('base64');
      const response = await fetch(`${this.url}/db/data/`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 2000
      });

      if (response.ok) {
        connected = true;
        details = 'Neo4j connection active';
      } else {
        details = `Neo4j returned status: ${response.status}`;
      }
    } catch (err) {
      details = `Neo4j connection failed: ${err.message}`;
      logger.warn(`Neo4j Health Check: ${details}`);
    }

    // Retrieve database node/edge counts as a fallback or stats source
    let totalNodes = 0;
    let totalRels = 0;
    try {
      const nodeRes = await query('SELECT COUNT(*) as count FROM graph_nodes WHERE organization_id = $1', [organizationId]);
      totalNodes = parseInt(nodeRes.rows[0]?.count || '0');

      const edgeRes = await query('SELECT COUNT(*) as count FROM graph_edges WHERE organization_id = $1', [organizationId]);
      totalRels = parseInt(edgeRes.rows[0]?.count || '0');
    } catch (dbErr) {
      logger.error('Error fetching graph DB stats:', dbErr);
    }

    const graphHealthScore = connected ? 95.00 : 75.00;
    const syncReadinessRatio = totalNodes > 0 ? 100.00 : 0.00;

    // Record health metrics
    try {
      await query(
        `INSERT INTO graph_health_metrics 
         (organization_id, neo4j_connected, total_nodes, total_relationships, dangling_nodes_count, disconnected_subgraphs_count, sync_readiness_ratio, graph_health_score, last_checked_at)
         VALUES ($1, $2, $3, $4, 0, 0, $5, $6, NOW())`,
        [organizationId, connected, totalNodes, totalRels, syncReadinessRatio, graphHealthScore]
      );
    } catch (saveErr) {
      logger.error('Failed to log graph health metric:', saveErr);
    }

    return {
      connected,
      message: details,
      latencyMs: Date.now() - startTime,
      totalNodes,
      totalRelationships: totalRels,
      graphHealthScore,
      syncReadinessRatio
    };
  }

  async getLatestHealth(organizationId) {
    try {
      const res = await query(
        'SELECT * FROM graph_health_metrics WHERE organization_id = $1 ORDER BY last_checked_at DESC LIMIT 1',
        [organizationId]
      );
      if (res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {
      logger.error('Error loading latest graph health metrics:', err);
    }
    return {
      neo4j_connected: false,
      total_nodes: 0,
      total_relationships: 0,
      graph_health_score: 70.00,
      sync_readiness_ratio: 0.00
    };
  }
}

export default new Neo4jHealthService();
