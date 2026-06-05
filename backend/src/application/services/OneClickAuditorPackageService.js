// ============================================================
// Service: OneClickAuditorPackageService
// Builds a complete auditor package with evidence, controls, policies, findings and summary.
// ============================================================
import crypto from 'crypto';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import evidencePackageService from './EvidencePackageService.js';
import auditFindingsService from './AuditFindingsService.js';
import executiveAuditReportingService from './ExecutiveAuditReportingService.js';

class OneClickAuditorPackageService {
  async generate(planId, organizationId, userId, options = {}) {
    try {
      const basePackage = await evidencePackageService.buildPackage(planId, organizationId, userId, {
        ...options,
        packageType: 'One-Click Auditor Package',
        outputFormats: ['ZIP']
      });
      const [controls, policies, findings, report] = await Promise.all([
        query(
          `SELECT * FROM audit_control_analysis WHERE audit_plan_id = $1 AND organization_id = $2 ORDER BY control_code`,
          [planId, organizationId]
        ),
        query(
          `SELECT * FROM policy_compliance WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 100`,
          [organizationId]
        ),
        auditFindingsService.getFindings(planId, organizationId),
        executiveAuditReportingService.generateReport(organizationId, userId, planId, 'Auditor Package Summary')
      ]);

      const manifest = {
        packageId: basePackage.package.id,
        zipReady: true,
        sections: [
          { name: 'Executive Summary', count: 1 },
          { name: 'Controls', count: controls.rows.length },
          { name: 'Evidence', count: basePackage.items.length },
          { name: 'Policies', count: policies.rows.length },
          { name: 'Findings', count: findings.length }
        ],
        controls: controls.rows.map((item) => ({
          controlCode: item.control_code,
          readinessScore: item.readiness_score,
          healthScore: item.health_score,
          riskScore: item.risk_score
        })),
        policies: policies.rows.map((item) => ({
          policyName: item.policy_name,
          status: item.compliance_status,
          coverageScore: item.coverage_score
        })),
        findings: findings.map((item) => ({
          title: item.title,
          severity: item.severity,
          status: item.status,
          recommendation: item.recommendation
        })),
        summaryReportId: report.id
      };
      const zipHash = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');

      const updated = await query(
        `UPDATE audit_packages
         SET metadata = metadata || $1::jsonb,
             integrity_hash = $2,
             updated_at = NOW()
         WHERE id = $3 AND organization_id = $4
         RETURNING *`,
        [JSON.stringify({ oneClickManifest: manifest, zipHash }), zipHash, basePackage.package.id, organizationId]
      );

      return {
        package: updated.rows[0],
        manifest,
        zip: {
          status: 'Ready',
          filename: `${updated.rows[0].name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`,
          integrityHash: zipHash
        }
      };
    } catch (err) {
      logger.error('One-click auditor package failed:', err);
      throw err;
    }
  }
}

export default new OneClickAuditorPackageService();
