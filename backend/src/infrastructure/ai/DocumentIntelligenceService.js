// ============================================================
// Infrastructure: Document Intelligence Service (Phase 2)
// AI-powered summarization, classification, metadata generation
// Uses Ollama Qwen3 8B locally
// ============================================================
import { logger } from '../logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;

// ── Utility: Call Ollama generate endpoint ─────────────────────
const ollamaGenerate = async (prompt, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          top_p: options.top_p ?? 0.9,
          num_predict: options.num_predict ?? 512,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama generate error: ${err}`);
    }

    const data = await response.json();
    return {
      success: true,
      text: data.response || '',
      tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      latencyMs: Math.round((data.total_duration || 0) / 1000000)
    };
  } catch (error) {
    clearTimeout(timeoutId);
    logger.warn(`Ollama generate failed: ${error.message}`);
    return { success: false, text: '', error: error.message };
  }
};

// ── Parse JSON safely from LLM output ─────────────────────────
const parseJSONFromLLM = (text) => {
  try {
    // Extract JSON block from response (LLMs sometimes wrap with markdown)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, text];
    const jsonStr = jsonMatch[1] || text;
    return JSON.parse(jsonStr.trim());
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// 1. FULL DOCUMENT SUMMARIZATION ENGINE
// Generates short, detailed, executive summaries + key info
// ─────────────────────────────────────────────────────────────────
export const generateDocumentSummary = async (documentName, ocrText) => {
  if (!ocrText || ocrText.trim().length < 50) {
    return {
      success: false,
      error: 'Insufficient text content for summarization'
    };
  }

  const textChunk = ocrText.substring(0, 6000);
  const wordCount = ocrText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const prompt = `You are an enterprise document analyst. Analyze the following document and respond with ONLY a valid JSON object (no explanation, no markdown, just JSON).

Document Name: "${documentName}"
Document Content:
${textChunk}

Respond with this exact JSON structure:
{
  "short_summary": "50 words max summary of the document",
  "detailed_summary": "200-250 words comprehensive summary covering purpose, content, and conclusions",
  "executive_summary": "150 words business-focused summary for senior management",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "important_dates": ["date and context 1", "date and context 2"],
  "important_names": ["person/org name and role 1", "person/org name and role 2"],
  "action_items": ["action item 1", "action item 2"],
  "confidence_score": 0.85
}`;

  const start = Date.now();
  const result = await ollamaGenerate(prompt, { temperature: 0.2, num_predict: 1024 });
  const latencyMs = Date.now() - start;

  if (!result.success) {
    return { success: false, error: result.error, latencyMs };
  }

  const parsed = parseJSONFromLLM(result.text);
  if (!parsed) {
    // Fallback: basic extraction
    logger.warn(`Failed to parse summary JSON for ${documentName}, using fallback`);
    return {
      success: true,
      isFallback: true,
      data: {
        short_summary: `Document: ${documentName}. Contains ${wordCount} words.`,
        detailed_summary: ocrText.substring(0, 500) + '...',
        executive_summary: ocrText.substring(0, 250) + '...',
        key_highlights: [],
        risks: [],
        important_dates: [],
        important_names: [],
        action_items: [],
        confidence_score: 0.3,
        word_count: wordCount,
        reading_time_minutes: readingTime
      },
      latencyMs
    };
  }

  return {
    success: true,
    data: {
      ...parsed,
      word_count: wordCount,
      reading_time_minutes: readingTime
    },
    latencyMs,
    tokensUsed: result.tokensUsed
  };
};

// ─────────────────────────────────────────────────────────────────
// 2. DOCUMENT CLASSIFICATION ENGINE
// Auto-assigns category, department, type, risk level, keywords
// ─────────────────────────────────────────────────────────────────
export const classifyDocument = async (documentName, ocrText) => {
  const textChunk = (ocrText || '').substring(0, 4000);
  const hasText = textChunk.trim().length > 30;

  const prompt = `You are an enterprise document classification system. Classify this document and respond with ONLY a valid JSON object.

Document Name: "${documentName}"
${hasText ? `Document Content:\n${textChunk}` : '(No text content extracted)'}

Respond with this exact JSON structure:
{
  "doc_type": "one of: Contract, Invoice, Policy, Report, Handbook, Agreement, Certificate, Audit, Proposal, Letter, Form, Other",
  "primary_category": "one of: Legal, Finance, HR, Compliance, Operations, Marketing, Engineering, IT, General",
  "department": "one of: Legal, Finance, HR, Compliance, Engineering, Marketing, IT, Operations, Executive, General",
  "sub_category": "more specific classification like: Vendor Contract, Tax Invoice, Employee Policy, Audit Report",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "topics": ["topic1", "topic2", "topic3"],
  "risk_level": "one of: low, medium, high, critical",
  "confidentiality_level": "one of: public, internal, confidential, restricted, top_secret",
  "importance_score": 0.75,
  "sentiment": "one of: positive, neutral, negative, mixed",
  "confidence_score": 0.85
}`;

  const start = Date.now();
  const result = await ollamaGenerate(prompt, { temperature: 0.1, num_predict: 512 });
  const latencyMs = Date.now() - start;

  if (!result.success) {
    return { success: false, error: result.error, latencyMs };
  }

  const parsed = parseJSONFromLLM(result.text);
  if (!parsed) {
    // Fallback: infer from filename
    const name = documentName.toLowerCase();
    const fallback = {
      doc_type: name.includes('invoice') ? 'Invoice' :
                name.includes('contract') ? 'Contract' :
                name.includes('policy') ? 'Policy' :
                name.includes('report') ? 'Report' : 'Other',
      primary_category: name.includes('invoice') ? 'Finance' :
                        name.includes('hr') ? 'HR' :
                        name.includes('legal') ? 'Legal' : 'General',
      department: 'General',
      sub_category: 'Unclassified',
      keywords: [],
      topics: [],
      risk_level: 'low',
      confidentiality_level: 'internal',
      importance_score: 0.5,
      sentiment: 'neutral',
      confidence_score: 0.3
    };
    return { success: true, isFallback: true, data: fallback, latencyMs };
  }

  return { success: true, data: parsed, latencyMs, tokensUsed: result.tokensUsed };
};

// ─────────────────────────────────────────────────────────────────
// 3. SMART METADATA GENERATOR
// Generates comprehensive metadata automatically
// ─────────────────────────────────────────────────────────────────
export const generateSmartMetadata = async (documentName, ocrText) => {
  const textChunk = (ocrText || '').substring(0, 3000);

  const prompt = `Extract key metadata from this document. Respond with ONLY valid JSON.

Document Name: "${documentName}"
${textChunk ? `Content:\n${textChunk}` : '(No text available)'}

JSON response:
{
  "inferred_title": "clean professional title for this document",
  "document_owner": "person or department responsible if mentioned, else null",
  "related_topics": ["topic1", "topic2", "topic3"],
  "effective_date": "date when document became effective if found, else null",
  "expiry_date": "expiry/renewal date if found, else null",
  "document_number": "document reference/number if found, else null",
  "parties_involved": ["name1", "name2"],
  "currency_mentions": ["INR 50,000", "USD 10,000"],
  "regulatory_references": ["GST Act", "Companies Act"],
  "summary_tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

  const result = await ollamaGenerate(prompt, { temperature: 0.1, num_predict: 512 });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const parsed = parseJSONFromLLM(result.text);
  return {
    success: true,
    data: parsed || {},
    latencyMs: result.latencyMs,
    tokensUsed: result.tokensUsed
  };
};

// ─────────────────────────────────────────────────────────────────
// 4. FULL ANALYSIS PIPELINE
// Runs summarization + classification + metadata in sequence
// ─────────────────────────────────────────────────────────────────
export const runFullAnalysisPipeline = async (documentName, ocrText) => {
  logger.info(`🤖 Starting full AI analysis pipeline for: ${documentName}`);
  const pipelineStart = Date.now();

  const [summaryResult, classifyResult, metadataResult] = await Promise.allSettled([
    generateDocumentSummary(documentName, ocrText),
    classifyDocument(documentName, ocrText),
    generateSmartMetadata(documentName, ocrText)
  ]);

  const totalLatency = Date.now() - pipelineStart;

  return {
    success: true,
    summary: summaryResult.status === 'fulfilled' ? summaryResult.value : { success: false },
    classification: classifyResult.status === 'fulfilled' ? classifyResult.value : { success: false },
    metadata: metadataResult.status === 'fulfilled' ? metadataResult.value : { success: false },
    totalLatencyMs: totalLatency
  };
};

export default {
  generateDocumentSummary,
  classifyDocument,
  generateSmartMetadata,
  runFullAnalysisPipeline
};
