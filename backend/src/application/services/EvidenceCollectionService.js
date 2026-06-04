// ============================================================
// Service: EvidenceCollectionService
// Manages compliance evidence collection, validation & expiry
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class EvidenceCollectionService {
  async collectEvidence(organizationId, data) {
    try {
      const res = await query(
        `INSERT INTO evidence_repository
         (organization_id, title, description, evidence_type, source_type, source_id, owner_id, department, 
          compliance_category, expiry_date, confidence_score, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          organizationId, data.title, data.description,
          data.evidence_type || 'Document', data.source_type || 'Manual',
          data.source_id || null, data.owner_id || null,
          data.department || null, data.compliance_category || null,
          data.expiry_date || null, data.confidence_score || 100.00,
          JSON.stringify(data.metadata || {})
        ]
      );
      const evidence = res.rows[0];

      // Track expiry
      if (data.expiry_date) {
        const daysUntil = Math.floor((new Date(data.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        await query(
          `INSERT INTO evidence_expiry_tracking (organization_id, evidence_id, expiry_date, days_until_expiry, expiry_status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (organization_id, evidence_id) DO UPDATE
           SET expiry_date = EXCLUDED.expiry_date, days_until_expiry = EXCLUDED.days_until_expiry, last_checked_at = NOW()`,
          [organizationId, evidence.id, data.expiry_date, daysUntil,
           daysUntil < 0 ? 'Expired' : daysUntil < 30 ? 'Expiring Soon' : 'Valid']
        );
      }

      return { success: true, evidence };
    } catch (err) {
      logger.error('Failed to collect evidence:', err);
      return { success: false, message: err.message };
    }
  }

  async autoCollectFromDocuments(organizationId) {
    try {
      const docsRes = await query(
        `SELECT d.id, d.name, d.category, d.department, d.owner_id, d.updated_at
         FROM documents d
         WHERE d.organization_id = $1 AND d.is_deleted = FALSE`,
        [organizationId]
      );

      let collected = 0;
      for (const doc of docsRes.rows) {
        const complianceCategories = ['Compliance', 'Legal', 'Finance', 'Policy', 'Security'];
        if (!complianceCategories.includes(doc.category)) continue;

        try {
          await query(
            `INSERT INTO evidence_repository
             (organization_id, title, description, evidence_type, source_type, source_id, owner_id, department, 
              compliance_category, confidence_score)
             VALUES ($1, $2, $3, 'Document', 'Auto-Collected', $4, $5, $6, $7, 90.00)
             ON CONFLICT DO NOTHING`,
            [
              organizationId,
              `Evidence: ${doc.name}`,
              `Auto-collected from ${doc.category} document repository.`,
              doc.id, doc.owner_id, doc.department, doc.category
            ]
          );
          collected++;
        } catch { /* already exists */ }
      }

      return { success: true, collected };
    } catch (err) {
      logger.error('Failed to auto-collect evidence:', err);
      return { success: false, collected: 0 };
    }
  }

  async getEvidence(organizationId, { search, category, status, expiryStatus } = {}) {
    try {
      let sql = `SELECT er.*, u.name as owner_name, 
                        eet.expiry_status, eet.days_until_expiry,
                        COUNT(DISTINCT em.id) as control_mappings
                 FROM evidence_repository er
                 LEFT JOIN users u ON er.owner_id = u.id
                 LEFT JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
                 LEFT JOIN evidence_mappings em ON em.evidence_id = er.id
                 WHERE er.organization_id = $1 AND er.is_archived = FALSE`;
      const params = [organizationId];

      if (search) {
        sql += ` AND (er.title ILIKE $${params.length + 1} OR er.description ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }
      if (category) { sql += ` AND er.compliance_category = $${params.length + 1}`; params.push(category); }
      if (status) { sql += ` AND er.review_status = $${params.length + 1}`; params.push(status); }
      if (expiryStatus) { sql += ` AND eet.expiry_status = $${params.length + 1}`; params.push(expiryStatus); }

      sql += ` GROUP BY er.id, u.name, eet.expiry_status, eet.days_until_expiry
               ORDER BY er.collection_date DESC`;

      const res = await query(sql, params);
      return { success: true, evidence: res.rows };
    } catch (err) {
      logger.error('Failed to get evidence:', err);
      return { success: false, evidence: [] };
    }
  }

  async mapEvidenceToControl(organizationId, evidenceId, controlId, mappedBy = null) {
    try {
      await query(
        `INSERT INTO evidence_mappings (organization_id, evidence_id, control_id, mapped_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (organization_id, evidence_id, control_id) DO NOTHING`,
        [organizationId, evidenceId, controlId, mappedBy]
      );

      // Update control evidence count
      await query(
        `UPDATE compliance_controls SET evidence_count = (
           SELECT COUNT(*) FROM evidence_mappings WHERE control_id = $1
         ), updated_at = NOW() WHERE id = $1`,
        [controlId]
      );

      return { success: true };
    } catch (err) {
      logger.error('Failed to map evidence to control:', err);
      return { success: false, message: err.message };
    }
  }

  async refreshExpiryStatus(organizationId) {
    try {
      const res = await query(
        `SELECT id, expiry_date FROM evidence_repository
         WHERE organization_id = $1 AND expiry_date IS NOT NULL AND is_archived = FALSE`,
        [organizationId]
      );

      for (const ev of res.rows) {
        const daysUntil = Math.floor((new Date(ev.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        const status = daysUntil < 0 ? 'Expired' : daysUntil < 30 ? 'Expiring Soon' : 'Valid';

        await query(
          `INSERT INTO evidence_expiry_tracking (organization_id, evidence_id, expiry_date, days_until_expiry, expiry_status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (organization_id, evidence_id) DO UPDATE
           SET days_until_expiry = EXCLUDED.days_until_expiry, expiry_status = EXCLUDED.expiry_status, last_checked_at = NOW()`,
          [organizationId, ev.id, ev.expiry_date, daysUntil, status]
        );
      }

      return { success: true };
    } catch (err) {
      logger.error('Failed to refresh expiry status:', err);
      return { success: false };
    }
  }
}

export default new EvidenceCollectionService();
