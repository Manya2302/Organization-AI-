import pool from '../../infrastructure/database/connection.js';
import evidenceMonitoringService from './EvidenceMonitoringService.js';

class ComplianceMonitoringService {
  async runComplianceScan(organizationId, scanType = 'Daily') {
    const alerts = [];

    // 1. Scan for Expired Evidence
    const expiredEvidence = await evidenceMonitoringService.checkExpirations(organizationId);
    if (expiredEvidence.length > 0) {
      alerts.push({
        type: 'EXPIRED_EVIDENCE',
        severity: 'HIGH',
        message: `Detected ${expiredEvidence.length} expired evidence files requiring replacement.`
      });
    }

    // 2. Scan for Failing Controls (effectiveness <= 40%)
    const failingControls = await pool.query(
      `SELECT * FROM compliance_controls WHERE organization_id = $1 AND effectiveness = 'Low'`,
      [organizationId]
    );
    if (failingControls.rows.length > 0) {
      alerts.push({
        type: 'CONTROL_FAILURE',
        severity: 'HIGH',
        message: `Detected ${failingControls.rows.length} controls under threshold effectiveness.`
      });
    }

    // 3. Scan for Pending Critical Tasks
    const criticalTasks = await pool.query(
      `SELECT * FROM compliance_tasks WHERE organization_id = $1 AND priority = 'HIGH' AND status = 'Pending'`,
      [organizationId]
    );
    if (criticalTasks.rows.length > 0) {
      alerts.push({
        type: 'PENDING_TASKS',
        severity: 'MEDIUM',
        message: `Detected ${criticalTasks.rows.length} high priority compliance tasks pending.`
      });
    }

    // Log the scan result
    await pool.query(`
      INSERT INTO audit_logs (organization_id, action, category, details, created_at)
      VALUES ($1, 'COMPLIANCE_SCAN_COMPLETE', 'Compliance', $2, NOW())
    `, [organizationId, JSON.stringify({ scanType, alertsCount: alerts.length, alerts })]);

    return {
      success: true,
      scanType,
      scannedAt: new Date(),
      alerts
    };
  }
}

export default new ComplianceMonitoringService();
