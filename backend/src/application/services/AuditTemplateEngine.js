// ============================================================
// Service: AuditTemplateEngine
// Manages compliance framework templates
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class AuditTemplateEngine {
  async getTemplates(organizationId) {
    try {
      // First try to load from DB
      const result = await query(
        `SELECT * FROM audit_framework_templates`
      );
      if (result.rows.length > 0) {
        return result.rows;
      }
      
      // If empty, return standard default templates
      return this.getDefaultTemplates();
    } catch (err) {
      logger.error('Failed to get templates:', err);
      return this.getDefaultTemplates();
    }
  }

  async getTemplateByCode(frameworkCode) {
    try {
      const result = await query(
        `SELECT * FROM audit_framework_templates WHERE framework_code = $1`,
        [frameworkCode]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return this.getDefaultTemplates().find(t => t.framework_code === frameworkCode) || null;
    } catch (err) {
      logger.error(`Failed to get template for ${frameworkCode}:`, err);
      return this.getDefaultTemplates().find(t => t.framework_code === frameworkCode) || null;
    }
  }

  getDefaultTemplates() {
    return [
      {
        id: 'tpl-iso-27001',
        name: 'ISO 27001 ISMS Standard',
        framework_code: 'ISO27001',
        template_data: {
          controls: [
            { code: 'A.5.1', title: 'Information security policies', priority: 'HIGH', type: 'Administrative' },
            { code: 'A.6.1', title: 'Internal organization', priority: 'MEDIUM', type: 'Administrative' },
            { code: 'A.8.1', title: 'Responsibility for assets', priority: 'HIGH', type: 'Technical' },
            { code: 'A.9.1', title: 'Access control policy', priority: 'CRITICAL', type: 'Technical' },
            { code: 'A.10.1', title: 'Cryptographic policy', priority: 'HIGH', type: 'Technical' },
            { code: 'A.12.4', title: 'Logging and monitoring', priority: 'HIGH', type: 'Technical' },
            { code: 'A.13.1', title: 'Network security management', priority: 'HIGH', type: 'Technical' },
            { code: 'A.15.1', title: 'Information security in supplier relationships', priority: 'MEDIUM', type: 'Administrative' }
          ],
          required_evidence: [
            { name: 'Access Control Policy Document', control: 'A.9.1' },
            { name: 'Firewall Config Logs', control: 'A.13.1' },
            { name: 'Audit Log Encryption Proof', control: 'A.12.4' },
            { name: 'Supplier Risk Assessment', control: 'A.15.1' }
          ]
        }
      },
      {
        id: 'tpl-soc2',
        name: 'SOC 2 Trust Services Criteria',
        framework_code: 'SOC2',
        template_data: {
          controls: [
            { code: 'CC1.1', title: 'COSO Principle 1: Commitment to Integrity and Ethical Values', priority: 'HIGH', type: 'Administrative' },
            { code: 'CC2.1', title: 'COSO Principle 2: Oversight Responsibility', priority: 'MEDIUM', type: 'Administrative' },
            { code: 'CC6.1', title: 'Access Controls & Logical Security', priority: 'CRITICAL', type: 'Technical' },
            { code: 'CC6.2', title: 'User Registration & Access Lifecycle', priority: 'HIGH', type: 'Technical' },
            { code: 'CC7.1', title: 'Vulnerability Management & Monitoring', priority: 'HIGH', type: 'Technical' },
            { code: 'CC8.1', title: 'Change Management Controls', priority: 'HIGH', type: 'Technical' }
          ],
          required_evidence: [
            { name: 'Employee Code of Conduct Signoffs', control: 'CC1.1' },
            { name: 'Identity & Access Audit Report', control: 'CC6.1' },
            { name: 'Quarterly Access Reviews', control: 'CC6.2' },
            { name: 'External Vulnerability Scan Report', control: 'CC7.1' }
          ]
        }
      },
      {
        id: 'tpl-dpdp',
        name: 'Digital Personal Data Protection Act (DPDP)',
        framework_code: 'DPDP',
        template_data: {
          controls: [
            { code: 'SEC-1', title: 'Notice & Consent Management', priority: 'CRITICAL', type: 'Administrative' },
            { code: 'SEC-2', title: 'Data Fiduciary Security Safeguards', priority: 'HIGH', type: 'Technical' },
            { code: 'SEC-3', title: 'Data Principal Rights Fulfillment', priority: 'HIGH', type: 'Administrative' },
            { code: 'SEC-4', title: 'Data Breach Notification Timeline', priority: 'CRITICAL', type: 'Technical' }
          ],
          required_evidence: [
            { name: 'Notice and Consent Template', control: 'SEC-1' },
            { name: 'Data Minimization Policy', control: 'SEC-2' },
            { name: 'Breach Response Playbook', control: 'SEC-4' }
          ]
        }
      }
    ];
  }
}

export default new AuditTemplateEngine();
