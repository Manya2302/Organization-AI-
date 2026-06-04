// ============================================================
// Service: PolicyComplianceService
// Maps policies to frameworks and tracks policy health
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class PolicyComplianceService {
  async mapPolicyToFramework(organizationId, documentId, frameworkId, ownerId = null) {
    try {
      const docRes = await query('SELECT name FROM documents WHERE id = $1', [documentId]);
      if (!docRes.rows[0]) return { success: false, message: 'Document not found' };

      const res = await query(
        `INSERT INTO policy_compliance
         (organization_id, document_id, framework_id, policy_name, compliance_status, review_owner_id, next_review_date)
         VALUES ($1, $2, $3, $4, 'Under Review', $5, NOW() + INTERVAL '1 year')
         ON CONFLICT (organization_id, document_id, framework_id) DO UPDATE
         SET review_owner_id = EXCLUDED.review_owner_id, updated_at = NOW()
         RETURNING *`,
        [organizationId, documentId, frameworkId, docRes.rows[0].name, ownerId]
      );
      return { success: true, mapping: res.rows[0] };
    } catch (err) {
      logger.error('Failed to map policy to framework:', err);
      return { success: false, message: err.message };
    }
  }

  async getPolicyCoverage(organizationId) {
    try {
      const res = await query(
        `SELECT pc.*, d.name as document_name, d.category as document_category,
                cf.short_name as framework_name, u.name as review_owner_name
         FROM policy_compliance pc
         JOIN documents d ON pc.document_id = d.id
         LEFT JOIN compliance_frameworks cf ON pc.framework_id = cf.id
         LEFT JOIN users u ON pc.review_owner_id = u.id
         WHERE pc.organization_id = $1
         ORDER BY pc.compliance_status ASC, pc.next_review_date ASC`,
        [organizationId]
      );

      const summary = await query(
        `SELECT compliance_status, COUNT(*) as count
         FROM policy_compliance WHERE organization_id = $1
         GROUP BY compliance_status`,
        [organizationId]
      );

      const expiredRes = await query(
        `SELECT COUNT(*) as count FROM policy_compliance
         WHERE organization_id = $1 AND expiry_date < NOW()`,
        [organizationId]
      );

      return {
        success: true,
        policies: res.rows,
        summary: summary.rows,
        expiredCount: parseInt(expiredRes.rows[0]?.count || 0)
      };
    } catch (err) {
      logger.error('Failed to get policy coverage:', err);
      return { success: false, policies: [], summary: [] };
    }
  }

  async approvePolicy(organizationId, policyId, approverId) {
    try {
      await query(
        `UPDATE policy_compliance SET
           compliance_status = 'Compliant', is_approved = TRUE,
           approved_by = $1, approved_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [approverId, policyId, organizationId]
      );
      return { success: true };
    } catch (err) {
      logger.error('Failed to approve policy:', err);
      return { success: false };
    }
  }

  async autoMapDocuments(organizationId) {
    try {
      const docsRes = await query(
        `SELECT d.id, d.name, d.category FROM documents d
         WHERE d.organization_id = $1 AND d.is_deleted = FALSE
         AND d.category IN ('Compliance', 'Legal', 'Policy', 'Security', 'Finance')`,
        [organizationId]
      );

      const frameworksRes = await query(
        `SELECT id, short_name FROM compliance_frameworks WHERE organization_id = $1 AND is_active = TRUE`,
        [organizationId]
      );

      if (frameworksRes.rows.length === 0) return { success: true, mapped: 0 };

      let mapped = 0;
      for (const doc of docsRes.rows) {
        const defaultFramework = frameworksRes.rows[0];
        try {
          await query(
            `INSERT INTO policy_compliance
             (organization_id, document_id, framework_id, policy_name, compliance_status, next_review_date)
             VALUES ($1, $2, $3, $4, 'Under Review', NOW() + INTERVAL '1 year')
             ON CONFLICT DO NOTHING`,
            [organizationId, doc.id, defaultFramework.id, doc.name]
          );
          mapped++;
        } catch { /* skip existing */ }
      }

      return { success: true, mapped };
    } catch (err) {
      logger.error('Failed to auto-map documents:', err);
      return { success: false, mapped: 0 };
    }
  }
}

export default new PolicyComplianceService();
