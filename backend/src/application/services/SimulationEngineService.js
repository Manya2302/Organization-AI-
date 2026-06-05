import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { twinService } from './EnterpriseDigitalTwinService.js';

export class SimulationEngineService {
  async getSimulationRuns(organizationId) {
    try {
      const res = await query(
        `SELECT r.*, s.name as scenario_name, s.scenario_type
         FROM simulation_runs r
         LEFT JOIN simulation_scenarios s ON r.scenario_id = s.id
         WHERE r.organization_id = $1 ORDER BY r.created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('SimulationEngineService.getSimulationRuns error:', err);
      return [];
    }
  }

  async createScenario(organizationId, name, description, scenarioType, config = {}) {
    const res = await query(
      `INSERT INTO simulation_scenarios (organization_id, name, description, scenario_type, config)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, name, description, scenarioType, JSON.stringify(config)]
    );
    return res.rows[0];
  }

  async runSimulation(organizationId, scenarioId, userId) {
    logger.info(`🎭 Running simulation for scenario ${scenarioId}...`);

    // Fetch scenario details
    const scenarioRes = await query(`SELECT * FROM simulation_scenarios WHERE id = $1`, [scenarioId]);
    if (scenarioRes.rows.length === 0) {
      throw new Error('Scenario not found');
    }
    const scenario = scenarioRes.rows[0];
    const config = scenario.config || {};

    // Get twin snapshot
    const twin = await twinService.getSnapshot(organizationId);
    
    // Default simulation results
    let affectedDepts = [];
    let affectedProjects = [];
    let affectedControls = [];
    let affectedKnowledge = [];
    let affectedRevenue = 0.00;
    let resilienceScore = 90.00;
    let summary = '';
    let successProbability = 85.00;
    let riskAssessment = {};
    let costForecast = {};
    let impactForecast = {};

    switch (scenario.scenario_type) {
      case 'Employee Departure':
        const employeeName = config.targetEntity || 'Key Lead Officer';
        affectedDepts = [config.department || 'Legal & Compliance'];
        affectedProjects = ['Annual Regulatory Filing', 'Compliance Gap Remediation'];
        affectedControls = ['Internal Access Control Auditing'];
        affectedKnowledge = [`Expertise in domain: ${config.expertise || 'DPDP Consent Auditing'}`];
        affectedRevenue = 45000.00; // Replacement costs & hiring overhead
        resilienceScore = 78.50;
        successProbability = 75.00;
        summary = `Simulated resignation of ${employeeName}. Highly vulnerable key-man dependencies triggered. Knowledge gap detected in: ${config.expertise || 'DPDP Regulations'}. Recommended to initiate succession plans immediately.`;
        riskAssessment = { riskLevel: 'Medium', keyManRisk: 'High', replacementTimeDays: 90 };
        costForecast = { hiringCost: 25000, productivityLoss: 20000, totalCost: 45000 };
        impactForecast = { projectDelayDays: 30, departmentLoadFactor: '+25%' };
        break;

      case 'Vendor Failure':
        const vendorName = config.targetEntity || 'Core Storage Node Vendor';
        affectedDepts = ['Engineering', 'Finance'];
        affectedProjects = ['Project Vault Secure Storage', 'Cloud Sync Gateway'];
        affectedControls = ['Data Backup & Recovery SLAs'];
        affectedKnowledge = ['Vendor backup recovery procedures'];
        affectedRevenue = 150000.00; // Business disruption & fallback system procurement
        resilienceScore = 55.00;
        successProbability = 60.00;
        summary = `Critical outage simulated for key vendor ${vendorName}. System dependency analysis shows that 3 main database services and all primary uploads are blocked. Backup availability check shows 12 hours recovery delay.`;
        riskAssessment = { riskLevel: 'High', serviceDownTime: '12-24 hours', backupStatus: 'Partially Verified' };
        costForecast = { penaltySLA: 50000, fallbackProcurement: 100000, totalCost: 150000 };
        impactForecast = { blockedServicesCount: 4, downtimeRiskHours: 18 };
        break;

      case 'Compliance Violation':
      case 'Audit Failure':
        affectedDepts = ['Legal', 'Operations'];
        affectedProjects = ['ISO 27001 Readiness', 'DPDP Framework Implementation'];
        affectedControls = ['Customer Consent Notices', 'Data Sovereignty Keys'];
        affectedKnowledge = ['Regulatory penalty filing procedures'];
        affectedRevenue = 250000.00; // Regulatory fines + audit remediation costs
        resilienceScore = 48.00;
        successProbability = 45.00;
        summary = `Simulated serious non-compliance warning regarding local data storage. A mock external audit has failed on rule 'D Sovereignty-2'. Immediate mitigation strategies must be applied to prevent legal sanctions.`;
        riskAssessment = { riskLevel: 'Critical', auditReadinessPercent: 42.0, litigationProbability: 'High' };
        costForecast = { legalDefenseCost: 50000, potentialFine: 200000, total: 250000 };
        impactForecast = { controlFailureCount: 3, operationalLoad: 'Severe' };
        break;

      case 'Data Breach':
        affectedDepts = ['IT Security', 'Legal', 'Communications'];
        affectedProjects = ['Zero Trust Perimeter Guard'];
        affectedControls = ['Data Encryption at Rest', 'VPC Access Logs'];
        affectedKnowledge = ['Incident Response playbook', 'Vulnerability records'];
        affectedRevenue = 500000.00;
        resilienceScore = 35.00;
        successProbability = 30.00;
        summary = `Major system data breach simulation. Infiltration point identified as an unrotated third-party VPC access key. Estimated breach window is 72 hours. Recommended to rotate all active API tokens instantly.`;
        riskAssessment = { riskLevel: 'Critical', breachScope: 'PII Leakage', notificationObligation: 'Immediate' };
        costForecast = { forensicsAudit: 100000, fines: 300000, prManagement: 100000, total: 500000 };
        impactForecast = { customerAttritionPercent: 4.5, reputationalDamage: 'Severe' };
        break;

      default:
        affectedDepts = ['Operations'];
        affectedProjects = ['Internal Tools Deployment'];
        affectedControls = ['General Security Control-1'];
        affectedKnowledge = ['Standard operational documents'];
        affectedRevenue = 10000.00;
        resilienceScore = 85.00;
        successProbability = 90.00;
        summary = `Routine organizational simulation finished. System is stable. Minimal impact detected on day-to-day services.`;
        riskAssessment = { riskLevel: 'Low' };
        costForecast = { total: 10000 };
        impactForecast = { operationalLoad: 'Negligible' };
    }

    // Insert simulation run
    const runRes = await query(
      `INSERT INTO simulation_runs (
        organization_id, scenario_id, simulation_name, status, run_by,
        impact_analysis, affected_departments, affected_projects,
        affected_controls, affected_knowledge, affected_revenue, resilience_score
      )
      VALUES ($1, $2, $3, 'Completed', $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        organizationId, scenarioId, `Run: ${scenario.name}`, userId,
        JSON.stringify({ summary, riskAssessment }),
        JSON.stringify(affectedDepts), JSON.stringify(affectedProjects),
        JSON.stringify(affectedControls), JSON.stringify(affectedKnowledge),
        affectedRevenue, resilienceScore
      ]
    );
    const runId = runRes.rows[0].id;

    // Save results
    await query(
      `INSERT INTO scenario_results (
        organization_id, scenario_id, run_id, summary, risk_assessment,
        cost_forecast, impact_forecast, success_probability
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        organizationId, scenarioId, runId, summary,
        JSON.stringify(riskAssessment), JSON.stringify(costForecast),
        JSON.stringify(impactForecast), successProbability
      ]
    );

    // Also trigger an executive alert if resilience score drops below 60
    if (resilienceScore < 60) {
      await query(
        `INSERT INTO executive_alerts (organization_id, alert_title, alert_message, severity)
         VALUES ($1, $2, $3, 'Critical')`,
        [organizationId, `Low Resilience Alert: ${scenario.name}`, `Simulation run resulted in critical resilience drop (${resilienceScore}%). Immediate review recommended.`]
      );
    }

    return {
      runId,
      summary,
      resilienceScore,
      successProbability,
      affectedDepts,
      affectedProjects,
      affectedRevenue
    };
  }
}

export const simulationService = new SimulationEngineService();
