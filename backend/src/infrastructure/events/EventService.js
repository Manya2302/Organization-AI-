import { query } from '../database/connection.js';
import { logger } from '../logging/logger.js';

/**
 * EventService — Phase 2 Final Architecture Refinements
 * Prepares system for future event-driven triggers by tracking important pipeline occurrences in system_events.
 */
export const publishSystemEvent = async (organizationId, eventType, payload = {}, triggeredBy = null) => {
  try {
    await query(
      `INSERT INTO system_events (organization_id, event_type, payload, triggered_by)
       VALUES ($1, $2, $3, $4)`,
      [organizationId, eventType, JSON.stringify(payload), triggeredBy]
    );
    logger.info(`📢 Event Published: "${eventType}" for Org ${organizationId}`);
  } catch (err) {
    logger.error(`❌ Event publication failed: ${err.message}`);
  }
};

export default {
  publishSystemEvent
};
