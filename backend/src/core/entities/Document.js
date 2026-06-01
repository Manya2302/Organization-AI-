// ============================================================
// Core Domain Entity: Document
// ============================================================
export class Document {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id || data.organizationId;
    this.ownerId = data.owner_id || data.ownerId;
    this.name = data.name;
    this.originalFilename = data.original_filename || data.originalFilename;
    this.filePath = data.file_path || data.filePath;
    this.fileSize = data.file_size || data.fileSize;
    this.fileType = data.file_type || data.fileType;
    this.mimeType = data.mime_type || data.mimeType;
    this.category = data.category || 'General';
    this.department = data.department;
    this.tags = data.tags || [];
    this.description = data.description;
    this.version = data.version || 1;
    this.parentDocumentId = data.parent_document_id || data.parentDocumentId;
    this.ocrStatus = data.ocr_status || data.ocrStatus || 'pending';
    this.ocrText = data.ocr_text || data.ocrText;
    this.ocrWordCount = data.ocr_word_count || data.ocrWordCount;
    this.vectorIndexed = data.vector_indexed ?? data.vectorIndexed ?? false;
    this.chromaDocId = data.chroma_doc_id || data.chromaDocId;
    this.isDeleted = data.is_deleted ?? data.isDeleted ?? false;
    this.deletedAt = data.deleted_at || data.deletedAt;
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    // Joined data
    this.uploadedBy = data.uploaded_by || data.uploadedBy;
    this.versions = data.versions || [];
  }

  get sizeFormatted() {
    const bytes = this.fileSize;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  get isOCRComplete() {
    return this.ocrStatus === 'completed';
  }
}

export class DocumentVersion {
  constructor(data) {
    this.id = data.id;
    this.documentId = data.document_id || data.documentId;
    this.versionNumber = data.version_number || data.versionNumber;
    this.fileName = data.file_name || data.fileName;
    this.filePath = data.file_path || data.filePath;
    this.fileSize = data.file_size || data.fileSize;
    this.uploadedBy = data.uploaded_by || data.uploadedBy;
    this.changeNotes = data.change_notes || data.changeNotes;
    this.createdAt = data.created_at || data.createdAt;
  }
}

export class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id || data.organizationId;
    this.userId = data.user_id || data.userId;
    this.userName = data.user_name || data.userName;
    this.userRole = data.user_role || data.userRole;
    this.action = data.action;
    this.resourceType = data.resource_type || data.resourceType;
    this.resourceId = data.resource_id || data.resourceId;
    this.resourceName = data.resource_name || data.resourceName;
    this.details = data.details;
    this.metadata = data.metadata || {};
    this.ipAddress = data.ip_address || data.ipAddress;
    this.userAgent = data.user_agent || data.userAgent;
    this.status = data.status || 'success';
    this.createdAt = data.created_at || data.createdAt;
  }
}
