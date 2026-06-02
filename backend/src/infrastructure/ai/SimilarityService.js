// ============================================================
// Infrastructure: Similarity Detection Service (Phase 2)
// Detects duplicate and similar documents using vector cosine similarity
// ============================================================
import { logger } from '../logging/logger.js';
import { semanticSearch } from './ChromaService.js';
import { generateEmbedding } from './OllamaService.js';

const CHROMA_BASE = process.env.CHROMA_BASE_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'securevault_documents';

// ── Cosine similarity between two vectors ─────────────────────
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
};

// ── Detect similar/duplicate documents for a given document ────
export const findSimilarDocuments = async (documentId, organizationId, threshold = 0.75) => {
  try {
    // Query ChromaDB for similar documents
    const response = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: [documentId],
        include: ['embeddings', 'metadatas']
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      logger.warn(`ChromaDB get failed for similarity on doc ${documentId}`);
      return [];
    }

    const data = await response.json();
    const embedding = data.embeddings?.[0];

    if (!embedding || embedding.length === 0) {
      logger.warn(`No embedding found for document ${documentId}`);
      return [];
    }

    // Now query for similar documents
    const queryResponse = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [embedding],
        n_results: 10,
        where: { organizationId: { '$eq': organizationId } },
        include: ['documents', 'metadatas', 'distances', 'embeddings']
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!queryResponse.ok) return [];

    const queryData = await queryResponse.json();
    const results = [];

    if (queryData.ids?.[0]) {
      for (let i = 0; i < queryData.ids[0].length; i++) {
        const similarDocId = queryData.ids[0][i];
        if (similarDocId === documentId) continue; // Skip self

        const distance = queryData.distances?.[0]?.[i] || 1;
        const similarity = Math.max(0, 1 - distance);

        if (similarity >= threshold) {
          results.push({
            documentId: similarDocId,
            name: queryData.metadatas?.[0]?.[i]?.name || 'Unknown',
            category: queryData.metadatas?.[0]?.[i]?.category || '',
            department: queryData.metadatas?.[0]?.[i]?.department || '',
            similarityScore: parseFloat(similarity.toFixed(4)),
            relationshipType: similarity >= 0.95 ? 'duplicate' :
                              similarity >= 0.85 ? 'near_duplicate' :
                              similarity >= 0.75 ? 'similar' : 'related'
          });
        }
      }
    }

    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  } catch (error) {
    logger.warn(`Similarity detection failed for ${documentId}: ${error.message}`);
    return [];
  }
};

// ── Detect all duplicate clusters across organization ──────────
export const findOrganizationDuplicates = async (organizationId) => {
  try {
    // Get all documents from ChromaDB for this org
    const response = await fetch(`${CHROMA_BASE}/api/v1/collections/${COLLECTION_NAME}/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { organizationId: { '$eq': organizationId } },
        include: ['embeddings', 'metadatas']
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) return { clusters: [], totalDuplicates: 0 };

    const data = await response.json();
    const ids = data.ids || [];
    const embeddings = data.embeddings || [];
    const metadatas = data.metadatas || [];

    if (ids.length < 2) return { clusters: [], totalDuplicates: 0 };

    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < ids.length; i++) {
      if (visited.has(ids[i])) continue;

      const cluster = [{
        documentId: ids[i],
        name: metadatas[i]?.name || 'Unknown',
        similarityScore: 1.0,
        relationshipType: 'source'
      }];

      for (let j = i + 1; j < ids.length; j++) {
        if (visited.has(ids[j])) continue;

        const sim = cosineSimilarity(embeddings[i], embeddings[j]);
        if (sim >= 0.85) {
          cluster.push({
            documentId: ids[j],
            name: metadatas[j]?.name || 'Unknown',
            similarityScore: parseFloat(sim.toFixed(4)),
            relationshipType: sim >= 0.95 ? 'duplicate' : 'similar'
          });
          visited.add(ids[j]);
        }
      }

      if (cluster.length > 1) {
        visited.add(ids[i]);
        clusters.push(cluster);
      }
    }

    const totalDuplicates = clusters.reduce((sum, c) => sum + c.length - 1, 0);
    return { clusters, totalDuplicates };
  } catch (error) {
    logger.warn(`Organization duplicate scan failed: ${error.message}`);
    return { clusters: [], totalDuplicates: 0, error: error.message };
  }
};

export default { findSimilarDocuments, findOrganizationDuplicates };
