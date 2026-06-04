// ============================================================
// Phase 3: Knowledge Graph Service
// Builds and queries graph nodes/edges in PostgreSQL
// (Neo4j-compatible schema for future migration).
// ============================================================
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class KnowledgeGraphService {

  // ── Build full graph from existing data ───────────────────────
  async buildGraph(organizationId) {
    if (isLocalJSONDb) return { nodes: 0, edges: 0 };
    let nodesCreated = 0;
    let edgesCreated = 0;

    // 1. Add Employee nodes
    const users = await query(`
      SELECT id, name, department, designation, role FROM users
      WHERE organization_id = $1 AND role != 'SuperAdmin' AND is_active = TRUE
    `, [organizationId]);

    for (const u of users.rows) {
      await this._upsertNode(organizationId, 'Employee', u.id, u.name, {
        department: u.department, designation: u.designation, role: u.role
      });
      nodesCreated++;
    }

    // 2. Add Department nodes
    const depts = await query(`
      SELECT DISTINCT department FROM documents
      WHERE organization_id = $1 AND department IS NOT NULL AND is_deleted = FALSE
    `, [organizationId]);

    for (const d of depts.rows) {
      await this._upsertNode(organizationId, 'Department', d.department, d.department, {});
      nodesCreated++;
    }

    // 3. Add Document nodes
    const docs = await query(`
      SELECT id, name, category, department FROM documents
      WHERE organization_id = $1 AND is_deleted = FALSE
    `, [organizationId]);

    for (const d of docs.rows) {
      await this._upsertNode(organizationId, 'Document', d.id, d.name, {
        category: d.category, department: d.department
      });
      nodesCreated++;
    }

    // 4. Create CREATED_BY edges (Document → Employee)
    const ownerships = await query(`
      SELECT d.id as doc_id, d.name as doc_name, u.id as user_id, u.name as user_name
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      WHERE d.organization_id = $1 AND d.is_deleted = FALSE
    `, [organizationId]);

    for (const o of ownerships.rows) {
      const docNode = await this._findNode(organizationId, 'Document', o.doc_id);
      const userNode = await this._findNode(organizationId, 'Employee', o.user_id);
      if (docNode && userNode) {
        await this._upsertEdge(organizationId, docNode.id, userNode.id, 'CREATED_BY', 1.0);

        // Also create knowledge_relationships record
        await query(`
          INSERT INTO knowledge_relationships
            (organization_id, source_type, source_id, source_name, relationship_type, target_type, target_id, target_name)
          VALUES ($1, 'Document', $2, $3, 'CREATED_BY', 'Employee', $4, $5)
          ON CONFLICT DO NOTHING
        `, [organizationId, o.doc_id, o.doc_name, o.user_id, o.user_name]).catch(() => {});
        edgesCreated++;
      }
    }

    // 5. Create BELONGS_TO edges (Employee → Department)
    for (const u of users.rows) {
      if (!u.department) continue;
      const userNode = await this._findNode(organizationId, 'Employee', u.id);
      const deptNode = await this._findNode(organizationId, 'Department', u.department);
      if (userNode && deptNode) {
        await this._upsertEdge(organizationId, userNode.id, deptNode.id, 'BELONGS_TO', 1.0);

        await query(`
          INSERT INTO knowledge_relationships
            (organization_id, source_type, source_id, source_name, relationship_type, target_type, target_id, target_name)
          VALUES ($1, 'Employee', $2, $3, 'BELONGS_TO', 'Department', $4, $4)
          ON CONFLICT DO NOTHING
        `, [organizationId, u.id, u.name, u.department]).catch(() => {});
        edgesCreated++;
      }
    }

    // 6. Create IN_DEPARTMENT edges (Document → Department)
    for (const d of docs.rows) {
      if (!d.department) continue;
      const docNode = await this._findNode(organizationId, 'Document', d.id);
      const deptNode = await this._findNode(organizationId, 'Department', d.department);
      if (docNode && deptNode) {
        await this._upsertEdge(organizationId, docNode.id, deptNode.id, 'BELONGS_TO_DEPARTMENT', 1.0);
        edgesCreated++;
      }
    }

    logger.info(`📊 Graph built: ${nodesCreated} nodes, ${edgesCreated} edges for org ${organizationId}`);
    return { nodes: nodesCreated, edges: edgesCreated };
  }

  // ── Get graph stats ───────────────────────────────────────────
  async getGraphStats(organizationId) {
    if (isLocalJSONDb) return { nodes: [], edges: 0, nodesByType: [] };

    const [nodesRes, edgesRes, byTypeRes] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM graph_nodes WHERE organization_id = $1`, [organizationId]),
      query(`SELECT COUNT(*) as total FROM graph_edges ge
             JOIN graph_nodes gn ON gn.id = ge.from_node_id
             WHERE gn.organization_id = $1`, [organizationId]),
      query(`SELECT node_type, COUNT(*) as count FROM graph_nodes WHERE organization_id = $1 GROUP BY node_type ORDER BY count DESC`, [organizationId])
    ]);

    return {
      totalNodes: parseInt(nodesRes.rows[0]?.total || 0),
      totalEdges: parseInt(edgesRes.rows[0]?.total || 0),
      nodesByType: byTypeRes.rows
    };
  }

  // ── Get graph data for visualization ─────────────────────────
  async getGraphData(organizationId, limit = 100) {
    if (isLocalJSONDb) return { nodes: [], edges: [] };

    const [nodesRes, edgesRes, relsRes] = await Promise.all([
      query(`
        SELECT id, node_type, node_label, properties
        FROM graph_nodes WHERE organization_id = $1
        LIMIT $2
      `, [organizationId, limit]),

      query(`
        SELECT ge.id, ge.from_node_id, ge.to_node_id, ge.edge_type, ge.weight
        FROM graph_edges ge
        JOIN graph_nodes gn ON gn.id = ge.from_node_id
        WHERE gn.organization_id = $1
        LIMIT $2
      `, [organizationId, limit * 3]),

      query(`
        SELECT source_type, source_name, relationship_type, target_type, target_name, COUNT(*) as freq
        FROM knowledge_relationships WHERE organization_id = $1
        GROUP BY source_type, source_name, relationship_type, target_type, target_name
        ORDER BY freq DESC LIMIT 50
      `, [organizationId])
    ]);

    return {
      nodes: nodesRes.rows.map(n => ({
        id: n.id,
        type: n.node_type,
        label: n.node_label,
        ...n.properties
      })),
      edges: edgesRes.rows.map(e => ({
        id: e.id,
        source: e.from_node_id,
        target: e.to_node_id,
        type: e.edge_type,
        weight: e.weight
      })),
      relationships: relsRes.rows
    };
  }

  // ── Private helpers ───────────────────────────────────────────
  async _upsertNode(organizationId, nodeType, nodeId, nodeLabel, properties) {
    const result = await query(`
      INSERT INTO graph_nodes (organization_id, node_type, node_id, node_label, properties)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (organization_id, node_type, node_id) DO UPDATE
        SET node_label = $4, properties = $5, updated_at = NOW()
      RETURNING id
    `, [organizationId, nodeType, String(nodeId), nodeLabel, JSON.stringify(properties)]);
    return result.rows[0];
  }

  async _findNode(organizationId, nodeType, nodeId) {
    const result = await query(`
      SELECT id FROM graph_nodes WHERE organization_id = $1 AND node_type = $2 AND node_id = $3
    `, [organizationId, nodeType, String(nodeId)]);
    return result.rows[0] || null;
  }

  async _upsertEdge(organizationId, fromNodeId, toNodeId, edgeType, weight = 1.0) {
    await query(`
      INSERT INTO graph_edges (organization_id, from_node_id, to_node_id, edge_type, weight)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [organizationId, fromNodeId, toNodeId, edgeType, weight]).catch(() => {});
  }
}

export default new KnowledgeGraphService();
