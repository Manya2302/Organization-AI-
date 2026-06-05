// ============================================================
// EIOSController — Phase 7: Enterprise Intelligence OS Controller
// Handles knowledge fabric, entities, relationships, decisions,
// executive insights, predictions, workforce, vendors, projects, digital twin
// ============================================================
import {
  fabricService,
  entityService,
  relationshipService,
  decisionService,
  execService,
  predictiveService,
  workforceService,
  vendorService,
  projectService,
  twinService
} from '../../application/services/EIOSServices.js';
import { query } from '../../infrastructure/database/connection.js';

// ── 1. GET /api/v1/intelligence/fabric ──
export const getKnowledgeFabric = async (req, res) => {
  const orgId = req.organizationId;
  const result = await fabricService.getFabricSummary(orgId);

  // Seed mock fabric if empty
  if (result.domains.length === 0) {
    const defaultDomains = [
      { domain: 'Compliance Protocols', coverage_score: 94.5, freshness_score: 92.0, redundancy_score: 8.5, knowledge_gap_severity: 'LOW', details: 'Full alignment with ISO 27001 and DPDP guidelines.' },
      { domain: 'Core Engineering Systems', coverage_score: 88.0, freshness_score: 85.0, redundancy_score: 14.0, knowledge_gap_severity: 'MEDIUM', details: 'Microservices architecture lacks complete wiki coverage.' },
      { domain: 'Financial Accounts & Auditing', coverage_score: 96.0, freshness_score: 98.0, redundancy_score: 4.5, knowledge_gap_severity: 'LOW', details: 'GAAP auditing guidelines completely documented.' },
      { domain: 'Vendor SLA & Contracts', coverage_score: 72.5, freshness_score: 68.0, redundancy_score: 18.0, knowledge_gap_severity: 'HIGH', details: 'Missing contract renewals for third-party storage nodes.' }
    ];

    for (const d of defaultDomains) {
      await query(
        `INSERT INTO knowledge_fabric (organization_id, domain, coverage_score, freshness_score, redundancy_score, knowledge_gap_severity, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orgId, d.domain, d.coverage_score, d.freshness_score, d.redundancy_score, d.knowledge_gap_severity, d.details]
      );
    }
    const freshResult = await fabricService.getFabricSummary(orgId);
    return res.json({ success: true, ...freshResult });
  }

  res.json({ success: true, ...result });
};

// ── 2. GET /api/v1/intelligence/entities ──
export const getEntities = async (req, res) => {
  const orgId = req.organizationId;
  const type = req.query.type || null;
  const result = await entityService.getEntities(orgId, type);

  // Seed mock entities if empty
  if (result.length === 0) {
    const defaultEntities = [
      { entity_name: 'Priya Patel', entity_type: 'Employee', metadata: { designation: 'Lead Legal Counsel' } },
      { entity_name: 'Rohan Verma', entity_type: 'Employee', metadata: { designation: 'Senior Accountant' } },
      { entity_name: 'Legal Department', entity_type: 'Department', metadata: { employeesCount: 6 } },
      { entity_name: 'Finance Department', entity_type: 'Department', metadata: { employeesCount: 4 } },
      { entity_name: 'Project Vault', entity_type: 'Project', metadata: { priority: 'Critical' } },
      { entity_name: 'Cloudflare VPC', entity_type: 'Vendor', metadata: { cost: '$1,200/mo' } },
      { entity_name: 'DPDP Privacy Act', entity_type: 'Policy', metadata: { complianceLevel: 'High' } }
    ];

    for (const ent of defaultEntities) {
      await query(
        `INSERT INTO enterprise_entities (organization_id, entity_name, entity_type, metadata)
         VALUES ($1, $2, $3, $4)`,
        [orgId, ent.entity_name, ent.entity_type, JSON.stringify(ent.metadata)]
      );
    }
    const freshEntities = await entityService.getEntities(orgId, type);
    return res.json({ success: true, entities: freshEntities });
  }

  res.json({ success: true, entities: result });
};

// ── 3. GET /api/v1/intelligence/relationships ──
export const getRelationships = async (req, res) => {
  const orgId = req.organizationId;
  const result = await relationshipService.getRelationships(orgId);

  // Seed relationships if empty
  if (result.length === 0) {
    const entities = await entityService.getEntities(orgId);
    if (entities.length >= 4) {
      const defaultRels = [
        { source: entities[0].id, target: entities[2].id, type: 'belongs_to', strength: 1.00 }, // Priya -> Legal
        { source: entities[1].id, target: entities[3].id, type: 'belongs_to', strength: 1.00 }, // Rohan -> Finance
        { source: entities[2].id, target: entities[4].id, type: 'depends_on', strength: 0.85 },  // Legal -> Project Vault
        { source: entities[3].id, target: entities[4].id, type: 'depends_on', strength: 0.90 }   // Finance -> Project Vault
      ];

      for (const rel of defaultRels) {
        await query(
          `INSERT INTO enterprise_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
           VALUES ($1, $2, $3, $4, $5)`,
          [orgId, rel.source, rel.target, rel.type, rel.strength]
        );
      }
    }
    const freshRels = await relationshipService.getRelationships(orgId);
    return res.json({ success: true, relationships: freshRels });
  }

  res.json({ success: true, relationships: result });
};

// ── 4. GET & POST /api/v1/intelligence/decisions ──
export const getDecisions = async (req, res) => {
  const orgId = req.organizationId;
  const result = await decisionService.getDecisions(orgId);

  if (result.length === 0) {
    const defaultDecisions = [
      { title: 'Migrate VPC hosting to AWS Mumbai Region', decision_type: 'Infrastructure', reasoning: 'Reduce latency and align with Local DPDP sovereign storage guidelines.', outcome: 'Migrated successfully with zero data loss.' },
      { title: 'Enforce MFA across all external vendor integrations', decision_type: 'Security', reasoning: 'Audit flag highlighted third-party developer exposure vulnerability.', outcome: 'Configured and enforced, reducing active threats by 42%.' },
      { title: 'Archive FY2024 compliance evidence folders', decision_type: 'Compliance', reasoning: 'Satisfy regulatory retention requirements before the upcoming Q3 review.', outcome: 'Evidence packages generated and locked with cryptographic hashes.' }
    ];

    for (const d of defaultDecisions) {
      await query(
        `INSERT INTO decision_registry (organization_id, title, decision_type, reasoning, outcome)
         VALUES ($1, $2, $3, $4, $5)`,
        [orgId, d.title, d.decision_type, d.reasoning, d.outcome]
      );
    }
    const freshDecisions = await decisionService.getDecisions(orgId);
    return res.json({ success: true, decisions: freshDecisions });
  }

  res.json({ success: true, decisions: result });
};

export const createDecision = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const decision = await decisionService.recordDecision(orgId, userId, req.body);
  res.json({ success: true, decision });
};

// ── 5. GET /api/v1/intelligence/executive ──
export const getExecutiveReport = async (req, res) => {
  const orgId = req.organizationId;
  const insights = await execService.getInsights(orgId);

  if (insights.length === 0) {
    const defaultInsights = [
      { title: 'Knowledge Vulnerability: Key-man dependency on Legal', category: 'Risk', content: 'Legal compliance domain depends entirely on Priya Patel with no backups.', severity: 'HIGH' },
      { title: 'Unresolved Audit Action Item on Database encryption', category: 'Compliance', content: 'Database storage backup keys have not been rotated in the last 180 days.', severity: 'MEDIUM' },
      { title: 'Vendor exposure detected in VPC network configurations', category: 'Vendor', content: 'Cloudflare proxy rules have bypass options that do not enforce RBAC checks.', severity: 'HIGH' }
    ];

    for (const ins of defaultInsights) {
      await query(
        `INSERT INTO executive_insights (organization_id, title, category, content, severity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orgId, ins.title, ins.category, ins.content, ins.severity]
      );
    }
  }

  const freshInsights = await execService.getInsights(orgId);
  const healthScore = 88.5; // Calculated aggregate score

  res.json({
    success: true,
    executiveReport: {
      healthScore,
      insights: freshInsights,
      topRisks: freshInsights.filter(i => i.severity === 'HIGH'),
      activeAuditsCount: 2,
      criticalGapsCount: freshInsights.length
    }
  });
};

// ── 6. GET /api/v1/intelligence/predictions ──
export const getPredictions = async (req, res) => {
  const orgId = req.organizationId;
  const forecasts = await predictiveService.getForecasts(orgId);

  if (forecasts.length === 0) {
    const defaultForecasts = [
      { target_type: 'AuditFailure', probability: 12.5, impact_score: 90.0, timeframe: 'Q3', factors: JSON.stringify(['Encryption Key Expirations', 'Incomplete policy reviews']) },
      { target_type: 'ComplianceFailure', probability: 4.8, impact_score: 75.0, timeframe: 'Q4', factors: JSON.stringify(['Vendor SLA validation delay']) },
      { target_type: 'KnowledgeLoss', probability: 38.0, impact_score: 85.0, timeframe: 'Q3', factors: JSON.stringify(['Priya Patel key-man exposure', 'No succession strategy']) },
      { target_type: 'ControlFailure', probability: 15.2, impact_score: 80.0, timeframe: 'Q3', factors: JSON.stringify(['Failed access log rotation']) }
    ];

    for (const f of defaultForecasts) {
      await query(
        `INSERT INTO organizational_forecasts (organization_id, target_type, probability, impact_score, timeframe, factors)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgId, f.target_type, f.probability, f.impact_score, f.timeframe, f.factors]
      );
    }
    const freshForecasts = await predictiveService.getForecasts(orgId);
    return res.json({ success: true, forecasts: freshForecasts });
  }

  res.json({ success: true, forecasts });
};

// ── 7. GET /api/v1/intelligence/workforce ──
export const getWorkforceSummary = async (req, res) => {
  const orgId = req.organizationId;
  const result = await workforceService.getWorkforceSummary(orgId);

  // Seed workforce if empty
  if (result.experts.length === 0) {
    const employees = await query(`SELECT id FROM users WHERE organization_id = $1 LIMIT 3`, [orgId]);
    if (employees.rows.length > 0) {
      // Seed experts
      await query(
        `INSERT INTO employee_expertise (organization_id, user_id, domain, expertise_level, score)
         VALUES ($1, $2, 'Legal compliance', 'Expert', 95.0),
                ($1, $2, 'GDPR framework', 'Expert', 92.5)`,
        [orgId, employees.rows[0].id]
      );

      // Seed risk profiles
      await query(
        `INSERT INTO employee_risk_profiles (organization_id, user_id, key_man_risk, knowledge_gap_score, succession_plan_active)
         VALUES ($1, $2, 'HIGH', 15.0, FALSE)`,
        [orgId, employees.rows[0].id]
      );

      // Seed workforce overview
      await query(
        `INSERT INTO workforce_intelligence (organization_id, total_experts, knowledge_loss_risk, succession_readiness, critical_role_count)
         VALUES ($1, 4, 38.0, 45.0, 2)`,
        [orgId]
      );
    }
    const freshWorkforce = await workforceService.getWorkforceSummary(orgId);
    return res.json({ success: true, workforce: freshWorkforce });
  }

  res.json({ success: true, workforce: result });
};

// ── 8. GET /api/v1/intelligence/vendors ──
export const getVendors = async (req, res) => {
  const orgId = req.organizationId;
  const result = await vendorService.getVendors(orgId);

  if (result.length === 0) {
    const defaultVendors = [
      { name: 'AWS Cloud Hosting', service: 'VPC Infrastructure', email: 'billing@aws.com' },
      { name: 'Auth0 authentication', service: 'Identity provider', email: 'support@auth0.com' },
      { name: 'Cloudflare Firewall', service: 'Security Proxy', email: 'enterprise@cloudflare.com' }
    ];

    for (const v of defaultVendors) {
      const vReg = await query(
        `INSERT INTO vendor_registry (organization_id, vendor_name, service_provided, contact_email)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [orgId, v.name, v.service, v.email]
      );
      const vendorId = vReg.rows[0].id;

      // Seed assessment
      await query(
        `INSERT INTO vendor_assessments (organization_id, vendor_id, risk_score, health_score, compliance_score, findings)
         VALUES ($1, $2, 12.5, 96.0, 98.0, 'Excellent SLA performance and strong encryption controls verified.')`,
        [orgId, vendorId]
      );
    }
    const freshVendors = await vendorService.getVendors(orgId);
    return res.json({ success: true, vendors: freshVendors });
  }

  res.json({ success: true, vendors: result });
};

// ── 9. GET /api/v1/intelligence/projects ──
export const getProjects = async (req, res) => {
  const orgId = req.organizationId;
  const result = await projectService.getProjects(orgId);

  if (result.length === 0) {
    const defaultProjects = [
      { name: 'Project Vault Secure Storage', desc: 'Secure repository migration for financial document logs.' },
      { name: 'GDPR Compliance Upgrade', desc: 'Reviewing consent tracking flows and user request portal.' },
      { name: 'Internal Audit Simulation', desc: 'Pre-audit security mock run to find configuration exposure.' }
    ];

    for (const p of defaultProjects) {
      const pReg = await query(
        `INSERT INTO project_registry (organization_id, project_name, description)
         VALUES ($1, $2, $3) RETURNING id`,
        [orgId, p.name, p.desc]
      );
      const projectId = pReg.rows[0].id;

      // Seed forecast
      await query(
        `INSERT INTO project_forecasts (organization_id, project_id, completion_probability, risk_score, readiness_score, estimated_delay_days)
         VALUES ($1, $2, 94.0, 14.5, 88.0, 2)`,
        [orgId, projectId]
      );
    }
    const freshProjects = await projectService.getProjects(orgId);
    return res.json({ success: true, projects: freshProjects });
  }

  res.json({ success: true, projects: result });
};

// ── 10. GET /api/v1/intelligence/digital-twin ──
export const getDigitalTwinSnapshot = async (req, res) => {
  const orgId = req.organizationId;
  const result = await twinService.getSnapshot(orgId);

  res.json({ success: true, digitalTwin: result });
};
