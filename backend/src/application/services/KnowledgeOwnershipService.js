// ============================================================
// Service: KnowledgeOwnershipService
// Manages compliance workflows, ownership, and stewardship roles
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class KnowledgeOwnershipService {
  async assignOwnership(organizationId, entityType, entityId, ownerId, stewardId = null, reviewerId = null, approverId = null) {
    try {
      const res = await query(
        `INSERT INTO knowledge_ownership (organization_id, entity_type, entity_id, owner_id, steward_id, reviewer_id, approver_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (organization_id, entity_type, entity_id)
         DO UPDATE SET owner_id = EXCLUDED.owner_id, steward_id = EXCLUDED.steward_id, reviewer_id = EXCLUDED.reviewer_id, approver_id = EXCLUDED.approver_id, updated_at = NOW()
         RETURNING *`,
        [organizationId, entityType, entityId, ownerId, stewardId, reviewerId, approverId]
      );
      return { success: true, ownership: res.rows[0] };
    } catch (err) {
      logger.error('Failed to assign knowledge ownership:', err);
      return { success: false, message: err.message };
    }
  }

  async getOwnership(organizationId, entityType, entityId) {
    try {
      const res = await query(
        `SELECT ko.*, 
                ow.name as owner_name, ow.email as owner_email,
                st.name as steward_name, st.email as steward_email,
                re.name as reviewer_name, re.email as reviewer_email,
                ap.name as approver_name, ap.email as approver_email
         FROM knowledge_ownership ko
         LEFT JOIN users ow ON ko.owner_id = ow.id
         LEFT JOIN users st ON ko.steward_id = st.id
         LEFT JOIN users re ON ko.reviewer_id = re.id
         LEFT JOIN users ap ON ko.approver_id = ap.id
         WHERE ko.organization_id = $1 AND ko.entity_type = $2 AND ko.entity_id = $3`,
        [organizationId, entityType, entityId]
      );
      return res.rows[0] || null;
    } catch (err) {
      logger.error('Failed to retrieve knowledge ownership details:', err);
      return null;
    }
  }

  async getOwnershipCoverage(organizationId) {
    try {
      const docsRes = await query(
        'SELECT COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE',
        [organizationId]
      );
      const totalDocs = parseInt(docsRes.rows[0]?.count || '0');

      const ownedRes = await query(
        "SELECT COUNT(*) as count FROM knowledge_ownership WHERE organization_id = $1 AND owner_id IS NOT NULL AND entity_type = 'Document'",
        [organizationId]
      );
      const ownedDocs = parseInt(ownedRes.rows[0]?.count || '0');

      const coverage = totalDocs > 0 ? (ownedDocs / totalDocs) * 100.00 : 100.00;

      return {
        totalEntities: totalDocs,
        assignedEntities: ownedDocs,
        ownershipCoverageRatio: parseFloat(coverage.toFixed(2))
      };
    } catch (err) {
      logger.error('Failed to calculate ownership coverage metrics:', err);
      return { totalEntities: 0, assignedEntities: 0, ownershipCoverageRatio: 0.00 };
    }
  }
}

export default new KnowledgeOwnershipService();
