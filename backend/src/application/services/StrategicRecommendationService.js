import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class StrategicRecommendationService {
  /**
   * Generates or retrieves prioritized strategic actions based on Twin vulnerability indices and simulation logs.
   */
  async generateRecommendations(organizationId) {
    try {
      logger.info(`[StrategicRecommendationService] Generating strategic recommendations for org: ${organizationId}`);

      // 1. Check current resilience status
      const resRes = await query(
        `SELECT * FROM resilience_metrics WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [organizationId]
      );
      const metrics = resRes.rows[0] || {
        enterprise_score: 90.0,
        business_continuity: 90.0,
        operational_stability: 90.0,
        compliance_stability: 90.0,
        vendor_stability: 90.0,
        knowledge_stability: 90.0,
        ai_stability: 90.0,
        recovery_capability: 90.0
      };

      const generatedRecs = [];

      // 2. Analyze weak points and compile specific actions
      if (parseFloat(metrics.vendor_stability) < 85) {
        generatedRecs.push({
          recommendation: 'Adopt multi-region database redundancy and secondary domain name registers to mitigate core vendor outage risks.',
          priority: 'Critical',
          source: 'Twin Analysis',
          details: {
            expectedRoi: 35.5,
            riskReduction: 48.0,
            expectedCost: 15000.00,
            successProbability: 94.0,
            benefit: 'Guarantees 99.99% system availability'
          }
        });
      } else {
        generatedRecs.push({
          recommendation: 'Initiate monthly performance benchmarks for tier-1 service providers to maintain optimal routing efficiency.',
          priority: 'Low',
          source: 'Twin Analysis',
          details: {
            expectedRoi: 12.0,
            riskReduction: 15.0,
            expectedCost: 3500.00,
            successProbability: 97.0,
            benefit: 'Improves response time predictability'
          }
        });
      }

      if (parseFloat(metrics.compliance_stability) < 85) {
        generatedRecs.push({
          recommendation: 'Deploy real-time consent review hooks in onboarding portals to satisfy strict DPDP data storage regulations.',
          priority: 'High',
          source: 'Risk Forecast',
          details: {
            expectedRoi: 25.0,
            riskReduction: 60.0,
            expectedCost: 8000.00,
            successProbability: 90.0,
            benefit: 'Eliminates compliance audit fines'
          }
        });
      } else {
        generatedRecs.push({
          recommendation: 'Perform an annual regulatory review to align data retention rules with regional updates.',
          priority: 'Medium',
          source: 'Risk Forecast',
          details: {
            expectedRoi: 15.0,
            riskReduction: 25.0,
            expectedCost: 4500.00,
            successProbability: 92.0,
            benefit: 'Aligns operations with best practices'
          }
        });
      }

      if (parseFloat(metrics.knowledge_stability) < 85) {
        generatedRecs.push({
          recommendation: 'Automate code documentation extraction using internal RAG agents to capture project architectural dependencies.',
          priority: 'High',
          source: 'AI Council',
          details: {
            expectedRoi: 42.0,
            riskReduction: 35.0,
            expectedCost: 5500.00,
            successProbability: 88.0,
            benefit: 'Reduces developer offboarding drift'
          }
        });
      } else {
        generatedRecs.push({
          recommendation: 'Upgrade central knowledge index tags using entity grouping rules to expedite search queries.',
          priority: 'Low',
          source: 'AI Council',
          details: {
            expectedRoi: 18.0,
            riskReduction: 10.0,
            expectedCost: 2000.00,
            successProbability: 95.0,
            benefit: 'Saves developer search time'
          }
        });
      }

      // Default strategic recommendation
      generatedRecs.push({
        recommendation: 'Enforce dual-authorization approvals for structural model registry edits to block prompt injection payloads.',
        priority: 'High',
        source: 'Twin Analysis',
        details: {
          expectedRoi: 28.0,
          riskReduction: 40.0,
          expectedCost: 1200.00,
          successProbability: 95.0,
          benefit: 'Secures model config variables'
        }
      });

      // 3. Clear older proposed recommendations and insert fresh recommendations
      await query(
        `DELETE FROM strategic_recommendations WHERE organization_id = $1 AND status = 'Proposed'`,
        [organizationId]
      );

      for (const rec of generatedRecs) {
        await query(
          `INSERT INTO strategic_recommendations (organization_id, recommendation, source, priority, status, details)
           VALUES ($1, $2, $3, $4, 'Proposed', $5)`,
          [organizationId, rec.recommendation, rec.source, rec.priority, JSON.stringify(rec.details)]
        );
      }

      // 4. Retrieve all active recommendations
      const recsRes = await query(
        `SELECT * FROM strategic_recommendations WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return {
        success: true,
        recommendations: recsRes.rows
      };
    } catch (err) {
      logger.error('[StrategicRecommendationService] Error:', err);
      return { success: false, error: err.message };
    }
  }
}

export const strategicRecommendationService = new StrategicRecommendationService();
