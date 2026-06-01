// ============================================================
// Infrastructure: ChromaDB Vector Store Service
// Stores and queries document embeddings for semantic search
// ============================================================
import { logger } from '../logging/logger.js';

const CHROMA_BASE = process.env.CHROMA_BASE_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'securevault_documents';

// Check ChromaDB availability
export const checkChromaHealth = async () => {
  try {
    const response = await fetch(`${CHROMA_BASE}/api/v1/heartbeat`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Ensure collection exists
const ensureCollection = async () => {
  try {
    // Try to get collection
    const getRes = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (getRes.ok) return true;

    // Create if not exists
    const createRes = await fetch(`${CHROMA_BASE}/api/v1/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: COLLECTION_NAME,
        metadata: { 'hnsw:space': 'cosine', description: 'SecureVault AI document embeddings' }
      }),
      signal: AbortSignal.timeout(5000)
    });

    return createRes.ok;
  } catch (error) {
    logger.warn(`ChromaDB collection setup failed: ${error.message}`);
    return false;
  }
};

// Upsert document embedding into ChromaDB
export const indexDocument = async (documentId, embedding, metadata, ocrText) => {
  try {
    if (!embedding || embedding.length === 0) {
      logger.warn(`No embedding for document ${documentId}, skipping vector index`);
      return false;
    }

    await ensureCollection();

    const response = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: [documentId],
        embeddings: [embedding],
        documents: [ocrText?.substring(0, 4000) || ''],
        metadatas: [{
          documentId,
          name: metadata.name || '',
          category: metadata.category || '',
          department: metadata.department || '',
          organizationId: metadata.organizationId || '',
          tags: (metadata.tags || []).join(','),
          uploadedAt: metadata.uploadedAt || new Date().toISOString()
        }]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ChromaDB upsert failed: ${err}`);
    }

    logger.info(`✅ Document ${documentId} indexed in ChromaDB`);
    return true;
  } catch (error) {
    logger.warn(`ChromaDB indexing failed for ${documentId}: ${error.message}`);
    return false;
  }
};

// Semantic similarity search
export const semanticSearch = async (queryEmbedding, organizationId, nResults = 5) => {
  try {
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    await ensureCollection();

    const response = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [queryEmbedding],
        n_results: nResults,
        where: { organizationId: { '$eq': organizationId } },
        include: ['documents', 'metadatas', 'distances']
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ChromaDB query failed: ${err}`);
    }

    const data = await response.json();
    const results = [];

    if (data.ids?.[0]) {
      for (let i = 0; i < data.ids[0].length; i++) {
        results.push({
          documentId: data.ids[0][i],
          content: data.documents?.[0]?.[i] || '',
          metadata: data.metadatas?.[0]?.[i] || {},
          similarity: 1 - (data.distances?.[0]?.[i] || 1),
          score: Math.max(0, 1 - (data.distances?.[0]?.[i] || 1))
        });
      }
    }

    return results.filter(r => r.score > 0.3).sort((a, b) => b.score - a.score);
  } catch (error) {
    logger.warn(`ChromaDB semantic search failed: ${error.message}`);
    return [];
  }
};

// Delete document from vector store
export const deleteDocumentVector = async (documentId) => {
  try {
    await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [documentId] }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    logger.warn(`ChromaDB delete failed for ${documentId}: ${error.message}`);
  }
};

export default { checkChromaHealth, indexDocument, semanticSearch, deleteDocumentVector };
