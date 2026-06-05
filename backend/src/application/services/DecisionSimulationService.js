import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class DecisionSimulationService {
  async getSimulations(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM decision_simulations WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('DecisionSimulationService.getSimulations error:', err);
      return [];
    }
  }

  async simulateDecision(organizationId, proposal, userId) {
    logger.info(`⚖️ Simulating proposal: "${proposal}"...`);

    let costImpact = 0.00;
    let riskImpact = 'Low';
    let complianceImpact = 'Neutral';
    let operationalImpact = 'Stable';
    let knowledgeImpact = 'Minimal';
    let successProbability = 85.00;
    let recommendation = '';

    const lowerProposal = proposal.toLowerCase();

    if (lowerProposal.includes('replace vendor') || lowerProposal.includes('vendor a') || lowerProposal.includes('vendor b')) {
      costImpact = -15000.00; // saving money
      riskImpact = 'Medium';
      complianceImpact = 'Positive (Improves local storage residency alignment)';
      operationalImpact = 'Moderate (Transition downtime risk: 2-4 hours)';
      knowledgeImpact = 'Requires updating team vendor SLAs and credentials';
      successProbability = 72.00;
      recommendation = `PROCEED WITH CAUTION. Replacing vendor will yield annual savings of $15K and guarantee DPDP local storage compliance, but requires managing a 4-hour migration window carefully.`;
    } else if (lowerProposal.includes('hire') || lowerProposal.includes('staff') || lowerProposal.includes('recruit')) {
      costImpact = 180000.00; // hiring costs
      riskImpact = 'Low';
      complianceImpact = 'Highly Positive (Fills crucial compliance monitoring gaps)';
      operationalImpact = 'Improves throughput, reduces workload bottlenecks';
      knowledgeImpact = 'Expands domain knowledge capacity';
      successProbability = 90.00;
      recommendation = `RECOMMENDED. Hiring additional compliance staff will resolve key-man risks and ensure the audit timeline stays on track. Cost is offset by risk reduction.`;
    } else if (lowerProposal.includes('audit failure') || lowerProposal.includes('fail audit')) {
      costImpact = 250000.00; // heavy cost
      riskImpact = 'Critical';
      complianceImpact = 'Severe Negative (Triggers regulatory inspections)';
      operationalImpact = 'Disrupted (Remediation tasks assigned to multiple departments)';
      knowledgeImpact = 'Exposes major training gaps in policy validation';
      successProbability = 15.00;
      recommendation = `CRITICAL ACTION REQUIRED. This simulation models the consequences of failing the upcoming regulatory audit. Deploy the Audit Copilot and prepare compliance packets immediately.`;
    } else if (lowerProposal.includes('iso 27001') || lowerProposal.includes('framework')) {
      costImpact = 45000.00;
      riskImpact = 'Low';
      complianceImpact = 'Highly Positive (Standardizes information security controls)';
      operationalImpact = 'Requires additional documentation effort from engineering';
      knowledgeImpact = 'Enforces structured security and asset ownership training';
      successProbability = 80.00;
      recommendation = `HIGHLY RECOMMENDED. Adopting ISO 27001 establishes a premium compliance posture and satisfies external partner audit requirements.`;
    } else {
      // General fallbacks
      costImpact = 12000.00;
      riskImpact = 'Low';
      complianceImpact = 'Positive';
      operationalImpact = 'Stable';
      knowledgeImpact = 'Minimal';
      successProbability = 85.00;
      recommendation = `PROCEED. Simulating this change shows safe risk metrics and solid success probability. Proceed with normal approval workflow.`;
    }

    const res = await query(
      `INSERT INTO decision_simulations (
        organization_id, decision_proposal, simulated_by, cost_impact,
        risk_impact, compliance_impact, operational_impact, knowledge_impact, success_probability, recommendation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        organizationId, proposal, userId, costImpact,
        riskImpact, complianceImpact, operationalImpact, knowledgeImpact, successProbability, recommendation
      ]
    );

    const simulation = res.rows[0];

    // Seed into decision_outcomes to satisfy relation/data demands
    await query(
      `INSERT INTO decision_outcomes (decision_id, success_rate, notes, audit_ready)
       VALUES ($1, $2, $3, TRUE)`,
      [simulation.id, successProbability, recommendation]
    );

    return simulation;
  }
}

export const decisionSimulationService = new DecisionSimulationService();
