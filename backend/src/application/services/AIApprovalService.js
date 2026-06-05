// ============================================================
// AIApprovalService — Phase 6: Human Approval Workflows
// Routes AI outputs to human reviewers before publication
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class AIApprovalService {

  // ── Get pending approvals ──
  async getApprovals(organizationId, status = null) {
    try {
      const conditions = ['a.organization_id = $1'];
      const params = [organizationId];
      if (status) { conditions.push(`a.status = $2`); params.push(status); }

      const result = await query(
        `SELECT a.*, u1.name as submitted_by_name, u1.email as submitted_by_email,
                u2.name as reviewer_name, u2.email as reviewer_email,
                r.response_text, r.confidence_score, r.trust_score
         FROM ai_approvals a
         LEFT JOIN users u1 ON a.submitted_by = u1.id
         LEFT JOIN users u2 ON a.reviewer_id = u2.id
         LEFT JOIN ai_responses r ON a.response_id = r.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY a.created_at DESC
         LIMIT 100`,
        params
      );
      return result.rows;
    } catch (err) {
      logger.error('AIApprovalService.getApprovals error:', err);
      return [];
    }
  }

  // ── Submit a response for approval ──
  async submitForApproval(organizationId, userId, responseId, approvalData) {
    const { approvalType, priority, dueDate, notes } = approvalData;

    const result = await query(
      `INSERT INTO ai_approvals (organization_id, response_id, submitted_by, approval_type, priority, due_date, review_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [organizationId, responseId, userId, approvalType || 'AI Output Review', priority || 'MEDIUM', dueDate || null, notes || '']
    );

    await query(
      `UPDATE ai_responses SET requires_approval=TRUE, approval_status='Pending' WHERE id=$1`,
      [responseId]
    );

    return result.rows[0];
  }

  // ── Review and decide on an approval ──
  async reviewApproval(approvalId, organizationId, reviewerId, decision, notes) {
    if (!['Approved', 'Rejected', 'Needs Revision'].includes(decision)) {
      throw new Error('Invalid decision. Use Approved, Rejected, or Needs Revision.');
    }

    const result = await query(
      `UPDATE ai_approvals SET 
         reviewer_id=$1, status=$2, decision=$3, review_notes=$4, decided_at=NOW(), updated_at=NOW()
       WHERE id=$5 AND organization_id=$6 RETURNING *`,
      [reviewerId, decision === 'Needs Revision' ? 'In Review' : decision, decision, notes || '', approvalId, organizationId]
    );

    const approval = result.rows[0];
    if (approval?.response_id) {
      await query(
        `UPDATE ai_responses SET approval_status=$1 WHERE id=$2`,
        [decision, approval.response_id]
      );
    }

    return approval;
  }

  // ── Get approval statistics ──
  async getApprovalStats(organizationId) {
    try {
      const result = await query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER(WHERE status='Pending') as pending,
           COUNT(*) FILTER(WHERE status='Approved') as approved,
           COUNT(*) FILTER(WHERE status='Rejected') as rejected,
           COUNT(*) FILTER(WHERE status='In Review') as in_review,
           AVG(EXTRACT(EPOCH FROM (decided_at - created_at))/3600) as avg_review_hours
         FROM ai_approvals
         WHERE organization_id=$1`,
        [organizationId]
      );
      return result.rows[0];
    } catch (err) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, in_review: 0, avg_review_hours: 0 };
    }
  }

  // ── Check if a response requires approval ──
  requiresApproval(responseData) {
    const { confidenceScore, trustScore, hallucinationProbability, requestType } = responseData;
    // High-risk conditions that trigger approval
    if (hallucinationProbability > 60) return { required: true, reason: 'High hallucination probability' };
    if (confidenceScore < 40) return { required: true, reason: 'Low AI confidence' };
    if (trustScore < 50) return { required: true, reason: 'Low trust score' };
    if (['Executive Report', 'Audit Finding', 'Compliance Action'].includes(requestType)) {
      return { required: true, reason: `High-impact output type: ${requestType}` };
    }
    return { required: false, reason: null };
  }
}

export default new AIApprovalService();
