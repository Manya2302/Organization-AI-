// ============================================================
// Service: Neo4jRelationshipService
// Manages graph relationships in Neo4j and local graph_edges staging
// ============================================================
import fetch from 'node-fetch';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import Neo4jNodeService from './Neo4jNodeService.js';

class Neo4jRelationshipService {
  constructor() {
    this.url = process.env.NEO4J_URI || 'http://localhost:7474';
    this.user = process.env.NEO4J_USER || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'password';
  }

  async runCypher(queryStr, params = {}) {
    return Neo4jNodeService.runCypher(queryStr, params);
  }

  async createRelationship(organizationId, sourceNode, targetNode, relationshipType, weight = 1.00, properties = {}) {
    // sourceNode: { type, id }
    // targetNode: { type, id }

    // 1. Resolve source and target graph_nodes DB IDs
    let sourceUuid = null;
    let targetUuid = null;
    try {
      const srcRes = await query(
        'SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, sourceNode.type, sourceNode.id]
      );
      sourceUuid = srcRes.rows[0]?.id;

      const tgtRes = await query(
        'SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, targetNode.type, targetNode.id]
      );
      targetUuid = tgtRes.rows[0]?.id;

      if (!sourceUuid || !targetUuid) {
        logger.warn(`Staging relationship skipped: source or target node not found in PG. Source: ${sourceNode.type}:${sourceNode.id}, Target: ${targetNode.type}:${targetNode.id}`);
        return { success: false, message: 'Source or target node not found.' };
      }

      // 2. Insert into graph_edges staging table
      const existing = await query(
        `SELECT id FROM graph_edges 
         WHERE organization_id = $1 AND from_node_id = $2 AND to_node_id = $3 AND edge_type = $4`,
        [organizationId, sourceUuid, targetUuid, relationshipType]
      );

      if (!existing.rows[0]) {
        await query(
          `INSERT INTO graph_edges (organization_id, from_node_id, to_node_id, edge_type, weight, properties)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [organizationId, sourceUuid, targetUuid, relationshipType, weight, JSON.stringify(properties)]
        );
      }
    } catch (dbErr) {
      logger.error('Failed to stage relationship in PG:', dbErr);
    }

    // 3. Sync to Neo4j
    let neo4jSynced = false;
    const cypher = `
      MATCH (src:${sourceNode.type} { nodeId: $srcId, organizationId: $organizationId })
      MATCH (tgt:${targetNode.type} { nodeId: $tgtId, organizationId: $organizationId })
      MERGE (src)-[r:${relationshipType}]->(tgt)
      ON CREATE SET r.weight = $weight, r.createdAt = datetime(), r += $properties
      ON MATCH SET r.weight = $weight, r.updatedAt = datetime(), r += $properties
      RETURN r
    `;

    const result = await this.runCypher(cypher, {
      srcId: sourceNode.id,
      tgtId: targetNode.id,
      organizationId,
      weight,
      properties
    });

    if (result) {
      neo4jSynced = true;
      if (sourceUuid && targetUuid) {
        await query(
          `UPDATE graph_edges SET neo4j_synced = TRUE 
           WHERE organization_id = $1 AND from_node_id = $2 AND to_node_id = $3 AND edge_type = $4`,
          [organizationId, sourceUuid, targetUuid, relationshipType]
        );
      }
    }

    return {
      success: true,
      neo4jSynced
    };
  }

  async deleteRelationship(organizationId, sourceNode, targetNode, relationshipType) {
    try {
      const srcRes = await query(
        'SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, sourceNode.type, sourceNode.id]
      );
      const tgtRes = await query(
        'SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, targetNode.type, targetNode.id]
      );

      if (srcRes.rows[0] && tgtRes.rows[0]) {
        await query(
          `DELETE FROM graph_edges 
           WHERE organization_id = $1 AND from_node_id = $2 AND to_node_id = $3 AND edge_type = $4`,
          [organizationId, srcRes.rows[0].id, tgtRes.rows[0].id, relationshipType]
        );
      }
    } catch (dbErr) {
      logger.error('Failed to delete edge in PG:', dbErr);
    }

    const cypher = `
      MATCH (src:${sourceNode.type} { nodeId: $srcId, organizationId: $organizationId })-[r:${relationshipType}]->(tgt:${targetNode.type} { nodeId: $tgtId, organizationId: $organizationId })
      DELETE r
    `;
    await this.runCypher(cypher, {
      srcId: sourceNode.id,
      tgtId: targetNode.id,
      organizationId
    });

    return { success: true };
  }
}

export default new Neo4jRelationshipService();
