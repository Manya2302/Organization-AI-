// ============================================================
// Service: AuditReadinessServiceV2
// Version 2: Multi-dimensional readiness computation & snapshot historical tracking
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditEvidenceService from './AuditEvidenceService.js';
import auditControlAnalyzer from './AuditControlAnalyzer.js';

class AuditReadinessServiceV2 {
  async calculatePlanReadiness(planId, organizationId) {
    try {
      // 1. Get evidence score
      const evidenceScores = await auditEvidenceService.calculateEvidenceScores(planId, organizationId);
      
      // 2. Get control metrics
      const controlMetrics = await auditControlAnalyzer.getControlMetrics(planId, organizationId);

      // 3. Count total items
      const countsRes = await query(
        `SELECT 
           (SELECT COUNT(*) FROM audit_checklists WHERE audit_plan_id = $1 AND organization_id = $2) as controls,
           (SELECT COUNT(*) FROM audit_evidence_recommendations WHERE audit_plan_id = $1 AND organization_id = $2) as evidence,
           (SELECT COUNT(*) FROM policy_compliance WHERE organization_id = $2) as policies`,
        [planId, organizationId]
      );
      const counts = countsRes.rows[0] || { controls: 0, evidence: 0, policies: 0 };

      // Compute composite readiness score
      const controlWeight = 0.50;
      const evidenceWeight = 0.50;
      
      const controlReadiness = parseFloat(controlMetrics.avg_readiness) || 0;
      const evidenceReadiness = parseFloat(evidenceScores.readinessScore) || 0;

      const finalScore = parseFloat((controlReadiness * controlWeight + evidenceReadiness * evidenceWeight).toFixed(2));

      // 4. Update the audit plan score
      await query(
        `UPDATE audit_plans SET readiness_score = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
        [finalScore, planId, organizationId]
      );

      // 5. Create readiness snapshot
      await query(
        `INSERT INTO audit_readiness_snapshots
         (organization_id, audit_plan_id, readiness_score, controls_count, policies_count, evidence_count, snapshot_date)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)`,
        [organizationId, planId, finalScore, parseInt(counts.controls), parseInt(counts.policies), parseInt(counts.evidence)]
      );

      // 6. Record history
      await query(
        `INSERT INTO audit_readiness_history
         (organization_id, audit_plan_id, readiness_score)
         VALUES ($1, $2, $3)`,
        [organizationId, planId, finalScore]
      );

      return {
        readinessScore: finalScore,
        controlReadiness,
        evidenceReadiness,
        controlsCount: parseInt(counts.controls),
        evidenceCount: parseInt(counts.evidence),
        policiesCount: parseInt(counts.policies)
      };
    } catch (err) {
      logger.error(`Failed to calculate plan readiness for ${planId}:`, err);
      return { readinessScore: 0, controlReadiness: 0, evidenceReadiness: 0 };
    }
  }

  async getReadinessHistory(planId, organizationId) {
    try {
      const res = await query(
        `SELECT readiness_score, recorded_at 
         FROM audit_readiness_history 
         WHERE audit_plan_id = $1 AND organization_id = $2
         ORDER BY recorded_at ASC`,
        [planId, organizationId]
      );
      return res.rows;
    } catch (err) {
      logger.error('Failed to get readiness history:', err);
      return [];
    }
  }
}

export default new AuditReadinessServiceV2();
