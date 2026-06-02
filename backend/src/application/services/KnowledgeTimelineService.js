// ============================================================
// Service: Knowledge Timeline Engine
// Tracks organizational memory events for timeline visualization
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

/**
 * Log a timeline event for organizational memory
 * @param {object} event - Event details
 * @param {string} event.organizationId
 * @param {string} [event.documentId]
 * @param {string} event.timelineType - 'Document Created', 'Document Updated', 'Knowledge Added', 'Policy Revised', 'Department Growth'
 * @param {string} event.title
 * @param {string} [event.details]
 * @param {string} [event.triggeredBy]
 */
export const logTimelineEvent = async ({
  organizationId, documentId, timelineType, title, details, triggeredBy
}) => {
  try {
    const res = await query(
      `INSERT INTO knowledge_timeline (organization_id, document_id, timeline_type, title, details, triggered_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [organizationId, documentId || null, timelineType, title, details || null, triggeredBy || null]
    );
    logger.info(`📅 Timeline event logged: [${timelineType}] - ${title}`);
    return res.rows[0].id;
  } catch (err) {
    logger.error(`Failed to log timeline event: ${err.message}`);
    return null;
  }
};

/**
 * Fetch the timeline history for an organization
 * @param {string} organizationId
 * @param {number} [limit=30]
 */
export const getKnowledgeTimeline = async (organizationId, limit = 30) => {
  try {
    const res = await query(
      `SELECT t.*, u.name as user_name, d.name as document_name 
       FROM knowledge_timeline t
       LEFT JOIN users u ON t.triggered_by = u.id
       LEFT JOIN documents d ON t.document_id = d.id
       WHERE t.organization_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [organizationId, limit]
    );
    return res.rows;
  } catch (err) {
    logger.error(`Failed to fetch timeline: ${err.message}`);
    return [];
  }
};

export default { logTimelineEvent, getKnowledgeTimeline };
