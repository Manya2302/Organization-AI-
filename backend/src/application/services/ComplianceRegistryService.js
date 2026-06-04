// ============================================================
// Service: ComplianceRegistryService
// Central repository for compliance frameworks, requirements & controls
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

const DEFAULT_FRAMEWORKS = [
  {
    name: 'Digital Personal Data Protection Act',
    short_name: 'DPDP',
    description: 'India\'s primary data protection legislation governing personal data processing.',
    version: '2023',
    regulatory_body: 'Ministry of Electronics & IT, India'
  },
  {
    name: 'ISO/IEC 27001:2022',
    short_name: 'ISO27001',
    description: 'International standard for information security management systems.',
    version: '2022',
    regulatory_body: 'International Organization for Standardization'
  },
  {
    name: 'System and Organization Controls 2',
    short_name: 'SOC2',
    description: 'AICPA framework for service organizations covering Trust Service Criteria.',
    version: 'TSC 2017',
    regulatory_body: 'American Institute of CPAs'
  },
  {
    name: 'General Data Protection Regulation',
    short_name: 'GDPR',
    description: 'EU regulation on data protection and privacy for individuals.',
    version: '2018',
    regulatory_body: 'European Union'
  },
  {
    name: 'Health Insurance Portability and Accountability Act',
    short_name: 'HIPAA',
    description: 'US federal law protecting sensitive patient health information.',
    version: '1996',
    regulatory_body: 'U.S. Department of Health and Human Services'
  }
];

class ComplianceRegistryService {
  async initializeFrameworks(organizationId) {
    const results = [];
    for (const fw of DEFAULT_FRAMEWORKS) {
      try {
        const res = await query(
          `INSERT INTO compliance_frameworks (organization_id, name, short_name, description, version, regulatory_body, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE)
           ON CONFLICT (organization_id, short_name) DO UPDATE
           SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()
           RETURNING *`,
          [organizationId, fw.name, fw.short_name, fw.description, fw.version, fw.regulatory_body]
        );
        results.push(res.rows[0]);
      } catch (err) {
        logger.error(`Failed to init framework ${fw.short_name}:`, err);
      }
    }
    return results;
  }

  async getFrameworks(organizationId) {
    try {
      const res = await query(
        `SELECT cf.*, 
                COUNT(DISTINCT cc.id) as control_count,
                COUNT(DISTINCT cr.id) as requirement_count
         FROM compliance_frameworks cf
         LEFT JOIN compliance_controls cc ON cc.organization_id = cf.organization_id
         LEFT JOIN compliance_requirements cr ON cr.framework_id = cf.id
         WHERE cf.organization_id = $1
         GROUP BY cf.id
         ORDER BY cf.is_custom ASC, cf.name ASC`,
        [organizationId]
      );
      return { success: true, frameworks: res.rows };
    } catch (err) {
      logger.error('Failed to get compliance frameworks:', err);
      return { success: false, frameworks: [] };
    }
  }

  async getControls(organizationId, { frameworkId, status, riskLevel } = {}) {
    try {
      let sql = `SELECT cc.*, u.name as owner_name, u.email as owner_email,
                        COUNT(DISTINCT em.id) as evidence_count,
                        COUNT(DISTINCT cr.id) as review_count
                 FROM compliance_controls cc
                 LEFT JOIN users u ON cc.owner_id = u.id
                 LEFT JOIN evidence_mappings em ON em.control_id = cc.id
                 LEFT JOIN control_reviews cr ON cr.control_id = cc.id
                 WHERE cc.organization_id = $1`;
      const params = [organizationId];

      if (status) { sql += ` AND cc.status = $${params.length + 1}`; params.push(status); }
      if (riskLevel) { sql += ` AND cc.risk_level = $${params.length + 1}`; params.push(riskLevel); }
      sql += ` GROUP BY cc.id, u.name, u.email ORDER BY cc.created_at DESC`;

      const res = await query(sql, params);
      return { success: true, controls: res.rows };
    } catch (err) {
      logger.error('Failed to get compliance controls:', err);
      return { success: false, controls: [] };
    }
  }

  async createControl(organizationId, data) {
    try {
      const res = await query(
        `INSERT INTO compliance_controls 
         (organization_id, control_code, title, description, control_type, owner_id, status, risk_level, review_frequency_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          organizationId, data.control_code, data.title, data.description,
          data.control_type || 'Preventive', data.owner_id || null,
          data.status || 'Not Started', data.risk_level || 'MEDIUM',
          data.review_frequency_days || 90
        ]
      );
      return { success: true, control: res.rows[0] };
    } catch (err) {
      logger.error('Failed to create compliance control:', err);
      return { success: false, message: err.message };
    }
  }

  async getRequirements(organizationId, frameworkId) {
    try {
      const res = await query(
        `SELECT cr.*, cf.short_name as framework_name
         FROM compliance_requirements cr
         JOIN compliance_frameworks cf ON cr.framework_id = cf.id
         WHERE cr.organization_id = $1 ${frameworkId ? 'AND cr.framework_id = $2' : ''}
         ORDER BY cr.requirement_code ASC`,
        frameworkId ? [organizationId, frameworkId] : [organizationId]
      );
      return { success: true, requirements: res.rows };
    } catch (err) {
      logger.error('Failed to get requirements:', err);
      return { success: false, requirements: [] };
    }
  }
}

export default new ComplianceRegistryService();
