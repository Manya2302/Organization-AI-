// ====================================================================
// AEOPController — Phase 8: Autonomous Enterprise Operations Platform
// Handles event-driven orchestrator, digital agents, command center
// ====================================================================
import {
  orchestratorService,
  aeopRecommendationService,
  actionCenterService,
  automationEngineService,
  decisionExecutionService,
  strategicPlanningService,
  operationalRiskService,
  cmdCenterService,
  outcomeAnalyticsService,
  digitalWorkforceService
} from '../../application/services/AEOPWorkflowService.js';
import { query } from '../../infrastructure/database/connection.js';

// ── 1. WORKFLOWS ──
export const getWorkflows = async (req, res) => {
  const orgId = req.organizationId;
  const result = await orchestratorService.getWorkflows(orgId);

  if (result.length === 0) {
    const defaultWfs = [
      { title: 'Annual GDPR Policy Review Lifecycle', type: 'Policy Review' },
      { title: 'ISO 27001 Cryptographic Key Rotation Audit', type: 'Audit Remediation' },
      { title: 'Third-party storage vendor security validation', type: 'Vendor Assessment' }
    ];
    for (const w of defaultWfs) {
      await orchestratorService.createWorkflow(orgId, {
        title: w.title,
        workflowType: w.type,
        steps: [
          { title: 'Draft Initial Evaluation Logs', stepType: 'Action', assignedRole: 'Compliance Officer' },
          { title: 'Verify Data Encryption Standards', stepType: 'Approval', assignedRole: 'Lead Security Auditor' },
          { title: 'Execute Key Renewal Operations', stepType: 'Decision', assignedRole: 'Executive Officer' }
        ]
      });
    }
    const freshWfs = await orchestratorService.getWorkflows(orgId);
    return res.json({ success: true, workflows: freshWfs });
  }
  res.json({ success: true, workflows: result });
};

export const createWorkflow = async (req, res) => {
  const orgId = req.organizationId;
  const wf = await orchestratorService.createWorkflow(orgId, req.body);
  res.json({ success: true, workflow: wf });
};

// ── 2. ACTIONS ──
export const getActions = async (req, res) => {
  const orgId = req.organizationId;
  const result = await actionCenterService.getActions(orgId);

  if (result.length === 0) {
    const defaultActions = [
      { title: 'Rotate AWS database KMS encryption key policies', source: 'Security Audit', priority: 'High' },
      { title: 'Sign renewed NDA agreements with Cloudflare integration team', source: 'Vendor Assessment', priority: 'Medium' },
      { title: 'Execute remediation tasks for the ISO 27001 evidence gap', source: 'Audit Remediation', priority: 'Critical' }
    ];
    for (const a of defaultActions) {
      const act = await actionCenterService.createAction(orgId, {
        title: a.title,
        sourceModule: a.source,
        priority: a.priority
      });
      // Add outcome evidence reference
      await query(
        `INSERT INTO action_outcomes (action_id, verified_by, risk_reduction_score, evidence_ref)
         VALUES ($1, $2, 18.5, 'hash_evidence_key_v1')`,
        [act.id, req.user.id]
      );
    }
    const freshActs = await actionCenterService.getActions(orgId);
    return res.json({ success: true, actions: freshActs });
  }
  res.json({ success: true, actions: result });
};

export const createAction = async (req, res) => {
  const orgId = req.organizationId;
  const act = await actionCenterService.createAction(orgId, req.body);
  res.json({ success: true, action: act });
};

// ── 3. RECOMMENDATIONS ──
export const getRecommendations = async (req, res) => {
  const orgId = req.organizationId;
  const result = await aeopRecommendationService.getRecommendations(orgId);

  if (result.length === 0) {
    const defaultRecs = [
      { source: 'Audit Intelligence', text: 'Define clear succession plans for legal roles to mitigate critical key-man risk.', priority: 'High', impact: 85.0 },
      { source: 'AI Governance', text: 'Establish automatic injection defense rules for frontend chat queries.', priority: 'High', impact: 92.0 },
      { source: 'Compliance Intelligence', text: 'Review database log rotation policies to comply with recent DPDP requirements.', priority: 'Medium', impact: 70.0 }
    ];
    for (const r of defaultRecs) {
      await query(
        `INSERT INTO recommendations (organization_id, trigger_source, recommendation_text, priority, status, estimated_impact)
         VALUES ($1, $2, $3, $4, 'Recommended', $5)`,
        [orgId, r.source, r.text, r.priority, r.impact]
      );
    }
    const freshRecs = await aeopRecommendationService.getRecommendations(orgId);
    return res.json({ success: true, recommendations: freshRecs });
  }
  res.json({ success: true, recommendations: result });
};

export const acceptRecommendation = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const { recommendationId } = req.body;
  const action = await aeopRecommendationService.acceptRecommendation(orgId, recommendationId, userId);
  res.json({ success: true, action });
};

// ── 4. AUTOMATION RULES ──
export const getAutomationRules = async (req, res) => {
  const orgId = req.organizationId;
  const rules = await automationEngineService.getRules(orgId);
  res.json({ success: true, rules });
};

// ── 5. DECISIONS ──
export const getDecisions = async (req, res) => {
  const orgId = req.organizationId;
  const result = await decisionExecutionService.getDecisions(orgId);

  if (result.length === 0) {
    const defaultDecisions = [
      { title: 'Enforce MFA across all external vendor integrations', approver: req.user.id },
      { title: 'Migrate VPC hosting configurations to AWS Mumbai region', approver: req.user.id }
    ];
    for (const d of defaultDecisions) {
      await decisionExecutionService.recordDecisionExecution(orgId, req.user.id, {
        decisionTitle: d.title,
        approverId: d.approver
      });
    }
    const freshDecs = await decisionExecutionService.getDecisions(orgId);
    return res.json({ success: true, decisions: freshDecs });
  }
  res.json({ success: true, decisions: result });
};

export const executeDecision = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const dec = await decisionExecutionService.recordDecisionExecution(orgId, userId, req.body);
  res.json({ success: true, decision: dec });
};

// ── 6. STRATEGIC PLANNING ──
export const getPlanningRoadmaps = async (req, res) => {
  const orgId = req.organizationId;
  const result = await strategicPlanningService.getPlans(orgId);

  if (result.length === 0) {
    const defaultPlans = [
      { name: 'FY2026 Audit Readiness Roadmap', type: 'Audit Roadmap' },
      { name: 'Q3 GDPR Compliance Plan', type: 'Compliance Plan' }
    ];
    for (const p of defaultPlans) {
      await strategicPlanningService.generateStrategicPlan(orgId, {
        planName: p.name,
        planType: p.type,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        milestones: [
          { title: 'Establish Consent Management Systems', targetDate: new Date() },
          { title: 'Draft Security Exemption Policies', targetDate: new Date() }
        ]
      });
    }
    const freshPlans = await strategicPlanningService.getPlans(orgId);
    return res.json({ success: true, plans: freshPlans });
  }
  res.json({ success: true, plans: result });
};

export const generatePlan = async (req, res) => {
  const orgId = req.organizationId;
  const plan = await strategicPlanningService.generateStrategicPlan(orgId, req.body);
  res.json({ success: true, plan });
};

// ── 7. OPERATIONAL RISKS ──
export const getOperationalRisks = async (req, res) => {
  const orgId = req.organizationId;
  const risks = await operationalRiskService.getRiskRegister(orgId);

  if (risks.length === 0) {
    const defaultRisks = [
      { title: 'Key-man exposure on Legal Counsel', category: 'Workforce', severity: 'High', score: 82.0 },
      { title: 'Unencrypted spreadsheets distribution', category: 'Security', severity: 'Critical', score: 94.0 },
      { title: 'AWS root account lacking active MFA policies', category: 'Compliance', severity: 'High', score: 88.0 }
    ];
    for (const r of defaultRisks) {
      await query(
        `INSERT INTO risk_register (organization_id, risk_title, category, severity, score)
         VALUES ($1, $2, $3, $4, $5)`,
        [orgId, r.title, r.category, r.severity, r.score]
      );
    }
    const freshRisks = await operationalRiskService.getRiskRegister(orgId);
    return res.json({ success: true, risks: freshRisks });
  }
  res.json({ success: true, risks });
};

// ── 8. COMMAND CENTER ──
export const getCommandCenter = async (req, res) => {
  const orgId = req.organizationId;
  const metrics = await cmdCenterService.getCommandCenterMetrics(orgId);
  res.json({ success: true, commandCenter: metrics });
};

// ── 9. OUTCOMES ──
export const getOutcomes = async (req, res) => {
  const orgId = req.organizationId;
  const analytics = await outcomeAnalyticsService.getOutcomeAnalytics(orgId);
  res.json({ success: true, outcomes: analytics });
};

// ── 10. DIGITAL WORKFORCE ──
export const getDigitalWorkforce = async (req, res) => {
  const orgId = req.organizationId;
  const result = await digitalWorkforceService.getAgents(orgId);

  if (result.length === 0) {
    const defaultAgents = [
      { name: 'Squire Compliance Agent', role: 'Compliance Agent', caps: ['Policy monitor', 'Consent check'] },
      { name: 'Sentinel Security Agent', role: 'Risk Agent', caps: ['Threat scanning', 'MFA validation'] },
      { name: 'scribe Document Agent', role: 'Knowledge Agent', caps: ['Lineage trace', 'Summary generation'] }
    ];
    for (const a of defaultAgents) {
      await query(
        `INSERT INTO digital_agents (organization_id, agent_name, role, capabilities)
         VALUES ($1, $2, $3, $4)`,
        [orgId, a.name, a.role, JSON.stringify(a.caps)]
      );
    }
    const freshAgents = await digitalWorkforceService.getAgents(orgId);
    return res.json({ success: true, agents: freshAgents });
  }
  res.json({ success: true, agents: result });
};

export const triggerAgentTask = async (req, res) => {
  const { agentId, taskTitle } = req.body;
  const task = await digitalWorkforceService.triggerAgentTask(agentId, taskTitle);
  res.json({ success: true, task });
};

// ── 11. ENTERPRISE NOTIFICATIONS ──
export const getNotifications = async (req, res) => {
  const orgId = req.organizationId;
  const result = await query(
    `SELECT * FROM enterprise_notifications WHERE organization_id = $1 ORDER BY created_at DESC`,
    [orgId]
  );

  if (result.rows.length === 0) {
    const defaultNotifs = [
      { title: 'Critical Risk Detected', message: 'AWS backup volume keys have expired rotation requirements.' },
      { title: 'Audit Failure Forecast Alert', message: 'Readiness score drops to 68% for the upcoming Q3 review.' },
      { title: 'Succession Plan Required', message: 'Priya Patel key-man node dependencies are currently unbacked.' }
    ];
    for (const n of defaultNotifs) {
      await query(
        `INSERT INTO enterprise_notifications (organization_id, title, message)
         VALUES ($1, $2, $3)`,
        [orgId, n.title, n.message]
      );
    }
    const freshNotifs = await query(
      `SELECT * FROM enterprise_notifications WHERE organization_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return res.json({ success: true, notifications: freshNotifs.rows });
  }
  res.json({ success: true, notifications: result.rows });
};
