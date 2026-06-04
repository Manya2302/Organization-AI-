// ============================================================
// Service: ComplianceMappingService
// Maps documents and controls to regulatory frameworks
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// Keyword-based auto-mapping rules per framework
const FRAMEWORK_KEYWORDS = {
  DPDP: ['personal data', 'consent', 'data principal', 'data fiduciary', 'privacy', 'data protection', 'dpdp', 'grievance', 'breach notification'],
  ISO27001: ['information security', 'isms', 'iso 27001', 'risk assessment', 'access control', 'incident management', 'asset management', 'cryptography', 'supplier'],
  SOC2: ['trust services', 'soc2', 'soc 2', 'availability', 'confidentiality', 'processing integrity', 'security criteria', 'service organization'],
  GDPR: ['gdpr', 'data subject', 'lawful basis', 'controller', 'processor', 'right to erasure', 'data portability', 'dpa', 'supervisory authority'],
  HIPAA: ['hipaa', 'phi', 'protected health', 'covered entity', 'business associate', 'minimum necessary', 'safeguards', 'health information']
};

class ComplianceMappingService {
  async autoMapDocumentsToFrameworks(organizationId) {
    try {
      const docsRes = await query(
        `SELECT d.id, d.name, d.category, COALESCE(d.ocr_text, '') as ocr_text
         FROM documents d
         WHERE d.organization_id = $1 AND d.is_deleted = FALSE`,
        [organizationId]
      );

      const frameworksRes = await query(
        `SELECT id, short_name FROM compliance_frameworks WHERE organization_id = $1 AND is_active = TRUE`,
        [organizationId]
      );

      const frameworkMap = {};
      for (const fw of frameworksRes.rows) frameworkMap[fw.short_name] = fw.id;

      let mapped = 0;
      for (const doc of docsRes.rows) {
        const content = `${doc.name} ${doc.category} ${doc.ocr_text}`.toLowerCase();

        for (const [shortName, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
          const fwId = frameworkMap[shortName];
          if (!fwId) continue;

          const matchCount = keywords.filter(kw => content.includes(kw)).length;
          if (matchCount === 0) continue;

          const relevance = Math.min(100, matchCount * 20);
          try {
            await query(
              `INSERT INTO control_mappings
               (organization_id, control_id, document_id, framework_id, mapping_type, relevance_score)
               VALUES ($1, NULL, $2, $3, 'Auto-Mapped', $4)
               ON CONFLICT DO NOTHING`,
              [organizationId, doc.id, fwId, relevance]
            );

            await query(
              `INSERT INTO policy_compliance
               (organization_id, document_id, framework_id, policy_name, compliance_status, next_review_date)
               VALUES ($1, $2, $3, $4, 'Under Review', NOW() + INTERVAL '1 year')
               ON CONFLICT DO NOTHING`,
              [organizationId, doc.id, fwId, doc.name]
            );
            mapped++;
          } catch { /* conflict = already mapped */ }
        }
      }

      return { success: true, mapped };
    } catch (err) {
      logger.error('Failed to auto-map documents to frameworks:', err);
      return { success: false, mapped: 0 };
    }
  }

  async autoMapControlsToFrameworks(organizationId) {
    try {
      const controlsRes = await query(
        `SELECT id, control_code, title, description FROM compliance_controls WHERE organization_id = $1`,
        [organizationId]
      );

      const frameworksRes = await query(
        `SELECT id, short_name FROM compliance_frameworks WHERE organization_id = $1 AND is_active = TRUE`,
        [organizationId]
      );

      const frameworkMap = {};
      for (const fw of frameworksRes.rows) frameworkMap[fw.short_name] = fw.id;

      const controlFrameworkHints = {
        'ACC': ['ISO27001', 'SOC2'],
        'DAT': ['DPDP', 'GDPR', 'ISO27001'],
        'INC': ['ISO27001', 'SOC2', 'HIPAA'],
        'VEN': ['ISO27001', 'SOC2'],
        'BCK': ['ISO27001', 'SOC2', 'HIPAA'],
        'AUD': ['ISO27001', 'SOC2', 'GDPR'],
        'TRN': ['ISO27001', 'DPDP', 'HIPAA'],
        'CHG': ['ISO27001', 'SOC2'],
        'VUL': ['ISO27001', 'SOC2'],
        'NET': ['ISO27001', 'SOC2'],
        'PHY': ['ISO27001']
      };

      let mapped = 0;
      for (const ctrl of controlsRes.rows) {
        const prefix = ctrl.control_code.split('-')[0];
        const targetFrameworks = controlFrameworkHints[prefix] || ['ISO27001'];

        for (const fw of targetFrameworks) {
          const fwId = frameworkMap[fw];
          if (!fwId) continue;
          try {
            await query(
              `INSERT INTO control_assignments (organization_id, control_id, framework_id, requirement_id)
               VALUES ($1, $2, $3, NULL)
               ON CONFLICT DO NOTHING`,
              [organizationId, ctrl.id, fwId]
            );
            mapped++;
          } catch { /* skip */ }
        }
      }

      return { success: true, mapped };
    } catch (err) {
      logger.error('Failed to auto-map controls to frameworks:', err);
      return { success: false, mapped: 0 };
    }
  }

  async getMappingsForDocument(organizationId, documentId) {
    try {
      const res = await query(
        `SELECT cm.*, cf.name as framework_name, cf.short_name, cc.title as control_title, cc.control_code
         FROM control_mappings cm
         LEFT JOIN compliance_frameworks cf ON cm.framework_id = cf.id
         LEFT JOIN compliance_controls cc ON cm.control_id = cc.id
         WHERE cm.organization_id = $1 AND cm.document_id = $2`,
        [organizationId, documentId]
      );
      return { success: true, mappings: res.rows };
    } catch (err) {
      logger.error('Failed to get document mappings:', err);
      return { success: false, mappings: [] };
    }
  }

  async getMappingsForControl(organizationId, controlId) {
    try {
      const res = await query(
        `SELECT ca.*, cf.name as framework_name, cf.short_name,
                cr.requirement_code, cr.title as requirement_title
         FROM control_assignments ca
         JOIN compliance_frameworks cf ON ca.framework_id = cf.id
         LEFT JOIN compliance_requirements cr ON ca.requirement_id = cr.id
         WHERE ca.organization_id = $1 AND ca.control_id = $2`,
        [organizationId, controlId]
      );
      return { success: true, mappings: res.rows };
    } catch (err) {
      logger.error('Failed to get control mappings:', err);
      return { success: false, mappings: [] };
    }
  }

  async getFrameworkCoverageMatrix(organizationId) {
    try {
      const res = await query(
        `SELECT cf.short_name as framework,
                COUNT(DISTINCT ca.control_id) as controls_mapped,
                COUNT(DISTINCT cm.document_id) as documents_mapped,
                COUNT(DISTINCT pc.document_id) as policies_mapped
         FROM compliance_frameworks cf
         LEFT JOIN control_assignments ca ON ca.framework_id = cf.id AND ca.organization_id = $1
         LEFT JOIN control_mappings cm ON cm.framework_id = cf.id AND cm.organization_id = $1
         LEFT JOIN policy_compliance pc ON pc.framework_id = cf.id AND pc.organization_id = $1
         WHERE cf.organization_id = $1 AND cf.is_active = TRUE
         GROUP BY cf.id, cf.short_name`,
        [organizationId]
      );
      return { success: true, matrix: res.rows };
    } catch (err) {
      logger.error('Failed to get framework coverage matrix:', err);
      return { success: false, matrix: [] };
    }
  }
}

export default new ComplianceMappingService();
