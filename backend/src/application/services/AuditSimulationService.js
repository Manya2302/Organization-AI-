// ============================================================
// Service: AuditSimulationService
// Runs mock audits and stores expected score, findings and risks.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditReadinessServiceV2 from './AuditReadinessServiceV2.js';
import auditFindingsService from './AuditFindingsService.js';
import controlPredictionService from './ControlPredictionService.js';

class AuditSimulationService {
  async runSimulation(organizationId, userId, options = {}) {
    try {
      const planId = options.planId || null;
      let readiness = { readinessScore: 0, controlReadiness: 0, evidenceReadiness: 0 };
      let findings = [];
      let predictions = [];

      if (planId) {
        readiness = await auditReadinessServiceV2.calculatePlanReadiness(planId, organizationId);
        findings = await auditFindingsService.generateFindings(planId, organizationId);
        predictions = await controlPredictionService.predictPlan(planId, organizationId);
      }

      const expectedRisks = predictions
        .filter((item) => Number(item.failure_probability) >= 60)
        .map((item) => ({
          controlCode: item.control_code,
          probability: Number(item.failure_probability),
          riskScore: Number(item.control_risk_score)
        }));

      const result = await query(
        `INSERT INTO audit_simulations
         (organization_id, audit_plan_id, framework, department, scope,
          expected_score, expected_findings, expected_risks, readiness_analysis, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          organizationId,
          planId,
          options.framework || null,
          options.department || null,
          options.scope || 'Organization',
          readiness.readinessScore,
          JSON.stringify(findings.map((item) => ({ title: item.title, severity: item.severity }))),
          JSON.stringify(expectedRisks),
          JSON.stringify(readiness),
          userId
        ]
      );
      return result.rows[0];
    } catch (err) {
      logger.error('Audit simulation failed:', err);
      throw err;
    }
  }
}

export default new AuditSimulationService();
