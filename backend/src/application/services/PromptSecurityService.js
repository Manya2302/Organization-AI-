// ============================================================
// PromptSecurityService — Phase 6: Prompt Injection Defense
// Detects, sanitizes, and scores prompt injection threats
// ============================================================
import { logger } from '../../infrastructure/logging/logger.js';
import { query } from '../../infrastructure/database/connection.js';

export class PromptSecurityService {

  // ── Injection patterns database ──
  _getInjectionPatterns() {
    return [
      { pattern: /ignore\s+(all\s+)?(previous\s+)?(instructions?|rules?|prompts?)/gi, threat: 'instruction_override', severity: 'CRITICAL', score: 95 },
      { pattern: /forget\s+(everything|all|your\s+instructions)/gi, threat: 'context_erasure', severity: 'CRITICAL', score: 95 },
      { pattern: /you\s+are\s+now\s+(a\s+)?(different|new|another)/gi, threat: 'persona_hijack', severity: 'HIGH', score: 80 },
      { pattern: /act\s+as\s+(if\s+you\s+are|a\s+)(hacker|admin|system|root)/gi, threat: 'privilege_escalation', severity: 'HIGH', score: 85 },
      { pattern: /show\s+(me\s+)?(all\s+)?(salaries|passwords|secrets|private|confidential)/gi, threat: 'data_extraction', severity: 'HIGH', score: 80 },
      { pattern: /bypass\s+(security|restrictions?|policies|controls)/gi, threat: 'security_bypass', severity: 'HIGH', score: 80 },
      { pattern: /jailbreak|DAN|do\s+anything\s+now/gi, threat: 'jailbreak_attempt', severity: 'CRITICAL', score: 90 },
      { pattern: /\[SYSTEM\]|\[INST\]|<\|im_start\|>|<\|im_end\|>/gi, threat: 'token_injection', severity: 'HIGH', score: 85 },
      { pattern: /print\s+(the\s+)?(full\s+)?(system\s+)?(prompt|instructions)/gi, threat: 'prompt_extraction', severity: 'HIGH', score: 75 },
      { pattern: /execute\s+(this\s+)?(code|command|script)/gi, threat: 'code_injection', severity: 'MEDIUM', score: 60 },
      { pattern: /reveal\s+(confidential|private|internal|secret)/gi, threat: 'information_extraction', severity: 'HIGH', score: 70 },
      { pattern: /\{\{.*\}\}|\$\{.*\}|<script/gi, threat: 'template_injection', severity: 'HIGH', score: 75 }
    ];
  }

  // ── Analyze prompt for injection threats ──
  analyzePrompt(promptText) {
    const patterns = this._getInjectionPatterns();
    const detectedThreats = [];
    let maxScore = 0;

    for (const { pattern, threat, severity, score } of patterns) {
      if (pattern.test(promptText)) {
        detectedThreats.push({ threat, severity, score, pattern: pattern.source });
        maxScore = Math.max(maxScore, score);
      }
    }

    const isSafe = detectedThreats.length === 0;
    const injectionRiskScore = maxScore;
    const securityScore = Math.max(0, 100 - injectionRiskScore);
    const threatSeverity = detectedThreats.length > 0
      ? (detectedThreats.some(t => t.severity === 'CRITICAL') ? 'CRITICAL' :
         detectedThreats.some(t => t.severity === 'HIGH') ? 'HIGH' : 'MEDIUM')
      : 'NONE';

    return {
      isSafe,
      injectionRiskScore,
      securityScore,
      threatSeverity,
      detectedThreats,
      threatCount: detectedThreats.length
    };
  }

  // ── Sanitize prompt by removing injection patterns ──
  sanitizePrompt(promptText) {
    let sanitized = promptText;
    const patterns = this._getInjectionPatterns();
    for (const { pattern } of patterns) {
      sanitized = sanitized.replace(pattern, '[BLOCKED]');
    }
    // Remove excessive special chars used in injections
    sanitized = sanitized.replace(/\{\{|\}\}|\[SYSTEM\]|\[INST\]/gi, '');
    return sanitized.trim();
  }

  // ── Full security analysis pipeline ──
  async analyzeAndSave(organizationId, promptId, promptText) {
    const analysis = this.analyzePrompt(promptText);
    const sanitized = analysis.isSafe ? promptText : this.sanitizePrompt(promptText);

    try {
      await query(
        `INSERT INTO ai_prompt_security (organization_id, prompt_id, injection_risk_score, security_score, detected_threats, sanitized_text, is_safe, analysis_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [organizationId, promptId, analysis.injectionRiskScore, analysis.securityScore, JSON.stringify(analysis.detectedThreats), sanitized, analysis.isSafe, 'PromptSecurityService-v1']
      );
    } catch (err) {
      logger.warn('Failed to save prompt security analysis:', err.message);
    }

    return { ...analysis, sanitizedText: sanitized };
  }

  // ── Analyze an ad-hoc text (no DB save) ──
  analyzeText(text) {
    const analysis = this.analyzePrompt(text);
    const sanitized = analysis.isSafe ? text : this.sanitizePrompt(text);
    return { ...analysis, sanitizedText: sanitized };
  }

  // ── Log a security event ──
  async logSecurityEvent(organizationId, requestId, userId, threatData, ipAddress) {
    try {
      await query(
        `INSERT INTO ai_security_events (organization_id, request_id, event_type, severity, threat_type, threat_details, attacker_input, blocked, ip_address, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [organizationId, requestId, 'Prompt Injection Detected', threatData.threatSeverity || 'HIGH', threatData.detectedThreats?.[0]?.threat || 'Unknown', JSON.stringify(threatData.detectedThreats), threatData.originalText?.substring(0, 500), true, ipAddress, userId]
      );
    } catch (err) {
      logger.warn('Failed to log security event:', err.message);
    }
  }

  // ── Get security events ──
  async getSecurityEvents(organizationId, limit = 50) {
    try {
      const result = await query(
        `SELECT se.*, u.name as user_name, u.email as user_email
         FROM ai_security_events se
         LEFT JOIN users u ON se.user_id = u.id
         WHERE se.organization_id = $1
         ORDER BY se.created_at DESC
         LIMIT $2`,
        [organizationId, limit]
      );
      return result.rows;
    } catch (err) {
      logger.error('PromptSecurityService.getSecurityEvents error:', err);
      return [];
    }
  }
}

export default new PromptSecurityService();
