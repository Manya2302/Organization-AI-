import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class GraphReadinessService {
  static async calculateGraphReadiness(organizationId) {
    try {
      // 1. Get total documents count
      const totalRes = await query(
        `SELECT COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE`,
        [organizationId]
      );
      const totalDocs = parseInt(totalRes.rows[0]?.count || 0);
      if (totalDocs === 0) {
        return this.saveMetrics(organizationId, 0, 0, 0, 0, 0, 0, 0, 'LOW');
      }

      // 2. Get classified documents count
      const classRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND category IS NOT NULL AND category != 'General'`,
        [organizationId]
      );
      const classifiedDocs = parseInt(classRes.rows[0]?.count || 0);

      // 3. Get documents with entities
      const entRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND metadata->'entities' IS NOT NULL 
           AND jsonb_array_length(metadata->'entities') > 0`,
        [organizationId]
      );
      const docsWithEntities = parseInt(entRes.rows[0]?.count || 0);

      // 4. Get documents with relationships
      const relRes = await query(
        `SELECT COUNT(DISTINCT document_id) as count FROM document_relationships 
         WHERE organization_id = $1`,
        [organizationId]
      );
      const docsWithRelationships = parseInt(relRes.rows[0]?.count || 0);

      // 5. Get documents with summaries
      const sumRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND metadata->'summary' IS NOT NULL`,
        [organizationId]
      );
      const docsWithSummaries = parseInt(sumRes.rows[0]?.count || 0);

      // 6. Get documents with sensitivity analysis
      const sensRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND metadata->'sensitivity' IS NOT NULL`,
        [organizationId]
      );
      const docsWithSensitivity = parseInt(sensRes.rows[0]?.count || 0);

      // Compute readiness percentages
      const classifiedRatio = classifiedDocs / totalDocs;
      const entitiesRatio = docsWithEntities / totalDocs;
      const relationshipsRatio = Math.min(docsWithRelationships / Math.max(totalDocs / 2, 1), 1.0);
      const summariesRatio = docsWithSummaries / totalDocs;
      const sensitivityRatio = docsWithSensitivity / totalDocs;

      // Composite Readiness Score (0 to 100)
      const rawScore = (
        (classifiedRatio * 20) +
        (entitiesRatio * 20) +
        (relationshipsRatio * 20) +
        (summariesRatio * 20) +
        (sensitivityRatio * 20)
      ) * 100;
      
      const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

      // Readiness Levels: LOW, MEDIUM, HIGH, ENTERPRISE_READY
      let readinessLevel = 'LOW';
      if (score >= 80) readinessLevel = 'ENTERPRISE_READY';
      else if (score >= 60) readinessLevel = 'HIGH';
      else if (score >= 35) readinessLevel = 'MEDIUM';

      return await this.saveMetrics(
        organizationId,
        totalDocs,
        classifiedDocs,
        docsWithEntities,
        docsWithRelationships,
        docsWithSummaries,
        docsWithSensitivity,
        score,
        readinessLevel
      );
    } catch (err) {
      logger.error('Error calculating graph readiness:', err);
      throw err;
    }
  }

  static async saveMetrics(orgId, total, classified, entities, relationships, summaries, sensitivity, score, level) {
    const res = await query(
      `INSERT INTO graph_readiness_metrics 
       (organization_id, total_documents, classified_documents, documents_with_entities, 
        documents_with_relationships, documents_with_summaries, documents_with_sensitivity_analysis, 
        graph_readiness_score, readiness_level, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [orgId, total, classified, entities, relationships, summaries, sensitivity, score, level]
    );
    return res.rows[0];
  }

  static async getLatestMetrics(organizationId) {
    // Generate fresh numbers or return latest
    const res = await query(
      `SELECT * FROM graph_readiness_metrics 
       WHERE organization_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    // Calculate new if not present
    return await this.calculateGraphReadiness(organizationId);
  }
}
