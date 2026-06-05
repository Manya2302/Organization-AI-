import pool from '../../infrastructure/database/connection.js';

class RegulatoryMappingService {
  async autoMapToRegulations(organizationId, documentId) {
    // Look up doc content or keywords
    const docQuery = await pool.query(
      `SELECT title, extracted_text FROM documents WHERE id = $1 AND organization_id = $2`,
      [documentId, organizationId]
    );
    if (docQuery.rows.length === 0) return null;

    const { title, extracted_text } = docQuery.rows[0];
    const textContent = (extracted_text || title || '').toLowerCase();

    // Mapping keywords
    const mappings = [];
    if (textContent.includes('privacy') || textContent.includes('consent') || textContent.includes('dpdp') || textContent.includes('personal data')) {
      mappings.push({ framework: 'DPDP', score: 90 });
    }
    if (textContent.includes('security') || textContent.includes('encryption') || textContent.includes('iso') || textContent.includes('access control')) {
      mappings.push({ framework: 'ISO27001', score: 85 });
    }
    if (textContent.includes('audit') || textContent.includes('compliance') || textContent.includes('soc') || textContent.includes('financial')) {
      mappings.push({ framework: 'SOC2', score: 80 });
    }
    if (textContent.includes('patient') || textContent.includes('health') || textContent.includes('hipaa') || textContent.includes('medical')) {
      mappings.push({ framework: 'HIPAA', score: 75 });
    }

    // Insert mapped results to policy_compliance
    for (const map of mappings) {
      await pool.query(`
        INSERT INTO policy_compliance (organization_id, document_id, policy_name, compliance_status, coverage_score)
        VALUES ($1, $2, $3, 'Under Review', $4)
        ON CONFLICT (organization_id, document_id) 
        DO UPDATE SET coverage_score = EXCLUDED.coverage_score, updated_at = NOW()
      `, [organizationId, documentId, `${map.framework} Compliance Directive`, map.score]);
    }

    return mappings;
  }

  async getCoverageDashboard(organizationId) {
    const query = `
      SELECT 
        policy_name as name,
        AVG(coverage_score) as average_score,
        COUNT(*) as total_mapped
      FROM policy_compliance
      WHERE organization_id = $1
      GROUP BY policy_name
    `;
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }
}

export default new RegulatoryMappingService();
