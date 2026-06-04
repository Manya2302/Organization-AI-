// ============================================================
// Service: DependencyGraphService
// Maps resource dependencies and discovers single points of failure
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class DependencyGraphService {
  async analyzeDependencies(organizationId) {
    try {
      // 1. Fetch document ownership and creations
      const docRels = await query(
        `SELECT id, name, category, author_id, owner_id FROM documents 
         WHERE organization_id = $1 AND is_deleted = FALSE`,
        [organizationId]
      );

      const items = docRels.rows;
      if (items.length === 0) {
        return { dependencyCount: 0, sPoFCount: 0, riskScore: 0.00 };
      }

      // Track how many resources each employee is responsible for
      const ownerDocCounts = {};
      items.forEach(doc => {
        const owner = doc.owner_id || doc.author_id;
        if (owner) {
          ownerDocCounts[owner] = (ownerDocCounts[owner] || 0) + 1;
        }
      });

      const totalDocs = items.length;
      let sPoFCount = 0;
      const dependencyEntries = [];

      for (const doc of items) {
        const owner = doc.owner_id || doc.author_id;
        if (!owner) continue;

        // Calculate ownership density
        const ownerShare = ownerDocCounts[owner] / totalDocs;
        const isSPoF = ownerShare > 0.40; // If one person owns > 40% of docs

        if (isSPoF) {
          sPoFCount++;
        }

        const riskScore = Math.min(100.00, (ownerShare * 100.00) + (isSPoF ? 30.00 : 0.00));
        const criticality = riskScore > 75.00 ? 'CRITICAL' : riskScore > 50.00 ? 'HIGH' : 'MEDIUM';

        // Stage in dependency_mappings table
        await query(
          `INSERT INTO dependency_mappings (organization_id, source_type, source_id, target_type, target_id, dependency_type, criticality, dependency_risk_score, is_single_point_of_failure)
           VALUES ($1, 'Document', $2, 'Employee', $3, 'REQUIRED', $4, $5, $6)
           ON CONFLICT (organization_id, source_type, source_id, target_type, target_id)
           DO UPDATE SET dependency_risk_score = EXCLUDED.dependency_risk_score, is_single_point_of_failure = EXCLUDED.is_single_point_of_failure, criticality = EXCLUDED.criticality`,
          [organizationId, doc.id, owner, criticality, riskScore, isSPoF]
        );

        dependencyEntries.push({
          sourceType: 'Document',
          sourceName: doc.name,
          targetType: 'Employee',
          targetId: owner,
          riskScore,
          isSPoF
        });
      }

      // Compute average dependency risk score
      const avgRisk = dependencyEntries.length > 0 
        ? dependencyEntries.reduce((sum, item) => sum + item.riskScore, 0) / dependencyEntries.length
        : 0.00;

      return {
        dependencyCount: dependencyEntries.length,
        sPoFCount,
        riskScore: parseFloat(avgRisk.toFixed(2))
      };
    } catch (err) {
      logger.error('Failed to map organizational dependencies:', err);
      return { dependencyCount: 0, sPoFCount: 0, riskScore: 0.00 };
    }
  }

  async getDependenciesOverview(organizationId) {
    try {
      const res = await query(
        `SELECT dm.*, 
                d.name as source_name,
                u.name as target_name
         FROM dependency_mappings dm
         LEFT JOIN documents d ON dm.source_id = d.id::text AND dm.source_type = 'Document'
         LEFT JOIN users u ON dm.target_id = u.id::text AND dm.target_type = 'Employee'
         WHERE dm.organization_id = $1 
         ORDER BY dm.dependency_risk_score DESC`,
        [organizationId]
      );
      return { success: true, dependencies: res.rows };
    } catch (err) {
      logger.error('Failed to fetch dependencies:', err);
      return { success: false, dependencies: [] };
    }
  }
}

export default new DependencyGraphService();
