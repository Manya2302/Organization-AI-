// ============================================================
// Service: EvidenceValidationService
// Validates evidence integrity, completeness, and expiry
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class EvidenceValidationService {
  async validateEvidence(organizationId, evidenceId) {
    try {
      const evRes = await query(
        `SELECT er.*, eet.expiry_status, eet.days_until_expiry
         FROM evidence_repository er
         LEFT JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
         WHERE er.id = $1 AND er.organization_id = $2`,
        [evidenceId, organizationId]
      );
      if (!evRes.rows[0]) return { success: false, message: 'Evidence not found' };

      const ev = evRes.rows[0];
      const issues = [];
      let score = 100;

      if (!ev.title || ev.title.trim() === '') { issues.push('Missing title'); score -= 20; }
      if (!ev.description) { issues.push('Missing description'); score -= 10; }
      if (!ev.owner_id) { issues.push('No evidence owner assigned'); score -= 15; }
      if (!ev.compliance_category) { issues.push('Compliance category not set'); score -= 10; }
      if (ev.expiry_status === 'Expired') { issues.push('Evidence has expired'); score -= 30; }
      if (ev.expiry_status === 'Expiring Soon') { issues.push('Evidence expiring within 30 days'); score -= 10; }
      if (ev.review_status === 'Pending') { issues.push('Evidence not yet reviewed'); score -= 5; }

      const controlMappings = await query(
        `SELECT COUNT(*) as count FROM evidence_mappings WHERE evidence_id = $1 AND organization_id = $2`,
        [evidenceId, organizationId]
      );
      if (parseInt(controlMappings.rows[0]?.count || 0) === 0) {
        issues.push('Not mapped to any compliance control');
        score -= 10;
      }

      score = Math.max(0, score);
      const status = score >= 80 ? 'Valid' : score >= 50 ? 'Needs Attention' : 'Invalid';

      await query(
        `INSERT INTO evidence_reviews
         (organization_id, evidence_id, reviewer_id, review_outcome, review_notes)
         VALUES ($1, $2, NULL, $3, $4)`,
        [organizationId, evidenceId, status, issues.join('; ') || 'All checks passed']
      );

      await query(
        `UPDATE evidence_repository SET
           confidence_score = $1, review_status = $2, updated_at = NOW()
         WHERE id = $3 AND organization_id = $4`,
        [score, issues.length > 0 ? 'Issues Found' : 'Approved', evidenceId, organizationId]
      );

      return { success: true, evidenceId, validationScore: score, status, issues };
    } catch (err) {
      logger.error('Failed to validate evidence:', err);
      return { success: false, message: err.message };
    }
  }

  async validateAllEvidence(organizationId) {
    try {
      const evRes = await query(
        `SELECT id FROM evidence_repository WHERE organization_id = $1 AND is_archived = FALSE`,
        [organizationId]
      );

      const results = [];
      for (const ev of evRes.rows) {
        const result = await this.validateEvidence(organizationId, ev.id);
        results.push(result);
      }

      const valid = results.filter(r => r.status === 'Valid').length;
      const needsAttention = results.filter(r => r.status === 'Needs Attention').length;
      const invalid = results.filter(r => r.status === 'Invalid').length;

      return { success: true, total: results.length, valid, needsAttention, invalid };
    } catch (err) {
      logger.error('Failed to validate all evidence:', err);
      return { success: false, total: 0 };
    }
  }

  async getValidationHistory(organizationId, evidenceId = null) {
    try {
      let sql = `SELECT evr.*, er.title as evidence_title, u.name as reviewer_name
                 FROM evidence_reviews evr
                 JOIN evidence_repository er ON evr.evidence_id = er.id
                 LEFT JOIN users u ON evr.reviewer_id = u.id
                 WHERE evr.organization_id = $1`;
      const params = [organizationId];

      if (evidenceId) { sql += ` AND evr.evidence_id = $${params.length + 1}`; params.push(evidenceId); }
      sql += ` ORDER BY evr.reviewed_at DESC LIMIT 50`;

      const res = await query(sql, params);
      return { success: true, history: res.rows };
    } catch (err) {
      logger.error('Failed to get validation history:', err);
      return { success: false, history: [] };
    }
  }

  async getExpiryReport(organizationId) {
    try {
      const res = await query(
        `SELECT er.id, er.title, er.compliance_category, er.owner_id,
                eet.expiry_date, eet.days_until_expiry, eet.expiry_status,
                u.name as owner_name, u.email as owner_email
         FROM evidence_expiry_tracking eet
         JOIN evidence_repository er ON eet.evidence_id = er.id
         LEFT JOIN users u ON er.owner_id = u.id
         WHERE er.organization_id = $1
         ORDER BY eet.days_until_expiry ASC NULLS LAST`,
        [organizationId]
      );

      const expired = res.rows.filter(r => r.expiry_status === 'Expired').length;
      const expiringSoon = res.rows.filter(r => r.expiry_status === 'Expiring Soon').length;
      const valid = res.rows.filter(r => r.expiry_status === 'Valid').length;

      return { success: true, items: res.rows, expired, expiringSoon, valid };
    } catch (err) {
      logger.error('Failed to get expiry report:', err);
      return { success: false, items: [] };
    }
  }
}

export default new EvidenceValidationService();
