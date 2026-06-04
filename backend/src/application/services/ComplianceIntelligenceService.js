// ============================================================
// Service: ComplianceIntelligenceService
// AI-powered compliance analysis with Ollama integration
// ============================================================
import fetch from 'node-fetch';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

class ComplianceIntelligenceService {

  async getDashboardMetrics(organizationId) {
    try {
      const [frameworksRes, controlsRes, evidenceRes, gapsRes, tasksRes, risksRes, packagesRes, readinessRes] = await Promise.all([
        query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active FROM compliance_frameworks WHERE organization_id = $1`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN status='Implemented' THEN 1 END) as implemented,
                 COUNT(CASE WHEN status='Not Started' THEN 1 END) as not_started,
                 COUNT(CASE WHEN status='Partially Implemented' THEN 1 END) as partial,
                 COUNT(CASE WHEN risk_level IN ('HIGH','CRITICAL') THEN 1 END) as high_risk
               FROM compliance_controls WHERE organization_id = $1`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN review_status='Approved' THEN 1 END) as approved,
                 COUNT(CASE WHEN eet.expiry_status='Expired' THEN 1 END) as expired
               FROM evidence_repository er
               LEFT JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
               WHERE er.organization_id = $1 AND er.is_archived = FALSE`, [organizationId]),
        query(`SELECT COUNT(*) as total,
                 COUNT(CASE WHEN severity='CRITICAL' THEN 1 END) as critical,
                 COUNT(CASE WHEN severity='HIGH' THEN 1 END) as high
               FROM compliance_gaps WHERE organization_id = $1 AND status='Open'`, [organizationId]),
        query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='Pending' THEN 1 END) as pending FROM compliance_tasks WHERE organization_id = $1`, [organizationId]),
        query(`SELECT COUNT(*) as total, COALESCE(AVG(risk_score),0) as avg_risk FROM compliance_risks WHERE organization_id = $1 AND status='Open'`, [organizationId]),
        query(`SELECT overall_score FROM audit_packages WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`, [organizationId]),
        query(`SELECT overall_readiness_score, readiness_level FROM audit_readiness_metrics WHERE organization_id = $1 ORDER BY calculated_at DESC LIMIT 1`, [organizationId])
      ]);

      const totalControls = parseInt(controlsRes.rows[0]?.total) || 0;
      const implementedControls = parseInt(controlsRes.rows[0]?.implemented) || 0;
      const totalEvidence = parseInt(evidenceRes.rows[0]?.total) || 0;
      const approvedEvidence = parseInt(evidenceRes.rows[0]?.approved) || 0;
      const openGaps = parseInt(gapsRes.rows[0]?.total) || 0;
      const criticalGaps = parseInt(gapsRes.rows[0]?.critical) + parseInt(gapsRes.rows[0]?.high) || 0;

      const controlCoverage = totalControls > 0 ? parseFloat(((implementedControls / totalControls) * 100).toFixed(1)) : 0;
      const evidenceCoverage = totalControls > 0 ? Math.min(100, parseFloat(((totalEvidence / totalControls) * 100).toFixed(1))) : 0;
      const riskScore = parseFloat(risksRes.rows[0]?.avg_risk || 0).toFixed(1);
      const auditScore = parseFloat(packagesRes.rows[0]?.overall_score || 0);

      const overallScore = parseFloat((
        controlCoverage * 0.35 + evidenceCoverage * 0.30 +
        Math.max(0, 100 - openGaps * 3) * 0.20 +
        Math.max(0, 100 - criticalGaps * 10) * 0.15
      ).toFixed(1));

      const complianceLevel = overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' :
                               overallScore >= 55 ? 'Improving' : overallScore >= 35 ? 'Needs Attention' : 'Critical';

      return {
        success: true,
        overallScore, complianceLevel, controlCoverage, evidenceCoverage,
        openGaps, criticalGaps, riskScore: parseFloat(riskScore), auditScore,
        totalFrameworks: parseInt(frameworksRes.rows[0]?.total) || 0,
        activeFrameworks: parseInt(frameworksRes.rows[0]?.active) || 0,
        totalControls, implementedControls,
        notStartedControls: parseInt(controlsRes.rows[0]?.not_started) || 0,
        partialControls: parseInt(controlsRes.rows[0]?.partial) || 0,
        highRiskControls: parseInt(controlsRes.rows[0]?.high_risk) || 0,
        totalEvidence, approvedEvidence,
        expiredEvidence: parseInt(evidenceRes.rows[0]?.expired) || 0,
        pendingTasks: parseInt(tasksRes.rows[0]?.pending) || 0,
        totalTasks: parseInt(tasksRes.rows[0]?.total) || 0,
        openRisks: parseInt(risksRes.rows[0]?.total) || 0,
        auditReadinessScore: parseFloat(readinessRes.rows[0]?.overall_readiness_score || 0),
        readinessLevel: readinessRes.rows[0]?.readiness_level || 'Not Calculated'
      };
    } catch (err) {
      logger.error('Failed to get compliance dashboard:', err);
      return { success: false, overallScore: 0, complianceLevel: 'Critical' };
    }
  }

  async getFrameworkCoverage(organizationId) {
    try {
      const res = await query(
        `SELECT cf.id, cf.name, cf.short_name, cf.is_active,
                COUNT(DISTINCT ca.control_id) as mapped_controls,
                COUNT(DISTINCT CASE WHEN cc.status = 'Implemented' THEN ca.control_id END) as implemented_controls,
                COUNT(DISTINCT cm.document_id) as document_mappings,
                COUNT(DISTINCT pc.id) as policy_mappings,
                COUNT(DISTINCT em.evidence_id) as evidence_items
         FROM compliance_frameworks cf
         LEFT JOIN control_assignments ca ON ca.framework_id = cf.id AND ca.organization_id = $1
         LEFT JOIN compliance_controls cc ON ca.control_id = cc.id
         LEFT JOIN control_mappings cm ON cm.framework_id = cf.id AND cm.organization_id = $1
         LEFT JOIN policy_compliance pc ON pc.framework_id = cf.id AND pc.organization_id = $1
         LEFT JOIN evidence_mappings em ON em.framework_id = cf.id AND em.organization_id = $1
         WHERE cf.organization_id = $1
         GROUP BY cf.id, cf.name, cf.short_name, cf.is_active
         ORDER BY cf.name`,
        [organizationId]
      );

      return {
        success: true,
        frameworks: res.rows.map(f => ({
          ...f,
          coverage: parseInt(f.mapped_controls) > 0
            ? parseFloat(((parseInt(f.implemented_controls) / parseInt(f.mapped_controls)) * 100).toFixed(1))
            : 0
        }))
      };
    } catch (err) {
      logger.error('Failed to get framework coverage:', err);
      return { success: false, frameworks: [] };
    }
  }

  async answerComplianceQuestion(organizationId, question) {
    try {
      // Gather compliance context
      const context = await this._gatherComplianceContext(organizationId, question);
      const contextText = this._buildContextText(context);

      // Try Ollama first
      let answer = '';
      let confidence = 'High';
      let sources = [];

      try {
        const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an expert compliance officer AI assistant for SecureVault AI. 
Answer questions about organizational compliance posture using ONLY the context provided below.
Be specific with numbers and control codes. If data is insufficient, say so clearly. Max 200 words. No markdown.

COMPLIANCE CONTEXT:
${contextText}`
              },
              { role: 'user', content: question }
            ],
            stream: false,
            options: { temperature: 0.2, top_p: 0.9 }
          }),
          signal: AbortSignal.timeout(20000)
        });

        if (response.ok) {
          const data = await response.json();
          answer = data.message?.content || '';
          answer = answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          sources = context.sources;
        }
      } catch {
        logger.warn('Ollama unavailable for compliance Q&A, using rule-based response');
      }

      // Fallback to rule-based if AI offline or empty
      if (!answer || answer.length < 20) {
        answer = this._ruleBasedAnswer(question, context);
        confidence = 'Medium';
      }

      return { answer, confidence, sources, context: { metrics: context.metrics } };
    } catch (err) {
      logger.error('Failed to answer compliance question:', err);
      return {
        answer: 'Unable to process your compliance question at this time. Please try again.',
        confidence: 'Low', sources: []
      };
    }
  }

  async _gatherComplianceContext(organizationId, question) {
    const q = question.toLowerCase();
    const context = { sources: [], metrics: {}, controls: [], gaps: [], evidence: [], policies: [] };

    try {
      const [metricsRes, controlsRes, gapsRes, evidenceRes, policiesRes, frameworksRes] = await Promise.all([
        this.getDashboardMetrics(organizationId),
        query(`SELECT control_code, title, status, risk_level, effectiveness
               FROM compliance_controls WHERE organization_id = $1 ORDER BY risk_level DESC LIMIT 10`, [organizationId]),
        query(`SELECT gap_type, severity, title, description FROM compliance_gaps
               WHERE organization_id = $1 AND status = 'Open' ORDER BY severity DESC LIMIT 10`, [organizationId]),
        query(`SELECT title, compliance_category, review_status, confidence_score
               FROM evidence_repository WHERE organization_id = $1 AND is_archived = FALSE LIMIT 10`, [organizationId]),
        query(`SELECT pc.compliance_status, d.name as policy_name, cf.short_name as framework
               FROM policy_compliance pc JOIN documents d ON pc.document_id = d.id
               LEFT JOIN compliance_frameworks cf ON pc.framework_id = cf.id
               WHERE pc.organization_id = $1 LIMIT 10`, [organizationId]),
        query(`SELECT short_name, name FROM compliance_frameworks WHERE organization_id = $1 AND is_active = TRUE`, [organizationId])
      ]);

      context.metrics = metricsRes;
      context.controls = controlsRes.rows;
      context.gaps = gapsRes.rows;
      context.evidence = evidenceRes.rows;
      context.policies = policiesRes.rows;
      context.frameworks = frameworksRes.rows;

      context.sources = [
        `Compliance Score: ${metricsRes.overallScore}% (${metricsRes.complianceLevel})`,
        `Controls: ${metricsRes.implementedControls}/${metricsRes.totalControls} implemented`,
        `Evidence: ${metricsRes.totalEvidence} items, ${metricsRes.approvedEvidence} approved`,
        `Open Gaps: ${metricsRes.openGaps} (${metricsRes.criticalGaps} critical/high)`,
        `Active Frameworks: ${frameworksRes.rows.map(f => f.short_name).join(', ')}`
      ];
    } catch (err) {
      logger.warn('Failed to gather full compliance context:', err.message);
    }

    return context;
  }

  _buildContextText(context) {
    const m = context.metrics;
    const lines = [
      `Overall Compliance Score: ${m.overallScore}% (${m.complianceLevel})`,
      `Control Coverage: ${m.controlCoverage}% | Evidence Coverage: ${m.evidenceCoverage}%`,
      `Controls: ${m.implementedControls} Implemented, ${m.partialControls} Partial, ${m.notStartedControls} Not Started (Total: ${m.totalControls})`,
      `Evidence: ${m.totalEvidence} collected, ${m.approvedEvidence} approved, ${m.expiredEvidence} expired`,
      `Open Gaps: ${m.openGaps} total, ${m.criticalGaps} critical/high severity`,
      `Risk Score: ${m.riskScore}/100 | Open Risks: ${m.openRisks}`,
      `Audit Readiness: ${m.auditReadinessScore}% (${m.readinessLevel})`,
      `Active Frameworks: ${context.frameworks?.map(f => f.short_name).join(', ') || 'None'}`,
      '',
      'TOP CONTROLS STATUS:',
      ...context.controls.map(c => `  ${c.control_code}: ${c.title} — ${c.status} (${c.risk_level})`),
      '',
      'OPEN GAPS:',
      ...context.gaps.slice(0, 5).map(g => `  [${g.severity}] ${g.gap_type}: ${g.title}`)
    ];
    return lines.join('\n');
  }

  _ruleBasedAnswer(question, context) {
    const q = question.toLowerCase();
    const m = context.metrics;

    if (q.includes('score') || q.includes('posture') || q.includes('status') || q.includes('compliant')) {
      return `Current compliance score is ${m.overallScore}% (${m.complianceLevel}). ${m.implementedControls} of ${m.totalControls} controls implemented. ${m.totalEvidence} evidence items collected with ${m.approvedEvidence} approved. ${m.openGaps} compliance gaps open.`;
    }
    if (q.includes('gap') || q.includes('missing')) {
      const gapDetails = context.gaps.slice(0, 3).map(g => `${g.gap_type}: ${g.title}`).join('; ');
      return `${m.openGaps} open compliance gaps detected, including ${m.criticalGaps} critical/high severity. Key gaps: ${gapDetails || 'Run gap detection for details'}. Immediate action required on critical gaps.`;
    }
    if (q.includes('evidence')) {
      return `${m.totalEvidence} evidence items collected. ${m.approvedEvidence} are approved, ${m.expiredEvidence} have expired. Evidence coverage is ${m.evidenceCoverage}% across all controls. Run evidence validation for detailed integrity reports.`;
    }
    if (q.includes('control')) {
      return `${m.totalControls} compliance controls tracked: ${m.implementedControls} implemented (${m.controlCoverage}%), ${m.partialControls} partially implemented, ${m.notStartedControls} not started. ${m.highRiskControls} high-risk controls require priority attention.`;
    }
    if (q.includes('risk')) {
      return `Average risk score: ${m.riskScore}/100. ${m.openRisks} open risks tracked. ${m.criticalGaps} critical compliance gaps detected. Audit readiness: ${m.auditReadinessScore}% (${m.readinessLevel}).`;
    }
    if (q.includes('audit')) {
      return `Audit readiness score: ${m.auditReadinessScore}% (${m.readinessLevel}). Last audit package score: ${m.auditScore}%. Generate an audit package to get a comprehensive report with findings and recommendations.`;
    }
    if (q.includes('framework') || q.includes('dpdp') || q.includes('iso') || q.includes('gdpr') || q.includes('hipaa') || q.includes('soc')) {
      const fws = context.frameworks?.map(f => f.short_name).join(', ') || 'None configured';
      return `Active compliance frameworks: ${fws}. Run framework initialization to enable full mapping and scoring. Use the framework scorecard to view per-framework control coverage.`;
    }
    if (q.includes('polic')) {
      return `${context.policies.filter(p => p.compliance_status === 'Compliant').length} of ${context.policies.length} policies are marked compliant. Run auto-map to link policy documents to compliance frameworks.`;
    }
    return `Compliance Overview — Score: ${m.overallScore}% (${m.complianceLevel}). Controls: ${m.implementedControls}/${m.totalControls} implemented. Evidence: ${m.totalEvidence} items. Open gaps: ${m.openGaps}. Use specific questions like "What are the open gaps?" or "Show control status" for detailed answers.`;
  }
}

export default new ComplianceIntelligenceService();
