// ============================================================
// Service: ComplianceGapService
// Detects missing controls, policies, evidence, and compliance gaps
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class ComplianceGapService {
  async detectGaps(organizationId) {
    const detected = [];

    try {
      // Gap 1: Controls with no evidence
      const noEvidenceRes = await query(
        `SELECT cc.id, cc.control_code, cc.title, cc.risk_level
         FROM compliance_controls cc
         WHERE cc.organization_id = $1
         AND cc.id NOT IN (SELECT DISTINCT control_id FROM evidence_mappings WHERE organization_id = $1)`,
        [organizationId]
      );

      for (const ctrl of noEvidenceRes.rows) {
        detected.push({
          gap_type: 'Missing Evidence',
          severity: ctrl.risk_level === 'HIGH' || ctrl.risk_level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          title: `No evidence for control: ${ctrl.control_code}`,
          description: `Control "${ctrl.title}" has no supporting evidence attached.`,
          recommended_action: 'Upload or link relevant documentation as evidence for this control.',
          control_id: ctrl.id
        });
      }

      // Gap 2: Overdue control reviews
      const overdueRes = await query(
        `SELECT id, control_code, title, risk_level, next_review_at
         FROM compliance_controls
         WHERE organization_id = $1 AND next_review_at < NOW() AND next_review_at IS NOT NULL`,
        [organizationId]
      );

      for (const ctrl of overdueRes.rows) {
        detected.push({
          gap_type: 'Overdue Review',
          severity: 'MEDIUM',
          title: `Overdue review for: ${ctrl.control_code}`,
          description: `Control "${ctrl.title}" review was due on ${new Date(ctrl.next_review_at).toLocaleDateString()}.`,
          recommended_action: 'Schedule and complete the overdue control review immediately.',
          control_id: ctrl.id
        });
      }

      // Gap 3: Documents in compliance categories with no policy_compliance mapping
      const unmappedPolicies = await query(
        `SELECT d.id, d.name, d.category
         FROM documents d
         WHERE d.organization_id = $1 AND d.is_deleted = FALSE
         AND d.category IN ('Compliance', 'Legal', 'Policy', 'Security')
         AND d.id NOT IN (SELECT document_id FROM policy_compliance WHERE organization_id = $1)`,
        [organizationId]
      );

      for (const doc of unmappedPolicies.rows) {
        detected.push({
          gap_type: 'Unmapped Policy',
          severity: 'LOW',
          title: `Policy not mapped to framework: ${doc.name}`,
          description: `Document "${doc.name}" (${doc.category}) has not been mapped to any compliance framework.`,
          recommended_action: 'Map this policy document to the relevant compliance framework.',
          control_id: null
        });
      }

      // Gap 4: Expired evidence
      const expiredEvidence = await query(
        `SELECT er.id, er.title, er.compliance_category
         FROM evidence_repository er
         JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
         WHERE er.organization_id = $1 AND eet.expiry_status = 'Expired'`,
        [organizationId]
      );

      for (const ev of expiredEvidence.rows) {
        detected.push({
          gap_type: 'Expired Evidence',
          severity: 'HIGH',
          title: `Evidence expired: ${ev.title}`,
          description: `Evidence item "${ev.title}" has expired and may no longer satisfy compliance requirements.`,
          recommended_action: 'Renew or replace this expired evidence immediately.',
          control_id: null
        });
      }

      // Upsert gaps
      for (const gap of detected) {
        try {
          await query(
            `INSERT INTO compliance_gaps
             (organization_id, framework_id, control_id, gap_type, severity, title, description, recommended_action, status)
             VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, 'Open')
             ON CONFLICT DO NOTHING`,
            [organizationId, gap.control_id, gap.gap_type, gap.severity, gap.title, gap.description, gap.recommended_action]
          );
        } catch { /* skip duplicates */ }
      }

      return { success: true, detectedCount: detected.length, gaps: detected };
    } catch (err) {
      logger.error('Failed to detect compliance gaps:', err);
      return { success: false, detectedCount: 0, gaps: [] };
    }
  }

  async getGaps(organizationId, { severity, status, gapType } = {}) {
    try {
      let sql = `SELECT cg.*, cc.title as control_title, cc.control_code,
                        cf.short_name as framework_name, u.name as assigned_to_name
                 FROM compliance_gaps cg
                 LEFT JOIN compliance_controls cc ON cg.control_id = cc.id
                 LEFT JOIN compliance_frameworks cf ON cg.framework_id = cf.id
                 LEFT JOIN users u ON cg.assigned_to = u.id
                 WHERE cg.organization_id = $1`;
      const params = [organizationId];

      if (severity) { sql += ` AND cg.severity = $${params.length + 1}`; params.push(severity); }
      if (status) { sql += ` AND cg.status = $${params.length + 1}`; params.push(status); }
      if (gapType) { sql += ` AND cg.gap_type = $${params.length + 1}`; params.push(gapType); }

      sql += ` ORDER BY 
        CASE cg.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
        cg.created_at DESC`;

      const res = await query(sql, params);
      return { success: true, gaps: res.rows };
    } catch (err) {
      logger.error('Failed to get compliance gaps:', err);
      return { success: false, gaps: [] };
    }
  }

  async resolveGap(organizationId, gapId) {
    try {
      await query(
        `UPDATE compliance_gaps SET status = 'Resolved', resolved_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [gapId, organizationId]
      );
      return { success: true };
    } catch (err) {
      logger.error('Failed to resolve gap:', err);
      return { success: false };
    }
  }

  async getGapSummary(organizationId) {
    try {
      const res = await query(
        `SELECT gap_type, severity, COUNT(*) as count
         FROM compliance_gaps
         WHERE organization_id = $1 AND status = 'Open'
         GROUP BY gap_type, severity
         ORDER BY severity DESC`,
        [organizationId]
      );
      return { success: true, summary: res.rows };
    } catch (err) {
      logger.error('Failed to get gap summary:', err);
      return { success: false, summary: [] };
    }
  }
}

export default new ComplianceGapService();
