import { query } from '../database/connection.js';
import { logger } from '../logging/logger.js';

/**
 * GraphPreparationService — Phase 2 Final Architecture Refinements
 * Prepares and structures enterprise data for future migration to Neo4j.
 * Automatically inserts node linkages into `graph_preparation_queue`.
 */
export const queueGraphNodeLink = async (orgId, sourceId, sourceType, targetId, targetType, relType, properties = {}, confidence = 1.00, source = 'ai', reasoning = 'Direct metadata link') => {
  try {
    await query(
      `INSERT INTO graph_preparation_queue (
         organization_id, source_node_id, source_node_type, target_node_id, target_node_type, 
         relationship_type, properties, relationship_confidence, relationship_source, relationship_reasoning
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [orgId, String(sourceId), sourceType, String(targetId), targetType, relType, JSON.stringify(properties), confidence, source, reasoning]
    );
    logger.info(`🔗 Graph preparation link enqueued: (${sourceType}:${sourceId}) -[:${relType}]-> (${targetType}:${targetId}) with confidence ${confidence}`);
  } catch (err) {
    logger.error(`❌ Graph preparation enqueue failed: ${err.message}`);
  }
};

export const prepareDocumentGraphLinks = async (documentId, organizationId, ownerId, department, metadata = {}) => {
  // 1. Link Document to Owner (CREATED_BY)
  if (ownerId) {
    await queueGraphNodeLink(organizationId, documentId, 'Document', ownerId, 'User', 'CREATED_BY', {}, 1.00, 'system', 'Direct document owner upload assignment');
  }

  // 2. Link Document to Department (BELONGS_TO_DEPARTMENT)
  if (department) {
    await queueGraphNodeLink(organizationId, documentId, 'Document', department, 'Department', 'BELONGS_TO_DEPARTMENT', {}, 0.95, 'ai', 'Derived from classification department field');
  }

  // 3. Link based on metadata tags or vendors if present
  if (metadata.vendorName) {
    await queueGraphNodeLink(organizationId, documentId, 'Document', metadata.vendorName, 'Vendor', 'ASSOCIATED_WITH_VENDOR', {}, 0.90, 'ai', 'Extracted via intelligent metadata normalization service');
  }

  if (metadata.projectName) {
    await queueGraphNodeLink(organizationId, documentId, 'Document', metadata.projectName, 'Project', 'ASSOCIATED_WITH_PROJECT', {}, 0.85, 'ai', 'Extracted via Smart Metadata OCR tagging');
  }

  if (metadata.policyReference) {
    await queueGraphNodeLink(organizationId, documentId, 'Document', metadata.policyReference, 'Policy', 'ASSOCIATED_WITH_POLICY', {}, 0.85, 'ai', 'Identified standard policy cross reference');
  }
};

export default {
  queueGraphNodeLink,
  prepareDocumentGraphLinks
};
