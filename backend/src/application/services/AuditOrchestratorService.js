// ============================================================
// Service: AuditOrchestratorService
// Executes the complete multi-step autonomous audit workflow.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditScopeService from './AuditScopeService.js';
import evidenceIntelligenceService from './EvidenceIntelligenceService.js';
import evidenceQualityService from './EvidenceQualityService.js';
import auditFindingsService from './AuditFindingsService.js';
import remediationPlanningService from './RemediationPlanningService.js';
import executiveAuditReportingService from './ExecutiveAuditReportingService.js';
import oneClickAuditorPackageService from './OneClickAuditorPackageService.js';
import controlPredictionService from './ControlPredictionService.js';
import auditTimelineService from './AuditTimelineService.js';
import auditMaturityService from './AuditMaturityService.js';
import auditKnowledgeGraphService from './AuditKnowledgeGraphService.js';

class AuditOrchestratorService {
  async executeAuditRequest(organizationId, userId, planId, request = {}) {
    const run = await this.createRun(organizationId, userId, planId, request);
    const context = { runId: run.id, planId, organizationId, userId };
    const steps = [];

    try {
      steps.push(await this.runStep(context, 'Audit Request', async () => ({
        accepted: true,
        request
      })));

      steps.push(await this.runStep(context, 'Scope Detection', async () => {
        const scopeData = {
          scope_type: request.scope || 'Organization',
          value: request.department || 'All',
          affected_controls: [],
          affected_evidence: []
        };
        return auditScopeService.updateScope(planId, organizationId, scopeData);
      }));

      steps.push(await this.runStep(context, 'Evidence Collection', async () =>
        evidenceIntelligenceService.analyzePlan(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Evidence Validation', async () =>
        evidenceQualityService.analyzePlan(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Finding Generation', async () =>
        auditFindingsService.generateFindings(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Remediation Planning', async () =>
        remediationPlanningService.buildPlan(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Risk Forecast', async () =>
        controlPredictionService.predictPlan(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Timeline Generation', async () =>
        auditTimelineService.generateTimeline(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Maturity Scoring', async () =>
        auditMaturityService.calculateMaturity(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Knowledge Graph Sync', async () =>
        auditKnowledgeGraphService.buildAuditGraph(planId, organizationId)
      ));

      steps.push(await this.runStep(context, 'Executive Report', async () =>
        executiveAuditReportingService.generateReport(organizationId, userId, planId, 'Orchestrated Executive Audit Report')
      ));

      steps.push(await this.runStep(context, 'Auditor Package', async () =>
        oneClickAuditorPackageService.generate(planId, organizationId, userId, request.packageOptions || {})
      ));

      const result = {
        workflow: 'Audit Request -> Scope Detection -> Evidence Collection -> Evidence Validation -> Finding Generation -> Remediation Planning -> Executive Report -> Auditor Package',
        completedSteps: steps.length,
        steps
      };

      await query(
        `UPDATE audit_orchestrator_runs
         SET status = 'Completed', current_step = 'Completed', steps = $1,
             result_payload = $2, completed_at = NOW(), updated_at = NOW()
         WHERE id = $3 AND organization_id = $4`,
        [JSON.stringify(steps), JSON.stringify(result), run.id, organizationId]
      );

      return { success: true, runId: run.id, ...result };
    } catch (err) {
      logger.error('Audit orchestration failed:', err);
      await query(
        `UPDATE audit_orchestrator_runs
         SET status = 'Failed', result_payload = $1, steps = $2, completed_at = NOW(), updated_at = NOW()
         WHERE id = $3 AND organization_id = $4`,
        [JSON.stringify({ error: err.message }), JSON.stringify(steps), run.id, organizationId]
      );
      throw err;
    }
  }

  async createRun(organizationId, userId, planId, request) {
    const res = await query(
      `INSERT INTO audit_orchestrator_runs
       (organization_id, audit_plan_id, requested_by, current_step, result_payload)
       VALUES ($1, $2, $3, 'Audit Request', $4)
       RETURNING *`,
      [organizationId, planId, userId, JSON.stringify({ request })]
    );
    return res.rows[0];
  }

  async runStep(context, name, handler) {
    await query(
      `UPDATE audit_orchestrator_runs
       SET current_step = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3`,
      [name, context.runId, context.organizationId]
    );
    const startedAt = new Date();
    const output = await handler();
    return {
      name,
      status: 'Completed',
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      summary: this.summarizeOutput(output),
      output
    };
  }

  summarizeOutput(output) {
    if (Array.isArray(output)) return { count: output.length };
    if (output?.package) return { packageId: output.package.id, zip: output.zip };
    if (output?.report_type) return { reportId: output.id, readinessScore: output.readiness_score };
    if (output?.maturity_level) return { maturityLevel: output.maturity_level, maturityScore: output.maturity_score };
    if (output?.nodesCreated !== undefined) return { nodesCreated: output.nodesCreated, relationshipsCreated: output.relationshipsCreated };
    return { status: 'Completed' };
  }
}

export default new AuditOrchestratorService();
