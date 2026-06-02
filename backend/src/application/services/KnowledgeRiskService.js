import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class KnowledgeRiskService {
  static async calculateKnowledgeRisks(organizationId) {
    try {
      // 1. Missing Policies/SOPs
      const policyRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND (category ILIKE '%policy%' OR name ILIKE '%policy%')`,
        [organizationId]
      );
      const policyCount = parseInt(policyRes.rows[0]?.count || 0);

      const sopRes = await query(
        `SELECT COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE 
           AND (category ILIKE '%sop%' OR category ILIKE '%standard%' OR name ILIKE '%sop%' OR name ILIKE '%procedure%')`,
        [organizationId]
      );
      const sopCount = parseInt(sopRes.rows[0]?.count || 0);

      const missingPolicyRisk = policyCount > 0 ? Math.max(0, 100 - (policyCount * 25)) : 90;
      const missingSopRisk = sopCount > 0 ? Math.max(0, 100 - (sopCount * 20)) : 80;

      // 2. Knowledge Concentration / Employee Dependency
      // Check if a single user owns too many documents
      const totalDocsRes = await query(
        `SELECT COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE`,
        [organizationId]
      );
      const totalDocs = parseInt(totalDocsRes.rows[0]?.count || 0);

      let employeeDependencyRisk = 10; // baseline
      let knowledgeConcentrationRisk = 15; // baseline

      if (totalDocs > 0) {
        const ownerRes = await query(
          `SELECT owner_id, COUNT(*) as count FROM documents 
           WHERE organization_id = $1 AND is_deleted = FALSE AND owner_id IS NOT NULL
           GROUP BY owner_id ORDER BY count DESC LIMIT 1`,
          [organizationId]
        );
        if (ownerRes.rows.length > 0) {
          const maxDocsBySingleUser = parseInt(ownerRes.rows[0].count);
          const ratio = maxDocsBySingleUser / totalDocs;
          if (ratio > 0.6) {
            employeeDependencyRisk = 85;
            knowledgeConcentrationRisk = 80;
          } else if (ratio > 0.4) {
            employeeDependencyRisk = 60;
            knowledgeConcentrationRisk = 55;
          } else if (ratio > 0.25) {
            employeeDependencyRisk = 40;
            knowledgeConcentrationRisk = 35;
          }
        }
      }

      // 3. Documentation Gap / Department Risk
      // Count empty/low departments
      const docGapRes = await query(
        `SELECT department, COUNT(*) as count FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE AND department IS NOT NULL
         GROUP BY department`,
        [organizationId]
      );
      const emptyDeptCount = docGapRes.rows.filter(r => parseInt(r.count) < 2).length;
      const documentationGapRisk = Math.min(20 + (emptyDeptCount * 25), 100);
      const departmentKnowledgeRisk = Math.min(15 + (emptyDeptCount * 20), 100);

      // Average composite Risk Score
      const knowledgeRiskScore = Math.round(
        (missingPolicyRisk + missingSopRisk + knowledgeConcentrationRisk + employeeDependencyRisk + documentationGapRisk + departmentKnowledgeRisk) / 6
      );

      // Risk Levels: LOW, MEDIUM, HIGH, CRITICAL
      let knowledgeRiskLevel = 'LOW';
      if (knowledgeRiskScore >= 75) knowledgeRiskLevel = 'CRITICAL';
      else if (knowledgeRiskScore >= 50) knowledgeRiskLevel = 'HIGH';
      else if (knowledgeRiskScore >= 30) knowledgeRiskLevel = 'MEDIUM';

      const res = await query(
        `INSERT INTO knowledge_risk_metrics 
         (organization_id, missing_sop_risk, missing_policy_risk, knowledge_concentration_risk, 
          employee_dependency_risk, documentation_gap_risk, department_knowledge_risk, 
          knowledge_risk_score, knowledge_risk_level, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
        [organizationId, missingSopRisk, missingPolicyRisk, knowledgeConcentrationRisk, employeeDependencyRisk, documentationGapRisk, departmentKnowledgeRisk, knowledgeRiskScore, knowledgeRiskLevel]
      );

      return res.rows[0];
    } catch (err) {
      logger.error('Error calculating knowledge risk metrics:', err);
      throw err;
    }
  }

  static async getLatestRiskMetrics(organizationId) {
    const res = await query(
      `SELECT * FROM knowledge_risk_metrics 
       WHERE organization_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return await this.calculateKnowledgeRisks(organizationId);
  }
}
