import { query } from '../database/connection.js';
import { createError } from '../../api/middleware/errorHandler.js';
import { logger } from '../logging/logger.js';

/**
 * TenantAccessService — Phase 2 Architecture Refinements
 * Enforces strict multi-tenant isolation at every database/AI service boundary.
 */
export const verifyTenantAccess = (targetOrgId, user) => {
  if (!user || !user.organizationId) {
    throw createError('Authentication required for tenant verification.', 401);
  }
  if (user.organizationId !== targetOrgId) {
    logger.warn(`🛑 Multi-tenant security violation by user ${user.id} targeting tenant ${targetOrgId}`);
    throw createError('Access Denied: Cross-tenant data operations prohibited.', 403);
  }
};

export const verifyDocumentAccess = async (documentId, user) => {
  if (!user) {
    throw createError('Authentication required for document access verification.', 401);
  }

  // Handle mock document IDs for frontend demo safety and stability
  if (documentId && documentId.startsWith('doc-')) {
    const isDoc1 = documentId.includes('doc-1');
    return {
      id: documentId,
      organization_id: user.organizationId || user, // fallback in case orgId is passed directly
      owner_id: typeof user === 'object' ? user.id : null,
      name: isDoc1 ? 'DPDP_Compliance_Framework_v1.pdf' : 'Q4_Financial_Audit_Report.xlsx',
      category: isDoc1 ? 'Compliance' : 'Finance',
      department: isDoc1 ? 'Legal' : 'Finance',
      ocrText: isDoc1 
        ? 'Digital Personal Data Protection Act compliance framework details. Section 4: Notice and Consent. Under the DPDP Act 2023, data fiduciaries must provide clear notice to data principals explaining what data is collected and for what specific purposes. Section 8: Obligations of Data Fiduciaries including data accuracy, security safeguards, and deletion protocols.'
        : 'Corporate financial data, including quarterly audits, balance sheets, cash flows, and expense logs. Approved by Rohan Verma, Senior Accountant.',
      ocrStatus: 'completed',
      fileSize: isDoc1 ? 2516582 : 1887436,
      is_deleted: false
    };
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!documentId || !UUID_REGEX.test(documentId)) {
    throw createError('Document not found or access denied.', 404);
  }

  // Fetch document details for owner validation
  const docResult = await query(
    `SELECT id, organization_id, owner_id, department, is_deleted FROM documents WHERE id = $1`,
    [documentId]
  );
  if (!docResult.rows[0]) {
    throw createError('Document not found or access denied.', 404);
  }

  const doc = docResult.rows[0];

  // 1. Cross-tenant check
  verifyTenantAccess(doc.organization_id, user);

  // 2. Department-level authorization checks for employees
  if (user.role === 'Employee') {
    if (doc.department && doc.department.toLowerCase() !== user.department?.toLowerCase()) {
      logger.warn(`🛑 Department access violation: User ${user.id} (${user.department}) tried to access document ${documentId} (${doc.department})`);
      throw createError('Access Denied: You do not belong to the authorized department for this document.', 403);
    }
  }

  return doc;
};

export default {
  verifyTenantAccess,
  verifyDocumentAccess
};
