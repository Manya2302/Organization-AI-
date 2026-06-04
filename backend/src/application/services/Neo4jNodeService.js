// ============================================================
// Service: Neo4jNodeService
// Manages graph nodes in Neo4j and local graph_nodes staging
// ============================================================
import fetch from 'node-fetch';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class Neo4jNodeService {
  constructor() {
    this.url = process.env.NEO4J_URI || 'http://localhost:7474';
    this.user = process.env.NEO4J_USER || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'password';
  }

  async runCypher(queryStr, params = {}) {
    try {
      const auth = Buffer.from(`${this.user}:${this.password}`).toString('base64');
      const response = await fetch(`${this.url}/db/neo4j/tx/commit`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          statements: [{ statement: queryStr, parameters: params }]
        }),
        timeout: 3000
      });

      if (!response.ok) {
        throw new Error(`Neo4j status code: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.errors && resData.errors.length > 0) {
        throw new Error(resData.errors[0].message);
      }
      return resData.results;
    } catch (err) {
      logger.warn(`Neo4j cypher execution fallback active. Cypher failed: ${err.message}`);
      return null;
    }
  }

  async createNode(organizationId, nodeType, nodeId, nodeLabel, properties = {}) {
    // 1. Stage in PostgreSQL graph_nodes table
    let pgNode = null;
    try {
      const existing = await query(
        'SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, nodeType, nodeId]
      );

      if (existing.rows[0]) {
        const updateRes = await query(
          `UPDATE graph_nodes 
           SET node_label = $1, properties = $2, updated_at = NOW() 
           WHERE id = $3 RETURNING *`,
          [nodeLabel, JSON.stringify(properties), existing.rows[0].id]
        );
        pgNode = updateRes.rows[0];
      } else {
        const insertRes = await query(
          `INSERT INTO graph_nodes (organization_id, node_type, node_id, node_label, properties)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [organizationId, nodeType, nodeId, nodeLabel, JSON.stringify(properties)]
        );
        pgNode = insertRes.rows[0];
      }
    } catch (dbErr) {
      logger.error('Failed to stage node in PostgreSQL:', dbErr);
    }

    // 2. Sync to Neo4j
    let neo4jSynced = false;
    let neo4jNodeId = null;

    const cypher = `
      MERGE (n:${nodeType} { nodeId: $nodeId, organizationId: $organizationId })
      ON CREATE SET n.label = $nodeLabel, n.createdAt = datetime(), n += $properties
      ON MATCH SET n.label = $nodeLabel, n.updatedAt = datetime(), n += $properties
      RETURN id(n) as neoId
    `;

    const result = await this.runCypher(cypher, {
      nodeId,
      organizationId,
      nodeLabel,
      properties
    });

    if (result && pgNode) {
      neo4jSynced = true;
      neo4jNodeId = String(result[0]?.data[0]?.row[0] || '');
      
      // Update PostgreSQL sync flag
      await query(
        'UPDATE graph_nodes SET neo4j_synced = TRUE, neo4j_node_id = $1 WHERE id = $2',
        [neo4jNodeId, pgNode.id]
      );
    }

    return {
      success: true,
      nodeId,
      nodeType,
      neo4jSynced,
      neo4jNodeId
    };
  }

  async updateNode(organizationId, nodeType, nodeId, properties = {}) {
    // 1. Update PG Staging
    try {
      await query(
        `UPDATE graph_nodes 
         SET properties = properties || $1::jsonb, updated_at = NOW(), neo4j_synced = FALSE 
         WHERE organization_id = $2 AND node_type = $3 AND node_id = $4`,
        [JSON.stringify(properties), organizationId, nodeType, nodeId]
      );
    } catch (dbErr) {
      logger.error('Failed to update node in PG:', dbErr);
    }

    // 2. Sync to Neo4j
    const cypher = `
      MATCH (n:${nodeType} { nodeId: $nodeId, organizationId: $organizationId })
      SET n += $properties, n.updatedAt = datetime()
      RETURN id(n) as neoId
    `;

    const result = await this.runCypher(cypher, {
      nodeId,
      organizationId,
      properties
    });

    if (result) {
      const neoId = String(result[0]?.data[0]?.row[0] || '');
      await query(
        'UPDATE graph_nodes SET neo4j_synced = TRUE, neo4j_node_id = $1 WHERE organization_id = $2 AND node_type = $3 AND node_id = $4',
        [neoId, organizationId, nodeType, nodeId]
      );
      return { success: true, neo4jNodeId: neoId };
    }

    return { success: true, message: 'Updated locally. Sync pending.' };
  }

  async deleteNode(organizationId, nodeType, nodeId) {
    // 1. Delete in PG
    try {
      await query(
        'DELETE FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3',
        [organizationId, nodeType, nodeId]
      );
    } catch (dbErr) {
      logger.error('Failed to delete node in PG:', dbErr);
    }

    // 2. Delete in Neo4j
    const cypher = `
      MATCH (n:${nodeType} { nodeId: $nodeId, organizationId: $organizationId })
      DETACH DELETE n
    `;
    await this.runCypher(cypher, { nodeId, organizationId });

    return { success: true };
  }
}

export default new Neo4jNodeService();
