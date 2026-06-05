// ============================================================
// Service: EvidenceFreshnessService
// Tracks expiry, renewal and missing evidence alerts.
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class EvidenceFreshnessService {
  async getFreshnessAlerts(planId, organizationId) {
    try {
      const missing = await query(
        `SELECT id, control_code, recommended_evidence_name
         FROM audit_evidence_recommendations
         WHERE audit_plan_id = $1 AND organization_id = $2
           AND (matching_document_id IS NULL OR status = 'Missing')`,
        [planId, organizationId]
      );

      const evidence = await query(
        `SELECT er.id, er.title, er.expiry_date, er.review_status,
                EXTRACT(DAY FROM (er.expiry_date - NOW()))::int AS days_until_expiry
         FROM evidence_repository er
         WHERE er.organization_id = $1 AND er.is_archived = FALSE
           AND er.expiry_date IS NOT NULL
         ORDER BY er.expiry_date ASC
         LIMIT 50`,
        [organizationId]
      );

      const expiryAlerts = evidence.rows
        .filter((item) => item.days_until_expiry <= 30)
        .map((item) => ({
          type: item.days_until_expiry < 0 ? 'Expired Evidence' : 'Evidence Expiring Soon',
          severity: item.days_until_expiry < 0 ? 'HIGH' : 'MEDIUM',
          title: item.title,
          daysUntilExpiry: item.days_until_expiry,
          evidenceId: item.id
        }));

      const missingAlerts = missing.rows.map((item) => ({
        type: 'Missing Evidence',
        severity: 'HIGH',
        title: item.recommended_evidence_name,
        controlCode: item.control_code,
        evidenceRecommendationId: item.id
      }));

      return {
        alerts: [...expiryAlerts, ...missingAlerts],
        renewalTasks: expiryAlerts.map((item) => ({
          title: `Renew ${item.title}`,
          dueInDays: Math.max(item.daysUntilExpiry || 0, 0),
          priority: item.severity
        })),
        missingEvidenceWarnings: missingAlerts
      };
    } catch (err) {
      logger.error('Evidence freshness alerts failed:', err);
      return { alerts: [], renewalTasks: [], missingEvidenceWarnings: [] };
    }
  }
}

export default new EvidenceFreshnessService();
