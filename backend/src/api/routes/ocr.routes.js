// ============================================================
// Routes: OCR Processing Queue Status
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { query } from '../../infrastructure/database/connection.js';
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import { extractTextFromFile } from '../../infrastructure/ai/OCRService.js';
import { generateEmbedding } from '../../infrastructure/ai/OllamaService.js';
import { indexDocument } from '../../infrastructure/ai/ChromaService.js';
import path from 'path';

const router = Router();
router.use(authenticate);

// GET /status — Get OCR queue status for org
router.get('/status', async (req, res) => {
  const result = await query(
    `SELECT q.*, d.name as document_name, d.mime_type
     FROM ocr_queue q
     JOIN documents d ON q.document_id = d.id
     WHERE q.organization_id = $1
     ORDER BY q.created_at DESC LIMIT 50`,
    [req.organizationId]
  );
  res.json({ success: true, queue: result.rows });
});

// POST /retry/:documentId — Manually trigger OCR re-processing
router.post('/retry/:documentId', authorize('SuperAdmin', 'EnterpriseAdmin'), async (req, res) => {
  const doc = await documentRepository.findById(req.params.documentId, req.organizationId);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

  // Update queue status
  await query(
    `UPDATE ocr_queue SET status = 'queued', error_message = NULL, attempt_count = 0
     WHERE document_id = $1`,
    [doc.id]
  );

  // Trigger async processing
  processAsync(doc, req.organizationId);

  res.json({ success: true, message: `OCR re-queued for: ${doc.name}` });
});

const processAsync = async (doc, orgId) => {
  try {
    await query('UPDATE ocr_queue SET status = $1, started_at = NOW() WHERE document_id = $2', ['processing', doc.id]);
    const ocrResult = await extractTextFromFile(doc.filePath, doc.mimeType, doc.name);
    if (ocrResult?.text) {
      await documentRepository.updateOCR(doc.id, ocrResult.text, ocrResult.wordCount);
      const embedding = await generateEmbedding(ocrResult.text);
      if (embedding) await indexDocument(doc.id, embedding, { name: doc.name, category: doc.category, department: doc.department, organizationId: orgId, tags: doc.tags }, ocrResult.text);
    }
  } catch (err) {
    await query('UPDATE ocr_queue SET status = $1, error_message = $2 WHERE document_id = $3', ['failed', err.message, doc.id]);
  }
};

export default router;
