// ============================================================
// Service: ControlPredictionService
// Predicts controls likely to fail future audits.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class ControlPredictionService {
  async predictPlan(planId, organizationId) {
    try {
      await query(
        `DELETE FROM audit_predictions WHERE audit_plan_id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );

      const controls = await query(
        `SELECT aca.*, chk.status AS checklist_status,
                COUNT(aer.id)::int AS evidence_total,
                COUNT(aer.matching_document_id)::int AS evidence_mapped
         FROM audit_control_analysis aca
         LEFT JOIN audit_checklists chk
           ON chk.audit_plan_id = aca.audit_plan_id
          AND chk.control_code = aca.control_code
          AND chk.organization_id = aca.organization_id
         LEFT JOIN audit_evidence_recommendations aer
           ON aer.audit_plan_id = aca.audit_plan_id
          AND aer.control_code = aca.control_code
          AND aer.organization_id = aca.organization_id
         WHERE aca.audit_plan_id = $1 AND aca.organization_id = $2
         GROUP BY aca.id, chk.status`,
        [planId, organizationId]
      );

      const predictions = [];
      for (const control of controls.rows) {
        const evidenceCoverage = control.evidence_total > 0
          ? (control.evidence_mapped / control.evidence_total) * 100
          : 50;
        const factors = [];
        let probability = 20;
        if (control.checklist_status === 'Failed') { probability += 45; factors.push('failed checklist verification'); }
        if (control.checklist_status === 'Pending') { probability += 20; factors.push('pending checklist verification'); }
        if (evidenceCoverage < 70) { probability += 25; factors.push('low evidence coverage'); }
        if (Number(control.risk_score || 0) > 60) { probability += 15; factors.push('elevated control risk score'); }
        if (control.ownership_status === 'Gapped') { probability += 15; factors.push('ownership gap'); }
        probability = Math.min(100, Math.round(probability));

        const saved = await query(
          `INSERT INTO audit_predictions
           (organization_id, audit_plan_id, control_code, failure_probability,
            control_risk_score, factors, prediction_summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            organizationId,
            planId,
            control.control_code,
            probability,
            Math.round((probability + Number(control.risk_score || 0)) / 2),
            JSON.stringify(factors),
            `Control ${control.control_code} has a ${probability}% predicted failure probability.`
          ]
        );
        predictions.push(saved.rows[0]);
      }

      return predictions;
    } catch (err) {
      logger.error('Control prediction failed:', err);
      return [];
    }
  }

  async getPredictions(planId, organizationId) {
    const res = await query(
      `SELECT * FROM audit_predictions
       WHERE audit_plan_id = $1 AND organization_id = $2
       ORDER BY failure_probability DESC, created_at DESC`,
      [planId, organizationId]
    );
    return res.rows;
  }
}

export default new ControlPredictionService();
