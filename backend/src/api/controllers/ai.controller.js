// ============================================================
// API Controller: AI Copilot (RAG + Semantic Search)
// ============================================================
import { generateRAGResponse, checkOllamaHealth } from '../../infrastructure/ai/OllamaService.js';
import { generateEmbedding } from '../../infrastructure/ai/OllamaService.js';
import { semanticSearch, checkChromaHealth } from '../../infrastructure/ai/ChromaService.js';
import documentRepository from '../../infrastructure/repositories/DocumentRepository.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';
import { query } from '../../infrastructure/database/connection.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';

// GET /ai/status — Check Ollama & ChromaDB connectivity
export const getAIStatus = async (req, res) => {
  const [ollamaStatus, chromaOnline] = await Promise.all([
    checkOllamaHealth(),
    checkChromaHealth()
  ]);

  res.json({
    success: true,
    ai: {
      ollama: {
        online: ollamaStatus.online,
        models: ollamaStatus.models || [],
        hasLLM: ollamaStatus.hasLLM || false,
        hasEmbedding: ollamaStatus.hasEmbed || false,
        url: process.env.OLLAMA_BASE_URL,
        activeModel: process.env.OLLAMA_MODEL
      },
      chromadb: {
        online: chromaOnline,
        url: process.env.CHROMA_BASE_URL,
        collection: process.env.CHROMA_COLLECTION
      }
    },
    hints: {
      setupOllama: ollamaStatus.online ? null : 'Run: ollama serve',
      pullModel: ollamaStatus.online && !ollamaStatus.hasLLM
        ? `Run: ollama pull ${process.env.OLLAMA_MODEL}`
        : null,
      pullEmbed: ollamaStatus.online && !ollamaStatus.hasEmbed
        ? 'Run: ollama pull nomic-embed-text'
        : null,
      setupChroma: chromaOnline ? null : 'Run: docker run -p 8000:8000 chromadb/chroma'
    }
  });
};

// POST /ai/chat — Main RAG conversation endpoint
export const chat = async (req, res) => {
  const { message, sessionId, chatHistory = [] } = req.body;

  if (!message?.trim()) throw createError('Message is required.', 400);

  logger.info(`AI Query from ${req.user.email}: "${message.substring(0, 80)}..."`);

  // Step 1: Generate embedding for query
  const queryEmbedding = await generateEmbedding(message);
  let contextDocuments = [];
  let vectorSearchScore = null;

  // Step 2: Semantic search in ChromaDB (if embedding available)
  if (queryEmbedding) {
    const vectorResults = await semanticSearch(queryEmbedding, req.organizationId, 3);

    if (vectorResults.length > 0) {
      vectorSearchScore = vectorResults[0]?.score || 0;

      // Fetch full document details from PostgreSQL
      const docIds = vectorResults.map(r => r.documentId);
      for (const docId of docIds) {
        const doc = await documentRepository.findById(docId, req.organizationId);
        if (doc && !doc.isDeleted) {
          contextDocuments.push({
            name: doc.name,
            category: doc.category,
            department: doc.department,
            ocrText: doc.ocrText,
            score: vectorResults.find(r => r.documentId === docId)?.score || 0
          });
        }
      }
    }
  }

  // Step 3: Fallback keyword search in PostgreSQL if vector search returns nothing
  if (contextDocuments.length === 0) {
    const keywordResults = await documentRepository.fullTextSearch(req.organizationId, message);
    contextDocuments = keywordResults.slice(0, 3).map(doc => ({
      name: doc.name,
      category: doc.category,
      department: doc.department,
      ocrText: doc.ocrText,
      score: 0.5 // Keyword match score
    }));
  }

  // Step 4: Generate AI response with retrieved context
  const startTime = Date.now();
  const aiResponse = await generateRAGResponse(message, contextDocuments, chatHistory);
  const latencyMs = Date.now() - startTime;

  // Step 5: Store message in DB
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const sessionResult = await query(
      `INSERT INTO ai_sessions (organization_id, user_id, session_title, model_used)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.organizationId, req.user.id, message.substring(0, 100), process.env.OLLAMA_MODEL]
    );
    currentSessionId = sessionResult.rows[0].id;
  }

  await query(
    `INSERT INTO ai_messages (session_id, organization_id, user_id, role, content, context_documents, vector_search_score, latency_ms)
     VALUES ($1, $2, $3, 'user', $4, $5, $6, $7)`,
    [currentSessionId, req.organizationId, req.user.id, message, JSON.stringify(contextDocuments.map(d => d.name)), vectorSearchScore, latencyMs]
  );

  await query(
    `INSERT INTO ai_messages (session_id, organization_id, user_id, role, content, context_documents, tokens_used, latency_ms)
     VALUES ($1, $2, $3, 'assistant', $4, $5, $6, $7)`,
    [currentSessionId, req.organizationId, req.user.id, aiResponse.content, JSON.stringify(contextDocuments.map(d => d.name)), aiResponse.tokensUsed || 0, aiResponse.latencyMs || latencyMs]
  );

  // Update session query count
  await query(
    'UPDATE ai_sessions SET total_queries = total_queries + 1, updated_at = NOW() WHERE id = $1',
    [currentSessionId]
  );

  res.json({
    success: true,
    sessionId: currentSessionId,
    response: aiResponse.content,
    contextSources: contextDocuments.map(d => ({ name: d.name, category: d.category, score: d.score })),
    model: aiResponse.model || process.env.OLLAMA_MODEL,
    latencyMs: aiResponse.latencyMs || latencyMs,
    ollamaOnline: aiResponse.success
  });
};

// GET /ai/sessions — Get chat history sessions
export const getSessions = async (req, res) => {
  const result = await query(
    `SELECT s.*, COUNT(m.id) as message_count
     FROM ai_sessions s
     LEFT JOIN ai_messages m ON s.id = m.session_id
     WHERE s.organization_id = $1 AND s.user_id = $2
     GROUP BY s.id
     ORDER BY s.updated_at DESC
     LIMIT 20`,
    [req.organizationId, req.user.id]
  );
  res.json({ success: true, sessions: result.rows });
};

// GET /ai/sessions/:id/messages — Get messages for a session
export const getSessionMessages = async (req, res) => {
  const result = await query(
    `SELECT * FROM ai_messages
     WHERE session_id = $1 AND organization_id = $2
     ORDER BY created_at ASC`,
    [req.params.id, req.organizationId]
  );
  res.json({ success: true, messages: result.rows });
};
