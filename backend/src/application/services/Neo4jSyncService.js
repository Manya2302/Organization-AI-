// ============================================================
// Service: Neo4jSyncService
// Manages incremental synchronization of nodes/edges to Neo4j
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import Neo4jNodeService from './Neo4jNodeService.js';
import Neo4jRelationshipService from './Neo4jRelationshipService.js';

class Neo4jSyncService {
  async syncAll(organizationId) {
    const startTime = Date.now();
    let nodesSynced = 0;
    let edgesSynced = 0;
    let status = 'success';
    let errorMessage = null;

    try {
      // 1. Fetch unsynced nodes from PostgreSQL
      const unsyncedNodes = await query(
        'SELECT * FROM graph_nodes WHERE organization_id = $1 AND neo4j_synced = FALSE',
        [organizationId]
      );

      for (const node of unsyncedNodes.rows) {
        try {
          const res = await Neo4jNodeService.createNode(
            organizationId,
            node.node_type,
            node.node_id,
            node.node_label,
            node.properties || {}
          );
          if (res.neo4jSynced) {
            nodesSynced++;
          }
        } catch (nodeErr) {
          logger.warn(`Failed to sync node ID ${node.node_id} to Neo4j: ${nodeErr.message}`);
        }
      }

      // 2. Fetch unsynced relationships (edges) from PostgreSQL
      const unsyncedEdges = await query(
        `SELECT ge.*, 
                fn.node_type as from_type, fn.node_id as from_id,
                tn.node_type as to_type, tn.node_id as to_id
         FROM graph_edges ge
         JOIN graph_nodes fn ON ge.from_node_id = fn.id
         JOIN graph_nodes tn ON ge.to_node_id = tn.id
         WHERE ge.organization_id = $1 AND ge.neo4j_synced = FALSE`,
        [organizationId]
      );

      for (const edge of unsyncedEdges.rows) {
        try {
          const res = await Neo4jRelationshipService.createRelationship(
            organizationId,
            { type: edge.from_type, id: edge.from_id },
            { type: edge.to_type, id: edge.to_id },
            edge.edge_type,
            edge.weight,
            edge.properties || {}
          );
          if (res.neo4jSynced) {
            edgesSynced++;
          }
        } catch (edgeErr) {
          logger.warn(`Failed to sync edge ID ${edge.id} to Neo4j: ${edgeErr.message}`);
        }
      }

    } catch (err) {
      status = 'failed';
      errorMessage = err.message;
      logger.error('Neo4j synchronization job failed:', err);
    }

    const duration = Date.now() - startTime;

    // Log the sync job results
    try {
      await query(
        `INSERT INTO neo4j_sync_logs (organization_id, sync_status, nodes_synced, relationships_synced, error_message, duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, status, nodesSynced, edgesSynced, errorMessage, duration]
      );
    } catch (logErr) {
      logger.error('Failed to log Neo4j sync session details:', logErr);
    }

    return {
      success: status === 'success',
      nodesSynced,
      relationshipsSynced: edgesSynced,
      durationMs: duration,
      error: errorMessage
    };
  }

  async getLatestSyncLog(organizationId) {
    try {
      const res = await query(
        'SELECT * FROM neo4j_sync_logs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1',
        [organizationId]
      );
      return res.rows[0] || null;
    } catch (err) {
      logger.error('Failed to load latest sync logs:', err);
      return null;
    }
  }
}

export default new Neo4jSyncService();
