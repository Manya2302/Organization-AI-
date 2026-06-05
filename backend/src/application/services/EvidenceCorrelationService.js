// ============================================================
// Service: EvidenceCorrelationService
// Builds evidence-control-policy-requirement-framework relationships.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class EvidenceCorrelationService {
  async correlatePlan(planId, organizationId) {
    try {
      const planRes = await query(
        `SELECT id, framework FROM audit_plans WHERE id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const plan = planRes.rows[0];
      if (!plan) return { relationships: [], graph: { nodes: [], edges: [] }, coverageMap: [] };

      const evidenceRes = await query(
        `SELECT * FROM audit_evidence_recommendations
         WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      const relationships = [];
      for (const item of evidenceRes.rows) {
        const strength = item.matching_document_id ? item.match_confidence || 80 : 0;
        const upsert = await query(
          `INSERT INTO audit_evidence_relationships
           (organization_id, audit_plan_id, evidence_recommendation_id, document_id,
            control_code, requirement_code, framework, relationship_strength, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (organization_id, audit_plan_id, evidence_recommendation_id)
           DO UPDATE SET document_id = EXCLUDED.document_id,
                         control_code = EXCLUDED.control_code,
                         relationship_strength = EXCLUDED.relationship_strength,
                         metadata = EXCLUDED.metadata,
                         updated_at = NOW()
           RETURNING *`,
          [
            organizationId,
            planId,
            item.id,
            item.matching_document_id,
            item.control_code,
            item.requirement_code,
            plan.framework,
            strength,
            JSON.stringify({ evidenceName: item.recommended_evidence_name, status: item.status })
          ]
        );
        relationships.push(upsert.rows[0]);
      }

      return {
        relationships,
        graph: this.toGraph(plan, evidenceRes.rows, relationships),
        coverageMap: this.toCoverageMap(evidenceRes.rows)
      };
    } catch (err) {
      logger.error('Evidence correlation failed:', err);
      return { relationships: [], graph: { nodes: [], edges: [] }, coverageMap: [] };
    }
  }

  toCoverageMap(items) {
    const grouped = new Map();
    for (const item of items) {
      if (!grouped.has(item.control_code)) grouped.set(item.control_code, { controlCode: item.control_code, total: 0, mapped: 0 });
      const entry = grouped.get(item.control_code);
      entry.total += 1;
      if (item.matching_document_id) entry.mapped += 1;
      entry.coverage = Math.round((entry.mapped / entry.total) * 100);
    }
    return Array.from(grouped.values());
  }

  toGraph(plan, evidenceItems, relationships) {
    const nodes = [{ id: `framework:${plan.framework}`, label: plan.framework, type: 'Framework' }];
    const edges = [];
    const controls = new Set();

    for (const item of evidenceItems) {
      const controlId = `control:${item.control_code}`;
      if (!controls.has(controlId)) {
        controls.add(controlId);
        nodes.push({ id: controlId, label: item.control_code, type: 'Control' });
        edges.push({ from: `framework:${plan.framework}`, to: controlId, label: 'contains' });
      }
      const evidenceId = `evidence:${item.id}`;
      nodes.push({ id: evidenceId, label: item.recommended_evidence_name, type: 'Evidence', status: item.status });
      edges.push({ from: controlId, to: evidenceId, label: 'requires' });
      if (item.matching_document_id) {
        const documentId = `document:${item.matching_document_id}`;
        nodes.push({ id: documentId, label: item.matching_document_name, type: 'Document' });
        edges.push({ from: evidenceId, to: documentId, label: 'mapped to' });
      }
    }

    return { nodes, edges, relationshipCount: relationships.length };
  }
}

export default new EvidenceCorrelationService();
