// SensitiveDataDetectionService — Phase 2
import { logger } from '../logging/logger.js';

const PATTERNS = {
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  gst: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/g,
  phone: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
  email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
  bankAccount: /\b\d{9,18}\b/g,
  passport: /\b[A-Z][1-9]\d{7}\b/g,
};

const RISK_WEIGHTS = { aadhaar: 9, pan: 8, passport: 8, creditCard: 9, bankAccount: 7, gst: 4, phone: 3, email: 2 };

export const detectSensitiveData = (text) => {
  if (!text) return { sensitivityScore: 0, riskLevel: 'low', detectedEntities: [], summary: 'No text to analyze' };

  const detected = [];
  let totalScore = 0;

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const weight = RISK_WEIGHTS[type] || 3;
      const count = matches.length;
      totalScore += weight * Math.min(count, 5);
      detected.push({ type, count, weight, sample: matches[0][0].replace(/\d(?=\d{4})/g, '*') });
    }
  }

  const score = Math.min(100, Math.round(totalScore));
  const riskLevel = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 15 ? 'medium' : 'low';

  return {
    sensitivityScore: score,
    riskLevel,
    detectedEntities: detected,
    summary: detected.length === 0 ? 'No sensitive data detected' : `Found ${detected.length} sensitive data type(s): ${detected.map(d => d.type).join(', ')}`
  };
};

export const analyzeSensitivity = async (documentId, organizationId, text, { query }) => {
  try {
    const result = detectSensitiveData(text);
    await query(
      `INSERT INTO document_sensitivity (document_id, organization_id, sensitivity_score, risk_level, detected_entities, summary)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (document_id) DO UPDATE SET
         sensitivity_score=EXCLUDED.sensitivity_score, risk_level=EXCLUDED.risk_level,
         detected_entities=EXCLUDED.detected_entities, summary=EXCLUDED.summary, updated_at=NOW()`,
      [documentId, organizationId, result.sensitivityScore, result.riskLevel, JSON.stringify(result.detectedEntities), result.summary]
    );
    return result;
  } catch (err) {
    logger.warn(`Sensitivity analysis failed: ${err.message}`);
    return null;
  }
};

export default { detectSensitiveData, analyzeSensitivity };
