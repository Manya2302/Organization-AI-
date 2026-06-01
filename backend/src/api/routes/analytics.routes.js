// ============================================================
// Routes: Analytics Dashboard Data
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';
import userRepository from '../../infrastructure/repositories/UserRepository.js';
import { query } from '../../infrastructure/database/connection.js';
import { checkOllamaHealth } from '../../infrastructure/ai/OllamaService.js';
import { checkChromaHealth } from '../../infrastructure/ai/ChromaService.js';

const router = Router();
router.use(authenticate);
router.use(authorize('SuperAdmin', 'EnterpriseAdmin', 'DepartmentManager'));

// GET /overview — Complete analytics overview
router.get('/overview', async (req, res) => {
  const orgId = req.organizationId;

  const [
    docCountRes,
    storageRes,
    userCountRes,
    recentLogs,
    uploadActivity,
    storageByDept,
    ocrStatusRes,
    vectorIndexedRes,
    ollamaStatus,
    chromaOnline
  ] = await Promise.all([
    query('SELECT COUNT(*) as total FROM documents WHERE organization_id = $1 AND is_deleted = FALSE', [orgId]),
    query('SELECT COALESCE(SUM(file_size), 0) as total_bytes, COALESCE(SUM(file_size), 0) / 1024.0 / 1024.0 as total_mb FROM documents WHERE organization_id = $1 AND is_deleted = FALSE', [orgId]),
    query("SELECT COUNT(*) as total FROM users WHERE organization_id = $1 AND is_active = TRUE AND role != 'SuperAdmin'", [orgId]),
    auditRepository.findByOrganization(orgId, { limit: 5 }),
    documentRepository.getUploadActivity(orgId, 7),
    query("SELECT department, COUNT(*) as count, COALESCE(SUM(file_size), 0) / 1024.0 / 1024.0 as size_mb FROM documents WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY department ORDER BY size_mb DESC", [orgId]),
    query("SELECT ocr_status, COUNT(*) as count FROM documents WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY ocr_status", [orgId]),
    query('SELECT COUNT(*) as indexed FROM documents WHERE organization_id = $1 AND vector_indexed = TRUE', [orgId]),
    checkOllamaHealth(),
    checkChromaHealth()
  ]);

  res.json({
    success: true,
    overview: {
      documents: {
        total: parseInt(docCountRes.rows[0]?.total) || 0,
        storageMB: parseFloat(storageRes.rows[0]?.total_mb || 0).toFixed(2),
        storageBytes: parseInt(storageRes.rows[0]?.total_bytes) || 0,
        vectorIndexed: parseInt(vectorIndexedRes.rows[0]?.indexed) || 0,
        ocrStatusBreakdown: ocrStatusRes.rows
      },
      users: {
        total: parseInt(userCountRes.rows[0]?.total) || 0
      },
      storageByDepartment: storageByDept.rows,
      uploadActivity: uploadActivity,
      recentActivity: recentLogs,
      infrastructure: {
        ollama: { online: ollamaStatus.online, model: process.env.OLLAMA_MODEL },
        chroma: { online: chromaOnline },
        database: 'PostgreSQL — Connected'
      }
    }
  });
});

// GET /category-breakdown
router.get('/category-breakdown', async (req, res) => {
  const result = await query(
    `SELECT category, COUNT(*) as count, SUM(file_size) as total_bytes
     FROM documents WHERE organization_id = $1 AND is_deleted = FALSE
     GROUP BY category ORDER BY count DESC`,
    [req.organizationId]
  );
  res.json({ success: true, breakdown: result.rows });
});

// GET /upload-trends?days=30
router.get('/upload-trends', async (req, res) => {
  const { days = 30 } = req.query;
  const activity = await documentRepository.getUploadActivity(req.organizationId, parseInt(days));
  res.json({ success: true, trends: activity });
});

export default router;
