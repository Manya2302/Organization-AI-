import { query } from '../database/connection.js';
import { generateOllamaCompletion } from './OllamaService.js';
import { createError } from '../../api/middleware/errorHandler.js';
import { logger } from '../logging/logger.js';

/**
 * VersionComparisonService — Phase 2 Final Architecture Refinements
 * Compares two document versions (or any two documents), highlighting diffs and generating semantic summaries.
 */
export const compareVersions = async (docIdA, docIdB, organizationId) => {
  // Fetch both documents
  const docAResult = await query(
    `SELECT id, name, ocr_text, version FROM documents WHERE id = $1 AND organization_id = $2`,
    [docIdA, organizationId]
  );
  const docBResult = await query(
    `SELECT id, name, ocr_text, version FROM documents WHERE id = $1 AND organization_id = $2`,
    [docIdB, organizationId]
  );

  if (!docAResult.rows[0] || !docBResult.rows[0]) {
    throw createError('One or both documents not found for comparison.', 404);
  }

  const docA = docAResult.rows[0];
  const docB = docBResult.rows[0];

  const textA = docA.ocr_text || '';
  const textB = docB.ocr_text || '';

  // 1. Calculate a simple word-based diff
  const wordsA = textA.split(/\s+/);
  const wordsB = textB.split(/\s+/);

  const additions = [];
  const removals = [];
  const unchanged = [];

  // Track simple addition/removal vectors
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  for (const w of wordsB) {
    if (!setA.has(w) && w.trim()) {
      additions.push(w);
    }
  }

  for (const w of wordsA) {
    if (!setB.has(w) && w.trim()) {
      removals.push(w);
    }
  }

  // 2. Generate a semantic change summary using Ollama
  let changeSummary = 'No significant text changes detected.';
  if (textA && textB && textA !== textB) {
    const prompt = `You are a legal and compliance document auditor. Compare the following two texts. 
Text A (Older Version):
"""
${textA.slice(0, 2000)}
"""

Text B (Newer Version):
"""
${textB.slice(0, 2000)}
"""

Analyze what changed. Highlight additions, deletions, policy changes, and legal risk shifts. 
Provide a clear, bulleted executive summary of changes. Keep it concise.`;

    try {
      changeSummary = await generateOllamaCompletion(prompt);
    } catch (err) {
      logger.warn(`Ollama version comparison summary failed: ${err.message}`);
      changeSummary = `Text differences detected. Additions: ${additions.length} words, Removals: ${removals.length} words. (Ollama model summary offline)`;
    }
  }

  return {
    documentA: { id: docA.id, name: docA.name, version: docA.version },
    documentB: { id: docB.id, name: docB.name, version: docB.version },
    summary: changeSummary,
    metrics: {
      totalWordsA: wordsA.length,
      totalWordsB: wordsB.length,
      additionsCount: additions.length,
      removalsCount: removals.length,
      similarityScore: parseFloat((1 - (additions.length + removals.length) / Math.max(wordsA.length + wordsB.length, 1)).toFixed(2))
    },
    sampleAdditions: additions.slice(0, 50),
    sampleRemovals: removals.slice(0, 50)
  };
};

export default {
  compareVersions
};
