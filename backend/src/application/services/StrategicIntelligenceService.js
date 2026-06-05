import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class StrategicIntelligenceService {
  async getStrategicSummary(organizationId) {
    try {
      const recs = await query(
        `SELECT * FROM strategic_recommendations WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      const opps = await query(
        `SELECT * FROM strategic_opportunities WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      const risks = await query(
        `SELECT * FROM strategic_risks WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return {
        recommendations: recs.rows,
        opportunities: opps.rows,
        risks: risks.rows,
        priorities: [
          { task: 'Remediate key-man dependency in Legal Counsel role.', status: 'High Priority', deadline: 'Next 30 Days' },
          { task: 'Enforce multi-factor verification across cloud-facing VPC nodes.', status: 'High Priority', deadline: 'Next 15 Days' },
          { task: 'Validate consent management audit compliance evidence.', status: 'Medium Priority', deadline: 'Next 60 Days' }
        ]
      };
    } catch (err) {
      logger.error('StrategicIntelligenceService.getStrategicSummary error:', err);
      return { recommendations: [], opportunities: [], risks: [], priorities: [] };
    }
  }

  async runStrategicAnalysis(organizationId) {
    logger.info(`🧠 Running strategic intelligence analysis for organization ${organizationId}...`);

    // Delete existing items to regenerate fresh ones
    await query(`DELETE FROM strategic_recommendations WHERE organization_id = $1`, [organizationId]);
    await query(`DELETE FROM strategic_opportunities WHERE organization_id = $1`, [organizationId]);
    await query(`DELETE FROM strategic_risks WHERE organization_id = $1`, [organizationId]);

    // Seed Strategic Risks
    const sampleRisks = [
      {
        title: 'Key-man exposure on Legal department operations',
        description: 'Single-source legal knowledge mapping leaves compliance verification process vulnerable to team disruptions.',
        mitigation: 'Appoint assistant legal counsel and automate policy parsing via AI Agent.',
        severity: 'High',
        probability: 'Medium'
      },
      {
        title: 'VPC host bypass rules',
        description: 'Cloud firewall rules have configurations that could allow third-party developers to access internal repositories with bypass checks.',
        mitigation: 'Configure mandatory MFA verify tunnels and rotate certificates every 90 days.',
        severity: 'High',
        probability: 'Low'
      },
      {
        title: 'Consent renewal timeline gap',
        description: 'Over 25% of active user compliance consent files are approaching the 1-year expiration window.',
        mitigation: 'Enable self-service consent renewals and notifications.',
        severity: 'Medium',
        probability: 'High'
      }
    ];

    for (const r of sampleRisks) {
      await query(
        `INSERT INTO strategic_risks (organization_id, title, description, mitigation, severity, probability)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, r.title, r.description, r.mitigation, r.severity, r.probability]
      );
    }

    // Seed Strategic Opportunities
    const sampleOpps = [
      {
        title: 'Autonomous Compliance Remediation Integration',
        description: 'Configure automated rules to auto-fix minor regulatory violations detected in repository scan.',
        potential_benefit: 'Reduces operational overhead by 40% and keeps readiness at 98%.',
        feasibility: 'High'
      },
      {
        title: 'AI Governance Model Registry standard',
        description: 'Implement a unified registry interface for auditing and tracking all company AI model instances.',
        potential_benefit: 'Ensures absolute model compliance, explainability, and prompt governance transparency.',
        feasibility: 'High'
      },
      {
        title: 'Cloud server transition to Sovereign Region nodes',
        description: 'Migrate active database backups to local state nodes.',
        potential_benefit: 'Fulfills local storage security mandates and reduces network latency.',
        feasibility: 'Medium'
      }
    ];

    for (const o of sampleOpps) {
      await query(
        `INSERT INTO strategic_opportunities (organization_id, title, description, potential_benefit, feasibility)
         VALUES ($1, $2, $3, $4, $5)`,
        [organizationId, o.title, o.description, o.potential_benefit, o.feasibility]
      );
    }

    // Seed Strategic Recommendations
    const sampleRecs = [
      {
        recommendation: 'Establish an AI Council advisory board to approve and govern new LLM prompts before production deployment.',
        source: 'AI Council',
        priority: 'High',
        details: { benefit: 'Neutralizes AI security prompt injections and hallucination exposure.' }
      },
      {
        recommendation: 'Re-assign tasks and roles in Legal department to build redundancy on Critical DPDP compliance work.',
        source: 'Twin Analysis',
        priority: 'High',
        details: { benefit: 'Mitigates workforce departure risk exposure from 38% down to 10%.' }
      },
      {
        recommendation: 'Adopt active continuous shadow auditing workflow across all active financial projects.',
        source: 'Risk Forecast',
        priority: 'Medium',
        details: { benefit: 'Increases audit readiness score to 95% within 90 days.' }
      }
    ];

    for (const r of sampleRecs) {
      await query(
        `INSERT INTO strategic_recommendations (organization_id, recommendation, source, priority, status, details)
         VALUES ($1, $2, $3, $4, 'Proposed', $5)`,
        [organizationId, r.recommendation, r.source, r.priority, JSON.stringify(r.details)]
      );
    }

    return this.getStrategicSummary(organizationId);
  }
}

export const strategicIntelligenceService = new StrategicIntelligenceService();
