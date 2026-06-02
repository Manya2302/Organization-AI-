// EntityExtractionService — Phase 2
import { logger } from '../logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

export const extractEntities = async (documentName, text) => {
  const chunk = (text || '').substring(0, 4000);
  const prompt = `Extract named entities from this document. Reply ONLY with valid JSON.
Document: "${documentName}"
Content: ${chunk}

JSON:
{"people":[],"organizations":[],"locations":[],"dates":[],"monetary_values":[],"vendor_names":[],"contract_numbers":[],"invoice_numbers":[],"projects":[]}`;

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { temperature: 0.1, num_predict: 512 } }),
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error('Ollama request failed');
    const data = await res.json();
    const txt = data.response || '';
    const jsonMatch = txt.match(/```json\s*([\s\S]*?)\s*```/) || txt.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : txt);
    return { success: true, entities: parsed };
  } catch (err) {
    logger.warn(`Entity extraction failed: ${err.message}`);
    return { success: false, entities: {} };
  }
};

export default { extractEntities };
