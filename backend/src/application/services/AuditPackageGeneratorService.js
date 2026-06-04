// ============================================================
// Service: AuditPackageGeneratorService
// Advanced audit package generation with AI-powered insights
// ============================================================
import fetch from 'node-fetch';
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

class AuditPackageGeneratorService {
  async generateFullPackage(organizationId, options = {}) {
    const { frameworkId, auditType = 'Internal', createdBy, name } = options;

    try {
      // 1. Gather all compliance data
      const [controlsRes, evidenceRes, gapsRes, policyRes, findingsRes, frameworkRes] = await Promise.all([
        query(`SELECT cc.*, u.name as owner_name, u.email as owner_email
               FROM compliance_controls cc LEFT JOIN users u ON cc.owner_id = u.id
               WHERE cc.organization_id = $1 ORDER BY cc.risk_level DESC`, [organizationId]),
        query(`SELECT er.*, u.name as owner_name, eet.expiry_status, eet.days_until_expiry
               FROM evidence_repository er
               LEFT JOIN users u ON er.owner_id = u.id
               LEFT JOIN evidence_expiry_tracking eet ON eet.evidence_id = er.id
               WHERE er.organization_id = $1 AND er.is_archived = FALSE`, [organizationId]),
        query(`SELECT * FROM compliance_gaps WHERE organization_id = $1 AND status = 'Open' ORDER BY severity DESC`, [organizationId]),
        query(`SELECT pc.*, d.name as doc_name, cf.short_name as fw_name
               FROM policy_compliance pc JOIN documents d ON pc.document_id = d.id
               LEFT JOIN compliance_frameworks cf ON pc.framework_id = cf.id
               WHERE pc.organization_id = $1`, [organizationId]),
        query(`SELECT * FROM audit_findings WHERE organization_id = $1 AND status = 'Open' ORDER BY severity DESC`, [organizationId]),
        frameworkId ? query(`SELECT * FROM compliance_frameworks WHERE id = $1`, [frameworkId]) : { rows: [] }
      ]);

      const controls = controlsRes.rows;
      const evidence = evidenceRes.rows;
      const gaps = gapsRes.rows;
      const policies = policyRes.rows;

      const passingControls = controls.filter(c => c.status === 'Implemented').length;
      const failingControls = controls.filter(c => c.status === 'Not Started').length;
      const partialControls = controls.filter(c => c.status === 'Partially Implemented').length;
      const expiredEvidence = evidence.filter(e => e.expiry_status === 'Expired').length;
      const criticalGaps = gaps.filter(g => g.severity === 'CRITICAL' || g.severity === 'HIGH').length;

      // Scoring
      const controlScore = controls.length > 0 ? ((passingControls + partialControls * 0.5) / controls.length) * 100 : 0;
      const evidenceScore = controls.length > 0 ? Math.min(100, (evidence.length / controls.length) * 100) : 0;
      const policyScore = policies.length > 0 ? (policies.filter(p => p.compliance_status === 'Compliant').length / policies.length) * 100 : 0;
      const gapPenalty = Math.min(40, criticalGaps * 5);
      const overallScore = parseFloat(Math.max(0, (controlScore * 0.35 + evidenceScore * 0.30 + policyScore * 0.20 + Math.max(0, 100 - gapPenalty) * 0.15)).toFixed(2));

      const readinessLevel = overallScore >= 90 ? 'Audit Ready' : overallScore >= 75 ? 'Good' :
                              overallScore >= 55 ? 'Moderate' : overallScore >= 35 ? 'Poor' : 'Critical';

      // Build summary context for AI narrative
      const summaryContext = `
Audit Package Analysis:
- Framework: ${frameworkRes.rows[0]?.name || 'All Frameworks'}
- Total Controls: ${controls.length} (Implemented: ${passingControls}, Partial: ${partialControls}, Not Started: ${failingControls})
- Evidence Items: ${evidence.length} (${expiredEvidence} expired)
- Open Compliance Gaps: ${gaps.length} (${criticalGaps} critical/high)
- Policy Mappings: ${policies.length}
- Overall Score: ${overallScore}% (${readinessLevel})
- Open Audit Findings: ${findingsRes.rows.length}
`.trim();

      // Generate AI narrative
      let executiveSummary = this._generateDefaultSummary(overallScore, readinessLevel, controls.length, passingControls, gaps.length, criticalGaps, evidence.length);
      try {
        const aiRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: 'You are an expert compliance auditor. Generate a concise, professional executive summary for an audit package. Be specific with numbers. Max 150 words. No markdown.' },
              { role: 'user', content: `Generate an executive summary for this audit:\n${summaryContext}` }
            ],
            stream: false,
            options: { temperature: 0.3, top_p: 0.9 }
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          let aiText = aiData.message?.content || '';
          aiText = aiText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          if (aiText.length > 50) executiveSummary = aiText;
        }
      } catch {
        logger.warn('AI narrative unavailable, using rule-based summary');
      }

      // Persist audit package
      const pkg = await query(
        `INSERT INTO audit_packages
         (organization_id, name, description, framework_id, audit_type, status, created_by,
          overall_score, total_controls, passing_controls, failing_controls, total_evidence, generated_at,
          metadata)
         VALUES ($1,$2,$3,$4,$5,'Generated',$6,$7,$8,$9,$10,$11,NOW(),$12) RETURNING *`,
        [
          organizationId,
          name || `${auditType} Audit Package — ${new Date().toLocaleDateString()}`,
          executiveSummary,
          frameworkId || null, auditType, createdBy || null,
          overallScore, controls.length, passingControls, failingControls, evidence.length,
          JSON.stringify({
            readinessLevel, expiredEvidence, criticalGaps, policyScore: parseFloat(policyScore.toFixed(1)),
            controlScore: parseFloat(controlScore.toFixed(1)), evidenceScore: parseFloat(evidenceScore.toFixed(1)),
            gapsByType: this._groupBy(gaps, 'gap_type'),
            gapsBySeverity: this._groupBy(gaps, 'severity')
          })
        ]
      );

      // Auto-generate findings for critical gaps
      for (const gap of gaps.filter(g => g.severity === 'CRITICAL' || g.severity === 'HIGH')) {
        try {
          await query(
            `INSERT INTO audit_findings
             (organization_id, audit_package_id, control_id, finding_type, severity, title, description, recommendation, status)
             VALUES ($1,$2,$3,'Gap',$4,$5,$6,$7,'Open')
             ON CONFLICT DO NOTHING`,
            [organizationId, pkg.rows[0].id, gap.control_id, gap.severity,
             gap.title, gap.description, gap.recommended_action]
          );
        } catch { /* skip duplicates */ }
      }

      return {
        success: true,
        package: pkg.rows[0],
        executiveSummary,
        metrics: {
          overallScore, readinessLevel, controlScore: parseFloat(controlScore.toFixed(1)),
          evidenceScore: parseFloat(evidenceScore.toFixed(1)), policyScore: parseFloat(policyScore.toFixed(1)),
          passingControls, failingControls, partialControls, expiredEvidence, criticalGaps
        },
        topGaps: gaps.slice(0, 10),
        openFindings: findingsRes.rows.slice(0, 10)
      };
    } catch (err) {
      logger.error('Failed to generate audit package:', err);
      return { success: false, message: err.message };
    }
  }

  _generateDefaultSummary(score, level, totalCtrl, implCtrl, totalGaps, critGaps, totalEv) {
    return `This audit package presents the current compliance posture of the organization. ` +
      `Overall compliance score: ${score}% (${level}). ` +
      `${implCtrl} of ${totalCtrl} controls are fully implemented. ` +
      `${totalEv} evidence items have been collected. ` +
      `${totalGaps} compliance gaps are open, including ${critGaps} critical/high severity items requiring immediate remediation. ` +
      `Priority actions: address critical gaps, complete control implementations, and renew any expired evidence.`;
  }

  _groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + 1;
      return acc;
    }, {});
  }
}

export default new AuditPackageGeneratorService();
