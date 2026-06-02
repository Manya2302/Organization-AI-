// ============================================================
// Service: Document Retention & Expiration Monitoring Service
// Monitors document age, compliance cycles, and reviews
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

/**
 * Scan all active documents in an organization to monitor retention and review status
 * @param {string} organizationId - The organization uuid
 */
export const checkDocumentRetentionAndExpirations = async (organizationId) => {
  try {
    logger.info(`🔍 Scanning retention & compliance timelines for organization: ${organizationId}`);

    // 1. Fetch active documents
    const res = await query(
      `SELECT id, name, category, department, owner_id, review_required, retention_period, created_at 
       FROM documents 
       WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    const documents = res.rows;
    const now = new Date();
    const alerts = [];

    for (const doc of documents) {
      const createdDate = new Date(doc.created_at);
      const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const retentionLimit = doc.retention_period || 365;

      // Check for Expiration
      if (ageInDays >= retentionLimit) {
        // Retention Violation (already expired)
        alerts.push({
          title: 'Retention Limit Violated',
          message: `Document "${doc.name}" has reached its retention limit of ${retentionLimit} days (current age: ${ageInDays} days). Purge or archving required.`,
          type: 'error',
          userId: doc.owner_id,
          docId: doc.id,
          tag: 'RETENTION_VIOLATION'
        });
      } else if (retentionLimit - ageInDays <= 30) {
        // Upcoming Expiration (within 30 days)
        alerts.push({
          title: 'Upcoming Retention Expiration',
          message: `Document "${doc.name}" will expire in ${retentionLimit - ageInDays} days.`,
          type: 'warning',
          userId: doc.owner_id,
          docId: doc.id,
          tag: 'UPCOMING_EXPIRATION'
        });
      }

      // Check for Review Requirements
      if (doc.review_required) {
        // Review Reminder
        alerts.push({
          title: 'Compliance Review Required',
          message: `Document "${doc.name}" is flagged for mandatory compliance review.`,
          type: 'info',
          userId: doc.owner_id,
          docId: doc.id,
          tag: 'REVIEW_REMINDER'
        });
      }
    }

    // 2. Insert notifications for generated alerts
    for (const alert of alerts) {
      await query(
        `INSERT INTO notifications (organization_id, user_id, title, message, type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId, 
          alert.userId, 
          alert.title, 
          alert.message, 
          alert.type, 
          JSON.stringify({ documentId: alert.docId, tag: alert.tag })
        ]
      );
    }

    logger.info(`✅ Retention monitoring complete. Generated ${alerts.length} notifications.`);
    return { success: true, alertsCount: alerts.length };
  } catch (err) {
    logger.error(`Error checking document retention: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export default { checkDocumentRetentionAndExpirations };
