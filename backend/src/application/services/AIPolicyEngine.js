// ============================================================
// AIPolicyEngine — Phase 6: AI Policy Enforcement
// Manages and enforces AI usage, data, and compliance policies
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AIPolicyEngine {

  // ── Get all policies ──
  async getPolicies(organizationId) {
    try {
      const result = await query(
        `SELECT p.*, u.name as created_by_name
         FROM ai_access_policies p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.organization_id = $1
         ORDER BY p.created_at DESC`,
        [organizationId]
      );
      return [...result.rows, ...this._getSystemPolicies()];
    } catch (err) {
      logger.error('AIPolicyEngine.getPolicies error:', err);
      return this._getSystemPolicies();
    }
  }

  // ── Create a policy ──
  async createPolicy(organizationId, userId, policyData) {
    const { policyName, policyType, description, rules, enforcementLevel, appliesTo } = policyData;
    const result = await query(
      `INSERT INTO ai_access_policies (organization_id, policy_name, policy_type, description, rules, enforcement_level, applies_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organizationId, policyName, policyType || 'Data Access', description || '', JSON.stringify(rules || []), enforcementLevel || 'Strict', JSON.stringify(appliesTo || []), userId]
    );
    return result.rows[0];
  }

  // ── Evaluate a request against policies ──
  async evaluateRequest(organizationId, requestData) {
    const { userId, department, requestType, promptText, modelId } = requestData;
    const violations = [];

    // 1. Check department access policies
    const policies = await this.getPolicies(organizationId);
    for (const policy of policies) {
      const rules = policy.rules || [];
      const ruleList = typeof rules === 'string' ? JSON.parse(rules) : rules;

      for (const rule of ruleList) {
        const violation = this._evaluateRule(rule, requestData);
        if (violation) {
          violations.push({
            policyId: policy.id,
            policyName: policy.policy_name,
            violationType: violation.type,
            severity: violation.severity,
            details: violation.details,
            autoBlocked: rule.autoBlock || false
          });
        }
      }
    }

    // 2. Save violations
    const savedViolations = [];
    for (const v of violations) {
      try {
        const r = await query(
          `INSERT INTO ai_policy_violations (organization_id, policy_id, policy_name, violation_type, severity, details, auto_blocked)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [organizationId, v.policyId, v.policyName, v.violationType, v.severity, v.details, v.autoBlocked]
        );
        savedViolations.push(r.rows[0]);
      } catch (err) {
        logger.warn('Failed to save policy violation:', err.message);
      }
    }

    const blocked = violations.some(v => v.autoBlocked);
    return { allowed: !blocked, violations: savedViolations, blocked, violationCount: violations.length };
  }

  // ── Get policy violations ──
  async getViolations(organizationId, limit = 100) {
    try {
      const result = await query(
        `SELECT pv.*, u.name as user_name, u.email as user_email
         FROM ai_policy_violations pv
         LEFT JOIN ai_requests r ON pv.request_id = r.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE pv.organization_id = $1
         ORDER BY pv.created_at DESC
         LIMIT $2`,
        [organizationId, limit]
      );
      return result.rows;
    } catch (err) {
      logger.error('AIPolicyEngine.getViolations error:', err);
      return [];
    }
  }

  // ── Get routing rules ──
  async getRoutingRules(organizationId) {
    try {
      const result = await query(
        `SELECT mr.*, m1.model_name as preferred_model_name, m2.model_name as fallback_model_name
         FROM ai_model_routing mr
         LEFT JOIN ai_models m1 ON mr.preferred_model_id = m1.id
         LEFT JOIN ai_models m2 ON mr.fallback_model_id = m2.id
         WHERE mr.organization_id = $1`,
        [organizationId]
      );
      return result.rows;
    } catch (err) {
      return this._getDefaultRouting();
    }
  }

  _evaluateRule(rule, requestData) {
    if (rule.type === 'department_restriction' && rule.blockedDepts?.includes(requestData.department)) {
      return { type: 'Department Access Violation', severity: 'HIGH', details: `Department ${requestData.department} is restricted from this AI feature.` };
    }
    if (rule.type === 'keyword_block' && rule.keywords?.some(k => requestData.promptText?.toLowerCase().includes(k.toLowerCase()))) {
      return { type: 'Keyword Policy Violation', severity: 'HIGH', details: `Request contains prohibited keyword.` };
    }
    if (rule.type === 'model_restriction' && rule.restrictedModels?.includes(requestData.modelId)) {
      return { type: 'Model Access Violation', severity: 'MEDIUM', details: `Model ${requestData.modelId} is restricted.` };
    }
    return null;
  }

  _getSystemPolicies() {
    return [
      { id: 'sys-pol-1', policy_name: 'Cross-Tenant Isolation Policy', policy_type: 'Security', description: 'Prevent any AI operation from accessing data across organizational boundaries.', enforcement_level: 'Strict', is_active: true, rules: [{ type: 'tenant_isolation', autoBlock: true }] },
      { id: 'sys-pol-2', policy_name: 'PII Data Access Policy', policy_type: 'Data Access', description: 'Restrict AI from returning unredacted PII in responses.', enforcement_level: 'Strict', is_active: true, rules: [{ type: 'pii_block', autoBlock: true }] },
      { id: 'sys-pol-3', policy_name: 'Audit Output Approval Policy', policy_type: 'Compliance', description: 'All audit findings generated by AI must go through human approval before publication.', enforcement_level: 'Moderate', is_active: true, rules: [{ type: 'approval_required', requestTypes: ['Audit Finding', 'Executive Report'] }] },
      { id: 'sys-pol-4', policy_name: 'Prompt Injection Prevention Policy', policy_type: 'Security', description: 'Automatically block and log any prompt injection attempts.', enforcement_level: 'Strict', is_active: true, rules: [{ type: 'injection_block', autoBlock: true }] }
    ];
  }

  _getDefaultRouting() {
    return [
      { request_type: 'Audit', risk_level: 'HIGH', preferred_model_name: 'Qwen3 8B', fallback_model_name: 'Mistral 7B', is_active: true },
      { request_type: 'Compliance', risk_level: 'MEDIUM', preferred_model_name: 'Qwen3 8B', fallback_model_name: 'Llama 3.1 8B', is_active: true },
      { request_type: 'Chat', risk_level: 'LOW', preferred_model_name: 'Qwen3 8B', fallback_model_name: 'Gemma 7B', is_active: true }
    ];
  }
}

export default new AIPolicyEngine();
