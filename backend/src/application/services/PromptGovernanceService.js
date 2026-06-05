// ============================================================
// PromptGovernanceService — Phase 6: Prompt Management
// Version control, approvals, and security reviews for prompts
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class PromptGovernanceService {

  // ── List all prompts ──
  async getPrompts(organizationId) {
    try {
      const result = await query(
        `SELECT p.*, u.name as owner_name,
                COUNT(pv.id) as version_count,
                MAX(pv.version) as latest_version,
                AVG(ps.security_score) as avg_security_score
         FROM ai_prompts p
         LEFT JOIN users u ON p.owner_id = u.id
         LEFT JOIN ai_prompt_versions pv ON pv.prompt_id = p.id
         LEFT JOIN ai_prompt_security ps ON ps.prompt_id = p.id
         WHERE p.organization_id = $1
         GROUP BY p.id, u.name
         ORDER BY p.created_at DESC`,
        [organizationId]
      );
      return result.rows;
    } catch (err) {
      logger.error('PromptGovernanceService.getPrompts error:', err);
      return this._getDefaultPrompts();
    }
  }

  // ── Create a new prompt ──
  async createPrompt(organizationId, userId, promptData) {
    const { promptName, category, purpose, riskLevel, tags } = promptData;
    const result = await query(
      `INSERT INTO ai_prompts (organization_id, prompt_name, category, purpose, owner_id, risk_level, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [organizationId, promptName, category || 'General', purpose || '', userId, riskLevel || 'LOW', JSON.stringify(tags || [])]
    );
    return result.rows[0];
  }

  // ── Add prompt version ──
  async addPromptVersion(organizationId, userId, promptId, versionData) {
    const { version, promptText, changeSummary } = versionData;
    const result = await query(
      `INSERT INTO ai_prompt_versions (organization_id, prompt_id, version, prompt_text, change_summary, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, promptId, version, promptText, changeSummary || '', userId]
    );
    return result.rows[0];
  }

  // ── Get prompt versions ──
  async getPromptVersions(promptId, organizationId) {
    try {
      const result = await query(
        `SELECT pv.*, u1.name as created_by_name, u2.name as approved_by_name
         FROM ai_prompt_versions pv
         LEFT JOIN users u1 ON pv.created_by = u1.id
         LEFT JOIN users u2 ON pv.approved_by = u2.id
         WHERE pv.prompt_id = $1 AND pv.organization_id = $2
         ORDER BY pv.created_at DESC`,
        [promptId, organizationId]
      );
      return result.rows;
    } catch (err) {
      return [];
    }
  }

  // ── Approve a prompt ──
  async approvePrompt(promptId, organizationId, reviewerId, decision, notes) {
    await query(
      `UPDATE ai_prompts SET approval_status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [decision === 'Approved' ? 'Approved' : 'Rejected', promptId, organizationId]
    );
    await query(
      `INSERT INTO ai_prompt_reviews (organization_id, prompt_id, reviewer_id, decision, findings)
       VALUES ($1, $2, $3, $4, $5)`,
      [organizationId, promptId, reviewerId, decision, notes || '']
    );
    return { success: true, status: decision };
  }

  // ── Get prompt categories ──
  getCategories() {
    return ['Audit', 'Compliance', 'Knowledge', 'Search', 'Risk Analysis', 'Executive Reports', 'Document Analysis', 'General'];
  }

  _getDefaultPrompts() {
    return [
      {
        id: 'sys-audit-1', prompt_name: 'Audit Readiness Assessment', category: 'Audit',
        purpose: 'Generate comprehensive audit readiness report', risk_level: 'LOW',
        approval_status: 'Approved', version_count: 3, latest_version: '1.2.0', is_system: true
      },
      {
        id: 'sys-compliance-1', prompt_name: 'Compliance Gap Analysis', category: 'Compliance',
        purpose: 'Identify compliance gaps against frameworks', risk_level: 'LOW',
        approval_status: 'Approved', version_count: 2, latest_version: '1.1.0', is_system: true
      },
      {
        id: 'sys-risk-1', prompt_name: 'Risk Impact Analysis', category: 'Risk Analysis',
        purpose: 'Evaluate risk severity and business impact', risk_level: 'MEDIUM',
        approval_status: 'Approved', version_count: 1, latest_version: '1.0.0', is_system: true
      }
    ];
  }
}

export default new PromptGovernanceService();
