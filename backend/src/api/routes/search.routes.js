// ============================================================
// Routes: Search (Full-text + Semantic)
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import { generateEmbedding } from '../../infrastructure/ai/OllamaService.js';
import { semanticSearch } from '../../infrastructure/ai/ChromaService.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';

const router = Router();
router.use(authenticate);

// GET /search?q=... — Combined full-text + semantic search
router.get('/', async (req, res) => {
  const { q, type = 'hybrid', category, department } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, results: [], query: q });
  }

  let results = [];
  const queryStr = q.trim();

  if (type === 'fulltext' || type === 'hybrid') {
    // PostgreSQL full-text search
    const ftResults = await documentRepository.fullTextSearch(req.organizationId, queryStr);
    results.push(...ftResults.map(doc => ({
      id: doc.id, name: doc.name, category: doc.category,
      department: doc.department, tags: doc.tags,
      uploadedBy: doc.uploadedBy, uploadedAt: doc.createdAt,
      snippet: doc.ocrText?.substring(0, 300) || '',
      searchType: 'fulltext', score: 0.7
    })));
  }

  if (type === 'semantic' || type === 'hybrid') {
    // Semantic vector search
    const embedding = await generateEmbedding(queryStr);
    if (embedding) {
      const vectorResults = await semanticSearch(embedding, req.organizationId, 5);

      for (const vr of vectorResults) {
        // Skip duplicates
        if (!results.find(r => r.id === vr.documentId)) {
          const doc = await documentRepository.findById(vr.documentId, req.organizationId);
          if (doc && !doc.isDeleted) {
            results.push({
              id: doc.id, name: doc.name, category: doc.category,
              department: doc.department, tags: doc.tags,
              uploadedBy: doc.uploadedBy, uploadedAt: doc.createdAt,
              snippet: doc.ocrText?.substring(0, 300) || '',
              searchType: 'semantic', score: vr.score
            });
          }
        }
      }
    }
  }

  // Apply filters
  if (category) results = results.filter(r => r.category === category);
  if (department) results = results.filter(r => r.department === department);

  // Sort by score desc
  results.sort((a, b) => b.score - a.score);

  // Log search in audit
  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Document Search',
    resourceType: 'Search',
    details: `Searched: "${queryStr}" — ${results.length} results`,
    ipAddress: req.ip
  });

  res.json({ success: true, query: queryStr, results, count: results.length, searchType: type });
});

export default router;
