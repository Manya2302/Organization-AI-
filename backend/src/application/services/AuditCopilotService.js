// ============================================================
// Service: AuditCopilotService
// Central Intelligence Engine orchestrating all Phase 5 operations
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import auditPlanningService from './AuditPlanningService.js';
import auditScopeService from './AuditScopeService.js';
import auditEvidenceService from './AuditEvidenceService.js';
import auditControlAnalyzer from './AuditControlAnalyzer.js';
import auditRiskEngine from './AuditRiskEngine.js';
import auditReadinessServiceV2 from './AuditReadinessServiceV2.js';
import auditTemplateEngine from './AuditTemplateEngine.js';

class AuditCopilotService {
  // AI assistant simulation that uses the planning details or returns smart suggestions
  async handleQuery(organizationId, queryText, planId = null) {
    try {
      logger.info(`Audit Copilot AI Query: "${queryText}" for plan: ${planId}`);
      
      let responseContent = "";
      const normalizedQuery = queryText.toLowerCase();

      if (normalizedQuery.includes('prepare') || normalizedQuery.includes('plan')) {
        let framework = "ISO27001";
        if (normalizedQuery.includes('soc2') || normalizedQuery.includes('soc 2')) framework = "SOC2";
        if (normalizedQuery.includes('dpdp')) framework = "DPDP";
        
        responseContent = `### AI Audit Planner - ${framework} Preparation Mode
I have parsed the standard controls for **${framework}**. To initiate preparation:
1. Setup a new Audit Plan using the "/dashboard/audit-planner" interface.
2. The scope builder will automatically select and map required policies and controls.
3. Our evidence engine will match existing files from the repository to framework requirements.
Would you like me to automatically create a draft plan for **${framework}** right now?`;
      } 
      else if (normalizedQuery.includes('ready') || normalizedQuery.includes('readiness')) {
        let readinessMsg = "Currently, there is no active audit plan. Create one in the planner to compute direct readiness.";
        if (planId) {
          const readiness = await auditReadinessServiceV2.calculatePlanReadiness(planId, organizationId);
          readinessMsg = `Our calculated composite readiness score for this plan is **${readiness.readinessScore}%**.
* Control Implementation: **${readiness.controlReadiness}%**
* Evidence Mapping completeness: **${readiness.evidenceReadiness}%**`;
        }
        responseContent = `### AI Readiness Report
${readinessMsg}

Key Recommendations to improve score:
1. Map missing evidence files for outstanding high-priority controls.
2. Complete pending policy reviews under the Compliance Center.`;
      } 
      else if (normalizedQuery.includes('evidence') || normalizedQuery.includes('missing')) {
        let missingMsg = "No active plan selected.";
        if (planId) {
          const items = await auditEvidenceService.getEvidenceRecommendations(planId, organizationId);
          const missing = items.filter(i => i.status === 'Missing');
          if (missing.length > 0) {
            missingMsg = `I found **${missing.length} missing evidence requirements**:\n` +
              missing.map(m => `* **${m.recommended_evidence_name}** (Control: ${m.control_code})`).join('\n');
          } else {
            missingMsg = `All required evidence files are currently mapped. Excellent coverage!`;
          }
        }
        responseContent = `### AI Evidence Checklist Discovery
${missingMsg}

*Suggestion:* Go to the **Evidence Readiness** tab and upload documents matching the suggested names.`;
      }
      else if (normalizedQuery.includes('risk') || normalizedQuery.includes('fail') || normalizedQuery.includes('gaps')) {
        let riskMsg = "No plan selected for analysis.";
        if (planId) {
          const risks = await auditRiskEngine.getRiskAssessments(planId, organizationId);
          if (risks.length > 0) {
            riskMsg = `I detected **${risks.length} compliance risks**:\n` +
              risks.map(r => `* [${r.severity}] **${r.title}**: ${r.description}`).join('\n');
          } else {
            riskMsg = `No critical risks detected. Security and documentation protocols are fully aligned.`;
          }
        }
        responseContent = `### AI Pre-Audit Risk Assessment
${riskMsg}

*Remediation Plan:* Assign owners to all outstanding controls to resolve ownership gaps before the audit starts.`;
      }
      else {
        responseContent = `I am your **Audit Copilot**. I can help you:
* Prepare framework plans (e.g. "Prepare ISO27001 audit", "Prepare SOC2 plan")
* Track readiness scores (e.g. "Are we ready for audit?")
* Discover document evidence gaps (e.g. "What evidence is missing?")
* Find pre-audit failure risks (e.g. "Show audit risks", "Which controls are failing?")`;
      }

      return {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('Audit Copilot query processing failed:', err);
      throw err;
    }
  }

  // Orchestrator method to run a full analysis & update readiness
  async runFullAuditAnalysis(planId, organizationId) {
    try {
      logger.info(`Running full copilot audit assessment for plan ${planId}`);
      // 1. Analyze controls effectiveness & ownership
      await auditControlAnalyzer.analyzeControls(planId, organizationId);

      // 2. Scan for compliance risks
      await auditRiskEngine.detectRisks(planId, organizationId);

      // 3. Re-calculate overall readiness score
      const readiness = await auditReadinessServiceV2.calculatePlanReadiness(planId, organizationId);

      return {
        success: true,
        readiness
      };
    } catch (err) {
      logger.error('Audit analysis failed:', err);
      throw err;
    }
  }
}

export default new AuditCopilotService();
export {
  auditPlanningService as AuditPlanningService,
  auditScopeService as AuditScopeService,
  auditEvidenceService as AuditEvidenceService,
  auditControlAnalyzer as AuditControlAnalyzer,
  auditRiskEngine as AuditRiskEngine,
  auditReadinessServiceV2 as AuditReadinessServiceV2,
  auditTemplateEngine as AuditTemplateEngine
};
