// ============================================================
// Infrastructure: AI Repository (Phase 2)
// Database operations for AI intelligence data
// ============================================================
import { query } from '../database/connection.js';
import { logger } from '../logging/logger.js';

// ── Document Summary CRUD ──────────────────────────────────────

export const saveSummary = async (documentId, organizationId, summaryData) => {
  const {
    short_summary, detailed_summary, executive_summary,
    key_highlights, risks, important_dates, important_names,
    action_items, word_count, reading_time_minutes,
    confidence_score, model_used
  } = summaryData;

  const result = await query(
    `INSERT INTO document_summaries (
      document_id, organization_id,
      short_summary, detailed_summary, executive_summary,
      key_highlights, risks, important_dates, important_names, action_items,
      word_count, reading_time_minutes, confidence_score, model_used
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (document_id) DO UPDATE SET
      short_summary = EXCLUDED.short_summary,
      detailed_summary = EXCLUDED.detailed_summary,
      executive_summary = EXCLUDED.executive_summary,
      key_highlights = EXCLUDED.key_highlights,
      risks = EXCLUDED.risks,
      important_dates = EXCLUDED.important_dates,
      important_names = EXCLUDED.important_names,
      action_items = EXCLUDED.action_items,
      word_count = EXCLUDED.word_count,
      reading_time_minutes = EXCLUDED.reading_time_minutes,
      confidence_score = EXCLUDED.confidence_score,
      model_used = EXCLUDED.model_used,
      updated_at = NOW()
    RETURNING *`,
    [
      documentId, organizationId,
      short_summary, detailed_summary, executive_summary,
      JSON.stringify(key_highlights || []),
      JSON.stringify(risks || []),
      JSON.stringify(important_dates || []),
      JSON.stringify(important_names || []),
      JSON.stringify(action_items || []),
      word_count || 0, reading_time_minutes || 0,
      confidence_score || 0,
      model_used || process.env.OLLAMA_MODEL || 'qwen3:8b'
    ]
  );
  return result.rows[0];
};

export const getSummaryByDocumentId = async (documentId, organizationId) => {
  const result = await query(
    `SELECT * FROM document_summaries 
     WHERE document_id = $1 AND organization_id = $2`,
    [documentId, organizationId]
  );
  return result.rows[0] || null;
};

// ── Document Classification CRUD ───────────────────────────────

export const saveClassification = async (documentId, organizationId, classData) => {
  const {
    doc_type, primary_category, department, sub_category,
    keywords, topics, risk_level, confidentiality_level,
    importance_score, language, sentiment, confidence_score
  } = classData;

  const result = await query(
    `INSERT INTO document_classifications (
      document_id, organization_id,
      doc_type, primary_category, department, sub_category,
      keywords, topics, risk_level, confidentiality_level,
      importance_score, language, sentiment, confidence_score,
      model_used
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (document_id) DO UPDATE SET
      doc_type = EXCLUDED.doc_type,
      primary_category = EXCLUDED.primary_category,
      department = EXCLUDED.department,
      sub_category = EXCLUDED.sub_category,
      keywords = EXCLUDED.keywords,
      topics = EXCLUDED.topics,
      risk_level = EXCLUDED.risk_level,
      confidentiality_level = EXCLUDED.confidentiality_level,
      importance_score = EXCLUDED.importance_score,
      sentiment = EXCLUDED.sentiment,
      confidence_score = EXCLUDED.confidence_score,
      updated_at = NOW()
    RETURNING *`,
    [
      documentId, organizationId,
      doc_type || 'Other', primary_category || 'General',
      department || 'General', sub_category || '',
      JSON.stringify(keywords || []),
      JSON.stringify(topics || []),
      risk_level || 'low', confidentiality_level || 'internal',
      importance_score || 0.5, language || 'en',
      sentiment || 'neutral', confidence_score || 0,
      process.env.OLLAMA_MODEL || 'qwen3:8b'
    ]
  );

  // Also update the document's category and department based on AI classification
  if (primary_category) {
    await query(
      `UPDATE documents SET 
       category = COALESCE(NULLIF($1,''), category),
       department = COALESCE(NULLIF($2,''), department),
       updated_at = NOW()
       WHERE id = $3`,
      [primary_category, department, documentId]
    );
  }

  return result.rows[0];
};

export const getClassificationByDocumentId = async (documentId, organizationId) => {
  const result = await query(
    `SELECT * FROM document_classifications 
     WHERE document_id = $1 AND organization_id = $2`,
    [documentId, organizationId]
  );
  return result.rows[0] || null;
};

// ── Document Relationships CRUD ─────────────────────────────────

export const saveDocumentRelationship = async (sourceId, targetId, organizationId, type, score, confidence = 1.00, source = 'ai', reasoning = 'Direct similarity link') => {
  try {
    await query(
      `INSERT INTO document_relationships 
       (source_document_id, target_document_id, organization_id, relationship_type, similarity_score, relationship_confidence, relationship_source, relationship_reasoning)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (source_document_id, target_document_id) DO UPDATE SET
         relationship_type = EXCLUDED.relationship_type,
         similarity_score = EXCLUDED.similarity_score,
         relationship_confidence = EXCLUDED.relationship_confidence,
         relationship_source = EXCLUDED.relationship_source,
         relationship_reasoning = EXCLUDED.relationship_reasoning,
         detected_at = NOW()`,
      [sourceId, targetId, organizationId, type, score, confidence, source, reasoning]
    );
  } catch (err) {
    logger.warn(`Failed to save relationship ${sourceId} -> ${targetId}: ${err.message}`);
  }
};

export const getDocumentRelationships = async (documentId, organizationId) => {
  const result = await query(
    `SELECT dr.*, 
       d.name as related_doc_name, d.category as related_doc_category,
       d.department as related_doc_department, d.file_size as related_file_size
     FROM document_relationships dr
     JOIN documents d ON (
       CASE WHEN dr.source_document_id = $1 THEN dr.target_document_id 
            ELSE dr.source_document_id END = d.id
     )
     WHERE (dr.source_document_id = $1 OR dr.target_document_id = $1)
       AND dr.organization_id = $2
       AND NOT d.is_deleted
     ORDER BY dr.similarity_score DESC`,
    [documentId, organizationId]
  );
  return result.rows;
};

// ── AI Interactions Logging ─────────────────────────────────────

export const logAIInteraction = async ({
  organizationId, userId, documentId,
  interactionType, inputTokens, outputTokens,
  latencyMs, modelUsed, status, errorMessage, metadata
}) => {
  try {
    await query(
      `INSERT INTO ai_interactions (
        organization_id, user_id, document_id,
        interaction_type, input_tokens, output_tokens,
        latency_ms, model_used, status, error_message, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        organizationId, userId, documentId || null,
        interactionType, inputTokens || 0, outputTokens || 0,
        latencyMs || 0, modelUsed || process.env.OLLAMA_MODEL || 'qwen3:8b',
        status || 'success', errorMessage || null,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (err) {
    logger.warn(`Failed to log AI interaction: ${err.message}`);
  }
};

// ── Knowledge Insights & Statistics ────────────────────────────

export const getOrganizationKnowledgeStats = async (organizationId) => {
  const [docsResult, summaryResult, classifyResult, interactResult, categoriesResult, riskResult] = await Promise.all([
    query(`SELECT COUNT(*) as total FROM documents WHERE organization_id = $1 AND NOT is_deleted`, [organizationId]),
    query(`SELECT COUNT(*) as total FROM document_summaries WHERE organization_id = $1`, [organizationId]),
    query(`SELECT COUNT(*) as total FROM document_classifications WHERE organization_id = $1`, [organizationId]),
    query(`SELECT COUNT(*) as total, SUM(latency_ms) as total_latency FROM ai_interactions WHERE organization_id = $1`, [organizationId]),
    query(`SELECT primary_category, COUNT(*) as count FROM document_classifications WHERE organization_id = $1 GROUP BY primary_category ORDER BY count DESC`, [organizationId]),
    query(`SELECT risk_level, COUNT(*) as count FROM document_classifications WHERE organization_id = $1 GROUP BY risk_level`, [organizationId]),
  ]);

  const topKeywordsResult = await query(
    `SELECT jsonb_array_elements_text(keywords) as keyword, COUNT(*) as freq
     FROM document_classifications WHERE organization_id = $1
     GROUP BY keyword ORDER BY freq DESC LIMIT 15`,
    [organizationId]
  );

  return {
    totalDocuments: parseInt(docsResult.rows[0]?.total || 0),
    summarizedDocuments: parseInt(summaryResult.rows[0]?.total || 0),
    classifiedDocuments: parseInt(classifyResult.rows[0]?.total || 0),
    totalAIInteractions: parseInt(interactResult.rows[0]?.total || 0),
    avgLatencyMs: interactResult.rows[0]?.total > 0 
      ? Math.round((interactResult.rows[0]?.total_latency || 0) / interactResult.rows[0]?.total)
      : 0,
    categoriesBreakdown: categoriesResult.rows,
    riskBreakdown: riskResult.rows,
    topKeywords: topKeywordsResult.rows
  };
};

export const getRecentAIActivity = async (organizationId, limit = 20) => {
  const result = await query(
    `SELECT ai.*, d.name as document_name, u.name as user_name
     FROM ai_interactions ai
     LEFT JOIN documents d ON ai.document_id = d.id
     LEFT JOIN users u ON ai.user_id = u.id
     WHERE ai.organization_id = $1
     ORDER BY ai.created_at DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return result.rows;
};

export const getFullDocumentIntelligence = async (documentId, organizationId) => {
  const [summary, classification, relationships] = await Promise.all([
    getSummaryByDocumentId(documentId, organizationId),
    getClassificationByDocumentId(documentId, organizationId),
    getDocumentRelationships(documentId, organizationId)
  ]);

  return { summary, classification, relationships };
};

export default {
  saveSummary,
  getSummaryByDocumentId,
  saveClassification,
  getClassificationByDocumentId,
  saveDocumentRelationship,
  getDocumentRelationships,
  logAIInteraction,
  getOrganizationKnowledgeStats,
  getRecentAIActivity,
  getFullDocumentIntelligence
};
