// ============================================================
// Service: Knowledge Asset Inventory Service
// Catalogs organizational document types to measure asset coverage
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// Map of standard category names to normalized asset types
const ASSET_TYPE_MAP = {
  policy: 'Policy',
  policies: 'Policy',
  contract: 'Contract',
  contracts: 'Contract',
  vendor: 'Vendor Record',
  vendors: 'Vendor Record',
  compliance: 'Compliance Document',
  training: 'Training Document',
  sop: 'SOP',
  sops: 'SOP',
  hr: 'HR Document',
  finance: 'Finance Document'
};

/**
 * Normalizes document category to standard asset types and indexes it if matched.
 */
export const registerKnowledgeAsset = async (organizationId, documentId, title, rawCategory, department) => {
  try {
    const cleanCat = String(rawCategory || '').trim().toLowerCase();
    const assetType = ASSET_TYPE_MAP[cleanCat] || null;

    if (!assetType) {
      return null; // Skip registering general/uncategorized documents as assets
    }

    const res = await query(
      `INSERT INTO knowledge_assets (organization_id, document_id, asset_type, title, department)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (document_id) DO UPDATE SET 
         asset_type = EXCLUDED.asset_type, 
         title = EXCLUDED.title, 
         department = EXCLUDED.department
       RETURNING id`,
      [organizationId, documentId, assetType, title, department || 'General']
    );
    logger.info(`📦 Registered knowledge asset: [${assetType}] - "${title}"`);
    return res.rows[0].id;
  } catch (err) {
    logger.error(`Failed to register knowledge asset: ${err.message}`);
    return null;
  }
};

/**
 * Get cataloged assets summary
 */
export const getKnowledgeAssetCoverage = async (organizationId) => {
  try {
    const res = await query(
      `SELECT asset_type, COUNT(*) as count 
       FROM knowledge_assets 
       WHERE organization_id = $1 
       GROUP BY asset_type 
       ORDER BY count DESC`,
      [organizationId]
    );
    return res.rows;
  } catch (err) {
    logger.error(`Failed to fetch asset coverage: ${err.message}`);
    return [];
  }
};

export default { registerKnowledgeAsset, getKnowledgeAssetCoverage };
