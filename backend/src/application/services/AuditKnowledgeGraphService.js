// ============================================================
// Service: AuditKnowledgeGraphService
// Builds Audit -> Framework -> Requirement -> Control -> Evidence -> Policy -> Owner -> Department graph.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import neo4jNodeService from './Neo4jNodeService.js';
import neo4jRelationshipService from './Neo4jRelationshipService.js';

class AuditKnowledgeGraphService {
  async buildAuditGraph(planId, organizationId) {
    try {
      const planRes = await query(
        `SELECT * FROM audit_plans WHERE id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const plan = planRes.rows[0];
      if (!plan) throw new Error('Audit plan not found');

      const nodes = [];
      const edges = [];
      const addNode = async (type, id, label, properties = {}) => {
        const node = await neo4jNodeService.createNode(organizationId, type, id, label, properties);
        nodes.push({ type, id, label, ...node });
      };
      const addEdge = async (source, target, type, properties = {}) => {
        const edge = await neo4jRelationshipService.createRelationship(organizationId, source, target, type, 1, properties);
        edges.push({ source, target, type, ...edge });
      };

      const auditNode = { type: 'Audit', id: plan.id };
      const frameworkNode = { type: 'Framework', id: `${plan.id}:${plan.framework}` };
      await addNode('Audit', plan.id, plan.name, { status: plan.status, readinessScore: plan.readiness_score });
      await addNode('Framework', frameworkNode.id, plan.framework, { framework: plan.framework });
      await addEdge(auditNode, frameworkNode, 'USES_FRAMEWORK');

      const controls = await query(
        `SELECT * FROM audit_control_analysis WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const evidence = await query(
        `SELECT * FROM audit_evidence_recommendations WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      for (const control of controls.rows) {
        const requirementNode = { type: 'Requirement', id: `${plan.id}:REQ:${control.control_code}` };
        const controlNode = { type: 'Control', id: `${plan.id}:CTRL:${control.control_code}` };
        await addNode('Requirement', requirementNode.id, `Requirement ${control.control_code}`, { framework: plan.framework });
        await addNode('Control', controlNode.id, control.control_code, {
          readinessScore: control.readiness_score,
          riskScore: control.risk_score,
          ownershipStatus: control.ownership_status
        });
        await addEdge(frameworkNode, requirementNode, 'HAS_REQUIREMENT');
        await addEdge(requirementNode, controlNode, 'SATISFIED_BY_CONTROL');
      }

      for (const item of evidence.rows) {
        const controlNode = { type: 'Control', id: `${plan.id}:CTRL:${item.control_code}` };
        const evidenceNode = { type: 'Evidence', id: `${plan.id}:EVIDENCE:${item.id}` };
        await addNode('Evidence', evidenceNode.id, item.recommended_evidence_name, {
          status: item.status,
          confidence: item.match_confidence,
          documentId: item.matching_document_id
        });
        await addEdge(controlNode, evidenceNode, 'SUPPORTED_BY_EVIDENCE');

        if (item.matching_document_id) {
          const doc = await query(
            `SELECT d.*, u.id AS owner_user_id, u.name AS owner_name, u.department AS owner_department
             FROM documents d
             LEFT JOIN users u ON u.id = d.owner_id AND u.organization_id = d.organization_id
             WHERE d.id = $1 AND d.organization_id = $2`,
            [item.matching_document_id, organizationId]
          );
          const document = doc.rows[0];
          if (document) {
            const policyNode = { type: 'Policy', id: `${plan.id}:POLICY:${document.id}` };
            await addNode('Policy', policyNode.id, document.name, {
              category: document.category,
              department: document.department
            });
            await addEdge(evidenceNode, policyNode, 'REFERENCES_POLICY');

            if (document.owner_user_id) {
              const ownerNode = { type: 'Owner', id: `${plan.id}:OWNER:${document.owner_user_id}` };
              await addNode('Owner', ownerNode.id, document.owner_name || 'Document Owner', {
                userId: document.owner_user_id
              });
              await addEdge(policyNode, ownerNode, 'OWNED_BY');

              const departmentName = document.owner_department || document.department || 'Unassigned';
              const departmentNode = { type: 'Department', id: `${plan.id}:DEPT:${departmentName}` };
              await addNode('Department', departmentNode.id, departmentName, {});
              await addEdge(ownerNode, departmentNode, 'MEMBER_OF_DEPARTMENT');
            }
          }
        }
      }

      return {
        success: true,
        nodesCreated: nodes.length,
        relationshipsCreated: edges.length,
        nodes,
        edges
      };
    } catch (err) {
      logger.error('Audit knowledge graph build failed:', err);
      return { success: false, nodesCreated: 0, relationshipsCreated: 0, error: err.message };
    }
  }
}

export default new AuditKnowledgeGraphService();
