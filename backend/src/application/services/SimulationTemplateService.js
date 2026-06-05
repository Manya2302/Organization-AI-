import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export const SIMULATION_TEMPLATES = {
  VENDOR_FAILURE: {
    name: 'Vendor Failure Outage',
    scenario_type: 'Vendor Failure',
    description: 'Simulates the total insolvency or failure of the primary cloud storage/hosting provider.',
    impact: {
      affected_revenue: 150000.00,
      resilience_penalty: 35,
      vendor_penalty: 50,
      business_continuity_penalty: 40,
      departments: ['Engineering', 'DevOps', 'Security'],
      projects: ['Core Cloud migration', 'Data Vault v2'],
      controls: ['Vendor Access Control', 'SLA Monitoring Rules'],
      summary: 'Critical vendor hosting failures resulted in system downtime and API interruptions. Redundant storage servers were not instantiated in 3 subregions.'
    }
  },
  MASS_EMPLOYEE_EXIT: {
    name: 'Mass Employee Resignation Event',
    scenario_type: 'Employee Departure',
    description: 'Simulates the loss of 5 key developers and DevOps architects within 48 hours.',
    impact: {
      affected_revenue: 75000.00,
      resilience_penalty: 25,
      workforce_penalty: 45,
      knowledge_penalty: 40,
      departments: ['Engineering', 'Product'],
      projects: ['Core Vault', 'EIOS System Integration'],
      controls: ['Key-Man Redundancy', 'Access Control Offboarding'],
      summary: 'Departure of critical system administrators caused knowledge loss and postponed development pipelines. Backup admin credentials were not rotated.'
    }
  },
  SECURITY_BREACH: {
    name: 'Critical Security Breach Simulation',
    scenario_type: 'Security Breach',
    description: 'Simulates a credential leak on an admin-level database hosting service.',
    impact: {
      affected_revenue: 500000.00,
      resilience_penalty: 55,
      ai_penalty: 30,
      compliance_penalty: 45,
      departments: ['Security', 'Legal', 'IT Support'],
      projects: ['Encryption Key Rotator', 'Admin Console'],
      controls: ['Multi-Factor Authentication', 'Audit Logs Integrity'],
      summary: 'Compromised admin credentials leaked key-store vaults. System security controls detected anomalous downloads but failed to auto-quarantine.'
    }
  },
  COMPLIANCE_FAILURE: {
    name: 'DPDP Compliance Assessment Deficit',
    scenario_type: 'Compliance Violation',
    description: 'Simulates a regulatory audit discovering non-consensual personal data storage.',
    impact: {
      affected_revenue: 250000.00,
      resilience_penalty: 30,
      compliance_penalty: 60,
      departments: ['Legal', 'Customer Success'],
      projects: ['Consent Manager Dashboard'],
      controls: ['Data Minimization Control', 'Privacy Policies Audit'],
      summary: 'Non-compliant data storage identified during validation. Fines may be assessed if consent records are not remediated within 30 days.'
    }
  },
  AUDIT_FAILURE: {
    name: 'Annual Security Audit Non-Compliance',
    scenario_type: 'Audit Failure',
    description: 'Simulates a failed ISO 27001 assessment regarding missing access logs.',
    impact: {
      affected_revenue: 120000.00,
      resilience_penalty: 20,
      compliance_penalty: 40,
      departments: ['Operations', 'Security'],
      projects: ['Audit Readiness Engine'],
      controls: ['Daily Audit Log Archival', 'System Access Reviews'],
      summary: 'Assessors flagged missing access review logs for vendor service accounts. Operational stability rating downgraded due to documentation lapse.'
    }
  },
  PROJECT_DELAY: {
    name: 'Critical Infrastructure Delivery Blockage',
    scenario_type: 'Project Delay',
    description: 'Simulates a 3-month launch delay of the core organization memory graph dashboard.',
    impact: {
      affected_revenue: 45000.00,
      resilience_penalty: 15,
      workforce_penalty: 20,
      departments: ['Engineering', 'Strategy'],
      projects: ['Memory Graph Explorer'],
      controls: ['Project Milestone Tracking'],
      summary: 'Blocked deliverables for dependency-graph components deferred client onboarding lifecycles.'
    }
  },
  DATA_LEAK: {
    name: 'Unauthorized PDF Document Exfiltration',
    scenario_type: 'Data Leak',
    description: 'Simulates employee copying confidential payroll sheets to an external environment.',
    impact: {
      affected_revenue: 180000.00,
      resilience_penalty: 35,
      compliance_penalty: 40,
      departments: ['Finance', 'HR'],
      projects: ['Secure Vault Access'],
      controls: ['Data Loss Prevention (DLP)', 'File Transfer Rules'],
      summary: 'Confidential corporate files were transferred to an unverified storage device. Internal controls triggered alerts post-facto.'
    }
  },
  REGULATORY_CHANGE: {
    name: 'New AI Governance Legislation Adoption',
    scenario_type: 'Policy Change',
    description: 'Simulates sudden legislative mandates requiring model weight audit logs.',
    impact: {
      affected_revenue: 60000.00,
      resilience_penalty: 10,
      compliance_penalty: 30,
      departments: ['AI Safety', 'Legal'],
      projects: ['Model Registry Compliance'],
      controls: ['Model Evaluation Log Verification'],
      summary: 'Sudden policy shifts required immediate updates to models. Compliance status marked yellow during policy review.'
    }
  },
  RAPID_GROWTH: {
    name: 'Rapid Enterprise Scale-Up Event',
    scenario_type: 'Department Expansion',
    description: 'Simulates hiring 150 new workforce nodes within a single quarter.',
    impact: {
      affected_revenue: -50000.00, // Positive revenue delta
      resilience_penalty: -15,      // Positive impact
      workforce_penalty: -25,
      departments: ['Human Resources', 'Operations'],
      projects: ['Onboarding Pipelines'],
      controls: ['Employee Verification Audits'],
      summary: 'Hiring spike increased operational capability by 35%, although onboarding bottlenecks briefly elevated support tickets.'
    }
  },
  ACQUISITION_EVENT: {
    name: 'Sub-entity Technical Merger',
    scenario_type: 'Acquisition',
    description: 'Simulates merging the database structures of an acquired subsidiary organization.',
    impact: {
      affected_revenue: 350000.00,
      resilience_penalty: 40,
      vendor_penalty: 30,
      departments: ['Engineering', 'Legal', 'Operations'],
      projects: ['Database Consolidation'],
      controls: ['System Integration Access Controls'],
      summary: 'Subsidiary database architectures contain legacy, unpatched vulnerabilities. Interim integration poses high access drift risks.'
    }
  }
};

export class SimulationTemplateService {
  async getTemplates() {
    return Object.entries(SIMULATION_TEMPLATES).map(([key, value]) => ({
      key,
      name: value.name,
      scenario_type: value.scenario_type,
      description: value.description
    }));
  }

  async runTemplateSimulation(organizationId, templateKey, userId = null) {
    const template = SIMULATION_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Simulation template '${templateKey}' not found.`);
    }

    logger.info(`[SimulationTemplateService] Executing simulation: ${template.name} for org ${organizationId}`);

    // 1. Ensure scenario exists in database
    let scenarioRes = await query(
      `SELECT id FROM simulation_scenarios WHERE organization_id = $1 AND name = $2`,
      [organizationId, template.name]
    );

    let scenarioId;
    if (scenarioRes.rows.length === 0) {
      const insertScen = await query(
        `INSERT INTO simulation_scenarios (organization_id, name, description, scenario_type, config)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [organizationId, template.name, template.description, template.scenario_type, JSON.stringify(template.impact)]
      );
      scenarioId = insertScen.rows[0].id;
    } else {
      scenarioId = scenarioRes.rows[0].id;
    }

    // 2. Fetch current resilience metrics to calculate penalties
    const resRes = await query(
      `SELECT * FROM resilience_metrics WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );

    let curMetrics = resRes.rows[0] || {
      enterprise_score: 95.0,
      business_continuity: 95.0,
      operational_stability: 95.0,
      compliance_stability: 95.0,
      vendor_stability: 95.0,
      knowledge_stability: 95.0,
      ai_stability: 95.0,
      recovery_capability: 95.0
    };

    // Calculate simulated metrics
    const simulatedMetrics = {
      business_continuity: Math.max(10, parseFloat(curMetrics.business_continuity) - (template.impact.business_continuity_penalty || 0)),
      operational_stability: Math.max(10, parseFloat(curMetrics.operational_stability) - (template.impact.workforce_penalty || 0)),
      compliance_stability: Math.max(10, parseFloat(curMetrics.compliance_stability) - (template.impact.compliance_penalty || 0)),
      vendor_stability: Math.max(10, parseFloat(curMetrics.vendor_stability) - (template.impact.vendor_penalty || 0)),
      knowledge_stability: Math.max(10, parseFloat(curMetrics.knowledge_stability) - (template.impact.knowledge_penalty || 0)),
      ai_stability: Math.max(10, parseFloat(curMetrics.ai_stability) - (template.impact.ai_penalty || 0)),
      recovery_capability: Math.max(10, parseFloat(curMetrics.recovery_capability) - 20)
    };

    // Calculate final composite resilience score
    const totalScore = (
      simulatedMetrics.business_continuity +
      simulatedMetrics.operational_stability +
      simulatedMetrics.compliance_stability +
      simulatedMetrics.vendor_stability +
      simulatedMetrics.knowledge_stability +
      simulatedMetrics.ai_stability +
      simulatedMetrics.recovery_capability
    ) / 7;

    // 3. Write Simulation Run
    const runRes = await query(
      `INSERT INTO simulation_runs (
        organization_id, scenario_id, simulation_name, status, run_by, 
        impact_analysis, affected_departments, affected_projects, 
        affected_controls, affected_knowledge, affected_revenue, resilience_score
      ) VALUES ($1, $2, $3, 'Completed', $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        organizationId,
        scenarioId,
        `Template: ${template.name}`,
        userId,
        JSON.stringify({ summary: template.impact.summary, timestamp: new Date() }),
        JSON.stringify(template.impact.departments || []),
        JSON.stringify(template.impact.projects || []),
        JSON.stringify(template.impact.controls || []),
        JSON.stringify(template.impact.affected_knowledge || []),
        template.impact.affected_revenue,
        totalScore
      ]
    );

    const runId = runRes.rows[0].id;

    // 4. Save Scenario result details
    await query(
      `INSERT INTO scenario_results (
        organization_id, scenario_id, run_id, summary, risk_assessment, cost_forecast, impact_forecast, success_probability
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        organizationId,
        scenarioId,
        runId,
        template.impact.summary,
        JSON.stringify({ severity: totalScore < 70 ? 'Critical' : 'Medium', vulnerabilityFound: true }),
        JSON.stringify({ potentialLoss: template.impact.affected_revenue }),
        JSON.stringify({ downtimeHours: totalScore < 70 ? 24 : 4 }),
        totalScore
      ]
    );

    // 5. Trigger warning alert in war room if score is low
    if (totalScore < 75) {
      await query(
        `INSERT INTO executive_alerts (organization_id, alert_title, alert_message, severity, is_resolved)
         VALUES ($1, $2, $3, 'Warning', FALSE)`,
        [
          organizationId,
          `Simulation Alert: ${template.name}`,
          `Simulated resilience score dropped to ${totalScore.toFixed(2)}%. Critical vulnerabilities in ${template.impact.departments?.join(', ') || 'infrastructure'}.`,
        ]
      );

      await query(
        `UPDATE executive_warroom SET status = 'Red', metrics = $1 WHERE organization_id = $2`,
        [JSON.stringify({ lastIncident: template.name, lastRunId: runId, score: totalScore }), organizationId]
      );
    }

    return {
      success: true,
      runId,
      scenarioId,
      simulationName: template.name,
      resilienceScore: totalScore,
      impact: template.impact
    };
  }
}

export const simulationTemplateService = new SimulationTemplateService();
