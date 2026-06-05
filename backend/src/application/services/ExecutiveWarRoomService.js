import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { resilienceService } from './ResilienceEngineService.js';
import { strategicIntelligenceService } from './StrategicIntelligenceService.js';

export class ExecutiveWarRoomService {
  async getWarRoomStatus(organizationId) {
    try {
      // Get resilience metrics
      const resilience = await resilienceService.getLatestMetrics(organizationId);
      
      // Get strategic opportunities, risks and recommendations
      const strategySummary = await strategicIntelligenceService.getStrategicSummary(organizationId);

      // Get latest simulation runs
      const sims = await query(
        `SELECT * FROM simulation_runs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [organizationId]
      );

      // Get latest active alerts
      const alerts = await query(
        `SELECT * FROM executive_alerts WHERE organization_id = $1 AND is_resolved = FALSE ORDER BY created_at DESC`,
        [organizationId]
      );

      // Get latest forecast results
      const forecasts = await query(
        `SELECT * FROM forecast_results WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [organizationId]
      );

      // Fetch or seed warroom status
      let warroomRes = await query(
        `SELECT * FROM executive_warroom WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );

      let status = 'Green';
      if (resilience && resilience.enterprise_score < 60) {
        status = 'Red';
      } else if (resilience && resilience.enterprise_score < 80) {
        status = 'Yellow';
      }

      if (warroomRes.rows.length === 0) {
        const insertRes = await query(
          `INSERT INTO executive_warroom (organization_id, status, metrics)
           VALUES ($1, $2, $3) RETURNING *`,
          [organizationId, status, JSON.stringify({ activeThreats: 0, complianceGaps: 3 })]
        );
        warroomRes = insertRes;
      } else {
        // Update status in case it changed
        await query(
          `UPDATE executive_warroom SET status = $1, metrics = $2 WHERE id = $3`,
          [status, JSON.stringify({ activeThreats: alerts.rows.length, complianceGaps: strategySummary.risks.length }), warroomRes.rows[0].id]
        );
        warroomRes.rows[0].status = status;
        warroomRes.rows[0].metrics = { activeThreats: alerts.rows.length, complianceGaps: strategySummary.risks.length };
      }

      return {
        status: warroomRes.rows[0].status,
        metrics: warroomRes.rows[0].metrics,
        resilience,
        strategySummary,
        alerts: alerts.rows,
        latestSimulations: sims.rows,
        latestForecasts: forecasts.rows
      };
    } catch (err) {
      logger.error('ExecutiveWarRoomService.getWarRoomStatus error:', err);
      return {
        status: 'Green',
        metrics: {},
        resilience: null,
        strategySummary: { recommendations: [], opportunities: [], risks: [], priorities: [] },
        alerts: [],
        latestSimulations: [],
        latestForecasts: []
      };
    }
  }

  async createAlert(organizationId, title, message, severity) {
    const res = await query(
      `INSERT INTO executive_alerts (organization_id, alert_title, alert_message, severity, is_resolved)
       VALUES ($1, $2, $3, $4, FALSE) RETURNING *`,
      [organizationId, title, message, severity]
    );
    return res.rows[0];
  }

  async resolveAlert(organizationId, alertId) {
    await query(
      `UPDATE executive_alerts SET is_resolved = TRUE WHERE id = $1 AND organization_id = $2`,
      [alertId, organizationId]
    );
    return { success: true };
  }
}

export const warRoomService = new ExecutiveWarRoomService();
