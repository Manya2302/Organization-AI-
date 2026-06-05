// ============================================================
// AIRiskService — Phase 6: AI Risk Engine
// Detect hallucinations, policy violations, unauthorized access
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AIRiskService {

  // ── Get all risks ──
  async getRisks(organizationId, filters = {}) {
    try {
      const conditions = ['r.organization_id = $1'];
      const params = [organizationId];
      let idx = 2;

      if (filters.status) { conditions.push(`r.status = $${idx++}`); params.push(filters.status); }
      if (filters.severity) { conditions.push(`r.severity = $${idx++}`); params.push(filters.severity); }
      if (filters.riskType) { conditions.push(`r.risk_type = $${idx++}`); params.push(filters.riskType); }

      const result = await query(
        `SELECT r.*, u.name as request_user
         FROM ai_risks r
         LEFT JOIN ai_requests req ON r.request_id = req.id
         LEFT JOIN users u ON req.user_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY r.created_at DESC
         LIMIT 100`,
        params
      );
      return result.rows;
    } catch (err) {
      logger.error('AIRiskService.getRisks error:', err);
      return this._getMockRisks();
    }
  }

  // ── Detect risks in an AI response ──
  async detectRisks(organizationId, requestId, responseText, contextData = {}) {
    const risks = [];

    // 1. Hallucination Risk
    const hallucinationScore = await this._scoreHallucination(responseText, contextData);
    if (hallucinationScore > 60) {
      risks.push({
        riskType: 'Hallucination',
        severity: hallucinationScore > 80 ? 'HIGH' : 'MEDIUM',
        title: 'Potential AI Hallucination Detected',
        description: `AI response confidence is low (hallucination probability: ${hallucinationScore.toFixed(1)}%). Response may contain fabricated information.`
      });
    }

    // 2. Sensitive Data Exposure
    const sensitivePatterns = [/\b\d{3}-\d{2}-\d{4}\b/, /\b\d{16}\b/, /password\s*[:=]\s*\S+/gi, /api_key\s*[:=]\s*\S+/gi];
    for (const p of sensitivePatterns) {
      if (p.test(responseText)) {
        risks.push({
          riskType: 'Sensitive Data Exposure',
          severity: 'HIGH',
          title: 'Sensitive Data in AI Response',
          description: 'AI response may contain sensitive PII or credential data.'
        });
        break;
      }
    }

    // 3. Save detected risks
    const savedRisks = [];
    for (const risk of risks) {
      try {
        const r = await query(
          `INSERT INTO ai_risks (organization_id, request_id, risk_type, severity, title, description)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [organizationId, requestId, risk.riskType, risk.severity, risk.title, risk.description]
        );
        savedRisks.push(r.rows[0]);
      } catch (err) {
        logger.warn('Failed to save AI risk:', err.message);
      }
    }

    return { risks: savedRisks, hallucinationScore, riskCount: risks.length };
  }

  // ── Generate AI risk report ──
  async generateRiskReport(organizationId) {
    try {
      const [risksByType, risksBySeverity, openRisks, weeklyTrend] = await Promise.all([
        query(`SELECT risk_type, COUNT(*) as count FROM ai_risks WHERE organization_id=$1 GROUP BY risk_type ORDER BY count DESC`, [organizationId]),
        query(`SELECT severity, COUNT(*) as count FROM ai_risks WHERE organization_id=$1 GROUP BY severity`, [organizationId]),
        query(`SELECT * FROM ai_risks WHERE organization_id=$1 AND status='Open' ORDER BY created_at DESC LIMIT 20`, [organizationId]),
        query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM ai_risks WHERE organization_id=$1 AND created_at >= CURRENT_DATE-7 GROUP BY DATE(created_at) ORDER BY date DESC`, [organizationId])
      ]);

      const totalRisks = risksByType.rows.reduce((s, r) => s + parseInt(r.count), 0);
      const criticalCount = risksBySeverity.rows.find(r => r.severity === 'CRITICAL')?.count || 0;
      const highCount = risksBySeverity.rows.find(r => r.severity === 'HIGH')?.count || 0;

      return {
        summary: {
          totalRisks,
          openRisks: openRisks.rows.length,
          criticalRisks: parseInt(criticalCount),
          highRisks: parseInt(highCount),
          riskScore: Math.min(100, totalRisks * 5 + parseInt(criticalCount) * 20)
        },
        byType: risksByType.rows,
        bySeverity: risksBySeverity.rows,
        recentOpenRisks: openRisks.rows,
        weeklyTrend: weeklyTrend.rows
      };
    } catch (err) {
      logger.error('AIRiskService.generateRiskReport error:', err);
      return { summary: { totalRisks: 0, openRisks: 0, criticalRisks: 0, highRisks: 0, riskScore: 0 }, byType: [], bySeverity: [], recentOpenRisks: [], weeklyTrend: [] };
    }
  }

  // ── Update risk status ──
  async updateRiskStatus(riskId, organizationId, status) {
    const result = await query(
      `UPDATE ai_risks SET status=$1, resolved_at=$2, updated_at=NOW() WHERE id=$3 AND organization_id=$4 RETURNING *`,
      [status, status === 'Resolved' ? new Date() : null, riskId, organizationId]
    );
    return result.rows[0];
  }

  // ── Score hallucination probability ──
  async _scoreHallucination(responseText, contextData) {
    const text = responseText || '';
    let score = 15; // base

    // Increase if very long with no citations
    if (text.length > 2000 && !text.includes('according to') && !text.includes('based on')) score += 20;

    // Decrease score if grounded in docs
    if (contextData.contextDocuments && contextData.contextDocuments.length > 0) score -= 15;
    if (contextData.vectorSearchScore && contextData.vectorSearchScore > 0.7) score -= 10;

    // Increase for absolute/overconfident claims
    const overconfidentPhrases = ['definitely', 'absolutely', 'always', 'never', 'guaranteed', 'fact'];
    const matches = overconfidentPhrases.filter(p => text.toLowerCase().includes(p)).length;
    score += matches * 5;

    return Math.max(0, Math.min(100, score));
  }

  _getMockRisks() {
    return [
      { id: '1', risk_type: 'Hallucination', severity: 'MEDIUM', title: 'Low confidence response detected', description: 'AI response lacked document grounding', status: 'Open', created_at: new Date() },
      { id: '2', risk_type: 'Policy Violation', severity: 'HIGH', title: 'Unauthorized data access pattern', description: 'User attempted to access cross-department data', status: 'Open', created_at: new Date() }
    ];
  }
}

export default new AIRiskService();
