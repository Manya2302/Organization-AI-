// ============================================================
// Phase 3: Knowledge Brain Service
// Multi-hop reasoning across employees, departments, documents,
// vendors, projects, and policies via Ollama AI.
// ============================================================
import fetch from 'node-fetch';
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

export class KnowledgeBrainService {

  // ── Organization Chat — multi-hop reasoning ───────────────────
  async chat(organizationId, userId, department, role, userMessage, sessionId = null) {
    if (isLocalJSONDb) return this._mockChatResponse(userMessage);

    // 1. Gather context from the knowledge graph
    const context = await this._gatherOrganizationalContext(organizationId, userMessage, role, department);

    // 2. Build system prompt with org context
    const systemPrompt = this._buildSystemPrompt(context, role, department);

    // 3. Call Ollama for reasoning
    let aiResponse = '';
    let reasoning = '';
    try {
      const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false,
          options: { temperature: 0.3, top_p: 0.9 }
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.message?.content || 'Unable to generate a response at this time.';
        // Extract thinking tags if present
        const thinkMatch = aiResponse.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          reasoning = thinkMatch[1].trim();
          aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }
      } else {
        aiResponse = this._generateContextualResponse(context, userMessage);
      }
    } catch (err) {
      logger.warn('Knowledge Brain AI unavailable, using context-based response');
      aiResponse = this._generateContextualResponse(context, userMessage);
    }

    // 4. Save to session
    if (sessionId) {
      await this._appendToSession(sessionId, userId, organizationId, userMessage, aiResponse, context);
    } else {
      sessionId = await this._createSession(organizationId, userId, userMessage);
    }

    return {
      response: aiResponse,
      reasoning: reasoning || null,
      sources: context.sources,
      experts: context.experts,
      relatedDocuments: context.documents.slice(0, 5),
      sessionId
    };
  }

  // ── Get or create knowledge session ──────────────────────────
  async getSession(sessionId, organizationId) {
    if (isLocalJSONDb) return null;
    const result = await query(
      `SELECT * FROM knowledge_sessions WHERE id = $1 AND organization_id = $2`,
      [sessionId, organizationId]
    );
    return result.rows[0] || null;
  }

  // ── Get all sessions for a user ───────────────────────────────
  async getUserSessions(organizationId, userId) {
    if (isLocalJSONDb) return [];
    const result = await query(`
      SELECT id, session_title, total_queries, created_at, updated_at
      FROM knowledge_sessions
      WHERE organization_id = $1 AND user_id = $2
      ORDER BY updated_at DESC
      LIMIT 20
    `, [organizationId, userId]);
    return result.rows;
  }

  // ── Generate knowledge recommendations ────────────────────────
  async generateRecommendations(organizationId, userId, userDepartment) {
    if (isLocalJSONDb) return this._mockRecommendations();

    // Clear old recommendations
    await query(
      `DELETE FROM knowledge_recommendations WHERE organization_id = $1 AND user_id = $2 AND created_at < NOW() - INTERVAL '1 day'`,
      [organizationId, userId]
    );

    const recs = [];

    // 1. Recommend documents from user's department they haven't seen
    const docRecs = await query(`
      SELECT d.id, d.name, d.category, d.department, d.created_at
      FROM documents d
      WHERE d.organization_id = $1
        AND d.department = $2
        AND d.is_deleted = FALSE
        AND d.owner_id != $3
      ORDER BY d.created_at DESC
      LIMIT 5
    `, [organizationId, userDepartment, userId]);

    for (const doc of docRecs.rows) {
      recs.push({
        recommendation_type: 'document',
        target_id: doc.id,
        target_type: 'Document',
        title: `Review: ${doc.name}`,
        description: `A ${doc.category} document from your ${doc.department} department`,
        relevance_score: 75,
        reason: `Added to your department: ${doc.department}`
      });
    }

    // 2. Recommend experts in adjacent domains
    const expertRecs = await query(`
      SELECT u.id, u.name, u.designation, u.department, ee.expertise_score, ee.primary_domain
      FROM employee_expertise ee
      JOIN users u ON u.id = ee.user_id
      WHERE ee.organization_id = $1 AND u.department != $2 AND ee.expertise_score > 60
      ORDER BY ee.expertise_score DESC
      LIMIT 3
    `, [organizationId, userDepartment]);

    for (const expert of expertRecs.rows) {
      recs.push({
        recommendation_type: 'expert',
        target_id: expert.id,
        target_type: 'Employee',
        title: `Connect with ${expert.name}`,
        description: `${expert.designation} | Expert in ${expert.primary_domain}`,
        relevance_score: Math.round(expert.expertise_score),
        reason: `Cross-department expert with score ${expert.expertise_score}`
      });
    }

    // Insert recommendations
    if (recs.length > 0) {
      for (const rec of recs) {
        await query(`
          INSERT INTO knowledge_recommendations
            (organization_id, user_id, recommendation_type, target_id, target_type, title, description, relevance_score, reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [organizationId, userId, rec.recommendation_type, rec.target_id, rec.target_type, rec.title, rec.description, rec.relevance_score, rec.reason]);
      }
    }

    return recs;
  }

  // ── Get knowledge brain metrics ───────────────────────────────
  async getBrainMetrics(organizationId) {
    if (isLocalJSONDb) return this._mockBrainMetrics();

    const [countsRes, existing] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM organizational_memory WHERE organization_id = $1) as entities,
          (SELECT COUNT(*) FROM knowledge_relationships WHERE organization_id = $1) as relationships,
          (SELECT COUNT(*) FROM employee_expertise WHERE organization_id = $1 AND expertise_score > 50) as experts,
          (SELECT COUNT(*) FROM graph_nodes WHERE organization_id = $1) as graph_nodes,
          (SELECT COUNT(*) FROM knowledge_contributions WHERE organization_id = $1) as contributions,
          (SELECT COUNT(*) FROM knowledge_sessions WHERE organization_id = $1) as sessions
      `, [organizationId]),

      query(`SELECT * FROM knowledge_brain_metrics WHERE organization_id = $1`, [organizationId])
    ]);

    const c = countsRes.rows[0];
    const entities = parseInt(c.entities);
    const relationships = parseInt(c.relationships);
    const experts = parseInt(c.experts);
    const graphNodes = parseInt(c.graph_nodes);
    const contributions = parseInt(c.contributions);

    const coverage = Math.min(100, (entities / 50) * 100);
    const density = entities > 0 ? Math.min(100, (relationships / entities) * 20) : 0;
    const expertCoverage = Math.min(100, experts * 20);
    const memoryHealth = Math.round((coverage + density + expertCoverage) / 3);

    const maturity = memoryHealth < 20 ? 'Initializing'
      : memoryHealth < 40 ? 'Learning'
      : memoryHealth < 60 ? 'Developing'
      : memoryHealth < 80 ? 'Advanced'
      : 'Enterprise Brain';

    const metrics = {
      total_knowledge_entities: entities,
      total_relationships: relationships,
      total_experts: experts,
      total_graph_nodes: graphNodes,
      knowledge_coverage: coverage.toFixed(2),
      expertise_coverage: expertCoverage.toFixed(2),
      relationship_density: density.toFixed(2),
      memory_health_score: memoryHealth,
      brain_maturity_level: maturity,
      total_contributions: contributions,
      total_sessions: parseInt(c.sessions)
    };

    // Upsert metrics
    await query(`
      INSERT INTO knowledge_brain_metrics
        (organization_id, total_knowledge_entities, total_relationships, total_experts, total_graph_nodes,
         knowledge_coverage, expertise_coverage, relationship_density, memory_health_score, brain_maturity_level, last_computed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (organization_id) DO UPDATE SET
        total_knowledge_entities = $2, total_relationships = $3, total_experts = $4, total_graph_nodes = $5,
        knowledge_coverage = $6, expertise_coverage = $7, relationship_density = $8,
        memory_health_score = $9, brain_maturity_level = $10, last_computed_at = NOW()
    `, [organizationId, entities, relationships, experts, graphNodes,
        coverage.toFixed(2), expertCoverage.toFixed(2), density.toFixed(2), memoryHealth, maturity]);

    return metrics;
  }

  // ── Private: Gather org context for chat ─────────────────────
  async _gatherOrganizationalContext(organizationId, userMessage, role, department) {
    const term = `%${userMessage.toLowerCase().slice(0, 100)}%`;
    const sources = [];
    const experts = [];
    const documents = [];

    try {
      // Find relevant documents
      const docsRes = await query(`
        SELECT d.id, d.name, d.category, d.department,
               SUBSTRING(d.ocr_text, 1, 300) as snippet,
               u.name as uploaded_by
        FROM documents d
        LEFT JOIN users u ON u.id = d.owner_id
        WHERE d.organization_id = $1 AND d.is_deleted = FALSE
          AND (LOWER(d.name) LIKE $2 OR LOWER(d.ocr_text) LIKE $2 OR LOWER(d.category) LIKE $2)
          AND ($3 = 'SuperAdmin' OR $3 = 'EnterpriseAdmin' OR d.department = $4)
        LIMIT 5
      `, [organizationId, term, role, department]);
      documents.push(...docsRes.rows);
      sources.push(...docsRes.rows.map(d => `Document: ${d.name}`));

      // Find relevant experts
      const expRes = await query(`
        SELECT u.name, u.department, u.designation, ee.expertise_score, ee.primary_domain
        FROM employee_expertise ee
        JOIN users u ON u.id = ee.user_id
        WHERE ee.organization_id = $1
          AND (LOWER(ee.primary_domain) LIKE $2 OR LOWER(u.department) LIKE $2)
          AND ($3 = 'SuperAdmin' OR $3 = 'EnterpriseAdmin' OR u.department = $4)
        ORDER BY ee.expertise_score DESC
        LIMIT 3
      `, [organizationId, term, role, department]);
      experts.push(...expRes.rows);

      // Find knowledge relationships
      const relsRes = await query(`
        SELECT source_name, relationship_type, target_name
        FROM knowledge_relationships
        WHERE organization_id = $1
          AND (LOWER(source_name) LIKE $2 OR LOWER(target_name) LIKE $2)
        LIMIT 10
      `, [organizationId, term]);
      sources.push(...relsRes.rows.map(r => `${r.source_name} → ${r.relationship_type} → ${r.target_name}`));

    } catch (err) {
      logger.warn('Context gathering partial failure:', err.message);
    }

    return { documents, experts, sources };
  }

  // ── Private: Build system prompt ─────────────────────────────
  _buildSystemPrompt(context, role, department) {
    const docContext = context.documents.map(d =>
      `Document: ${d.name} (${d.category}, ${d.department})\nUploaded by: ${d.uploaded_by}\nContent: ${d.snippet}`
    ).join('\n\n');

    const expertContext = context.experts.map(e =>
      `Expert: ${e.name} | ${e.designation} | ${e.department} | Score: ${e.expertise_score} | Domain: ${e.primary_domain}`
    ).join('\n');

    const relContext = context.sources.filter(s => s.includes('→')).join('\n');

    return `You are the CogniVault AI Enterprise Knowledge Brain for a ${role} in the ${department || 'organization'}.

Your role is to answer questions about the organization's knowledge, people, processes, policies, and documents.

Use ONLY the organizational context below to answer. Do not hallucinate. If you cannot find the answer in the context, say so clearly.

RELEVANT DOCUMENTS:
${docContext || 'No directly relevant documents found.'}

SUBJECT MATTER EXPERTS:
${expertContext || 'No specific experts identified for this query.'}

ORGANIZATIONAL RELATIONSHIPS:
${relContext || 'No specific relationships found.'}

Security Rules:
- You are restricted to ${role === 'Employee' ? `${department} department data only` : 'organizational data within your access level'}.
- Never reveal information from departments the user cannot access.
- Always cite your sources.

Provide concise, factual answers with specific names, documents, and experts where available.`;
  }

  // ── Private: Generate context-based response when AI offline ─
  _generateContextualResponse(context, userMessage) {
    if (context.experts.length > 0 && context.documents.length > 0) {
      return `Based on organizational knowledge, I found ${context.documents.length} relevant document(s) and ${context.experts.length} subject matter expert(s). Key experts include: ${context.experts.map(e => `${e.name} (${e.department})`).join(', ')}. Related documents: ${context.documents.map(d => d.name).join(', ')}.`;
    } else if (context.documents.length > 0) {
      return `Found ${context.documents.length} relevant document(s): ${context.documents.map(d => `${d.name} (${d.category})`).join(', ')}. Review these for detailed information.`;
    } else if (context.experts.length > 0) {
      return `No specific documents found, but these experts may help: ${context.experts.map(e => `${e.name} - ${e.designation}`).join(', ')}.`;
    }
    return `No specific organizational knowledge found for this query. Try rephrasing with more specific keywords.`;
  }

  // ── Private: Session management ───────────────────────────────
  async _createSession(organizationId, userId, firstMessage) {
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
    const result = await query(`
      INSERT INTO knowledge_sessions (organization_id, user_id, session_title, total_queries)
      VALUES ($1, $2, $3, 1)
      RETURNING id
    `, [organizationId, userId, title]);
    return result.rows[0]?.id;
  }

  async _appendToSession(sessionId, userId, organizationId, userMessage, aiResponse, context) {
    const msgEntry = {
      role: 'user', content: userMessage, timestamp: new Date().toISOString()
    };
    const aiEntry = {
      role: 'assistant', content: aiResponse,
      sources: context.sources.slice(0, 5),
      timestamp: new Date().toISOString()
    };
    await query(`
      UPDATE knowledge_sessions SET
        messages = messages || $2::jsonb,
        total_queries = total_queries + 1,
        updated_at = NOW()
      WHERE id = $1 AND organization_id = $3
    `, [sessionId, JSON.stringify([msgEntry, aiEntry]), organizationId]);
  }

  // ── Mocks ─────────────────────────────────────────────────────
  _mockChatResponse(msg) {
    return {
      response: `I found relevant organizational knowledge about "${msg.slice(0,30)}...". Please connect the backend for full AI-powered responses.`,
      reasoning: null, sources: [], experts: [], relatedDocuments: [], sessionId: null
    };
  }
  _mockRecommendations() { return []; }
  _mockBrainMetrics() {
    return {
      total_knowledge_entities: 0, total_relationships: 0, total_experts: 0,
      knowledge_coverage: 0, expertise_coverage: 0, memory_health_score: 0,
      brain_maturity_level: 'Initializing'
    };
  }
}

export default new KnowledgeBrainService();
