import { query } from '../database/connection.js';
import { logger } from '../logging/logger.js';

/**
 * RecommendationService — Phase 2 Final Architecture Refinements
 * Computes personalized recommendations, related policies, and contract suggestions.
 */
export const getDocumentRecommendations = async (documentId, organizationId) => {
  try {
    // 1. Fetch source document metadata
    const docResult = await query(
      `SELECT category, department, tags FROM documents WHERE id = $1 AND organization_id = $2`,
      [documentId, organizationId]
    );
    if (!docResult.rows[0]) return { relatedDocuments: [], recommendedPolicies: [] };
    const doc = docResult.rows[0];

    // 2. Fetch direct matches from document_relationships
    const relResult = await query(
      `SELECT r.target_document_id, r.similarity_score, d.name, d.category, d.department 
       FROM document_relationships r
       JOIN documents d ON r.target_document_id = d.id
       WHERE r.source_document_id = $1 AND r.organization_id = $2 AND d.is_deleted = false
       ORDER BY r.similarity_score DESC LIMIT 5`,
      [documentId, organizationId]
    );

    // 3. Fallback/Contextual: Same category/tags recommendations
    const tagMatches = await query(
      `SELECT id, name, category, department 
       FROM documents 
       WHERE id != $1 AND organization_id = $2 AND is_deleted = false 
       AND (category = $3 OR department = $4) 
       LIMIT 5`,
      [documentId, organizationId, doc.category, doc.department]
    );

    return {
      relatedDocuments: relResult.rows.map(r => ({
        id: r.target_document_id,
        name: r.name,
        category: r.category,
        department: r.department,
        matchScore: Math.round(parseFloat(r.similarity_score) * 100)
      })),
      recommendedPolicies: tagMatches.rows.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        department: t.department
      }))
    };
  } catch (err) {
    logger.error(`❌ Recommendation retrieval failed: ${err.message}`);
    return { relatedDocuments: [], recommendedPolicies: [] };
  }
};

export const getEmployeeDashboardRecommendations = async (department, organizationId) => {
  try {
    const res = await query(
      `SELECT id, name, category, department 
       FROM documents 
       WHERE organization_id = $1 AND is_deleted = false 
       AND (department = $2 OR category = 'Policies') 
       ORDER BY created_at DESC LIMIT 5`,
      [organizationId, department]
    );
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      department: r.department
    }));
  } catch (err) {
    logger.error(`❌ Employee recommendation retrieval failed: ${err.message}`);
    return [];
  }
};

export default {
  getDocumentRecommendations,
  getEmployeeDashboardRecommendations
};
