// ============================================================
// Service: SuccessorRecommendationService
// Identifies employee backup/successors to minimize operational risk
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

class SuccessorRecommendationService {
  async generateRecommendations(organizationId) {
    try {
      // Fetch all active employees
      const empsRes = await query(
        "SELECT id, name, department, designation, skills FROM users WHERE organization_id = $1 AND role != 'SuperAdmin' AND is_active = TRUE",
        [organizationId]
      );

      const employees = empsRes.rows;
      if (employees.length <= 1) {
        return [];
      }

      const results = [];

      for (const primary of employees) {
        const primarySkills = Array.isArray(primary.skills) ? primary.skills : JSON.parse(primary.skills || '[]');
        
        // Find best match among other employees
        let bestCandidate = null;
        let highestScore = 0.00;
        let sharedDomains = [];

        for (const candidate of employees) {
          if (candidate.id === primary.id) continue;

          const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : JSON.parse(candidate.skills || '[]');
          
          // Calculate Jaccard similarity score for skills
          const intersection = primarySkills.filter(s => candidateSkills.includes(s));
          const union = Array.from(new Set([...primarySkills, ...candidateSkills]));
          
          let skillSimilarity = union.length > 0 ? (intersection.length / union.length) : 0;
          
          // Boost score if same department
          let deptBonus = primary.department === candidate.department ? 0.25 : 0.00;
          let candidateScore = Math.min(100.00, (skillSimilarity * 75.00) + (deptBonus * 100.00));

          if (candidateScore > highestScore) {
            highestScore = candidateScore;
            bestCandidate = candidate;
            sharedDomains = intersection;
          }
        }

        if (bestCandidate && highestScore > 10.00) {
          const readiness = highestScore > 70 ? 90.00 : highestScore > 40 ? 60.00 : 35.00;
          const summary = `Candidate ${bestCandidate.name} has ${sharedDomains.length} overlapping skill areas. Shared domains: ${sharedDomains.join(', ')}.`;

          // Save recommendation
          await query(
            `INSERT INTO successor_recommendations (organization_id, primary_employee_id, successor_employee_id, successor_score, readiness_score, overlapping_projects, similar_expertise_domains, recommendations_summary)
             VALUES ($1, $2, $3, $4, $5, '[]', $6, $7)
             ON CONFLICT (organization_id, primary_employee_id, successor_employee_id)
             DO UPDATE SET successor_score = EXCLUDED.successor_score, readiness_score = EXCLUDED.readiness_score, similar_expertise_domains = EXCLUDED.similar_expertise_domains, recommendations_summary = EXCLUDED.recommendations_summary`,
            [organizationId, primary.id, bestCandidate.id, highestScore, readiness, JSON.stringify(sharedDomains), summary]
          );

          results.push({
            primaryId: primary.id,
            primaryName: primary.name,
            primaryDesignation: primary.designation,
            successorId: bestCandidate.id,
            successorName: bestCandidate.name,
            score: highestScore,
            readiness,
            summary
          });
        }
      }

      return results;
    } catch (err) {
      logger.error('Failed to compute successor recommendations:', err);
      return [];
    }
  }

  async getRecommendationsOverview(organizationId) {
    try {
      const res = await query(
        `SELECT sr.*, 
                pu.name as primary_name, pu.designation as primary_designation,
                su.name as successor_name, su.designation as successor_designation
         FROM successor_recommendations sr
         JOIN users pu ON sr.primary_employee_id = pu.id
         JOIN users su ON sr.successor_employee_id = su.id
         WHERE sr.organization_id = $1 
         ORDER BY sr.successor_score DESC`,
        [organizationId]
      );
      return { success: true, recommendations: res.rows };
    } catch (err) {
      logger.error('Failed to get succession details:', err);
      return { success: false, recommendations: [] };
    }
  }
}

export default new SuccessorRecommendationService();
