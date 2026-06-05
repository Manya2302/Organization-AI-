import pool from '../../infrastructure/database/connection.js';

class PolicyLifecycleService {
  async transitionPolicy(organizationId, documentId, newStatus, userId) {
    const query = `
      UPDATE policy_compliance
      SET compliance_status = $1, updated_at = NOW()
      WHERE document_id = $2 AND organization_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [newStatus, documentId, organizationId]);

    // Record review history in audit logs
    await pool.query(`
      INSERT INTO audit_logs (organization_id, action, actor_id, category, details, created_at)
      VALUES ($1, 'POLICY_STATUS_TRANSITION', $2, 'Compliance', $3, NOW())
    `, [
      organizationId,
      userId,
      JSON.stringify({ documentId, previousStatus: 'Under Review', newStatus })
    ]);

    return result.rows[0];
  }

  async getPolicyHistory(organizationId, documentId) {
    const query = `
      SELECT * FROM audit_logs
      WHERE organization_id = $1
        AND action = 'POLICY_STATUS_TRANSITION'
        AND details::json->>'documentId' = $2
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [organizationId, documentId]);
    return result.rows;
  }

  async getPolicyMetadata(organizationId, documentId) {
    const query = `
      SELECT pc.*, d.title, d.file_path, d.uploader_id
      FROM policy_compliance pc
      JOIN documents d ON pc.document_id = d.id
      WHERE pc.document_id = $1 AND pc.organization_id = $2
    `;
    const result = await pool.query(query, [documentId, organizationId]);
    return result.rows[0];
  }
}

export default new PolicyLifecycleService();
