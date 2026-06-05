import pool from '../../infrastructure/database/connection.js';

class EvidenceMonitoringService {
  async calculateEvidenceHealthScore(organizationId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN review_status = 'Accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN review_status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN review_status = 'Rejected' THEN 1 END) as rejected
      FROM evidence_repository
      WHERE organization_id = $1
    `;
    const result = await pool.query(query, [organizationId]);
    if (result.rows.length === 0) return 100;

    const { total, accepted, pending } = result.rows[0];
    const totalCount = parseInt(total) || 0;
    if (totalCount === 0) return 100;

    // Health calculation: 100% for Accepted, 50% for Pending, 0% for Rejected
    const score = ((parseInt(accepted) * 100) + (parseInt(pending) * 50)) / totalCount;
    return Math.min(100, Math.max(0, parseFloat(score.toFixed(2))));
  }

  async checkExpirations(organizationId) {
    // Select evidence files approaching expiration (e.g. older than 365 days)
    const query = `
      SELECT *, 
             NOW() - created_at as age 
      FROM evidence_repository 
      WHERE organization_id = $1 
        AND created_at < NOW() - INTERVAL '300 days'
    `;
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  async sendExpirationReminders(organizationId) {
    const expiredEvidence = await this.checkExpirations(organizationId);
    const notifications = expiredEvidence.map(item => ({
      evidenceId: item.id,
      title: item.title,
      daysOld: Math.floor((new Date() - new Date(item.created_at)) / (1000 * 60 * 60 * 24)),
      message: `Evidence artifact '${item.title}' is approaching expiration. Please review or replace.`
    }));

    // In a real system we would send emails. Let's log these to security_audit_logs.
    for (const notification of notifications) {
      await pool.query(`
        INSERT INTO audit_logs (organization_id, action, category, details, created_at)
        VALUES ($1, 'EVIDENCE_EXPIRATION_ALERT', 'Compliance', $2, NOW())
      `, [organizationId, JSON.stringify(notification)]);
    }

    return notifications;
  }

  async getFreshnessReport(organizationId) {
    const query = `
      SELECT 
        id, title, created_at,
        CASE 
          WHEN created_at > NOW() - INTERVAL '90 days' THEN 'Fresh'
          WHEN created_at > NOW() - INTERVAL '180 days' THEN 'Stale'
          ELSE 'Needs Refresh'
        END as freshness_status
      FROM evidence_repository
      WHERE organization_id = $1
    `;
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }
}

export default new EvidenceMonitoringService();
