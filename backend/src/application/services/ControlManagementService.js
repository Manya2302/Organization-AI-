// ============================================================
// Service: ControlManagementService
// Manages lifecycle of organizational compliance controls
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// Default control library seeded per org on first use
const STANDARD_CONTROLS = [
  { code: 'ACC-001', title: 'Access Control Policy', type: 'Preventive', risk: 'HIGH', desc: 'Define and enforce user access control procedures including least privilege and need-to-know principles.' },
  { code: 'ACC-002', title: 'Multi-Factor Authentication', type: 'Preventive', risk: 'HIGH', desc: 'Require MFA for all privileged and remote access to critical systems and data.' },
  { code: 'DAT-001', title: 'Data Classification Policy', type: 'Preventive', risk: 'HIGH', desc: 'Classify organizational data into sensitivity tiers and apply corresponding handling controls.' },
  { code: 'DAT-002', title: 'Data Retention & Disposal Policy', type: 'Preventive', risk: 'MEDIUM', desc: 'Define retention schedules and secure disposal procedures for all data categories.' },
  { code: 'DAT-003', title: 'Data Encryption at Rest', type: 'Technical', risk: 'HIGH', desc: 'Encrypt all sensitive data stored in databases, file systems, and backups using AES-256 or equivalent.' },
  { code: 'DAT-004', title: 'Data Encryption in Transit', type: 'Technical', risk: 'HIGH', desc: 'Use TLS 1.2+ for all data transmitted over networks, internal and external.' },
  { code: 'INC-001', title: 'Incident Response Plan', type: 'Corrective', risk: 'CRITICAL', desc: 'Document and test an incident response plan covering detection, containment, eradication, and recovery.' },
  { code: 'INC-002', title: 'Security Incident Log', type: 'Detective', risk: 'HIGH', desc: 'Maintain a centralized log of all security incidents with severity, timeline, and resolution notes.' },
  { code: 'VEN-001', title: 'Vendor Risk Assessment', type: 'Preventive', risk: 'HIGH', desc: 'Assess and document the security posture of all third-party vendors before onboarding.' },
  { code: 'VEN-002', title: 'Vendor Contract Review', type: 'Preventive', risk: 'MEDIUM', desc: 'Review vendor contracts annually to ensure compliance clauses and data protection terms are current.' },
  { code: 'BCK-001', title: 'Backup & Recovery Procedures', type: 'Corrective', risk: 'CRITICAL', desc: 'Define and test backup procedures for all critical systems with defined RPO and RTO targets.' },
  { code: 'BCK-002', title: 'Disaster Recovery Plan', type: 'Corrective', risk: 'CRITICAL', desc: 'Maintain and annually test a disaster recovery plan to ensure business continuity.' },
  { code: 'AUD-001', title: 'Audit Log Retention', type: 'Detective', risk: 'HIGH', desc: 'Retain audit logs for a minimum of 12 months and protect them from unauthorized modification.' },
  { code: 'AUD-002', title: 'Privileged Access Review', type: 'Detective', risk: 'HIGH', desc: 'Conduct quarterly reviews of all privileged user accounts and access rights.' },
  { code: 'TRN-001', title: 'Security Awareness Training', type: 'Preventive', risk: 'MEDIUM', desc: 'Conduct annual security awareness training for all employees and track completion.' },
  { code: 'TRN-002', title: 'Privacy Training (DPDP/GDPR)', type: 'Preventive', risk: 'HIGH', desc: 'Provide role-specific training on applicable privacy regulations including DPDP and GDPR.' },
  { code: 'CHG-001', title: 'Change Management Process', type: 'Preventive', risk: 'MEDIUM', desc: 'Document and approve all changes to production systems through a formal change management process.' },
  { code: 'VUL-001', title: 'Vulnerability Management', type: 'Detective', risk: 'HIGH', desc: 'Perform quarterly vulnerability scans and remediate critical findings within 30 days.' },
  { code: 'NET-001', title: 'Network Segmentation', type: 'Technical', risk: 'HIGH', desc: 'Segment networks to isolate sensitive systems and limit lateral movement in the event of a breach.' },
  { code: 'PHY-001', title: 'Physical Access Controls', type: 'Preventive', risk: 'MEDIUM', desc: 'Restrict physical access to data centers and server rooms to authorized personnel only.' }
];

class ControlManagementService {
  async seedStandardControls(organizationId) {
    let seeded = 0;
    for (const ctrl of STANDARD_CONTROLS) {
      try {
        await query(
          `INSERT INTO compliance_controls
           (organization_id, control_code, title, description, control_type, risk_level, status,
            review_frequency_days, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'Not Started', 90, NOW() + INTERVAL '90 days')
           ON CONFLICT (organization_id, control_code) DO NOTHING`,
          [organizationId, ctrl.code, ctrl.title, ctrl.desc, ctrl.type, ctrl.risk]
        );
        seeded++;
      } catch { /* already exists */ }
    }
    return { success: true, seeded };
  }

  async updateControl(organizationId, controlId, data) {
    try {
      const fields = [];
      const params = [organizationId, controlId];
      const allowed = ['title', 'description', 'status', 'effectiveness', 'owner_id',
                       'risk_level', 'review_frequency_days', 'implementation_notes'];
      for (const key of allowed) {
        if (data[key] !== undefined) {
          params.push(data[key]);
          fields.push(`${key} = $${params.length}`);
        }
      }
      if (data.status === 'Implemented' || data.status === 'Partially Implemented') {
        const nextReview = `NOW() + INTERVAL '${data.review_frequency_days || 90} days'`;
        fields.push(`next_review_at = ${nextReview}`, `last_reviewed_at = NOW()`);
      }
      if (fields.length === 0) return { success: false, message: 'No fields to update' };
      fields.push('updated_at = NOW()');

      const res = await query(
        `UPDATE compliance_controls SET ${fields.join(', ')}
         WHERE organization_id = $1 AND id = $2 RETURNING *`,
        params
      );
      return { success: true, control: res.rows[0] };
    } catch (err) {
      logger.error('Failed to update control:', err);
      return { success: false, message: err.message };
    }
  }

  async submitReview(organizationId, controlId, reviewerId, { status, notes, rating }) {
    try {
      const nextDate = new Date();
      const ctrl = await query('SELECT review_frequency_days FROM compliance_controls WHERE id = $1', [controlId]);
      const freq = ctrl.rows[0]?.review_frequency_days || 90;
      nextDate.setDate(nextDate.getDate() + freq);

      await query(
        `INSERT INTO control_reviews
         (organization_id, control_id, reviewer_id, review_status, review_notes, effectiveness_rating, next_review_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [organizationId, controlId, reviewerId, status || 'Completed', notes || '', rating || 3, nextDate]
      );

      await query(
        `UPDATE compliance_controls SET last_reviewed_at = NOW(), next_review_at = $1, updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [nextDate, controlId, organizationId]
      );
      return { success: true };
    } catch (err) {
      logger.error('Failed to submit control review:', err);
      return { success: false, message: err.message };
    }
  }

  async createTask(organizationId, data, createdBy) {
    try {
      const res = await query(
        `INSERT INTO compliance_tasks
         (organization_id, title, description, task_type, assigned_to, created_by, control_id, framework_id, priority, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', $10) RETURNING *`,
        [
          organizationId, data.title, data.description || null, data.task_type || 'Review',
          data.assigned_to || null, createdBy, data.control_id || null,
          data.framework_id || null, data.priority || 'MEDIUM', data.due_date || null
        ]
      );
      return { success: true, task: res.rows[0] };
    } catch (err) {
      logger.error('Failed to create compliance task:', err);
      return { success: false, message: err.message };
    }
  }

  async getTasks(organizationId, userId = null, { status, priority } = {}) {
    try {
      let sql = `SELECT ct.*, u.name as assigned_to_name, cu.name as created_by_name,
                        cc.title as control_title, cc.control_code,
                        cf.short_name as framework_name
                 FROM compliance_tasks ct
                 LEFT JOIN users u ON ct.assigned_to = u.id
                 LEFT JOIN users cu ON ct.created_by = cu.id
                 LEFT JOIN compliance_controls cc ON ct.control_id = cc.id
                 LEFT JOIN compliance_frameworks cf ON ct.framework_id = cf.id
                 WHERE ct.organization_id = $1`;
      const params = [organizationId];

      if (userId) { sql += ` AND ct.assigned_to = $${params.length + 1}`; params.push(userId); }
      if (status) { sql += ` AND ct.status = $${params.length + 1}`; params.push(status); }
      if (priority) { sql += ` AND ct.priority = $${params.length + 1}`; params.push(priority); }
      sql += ` ORDER BY CASE ct.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, ct.due_date ASC`;

      const res = await query(sql, params);
      return { success: true, tasks: res.rows };
    } catch (err) {
      logger.error('Failed to get tasks:', err);
      return { success: false, tasks: [] };
    }
  }

  async completeTask(organizationId, taskId) {
    try {
      await query(
        `UPDATE compliance_tasks SET status = 'Completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [taskId, organizationId]
      );
      return { success: true };
    } catch (err) {
      logger.error('Failed to complete task:', err);
      return { success: false };
    }
  }

  async getRisks(organizationId, { status } = {}) {
    try {
      let sql = `SELECT cr.*, cf.short_name as framework_name, cc.control_code, cc.title as control_title,
                        u.name as risk_owner_name
                 FROM compliance_risks cr
                 LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id
                 LEFT JOIN compliance_controls cc ON cr.control_id = cc.id
                 LEFT JOIN users u ON cr.risk_owner_id = u.id
                 WHERE cr.organization_id = $1`;
      const params = [organizationId];
      if (status) { sql += ` AND cr.status = $${params.length + 1}`; params.push(status); }
      sql += ` ORDER BY cr.risk_score DESC`;
      const res = await query(sql, params);
      return { success: true, risks: res.rows };
    } catch (err) {
      logger.error('Failed to get risks:', err);
      return { success: false, risks: [] };
    }
  }

  async createRisk(organizationId, data, ownerId) {
    try {
      const likelihood = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const impact = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const l = likelihood[data.likelihood] || 2;
      const i = impact[data.impact] || 2;
      const riskScore = parseFloat(((l * i / 16) * 100).toFixed(2));

      const res = await query(
        `INSERT INTO compliance_risks
         (organization_id, risk_title, risk_description, risk_category, framework_id, control_id,
          likelihood, impact, risk_score, inherent_risk_score, residual_risk_score,
          risk_owner_id, mitigation_strategy, status, review_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$12,'Open',$13) RETURNING *`,
        [
          organizationId, data.risk_title, data.description || null, data.risk_category || null,
          data.framework_id || null, data.control_id || null,
          data.likelihood || 'MEDIUM', data.impact || 'MEDIUM',
          riskScore, parseFloat((riskScore * 0.7).toFixed(2)),
          ownerId || null, data.mitigation_strategy || null, data.review_date || null
        ]
      );
      return { success: true, risk: res.rows[0] };
    } catch (err) {
      logger.error('Failed to create risk:', err);
      return { success: false, message: err.message };
    }
  }
}

export default new ControlManagementService();
