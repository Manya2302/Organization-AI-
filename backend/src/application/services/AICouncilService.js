import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AICouncilService {
  async getSessions(organizationId) {
    try {
      const sessions = await query(
        `SELECT * FROM ai_council_sessions WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );
      
      const sessionsWithRecs = [];
      for (const s of sessions.rows) {
        const recs = await query(
          `SELECT * FROM ai_council_recommendations WHERE session_id = $1`,
          [s.id]
        );
        sessionsWithRecs.push({
          ...s,
          recommendations: recs.rows
        });
      }
      return sessionsWithRecs;
    } catch (err) {
      logger.error('AICouncilService.getSessions error:', err);
      return [];
    }
  }

  async runCouncilSession(organizationId, topic) {
    logger.info(`🤖 Starting Cognitive AI Council debate session on topic: "${topic}"...`);

    const councilAgents = [
      { name: 'Compliance Advisor', role: 'Ensures strict alignment with regulatory acts like DPDP, GDPR, and ISO standards.' },
      { name: 'Audit Advisor', role: 'Focuses on documentation, audit trails, and evidence packages availability.' },
      { name: 'Risk Advisor', role: 'Identifies systemic operational risks and vulnerability metrics.' },
      { name: 'Knowledge Advisor', role: 'Evaluates domain expertise retention and successor readiness.' },
      { name: 'Workforce Advisor', role: 'Analyzes staff distribution, burnout risks, and departmental capacity.' },
      { name: 'Vendor Advisor', role: 'Monitors external vendor compliance, SLAs, and integration exposures.' },
      { name: 'AI Governance Advisor', role: 'Tracks LLM usage, prompt injections, and model registries.' },
      { name: 'Strategy Advisor', role: 'Synthesizes advisor positions into cohesive quarterly/annual plans.' }
    ];

    // Simulate debate log
    const debateLog = [];
    const recommendations = [];

    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('vendor') || lowerTopic.includes('outage') || lowerTopic.includes('replace')) {
      // Vendor debate
      debateLog.push({
        agent: 'Vendor Advisor',
        statement: 'Our cloud infrastructure relies heavily on third-party storage nodes. Any replacement will impact our active integration workflows. We must request full SLA security audits from the replacement vendor first.'
      });
      debateLog.push({
        agent: 'Compliance Advisor',
        statement: 'Agreed. The new vendor must strictly satisfy local data residency parameters. We cannot risk routing user compliance metadata across international boundaries.'
      });
      debateLog.push({
        agent: 'Risk Advisor',
        statement: 'A transition downtime of 4 hours has been simulated. This lowers our operational resilience score to 55%. We should stagger the database migration over weekend hours to mitigate risk.'
      });
      debateLog.push({
        agent: 'Strategy Advisor',
        statement: 'Synthesizing the counsel guidance: We recommend approving the vendor replacement with a staggered migration plan on Sunday, under a strict compliance verification checkpoint.'
      });
      
      recommendations.push({
        agent: 'Vendor Advisor',
        text: 'Request SLA validation and security certificates from replacement vendor before contract signing.',
        confidence: 94.00
      });
      recommendations.push({
        agent: 'Compliance Advisor',
        text: 'Verify local sovereign data residency configuration on new vendor VPC setups.',
        confidence: 96.50
      });
      recommendations.push({
        agent: 'Strategy Advisor',
        text: 'Deploy staggered weekend data transition workflow to limit downtime to < 2 hours.',
        confidence: 89.00
      });

    } else if (lowerTopic.includes('audit') || lowerTopic.includes('iso') || lowerTopic.includes('readiness')) {
      // Audit debate
      debateLog.push({
        agent: 'Audit Advisor',
        statement: 'For ISO 27001 readiness, we require cryptographic hashes for all evidence logs. Our current documents repository needs a sync with our vector database indexing.'
      });
      debateLog.push({
        agent: 'AI Governance Advisor',
        statement: 'We must also register all model inputs/outputs in the registry to satisfy AI audit guidelines. The Prompt Governance logs should be locked and made read-only.'
      });
      debateLog.push({
        agent: 'Knowledge Advisor',
        statement: 'Compliance audit documentation resides mostly with Priya. If she departs, we risk an audit failure. Succession planning must be part of our readiness checklists.'
      });
      debateLog.push({
        agent: 'Strategy Advisor',
        statement: 'Unified recommendation: Accelerate the deployment of the Audit Copilot workspace and link it to the model registry to auto-generate evidence packages.'
      });

      recommendations.push({
        agent: 'Audit Advisor',
        text: 'Sync all repository files with vector indexes to allow the Audit Copilot to parse evidence.',
        confidence: 92.00
      });
      recommendations.push({
        agent: 'AI Governance Advisor',
        text: 'Lock and export explainability logs for the registry model models.',
        confidence: 95.00
      });
      recommendations.push({
        agent: 'Strategy Advisor',
        text: 'Conduct a shadow continuous audit run using the new workspace to establish readiness gaps.',
        confidence: 90.00
      });

    } else {
      // General debate
      debateLog.push({
        agent: 'Risk Advisor',
        statement: `The strategic request: "${topic}" requires balancing workforce load against compliance policies.`
      });
      debateLog.push({
        agent: 'Workforce Advisor',
        statement: 'We must ensure that department workloads do not exceed critical thresholds during this change.'
      });
      debateLog.push({
        agent: 'Strategy Advisor',
        statement: 'We advise moving forward with standard validation controls and monitoring resilience scores closely.'
      });

      recommendations.push({
        agent: 'Strategy Advisor',
        text: `Proceed with validation checks for: "${topic}".`,
        confidence: 85.00
      });
    }

    // Insert council session record
    const sessRes = await query(
      `INSERT INTO ai_council_sessions (organization_id, topic, debate_log)
       VALUES ($1, $2, $3) RETURNING id`,
      [organizationId, topic, JSON.stringify(debateLog)]
    );
    const sessionId = sessRes.rows[0].id;

    // Save recommendations
    const savedRecs = [];
    for (const rec of recommendations) {
      const recRes = await query(
        `INSERT INTO ai_council_recommendations (organization_id, session_id, agent_name, recommendation, confidence)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [organizationId, sessionId, rec.agent, rec.text, rec.confidence]
      );
      savedRecs.push(recRes.rows[0]);
    }

    return {
      sessionId,
      topic,
      debateLog,
      recommendations: savedRecs
    };
  }
}

export const councilService = new AICouncilService();
