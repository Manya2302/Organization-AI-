import { query } from '../database/connection.js';
import { logger } from '../logging/logger.js';

/**
 * KnowledgeGapService — Phase 2 Final Architecture Refinements
 * Scans tenant repositories to identify documentation gaps, low coverage departments, and missing policies.
 */
export const detectKnowledgeGaps = async (organizationId) => {
  try {
    // 1. Fetch document count grouped by department
    const deptResult = await query(
      `SELECT department, COUNT(*) as count 
       FROM documents 
       WHERE organization_id = $1 AND is_deleted = false 
       GROUP BY department`,
      [organizationId]
    );

    // 2. Fetch document count grouped by category
    const catResult = await query(
      `SELECT category, COUNT(*) as count 
       FROM documents 
       WHERE organization_id = $1 AND is_deleted = false 
       GROUP BY category`,
      [organizationId]
    );

    const depts = deptResult.rows.map(r => ({ name: r.department || 'Unassigned', count: parseInt(r.count) }));
    const cats = catResult.rows.map(r => ({ name: r.category || 'General', count: parseInt(r.count) }));

    const totalDocs = depts.reduce((acc, d) => acc + d.count, 0);

    // 3. Define standard required departments and categories
    const standardDepts = ['HR', 'Finance', 'Legal', 'Engineering', 'Operations'];
    const standardCats = ['Compliance', 'Contracts', 'Policies', 'SOPs', 'Invoices'];

    const undocumentedDepartments = [];
    const lowDocumentationAreas = [];
    const missingPolicies = [];

    // Find undocumented or low doc departments
    for (const std of standardDepts) {
      const match = depts.find(d => d.name.toLowerCase() === std.toLowerCase());
      if (!match) {
        undocumentedDepartments.push(std);
      } else if (match.count < 3) {
        lowDocumentationAreas.push({ department: std, count: match.count, issue: 'Low document count' });
      }
    }

    // Find missing key categories
    for (const cat of standardCats) {
      const match = cats.find(c => c.name.toLowerCase() === cat.toLowerCase());
      if (!match || match.count === 0) {
        missingPolicies.push(`Missing standard organization-wide "${cat}" documentation`);
      }
    }

    // 4. Calculate Knowledge Health Score (0-100)
    let scoreBase = 100;
    scoreBase -= undocumentedDepartments.length * 15;
    scoreBase -= lowDocumentationAreas.length * 8;
    scoreBase -= missingPolicies.length * 10;
    const knowledgeHealthScore = Math.max(scoreBase, 10);

    // Calculate Knowledge Risk Level
    let riskLevel = 'low';
    if (knowledgeHealthScore < 50) {
      riskLevel = 'critical';
    } else if (knowledgeHealthScore < 75) {
      riskLevel = 'medium';
    }

    return {
      knowledgeHealthScore,
      knowledgeRiskLevel: riskLevel,
      gapAnalysis: {
        undocumentedDepartments,
        lowDocumentationAreas,
        missingPolicies,
        totalDocumentsScanned: totalDocs
      },
      recommendedActions: [
        ...undocumentedDepartments.map(d => `Create folder structure and upload initial onboarding manuals for ${d} Department.`),
        ...missingPolicies.map(p => `Draft and index the missing "${p.split('"')[1]}" documents.`),
        ...lowDocumentationAreas.map(l => `Increase documentation density for ${l.department} (currently only ${l.count} files).`)
      ]
    };
  } catch (err) {
    logger.error(`❌ Knowledge gap analysis failed: ${err.message}`);
    return {
      knowledgeHealthScore: 50,
      knowledgeRiskLevel: 'medium',
      gapAnalysis: { undocumentedDepartments: [], lowDocumentationAreas: [], missingPolicies: [], totalDocumentsScanned: 0 },
      recommendedActions: ['Perform full manual directory audit.']
    };
  }
};

export default {
  detectKnowledgeGaps
};
