// ============================================================
// Service: AuditFindingsService
// Generates audit findings from evidence gaps, failed controls and risks.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditFindingsService {
  async generateFindings(planId, organizationId) {
    try {
      const generated = [];

      const missingEvidence = await query(
        `SELECT * FROM audit_evidence_recommendations
         WHERE audit_plan_id = $1 AND organization_id = $2
           AND (status = 'Missing' OR matching_document_id IS NULL)`,
        [planId, organizationId]
      );
      for (const item of missingEvidence.rows) {
        generated.push(await this.upsertFinding(organizationId, planId, {
          findingType: 'Evidence Gap',
          category: 'Missing Evidence',
          severity: 'HIGH',
          title: `Missing evidence for ${item.control_code}`,
          description: `${item.recommended_evidence_name} is required but not mapped.`,
          recommendation: 'Upload, validate and map current evidence to the control before auditor review.',
          riskScore: 80
        }));
      }

      const failedControls = await query(
        `SELECT * FROM audit_checklists
         WHERE audit_plan_id = $1 AND organization_id = $2 AND status = 'Failed'`,
        [planId, organizationId]
      );
      for (const item of failedControls.rows) {
        generated.push(await this.upsertFinding(organizationId, planId, {
          findingType: 'Control Failure',
          category: 'Review Failure',
          severity: 'CRITICAL',
          title: `Control failed verification: ${item.control_code}`,
          description: item.comments || item.requirement,
          recommendation: 'Assign a control owner, remediate implementation gaps and re-run verification.',
          riskScore: 95
        }));
      }

      const ownershipGaps = await query(
        `SELECT * FROM audit_control_analysis
         WHERE audit_plan_id = $1 AND organization_id = $2 AND ownership_status = 'Gapped'`,
        [planId, organizationId]
      );
      for (const item of ownershipGaps.rows) {
        generated.push(await this.upsertFinding(organizationId, planId, {
          findingType: 'Ownership Issue',
          category: 'Ownership Gap',
          severity: 'MEDIUM',
          title: `Missing owner for ${item.control_code}`,
          description: `Control ${item.control_code} does not have accountable ownership.`,
          recommendation: 'Assign an accountable owner and schedule recurring control review.',
          riskScore: 60
        }));
      }

      return generated;
    } catch (err) {
      logger.error('Audit finding generation failed:', err);
      return [];
    }
  }

  async upsertFinding(organizationId, planId, finding) {
    const existing = await query(
      `SELECT id FROM audit_findings
       WHERE organization_id = $1 AND audit_plan_id = $2 AND title = $3 AND status != 'Resolved'
       LIMIT 1`,
      [organizationId, planId, finding.title]
    );
    if (existing.rows[0]) {
      const updated = await query(
        `UPDATE audit_findings
         SET description = $1, recommendation = $2, severity = $3,
             finding_category = $4, risk_score = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          finding.description,
          finding.recommendation,
          finding.severity,
          finding.category,
          finding.riskScore,
          existing.rows[0].id
        ]
      );
      return updated.rows[0];
    }

    const created = await query(
      `INSERT INTO audit_findings
       (organization_id, audit_plan_id, finding_type, finding_category, severity,
        title, description, recommendation, status, risk_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', $9)
       RETURNING *`,
      [
        organizationId,
        planId,
        finding.findingType,
        finding.category,
        finding.severity,
        finding.title,
        finding.description,
        finding.recommendation,
        finding.riskScore
      ]
    );
    return created.rows[0];
  }

  async getFindings(planId, organizationId) {
    const res = await query(
      `SELECT * FROM audit_findings
       WHERE audit_plan_id = $1 AND organization_id = $2
       ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC`,
      [planId, organizationId]
    );
    return res.rows;
  }
}

export default new AuditFindingsService();
