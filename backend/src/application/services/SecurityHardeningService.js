// ============================================================
// Service: Security Hardening & Prompt Injection Guard
// Intercepts prompt injections, bad uploads, and unauth access
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

// Common prompt injection attack patterns
const INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all|the)\s+instruction/i,
  /system\s+override/i,
  /bypass\s+(?:safety|filter|restriction)/i,
  /you\s+are\s+now\s+a\s+(?:helper|jailbroken|assistant)/i,
  /delete\s+table/i,
  /drop\s+database/i,
  /select\s+\*\s+from\s+users/i,
  /new\s+system\s+prompt/i,
  /you\s+must\s+ignore/i
];

/**
 * Log a security incident to security_events table
 */
export const logSecurityIncident = async ({
  organizationId, userId, eventType, severity = 'medium', description, ipAddress = null, userAgent = null
}) => {
  try {
    const res = await query(
      `INSERT INTO security_events (organization_id, user_id, event_type, severity, description, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [organizationId, userId || null, eventType, severity, description, ipAddress, userAgent]
    );
    logger.warn(`🛡️ SECURITY EVENT LOGGED: [${eventType}] - Severity: ${severity} - ${description}`);
    return res.rows[0].id;
  } catch (err) {
    logger.error(`Error logging security incident: ${err.message}`);
    return null;
  }
};

/**
 * Check if a text contains prompt injection attempts
 */
export const detectPromptInjection = async (organizationId, userId, text, source = 'AI Query') => {
  if (!text || typeof text !== 'string') return false;

  for (const regex of INJECTION_PATTERNS) {
    if (regex.test(text)) {
      await logSecurityIncident({
        organizationId,
        userId,
        eventType: 'Prompt Injection Attempt',
        severity: 'high',
        description: `Potential injection pattern detected in ${source}: "${text.substring(0, 100)}..."`
      });
      return true;
    }
  }

  return false;
};

/**
 * Validate files against size limits and extensions
 */
export const validateFileUpload = async (organizationId, userId, filename, fileSize, mimeType) => {
  // 1. Check size (limits e.g. 50MB)
  if (fileSize > 50 * 1024 * 1024) {
    await logSecurityIncident({
      organizationId,
      userId,
      eventType: 'Oversized Document',
      severity: 'medium',
      description: `File "${filename}" exceeded size limit: ${(fileSize / (1024 * 1024)).toFixed(1)}MB (Limit: 50MB)`
    });
    return { valid: false, reason: 'File exceeds maximum allowed size (50MB).' };
  }

  // 2. Check forbidden extensions/types
  const forbiddenExts = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.vbs', '.js', '.bin'];
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  
  if (forbiddenExts.includes(ext)) {
    await logSecurityIncident({
      organizationId,
      userId,
      eventType: 'Malicious File Upload',
      severity: 'critical',
      description: `Forbidden executable file extension detected: "${filename}"`
    });
    return { valid: false, reason: 'Malicious or unsupported file type detected.' };
  }

  return { valid: true };
};

/**
 * Validate OCR output content
 */
export const validateOCRText = async (organizationId, documentId, docName, ocrText) => {
  if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length === 0) {
    await logSecurityIncident({
      organizationId,
      eventType: 'Corrupted OCR Data',
      severity: 'low',
      description: `OCR extraction for document "${docName}" (id: ${documentId}) returned empty content.`
    });
    return false;
  }

  // Check if it is mostly gibberish (e.g. non-ascii characters or very few letters)
  const letterCount = (ocrText.match(/[a-zA-Z]/g) || []).length;
  if (letterCount / ocrText.length < 0.15 && ocrText.length > 50) {
    await logSecurityIncident({
      organizationId,
      eventType: 'Corrupted OCR Data',
      severity: 'medium',
      description: `OCR extraction for document "${docName}" (id: ${documentId}) returned mostly gibberish or corrupt fonts.`
    });
    return false;
  }

  return true;
};

export default { logSecurityIncident, detectPromptInjection, validateFileUpload, validateOCRText };
