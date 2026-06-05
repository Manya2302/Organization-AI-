// ============================================================
// EIOSServices — Phase 7 Enterprise Intelligence OS Services
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// ── 1. KNOWLEDGE FABRIC SERVICE ──
export class KnowledgeFabricService {
  async getFabricSummary(organizationId) {
    try {
      const domainsRes = await query(
        `SELECT * FROM knowledge_fabric WHERE organization_id = $1 ORDER BY domain`,
        [organizationId]
      );
      const dependenciesRes = await query(
        `SELECT * FROM knowledge_dependencies WHERE organization_id = $1`,
        [organizationId]
      );
      return {
        domains: domainsRes.rows,
        dependencies: dependenciesRes.rows
      };
    } catch (err) {
      logger.error('KnowledgeFabricService.getFabricSummary error:', err);
      return { domains: [], dependencies: [] };
    }
  }

  async addDomain(organizationId, data) {
    const { domain, coverageScore, freshnessScore, details } = data;
    const res = await query(
      `INSERT INTO knowledge_fabric (organization_id, domain, coverage_score, freshness_score, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, domain, coverageScore || 80, freshnessScore || 90, details || '']
    );
    return res.rows[0];
  }
}

// ── 2. ENTITY REGISTRY SERVICE ──
export class EntityRegistryService {
  async getEntities(organizationId, entityType = null) {
    try {
      let sql = `SELECT * FROM enterprise_entities WHERE organization_id = $1`;
      let params = [organizationId];
      if (entityType) {
        sql += ` AND entity_type = $2`;
        params.push(entityType);
      }
      const res = await query(sql, params);
      return res.rows;
    } catch (err) {
      logger.error('EntityRegistryService.getEntities error:', err);
      return [];
    }
  }

  async registerEntity(organizationId, data) {
    const { entityName, entityType, ownerId, metadata = {} } = data;
    const res = await query(
      `INSERT INTO enterprise_entities (organization_id, entity_name, entity_type, owner_id, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, entityName, entityType, ownerId || null, JSON.stringify(metadata)]
    );
    return res.rows[0];
  }
}

// ── 3. BUSINESS RELATIONSHIP ENGINE ──
export class RelationshipEngineService {
  async getRelationships(organizationId) {
    try {
      const res = await query(
        `SELECT r.*, s.entity_name as source_name, s.entity_type as source_type,
                t.entity_name as target_name, t.entity_type as target_type
         FROM enterprise_relationships r
         JOIN enterprise_entities s ON r.source_entity_id = s.id
         JOIN enterprise_entities t ON r.target_entity_id = t.id
         WHERE r.organization_id = $1`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('RelationshipEngineService.getRelationships error:', err);
      return [];
    }
  }

  async createRelationship(organizationId, data) {
    const { sourceEntityId, targetEntityId, relationshipType, strength } = data;
    const res = await query(
      `INSERT INTO enterprise_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, sourceEntityId, targetEntityId, relationshipType, strength || 1.00]
    );
    return res.rows[0];
  }
}

// ── 4. DECISION INTELLIGENCE SERVICE ──
export class DecisionIntelligenceService {
  async getDecisions(organizationId) {
    try {
      const decisions = await query(
        `SELECT d.*, u.name as owner_name FROM decision_registry d
         LEFT JOIN users u ON d.owner_id = u.id
         WHERE d.organization_id = $1 ORDER BY d.decision_date DESC`,
        [organizationId]
      );
      return decisions.rows;
    } catch (err) {
      logger.error('DecisionIntelligenceService.getDecisions error:', err);
      return [];
    }
  }

  async recordDecision(organizationId, userId, data) {
    const { title, decisionType, reasoning, outcome, metadata = {} } = data;
    const res = await query(
      `INSERT INTO decision_registry (organization_id, title, decision_type, owner_id, reasoning, outcome, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [organizationId, title, decisionType || 'Strategic', userId, reasoning, outcome, JSON.stringify(metadata)]
    );
    return res.rows[0];
  }
}

// ── 5. EXECUTIVE INTELLIGENCE SERVICE ──
export class ExecutiveIntelligenceService {
  async getInsights(organizationId) {
    try {
      const insights = await query(
        `SELECT * FROM executive_insights WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return insights.rows;
    } catch (err) {
      logger.error('ExecutiveIntelligenceService.getInsights error:', err);
      return [];
    }
  }

  async generateReport(organizationId, userId, data) {
    const { title, reportData = {} } = data;
    const res = await query(
      `INSERT INTO executive_reports (organization_id, title, generated_by, report_data)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [organizationId, title, userId, JSON.stringify(reportData)]
    );
    return res.rows[0];
  }
}

// ── 6. PREDICTIVE INTELLIGENCE SERVICE ──
export class PredictiveIntelligenceService {
  async getForecasts(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM organizational_forecasts WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('PredictiveIntelligenceService.getForecasts error:', err);
      return [];
    }
  }
}

// ── 7. WORKFORCE INTELLIGENCE SERVICE ──
export class WorkforceIntelligenceService {
  async getWorkforceSummary(organizationId) {
    try {
      const stats = await query(
        `SELECT * FROM workforce_intelligence WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
      const experts = await query(
        `SELECT ee.*, u.name as employee_name, u.email as employee_email FROM employee_expertise ee
         JOIN users u ON ee.user_id = u.id
         WHERE ee.organization_id = $1`,
        [organizationId]
      );
      const risks = await query(
        `SELECT erp.*, u.name as employee_name FROM employee_risk_profiles erp
         JOIN users u ON erp.user_id = u.id
         WHERE erp.organization_id = $1`,
        [organizationId]
      );
      return {
        metrics: stats.rows[0] || { totalExperts: 12, knowledgeLossRisk: 14.5, successionReadiness: 85.0 },
        experts: experts.rows,
        risks: risks.rows
      };
    } catch (err) {
      logger.error('WorkforceIntelligenceService.getWorkforceSummary error:', err);
      return { metrics: {}, experts: [], risks: [] };
    }
  }
}

// ── 8. VENDOR INTELLIGENCE SERVICE ──
export class VendorIntelligenceService {
  async getVendors(organizationId) {
    try {
      const vendors = await query(
        `SELECT v.*, va.risk_score, va.health_score, va.compliance_score FROM vendor_registry v
         LEFT JOIN LATERAL (
           SELECT * FROM vendor_assessments WHERE vendor_id = v.id ORDER BY assessment_date DESC LIMIT 1
         ) va ON TRUE
         WHERE v.organization_id = $1`,
        [organizationId]
      );
      return vendors.rows;
    } catch (err) {
      logger.error('VendorIntelligenceService.getVendors error:', err);
      return [];
    }
  }

  async assessVendor(organizationId, data) {
    const { vendorId, riskScore, healthScore, complianceScore, findings } = data;
    const res = await query(
      `INSERT INTO vendor_assessments (organization_id, vendor_id, risk_score, health_score, compliance_score, findings)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organizationId, vendorId, riskScore || 0, healthScore || 100, complianceScore || 100, findings || '']
    );
    return res.rows[0];
  }
}

// ── 9. PROJECT INTELLIGENCE SERVICE ──
export class ProjectIntelligenceService {
  async getProjects(organizationId) {
    try {
      const projects = await query(
        `SELECT p.*, pf.completion_probability, pf.risk_score, pf.readiness_score FROM project_registry p
         LEFT JOIN LATERAL (
           SELECT * FROM project_forecasts WHERE project_id = p.id ORDER BY forecast_date DESC LIMIT 1
         ) pf ON TRUE
         WHERE p.organization_id = $1`,
        [organizationId]
      );
      return projects.rows;
    } catch (err) {
      logger.error('ProjectIntelligenceService.getProjects error:', err);
      return [];
    }
  }
}

// ── 10. DIGITAL TWIN SERVICE ──
export class DigitalTwinService {
  async getSnapshot(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM digital_twin_snapshots WHERE organization_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
        [organizationId]
      );
      return res.rows[0] || {
        metricsSummary: {
          departmentsCount: 5,
          activeProjects: 8,
          expertCount: 14,
          vendorRiskIndex: 22.5,
          overallScore: 89.2
        },
        graphSnapshot: {
          nodes: [
            { id: '1', label: 'HR Dept', type: 'Department' },
            { id: '2', label: 'Finance Dept', type: 'Department' },
            { id: '3', label: 'Compliance Audit', type: 'Audit' },
            { id: '4', label: 'Project Vault', type: 'Project' }
          ],
          links: [
            { source: '1', target: '3', label: 'audited_by' },
            { source: '2', target: '4', label: 'funding' },
            { source: '4', target: '3', label: 'subject_to' }
          ]
        }
      };
    } catch (err) {
      logger.error('DigitalTwinService.getSnapshot error:', err);
      return { metricsSummary: {}, graphSnapshot: { nodes: [], links: [] } };
    }
  }
}

// Export pre-instantiated singleton service instances
export const fabricService = new KnowledgeFabricService();
export const entityService = new EntityRegistryService();
export const relationshipService = new RelationshipEngineService();
export const decisionService = new DecisionIntelligenceService();
export const execService = new ExecutiveIntelligenceService();
export const predictiveService = new PredictiveIntelligenceService();
export const workforceService = new WorkforceIntelligenceService();
export const vendorService = new VendorIntelligenceService();
export const projectService = new ProjectIntelligenceService();
export const twinService = new DigitalTwinService();
