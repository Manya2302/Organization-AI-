// ============================================================
// Service: ExternalAuditorPortalService
// Creates read-only, expiring auditor shares and review records.
// ============================================================
import crypto from 'crypto';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class ExternalAuditorPortalService {
  async createShare(organizationId, userId, packageId, options = {}) {
    try {
      const packageRes = await query(
        `SELECT * FROM audit_packages WHERE id = $1 AND organization_id = $2`,
        [packageId, organizationId]
      );
      if (!packageRes.rows[0]) throw new Error('Audit package not found');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(options.expiresInDays || 14));
      const shareToken = crypto.randomBytes(32).toString('hex');
      const share = await query(
        `INSERT INTO audit_shares
         (organization_id, audit_package_id, share_token, access_level, expires_at, created_by)
         VALUES ($1, $2, $3, 'ReadOnly', $4, $5)
         RETURNING id, audit_package_id, access_level, expires_at, created_at`,
        [organizationId, packageId, shareToken, expiresAt.toISOString(), userId]
      );

      if (options.reviewerEmail) {
        await query(
          `INSERT INTO audit_external_reviews
           (organization_id, audit_package_id, reviewer_email, reviewer_name, status)
           VALUES ($1, $2, $3, $4, 'Invited')`,
          [organizationId, packageId, options.reviewerEmail, options.reviewerName || null]
        );
      }

      return {
        ...share.rows[0],
        shareToken,
        portalUrl: `/auditor/review/${shareToken}`
      };
    } catch (err) {
      logger.error('External auditor share failed:', err);
      throw err;
    }
  }

  async getSharedPackage(shareToken) {
    const share = await query(
      `SELECT s.*, p.name, p.description, p.integrity_hash, p.metadata
       FROM audit_shares s
       JOIN audit_packages p ON p.id = s.audit_package_id
       WHERE s.share_token = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
      [shareToken]
    );
    if (!share.rows[0]) return null;
    const items = await query(
      `SELECT item_name, item_type, control_code, trust_score, metadata
       FROM audit_package_items
       WHERE audit_package_id = $1 AND organization_id = $2
       ORDER BY control_code, item_name`,
      [share.rows[0].audit_package_id, share.rows[0].organization_id]
    );
    return { share: share.rows[0], items: items.rows };
  }
}

export default new ExternalAuditorPortalService();
