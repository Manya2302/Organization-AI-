import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { GraphReadinessService } from './GraphReadinessService.js';
import { KnowledgeRiskService } from './KnowledgeRiskService.js';

export class MaturityModelService {
  static async calculateMaturityScore(organizationId) {
    try {
      // 1. Get Graph Readiness Score
      const readiness = await GraphReadinessService.getLatestMetrics(organizationId);
      const graphReadinessScore = parseFloat(readiness?.graph_readiness_score || 40);

      // 2. Get Knowledge Risk Score (invert so higher is better)
      const risk = await KnowledgeRiskService.getLatestRiskMetrics(organizationId);
      const riskScore = parseFloat(risk?.knowledge_risk_score || 30);
      const riskInverted = 100 - riskScore;

      // 3. Get Search Evaluation Quality (success rate)
      const searchRes = await query(
        `SELECT COUNT(*) FILTER(WHERE success = TRUE) as success, COUNT(*) as total 
         FROM search_quality_metrics WHERE organization_id = $1`,
        [organizationId]
      );
      const totalSearches = parseInt(searchRes.rows[0]?.total || 0);
      const searchSuccessRate = totalSearches > 0 
        ? Math.round((parseInt(searchRes.rows[0]?.success || 0) / totalSearches) * 100)
        : 85;

      // 4. Get human validation success rate
      const valRes = await query(
        `SELECT COUNT(*) FILTER(WHERE validation_feedback = 'approved') as approved, COUNT(*) as total 
         FROM validation_logs WHERE organization_id = $1`,
        [organizationId]
      );
      const totalValidations = parseInt(valRes.rows[0]?.total || 0);
      const validationRate = totalValidations > 0
        ? Math.round((parseInt(valRes.rows[0]?.approved || 0) / totalValidations) * 100)
        : 90;

      // 5. Query entity & relationship ratio
      const totalDocsRes = await query(
        `SELECT COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE`,
        [organizationId]
      );
      const totalDocs = parseInt(totalDocsRes.rows[0]?.count || 1);

      const classRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE AND category IS NOT NULL AND category != 'General'`,
        [organizationId]
      );
      const documentationCoverage = Math.round((parseInt(classRes.rows[0]?.count || 0) / totalDocs) * 100);

      // Average composite score
      const intelligenceScore = Math.round(
        (graphReadinessScore + riskInverted + searchSuccessRate + validationRate + documentationCoverage) / 5
      );

      // Maturity Level: Starter, Developing, Advanced, Enterprise, Knowledge Driven
      let maturityLevel = 'Starter';
      if (intelligenceScore >= 85) maturityLevel = 'Knowledge Driven';
      else if (intelligenceScore >= 70) maturityLevel = 'Enterprise';
      else if (intelligenceScore >= 50) maturityLevel = 'Advanced';
      else if (intelligenceScore >= 30) maturityLevel = 'Developing';

      const res = await query(
        `INSERT INTO organization_intelligence_metrics (organization_id, intelligence_score, maturity_level, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (organization_id)
         DO UPDATE SET 
           intelligence_score = EXCLUDED.intelligence_score,
           maturity_level = EXCLUDED.maturity_level,
           updated_at = NOW()
         RETURNING *`,
        [organizationId, intelligenceScore, maturityLevel]
      );

      // Populate memory candidates in background to prepare Graph visualizer
      await this.prepareMemoryCandidates(organizationId);

      return res.rows[0];
    } catch (err) {
      logger.error('Error calculating maturity score:', err);
      throw err;
    }
  }

  static async getMaturityMetrics(organizationId) {
    const res = await query(
      `SELECT * FROM organization_intelligence_metrics WHERE organization_id = $1`,
      [organizationId]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return await this.calculateMaturityScore(organizationId);
  }

  static async prepareMemoryCandidates(organizationId) {
    try {
      // Fetch distinct departments, employees (users), categories, vendors, etc.
      // Insert them as organizational memory node candidates
      const depts = await query(
        `SELECT DISTINCT department FROM users WHERE organization_id = $1 AND department IS NOT NULL`,
        [organizationId]
      );
      for (const row of depts.rows) {
        await this.addMemoryCandidate(organizationId, 'Department', row.department, { source: 'User list' });
      }

      const users = await query(
        `SELECT id, name, designation, department FROM users WHERE organization_id = $1`,
        [organizationId]
      );
      for (const row of users.rows) {
        await this.addMemoryCandidate(organizationId, 'Employee', row.name, { userId: row.id, role: row.designation, department: row.department });
      }

      const vendors = await query(
        `SELECT DISTINCT canonical_name FROM entity_deduplication_registry 
         WHERE organization_id = $1 AND entity_type = 'Vendor'`,
        [organizationId]
      );
      for (const row of vendors.rows) {
        await this.addMemoryCandidate(organizationId, 'Vendor', row.canonical_name, { source: 'Entity registry' });
      }
    } catch (err) {
      logger.error('Error preparing organizational memory candidates:', err);
    }
  }

  static async addMemoryCandidate(orgId, type, name, details = {}) {
    try {
      await query(
        `INSERT INTO organizational_memory_candidates (organization_id, candidate_type, candidate_name, details, confidence_score)
         VALUES ($1, $2, $3, $4, 0.95)
         ON CONFLICT DO NOTHING`, // No conflict constraints on candidate table, simple check or append is fine
        [orgId, type, name, JSON.stringify(details)]
      );
    } catch {}
  }

  static async listMemoryCandidates(organizationId) {
    const res = await query(
      `SELECT * FROM organizational_memory_candidates WHERE organization_id = $1 
       ORDER BY candidate_type, candidate_name`,
      [organizationId]
    );
    return res.rows;
  }
}
