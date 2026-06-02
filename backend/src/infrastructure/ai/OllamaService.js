// ============================================================
// Infrastructure: Ollama AI Service (Local RAG)
// Connects to local Ollama instance for LLM and embeddings
// ============================================================
import { logger } from '../logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;

// Check if Ollama is running
export const checkOllamaHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return { online: false };
    const data = await response.json();
    const models = data.models?.map(m => m.name) || [];
    return { online: true, models, hasLLM: models.some(m => m.includes('qwen') || m.includes('llama') || m.includes('deepseek')), hasEmbed: models.some(m => m.includes('nomic') || m.includes('embed')) };
  } catch {
    return { online: false, models: [] };
  }
};

// Generate text embeddings for vector search
export const generateEmbedding = async (text) => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 8192) }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama embedding error: ${error}`);
    }

    const data = await response.json();
    return data.embedding || [];
  } catch (error) {
    logger.warn(`Embedding generation failed (Ollama offline?): ${error.message}`);
    return null;
  }
};

// Chat completion with RAG context
export const generateRAGResponse = async (question, contextDocuments = [], chatHistory = []) => {
  // Build system prompt
  const systemPrompt = `You are SecureVault AI Copilot, an enterprise document intelligence assistant.
You have access to the organization's private document repository.
Answer questions based strictly on the provided document context.
If the answer is not found in the context, clearly state that.
Always cite which document you're drawing from.
Keep responses concise, professional, and factual.
Current date: ${new Date().toLocaleDateString('en-IN')}`;

  // Build context from retrieved documents
  let contextBlock = '';
  if (contextDocuments.length > 0) {
    contextBlock = '\n\n--- DOCUMENT CONTEXT ---\n';
    contextDocuments.forEach((doc, idx) => {
      contextBlock += `\n[${idx + 1}] Document: "${doc.name}" (Category: ${doc.category}, Dept: ${doc.department})\n`;
      if (doc.ocrText) {
        contextBlock += `Content excerpt:\n${doc.ocrText.substring(0, 2000)}\n`;
      }
      contextBlock += '---\n';
    });
  }

  // Build message history
  const messages = [
    { role: 'system', content: systemPrompt + contextBlock },
    ...chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1024
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama chat error: ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.message?.content || 'No response generated.',
      model: data.model,
      tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      latencyMs: Math.round((data.total_duration || 0) / 1000000)
    };
  } catch (error) {
    logger.warn(`Ollama LLM request failed: ${error.message}`);
    return {
      success: false,
      content: `I'm currently unable to reach the local AI model (Ollama). Please ensure Ollama is running with: \`ollama serve\`. Pull the model with: \`ollama pull ${MODEL}\``,
      model: MODEL,
      error: error.message
    };
  }
};

// Simple document summarization
export const summarizeDocument = async (text, maxLength = 500) => {
  const prompt = `Summarize the following document content in ${maxLength} characters or less. Focus on key facts, dates, and actionable information:\n\n${text.substring(0, 4000)}`;

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 256 }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) throw new Error('Summarization request failed');
    const data = await response.json();
    return data.response || '';
  } catch (error) {
    logger.warn(`Document summarization failed: ${error.message}`);
    return null;
  }
};

// Generate direct completion for general LLM queries
export const generateOllamaCompletion = async (prompt, systemPrompt = '') => {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: { temperature: 0.2, num_predict: 1024 }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) throw new Error('Ollama completion request failed');
    const data = await response.json();
    return data.message?.content || '';
  } catch (error) {
    logger.warn(`Ollama completion failed: ${error.message}`);
    return '';
  }
};

export default { checkOllamaHealth, generateEmbedding, generateRAGResponse, summarizeDocument, generateOllamaCompletion };
