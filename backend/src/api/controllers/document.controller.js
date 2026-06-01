// ============================================================
// API Controller: Documents
// Full CRUD + OCR + Versioning + Vector Indexing
// ============================================================
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';
import { extractTextFromFile } from '../../infrastructure/ai/OCRService.js';
import { generateEmbedding } from '../../infrastructure/ai/OllamaService.js';
import { indexDocument, deleteDocumentVector } from '../../infrastructure/ai/ChromaService.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { query } from '../../infrastructure/database/connection.js';
import path from 'path';
import fs from 'fs/promises';

// GET /documents — List all documents for organization
export const listDocuments = async (req, res) => {
  const { category, department, search, isDeleted, page = 1, limit = 50 } = req.query;

  const filters = {
    isDeleted: isDeleted === 'true',
    category: category || null,
    department: department || null,
    search: search || null,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  // Employees can only see their department's docs
  if (req.user.role === 'Employee') {
    filters.department = req.user.department;
  }

  const documents = await documentRepository.findByOrganization(req.organizationId, filters);

  // Format response
  const formatted = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    size: doc.sizeFormatted,
    fileSize: doc.fileSize,
    type: doc.fileType,
    category: doc.category,
    department: doc.department,
    tags: doc.tags,
    uploadedBy: doc.uploadedBy,
    uploadedAt: doc.createdAt,
    version: doc.version,
    ocrStatus: doc.ocrStatus,
    isDeleted: doc.isDeleted,
    vectorIndexed: doc.vectorIndexed
  }));

  res.json({ success: true, documents: formatted, count: formatted.length });
};

// GET /documents/:id — Get single document with versions and OCR
export const getDocument = async (req, res) => {
  const doc = await documentRepository.findById(req.params.id, req.organizationId);
  if (!doc) throw createError('Document not found or access denied.', 404);

  // Log access
  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Viewed',
    resourceType: 'Document',
    resourceId: doc.id,
    resourceName: doc.name,
    details: `Document viewed: ${doc.name}`,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    document: {
      id: doc.id,
      name: doc.name,
      size: doc.sizeFormatted,
      category: doc.category,
      department: doc.department,
      tags: doc.tags,
      description: doc.description,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.createdAt,
      version: doc.version,
      ocrStatus: doc.ocrStatus,
      ocrText: doc.ocrText,
      ocrWordCount: doc.ocrWordCount,
      vectorIndexed: doc.vectorIndexed,
      versions: doc.versions,
      metadata: doc.metadata
    }
  });
};

// POST /documents — Upload new document
export const uploadDocument = async (req, res) => {
  if (!req.file) throw createError('No file uploaded. Please attach a file.', 400);

  const { category, department, tags, description } = req.body;
  const file = req.file;

  const documentData = {
    organizationId: req.organizationId,
    ownerId: req.user.id,
    name: req.body.name || file.originalname,
    originalFilename: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    fileType: path.extname(file.originalname).replace('.', '').toUpperCase(),
    mimeType: file.mimetype,
    category: category || 'General',
    department: department || req.user.department || null,
    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
    description: description || null
  };

  const document = await documentRepository.create(documentData);

  // Run OCR asynchronously (non-blocking)
  processDocumentAsync(document.id, file.path, file.mimetype, file.originalname, req.organizationId, document);

  // Audit log
  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Uploaded',
    resourceType: 'Document',
    resourceId: document.id,
    resourceName: document.name,
    details: `Uploaded: ${file.originalname} (${(file.size/1048576).toFixed(2)} MB). OCR queued.`,
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully. OCR extraction initiated.',
    document: {
      id: document.id,
      name: document.name,
      size: document.sizeFormatted,
      category: document.category,
      department: document.department,
      tags: document.tags,
      uploadedAt: document.createdAt,
      version: document.version,
      ocrStatus: 'processing'
    }
  });
};

// POST /documents/:id/version — Upload new version
export const uploadVersion = async (req, res) => {
  if (!req.file) throw createError('No file uploaded.', 400);

  const doc = await documentRepository.findById(req.params.id, req.organizationId);
  if (!doc) throw createError('Document not found.', 404);

  const file = req.file;

  const updated = await documentRepository.addVersion(req.params.id, {
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    uploadedBy: req.user.id,
    changeNotes: req.body.changeNotes || null
  }, req.organizationId);

  // Re-run OCR on new version
  processDocumentAsync(updated.id, file.path, file.mimetype, file.originalname, req.organizationId, updated);

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Version Added',
    resourceType: 'Document',
    resourceId: doc.id,
    resourceName: doc.name,
    details: `New version ${updated.version} uploaded for: ${doc.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: `Version ${updated.version} uploaded.`, document: updated });
};

// DELETE /documents/:id — Soft delete (move to trash)
export const deleteDocument = async (req, res) => {
  const doc = await documentRepository.findById(req.params.id, req.organizationId);
  if (!doc) throw createError('Document not found.', 404);

  await documentRepository.softDelete(doc.id, req.user.id);

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Deleted',
    resourceType: 'Document',
    resourceId: doc.id,
    resourceName: doc.name,
    details: `Moved to trash: ${doc.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: `"${doc.name}" moved to trash.` });
};

// PATCH /documents/:id/restore — Restore from trash
export const restoreDocument = async (req, res) => {
  const doc = await documentRepository.findById(req.params.id, req.organizationId);
  if (!doc) throw createError('Document not found.', 404);

  await documentRepository.restore(doc.id);

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Restored',
    resourceType: 'Document',
    resourceId: doc.id,
    resourceName: doc.name,
    details: `Restored from trash: ${doc.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: `"${doc.name}" restored.` });
};

// GET /documents/:id/download — Secure file download
export const downloadDocument = async (req, res) => {
  const doc = await documentRepository.findById(req.params.id, req.organizationId);
  if (!doc) throw createError('Document not found.', 404);

  try {
    await fs.access(doc.filePath);
  } catch {
    throw createError('File not found on server. It may have been moved or deleted.', 404);
  }

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Downloaded',
    resourceType: 'Document',
    resourceId: doc.id,
    resourceName: doc.name,
    details: `Downloaded: ${doc.name} (v${doc.version})`,
    ipAddress: req.ip
  });

  res.download(doc.filePath, doc.originalFilename);
};

// Background: OCR + Embedding + ChromaDB indexing
const processDocumentAsync = async (docId, filePath, mimeType, fileName, orgId, doc) => {
  try {
    logger.info(`🔍 Processing document ${docId}: ${fileName}`);

    // Step 1: Extract text with OCR
    const ocrResult = await extractTextFromFile(filePath, mimeType, fileName);

    if (ocrResult?.text) {
      // Step 2: Save OCR text to DB
      await documentRepository.updateOCR(docId, ocrResult.text, ocrResult.wordCount);
      logger.info(`✅ OCR complete for ${fileName}: ${ocrResult.wordCount} words extracted`);

      // Step 3: Generate embedding
      const embedding = await generateEmbedding(ocrResult.text);

      if (embedding) {
        // Step 4: Index in ChromaDB
        const indexed = await indexDocument(docId, embedding, {
          name: doc.name,
          category: doc.category,
          department: doc.department,
          organizationId: orgId,
          tags: doc.tags,
          uploadedAt: doc.createdAt
        }, ocrResult.text);

        if (indexed) {
          await documentRepository.markVectorIndexed(docId, docId);
          logger.info(`✅ Vector indexed document ${docId} in ChromaDB`);
        }
      }
    }
  } catch (error) {
    logger.error(`Background processing failed for document ${docId}:`, error.message);
  }
};
