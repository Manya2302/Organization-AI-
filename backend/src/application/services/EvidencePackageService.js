// ============================================================
// Service: EvidencePackageService
// Generates structured auditor/control/framework evidence bundles.
// ============================================================
import crypto from 'crypto';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import evidenceQualityService from './EvidenceQualityService.js';

class EvidencePackageService {
  async buildPackage(planId, organizationId, userId, options = {}) {
    try {
      const planRes = await query(
        `SELECT * FROM audit_plans WHERE id = $1 AND organization_id = $2`,
        [planId, organizationId]
      );
      const plan = planRes.rows[0];
      if (!plan) throw new Error('Audit plan not found');

      const evidence = await query(
        `SELECT * FROM audit_evidence_recommendations
         WHERE audit_plan_id = $1 AND organization_id = $2
         ORDER BY control_code, recommended_evidence_name`,
        [planId, organizationId]
      );
      const quality = await evidenceQualityService.analyzePlan(planId, organizationId);
      const payload = {
        planId,
        framework: plan.framework,
        packageType: options.packageType || 'Auditor',
        outputFormats: options.outputFormats || ['ZIP', 'PDF', 'Excel'],
        evidenceCount: evidence.rows.length,
        mappedCount: evidence.rows.filter((item) => item.matching_document_id).length,
        quality: quality.scores
      };
      const integrityHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      const packageRes = await query(
        `INSERT INTO audit_packages
         (organization_id, audit_plan_id, name, description, audit_type, status,
          created_by, overall_score, total_evidence, package_type, integrity_hash, metadata, generated_at)
         VALUES ($1, $2, $3, $4, $5, 'Generated', $6, $7, $8, $9, $10, $11, NOW())
         RETURNING *`,
        [
          organizationId,
          planId,
          options.name || `${plan.framework} Auditor Package`,
          options.description || 'AI-generated structured audit evidence package',
          plan.audit_type || 'Internal',
          userId,
          quality.scores.readinessScore || 0,
          evidence.rows.length,
          options.packageType || 'Auditor',
          integrityHash,
          JSON.stringify(payload)
        ]
      );
      const auditPackage = packageRes.rows[0];

      for (const item of evidence.rows) {
        const qualityItem = quality.items.find((q) => q.evidenceRecommendationId === item.id);
        await query(
          `INSERT INTO audit_package_items
           (organization_id, audit_package_id, evidence_recommendation_id, document_id,
            control_code, item_name, trust_score, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            organizationId,
            auditPackage.id,
            item.id,
            item.matching_document_id,
            item.control_code,
            item.recommended_evidence_name,
            qualityItem?.trustScore || 0,
            JSON.stringify({ matchingDocumentName: item.matching_document_name, status: item.status })
          ]
        );
      }

      return { package: auditPackage, items: evidence.rows, manifest: payload };
    } catch (err) {
      logger.error('Evidence package build failed:', err);
      throw err;
    }
  }

  async getPackages(organizationId, planId = null) {
    const params = planId ? [organizationId, planId] : [organizationId];
    const where = planId ? 'organization_id = $1 AND audit_plan_id = $2' : 'organization_id = $1';
    const res = await query(
      `SELECT * FROM audit_packages WHERE ${where} ORDER BY created_at DESC`,
      params
    );
    return res.rows;
  }
}

export default new EvidencePackageService();
