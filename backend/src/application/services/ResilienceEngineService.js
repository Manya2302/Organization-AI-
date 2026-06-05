import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class ResilienceEngineService {
  async getLatestMetrics(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM resilience_metrics WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return this.calculateResilience(organizationId);
      }
      return res.rows[0];
    } catch (err) {
      logger.error('ResilienceEngineService.getLatestMetrics error:', err);
      return null;
    }
  }

  async getHistory(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM resilience_history WHERE organization_id = $1 ORDER BY metric_date DESC, created_at DESC LIMIT 30`,
        [organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('ResilienceEngineService.getHistory error:', err);
      return [];
    }
  }

  async calculateResilience(organizationId) {
    logger.info(`🛡️ Calculating resilience metrics for organization ${organizationId}...`);

    // Fetch counts and scores from active database tables to build dynamic values
    const workflows = await query(`SELECT COUNT(*) FROM enterprise_workflows WHERE organization_id = $1`, [organizationId]);
    const risks = await query(`SELECT AVG(score) as avg_risk FROM risk_register WHERE organization_id = $1`, [organizationId]);
    const vendors = await query(`SELECT COUNT(*) FROM vendor_registry WHERE organization_id = $1`, [organizationId]);
    const employees = await query(`SELECT COUNT(*) FROM users WHERE organization_id = $1`, [organizationId]);

    const activeWorkflows = parseInt(workflows.rows[0].count) || 5;
    const avgRiskScore = parseFloat(risks.rows[0].avg_risk) || 45.0;
    const activeVendors = parseInt(vendors.rows[0].count) || 3;
    const employeesCount = parseInt(employees.rows[0].count) || 10;

    // Derived scores
    const businessContinuity = Math.max(50, 95 - (activeVendors * 2.5)); // More vendors slightly increases dependency, lowering basic continuity
    const operationalStability = Math.min(100, 75 + (activeWorkflows * 3));
    const complianceStability = Math.min(100, 85 + (employeesCount > 5 ? 10 : 0));
    const vendorStability = Math.max(50, 98 - (activeVendors * 4));
    const knowledgeStability = Math.max(40, 90 - (avgRiskScore > 60 ? 15 : 5));
    const aiStability = 94.50; // Stable AI Governance default
    const recoveryCapability = 88.00;

    // Aggregate Enterprise Resilience Score
    const enterpriseScore = parseFloat(
      ((businessContinuity + operationalStability + complianceStability + vendorStability + knowledgeStability + aiStability + recoveryCapability) / 7).toFixed(2)
    );

    // Save metrics
    const res = await query(
      `INSERT INTO resilience_metrics (
        organization_id, enterprise_score, business_continuity, operational_stability,
        compliance_stability, vendor_stability, knowledge_stability, ai_stability, recovery_capability
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        organizationId, enterpriseScore, businessContinuity, operationalStability,
        complianceStability, vendorStability, knowledgeStability, aiStability, recoveryCapability
      ]
    );

    const metrics = res.rows[0];

    // Seed resilience history records
    const scoreTypes = [
      { type: 'Enterprise', score: enterpriseScore },
      { type: 'Department', score: operationalStability },
      { type: 'Risk', score: 100 - avgRiskScore },
      { type: 'Recovery', score: recoveryCapability }
    ];

    for (const st of scoreTypes) {
      await query(
        `INSERT INTO resilience_history (organization_id, score_type, score, details)
         VALUES ($1, $2, $3, $4)`,
        [organizationId, st.type, st.score, JSON.stringify({ workflows: activeWorkflows, employees: employeesCount })]
      );
    }

    return metrics;
  }
}

export const resilienceService = new ResilienceEngineService();
