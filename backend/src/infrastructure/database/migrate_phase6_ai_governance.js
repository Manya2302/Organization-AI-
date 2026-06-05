// ============================================================
// Database Migration — Phase 6: Enterprise AI Governance
// SecureVault AI — AI Models, Prompts, Risks, Trust, Security
// Run: node src/infrastructure/database/migrate_phase6_ai_governance.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [

  // 1. ai_models — Model Registry
  `CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    version VARCHAR(100) DEFAULT '1.0.0',
    provider VARCHAR(100) DEFAULT 'Ollama',
    deployment_date DATE DEFAULT CURRENT_DATE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    risk_level VARCHAR(50) DEFAULT 'LOW',
    description TEXT,
    capabilities JSONB DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. ai_model_versions — Version history
  `CREATE TABLE IF NOT EXISTS ai_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    changelog TEXT,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    safety_score DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    promoted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    promoted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. ai_model_metrics — Performance tracking
  `CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    metric_date DATE DEFAULT CURRENT_DATE,
    total_requests INTEGER DEFAULT 0,
    avg_latency_ms INTEGER DEFAULT 0,
    avg_confidence DECIMAL(5,2) DEFAULT 0.00,
    hallucination_rate DECIMAL(5,2) DEFAULT 0.00,
    trust_score DECIMAL(5,2) DEFAULT 0.00,
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 4. ai_prompts — Prompt Registry
  `CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    purpose TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    risk_level VARCHAR(50) DEFAULT 'LOW',
    approval_status VARCHAR(50) DEFAULT 'Draft',
    is_active BOOLEAN DEFAULT TRUE,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. ai_prompt_versions — Prompt version control
  `CREATE TABLE IF NOT EXISTS ai_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    prompt_text TEXT NOT NULL,
    change_summary TEXT,
    security_score DECIMAL(5,2) DEFAULT 0.00,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. ai_prompt_reviews — Security review tracking
  `CREATE TABLE IF NOT EXISTS ai_prompt_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_type VARCHAR(100) DEFAULT 'Security',
    findings TEXT,
    risk_level VARCHAR(50) DEFAULT 'LOW',
    decision VARCHAR(50) DEFAULT 'Pending',
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. ai_prompt_security — Security analysis results
  `CREATE TABLE IF NOT EXISTS ai_prompt_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE CASCADE,
    injection_risk_score DECIMAL(5,2) DEFAULT 0.00,
    security_score DECIMAL(5,2) DEFAULT 100.00,
    detected_threats JSONB DEFAULT '[]',
    sanitized_text TEXT,
    is_safe BOOLEAN DEFAULT TRUE,
    analysis_model VARCHAR(100),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. ai_requests — AI request audit log
  `CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
    request_type VARCHAR(100) DEFAULT 'Chat',
    input_text TEXT,
    department VARCHAR(100),
    context_type VARCHAR(100),
    ip_address VARCHAR(50),
    injection_detected BOOLEAN DEFAULT FALSE,
    policy_violations JSONB DEFAULT '[]',
    latency_ms INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 9. ai_responses — AI response registry
  `CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES ai_requests(id) ON DELETE CASCADE,
    response_text TEXT,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    grounding_score DECIMAL(5,2) DEFAULT 0.00,
    hallucination_probability DECIMAL(5,2) DEFAULT 0.00,
    trust_score DECIMAL(5,2) DEFAULT 0.00,
    sources_cited JSONB DEFAULT '[]',
    tokens_used INTEGER DEFAULT 0,
    model_used VARCHAR(100),
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) DEFAULT 'Auto-Approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. ai_explanations — Explainability records
  `CREATE TABLE IF NOT EXISTS ai_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES ai_requests(id) ON DELETE CASCADE,
    response_id UUID REFERENCES ai_responses(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    reasoning_chain JSONB DEFAULT '[]',
    decision_factors JSONB DEFAULT '[]',
    evidence_used JSONB DEFAULT '[]',
    confidence DECIMAL(5,2) DEFAULT 0.00,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. ai_approvals — Human approval workflow
  `CREATE TABLE IF NOT EXISTS ai_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_type VARCHAR(100) DEFAULT 'AI Output Review',
    status VARCHAR(50) DEFAULT 'Pending',
    review_notes TEXT,
    decision VARCHAR(50),
    decided_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 12. ai_risks — Risk detection log
  `CREATE TABLE IF NOT EXISTS ai_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    risk_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    affected_data JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'Open',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 13. ai_policy_violations — Policy breach records
  `CREATE TABLE IF NOT EXISTS ai_policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    policy_id VARCHAR(255),
    policy_name VARCHAR(255) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    details TEXT,
    auto_blocked BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 14. ai_security_events — Security event log
  `CREATE TABLE IF NOT EXISTS ai_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'HIGH',
    threat_type VARCHAR(100),
    threat_details TEXT,
    attacker_input TEXT,
    blocked BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 15. ai_usage_metrics — Analytics tracking
  `CREATE TABLE IF NOT EXISTS ai_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    metric_date DATE DEFAULT CURRENT_DATE,
    request_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    avg_latency_ms INTEGER DEFAULT 0,
    feature_type VARCHAR(100) DEFAULT 'Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id, metric_date, feature_type)
  )`,

  // 16. ai_hallucination_scores — Hallucination tracking
  `CREATE TABLE IF NOT EXISTS ai_hallucination_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    citation_coverage DECIMAL(5,2) DEFAULT 0.00,
    evidence_coverage DECIMAL(5,2) DEFAULT 0.00,
    grounding_quality DECIMAL(5,2) DEFAULT 0.00,
    response_confidence DECIMAL(5,2) DEFAULT 0.00,
    knowledge_support DECIMAL(5,2) DEFAULT 0.00,
    hallucination_probability DECIMAL(5,2) DEFAULT 0.00,
    reliability_score DECIMAL(5,2) DEFAULT 0.00,
    analysis_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 17. ai_trust_scores — Trust scoring
  `CREATE TABLE IF NOT EXISTS ai_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    score_date DATE DEFAULT CURRENT_DATE,
    overall_trust_score DECIMAL(5,2) DEFAULT 0.00,
    accuracy_score DECIMAL(5,2) DEFAULT 0.00,
    safety_score DECIMAL(5,2) DEFAULT 0.00,
    consistency_score DECIMAL(5,2) DEFAULT 0.00,
    compliance_score DECIMAL(5,2) DEFAULT 0.00,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, model_id, score_date)
  )`,

  // 18. ai_governance_audits — Governance event log
  `CREATE TABLE IF NOT EXISTS ai_governance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 19. ai_access_policies — Data access policies
  `CREATE TABLE IF NOT EXISTS ai_access_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(100) DEFAULT 'Data Access',
    description TEXT,
    rules JSONB DEFAULT '[]',
    enforcement_level VARCHAR(50) DEFAULT 'Strict',
    applies_to JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 20. ai_model_routing — Model routing rules
  `CREATE TABLE IF NOT EXISTS ai_model_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_type VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    risk_level VARCHAR(50) DEFAULT 'LOW',
    preferred_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    fallback_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_ai_requests_org_created ON ai_requests(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON ai_requests(organization_id, user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_responses_request ON ai_responses(request_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_risks_org_status ON ai_risks(organization_id, status, severity)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_security_events_org ON ai_security_events(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_policy_violations_org ON ai_policy_violations(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_org_date ON ai_usage_metrics(organization_id, metric_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_hallucination_response ON ai_hallucination_scores(response_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_approvals_org_status ON ai_approvals(organization_id, status, due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_governance_audits_org ON ai_governance_audits(organization_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_models_org_status ON ai_models(organization_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_prompts_org_status ON ai_prompts(organization_id, approval_status)`
];

export const migrateAIGovernance = async () => {
  logger.info('🚀 Starting Phase 6 AI Governance migrations...');
  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (err) {
      logger.error('Migration step failed:', err.message);
      throw err;
    }
  }
  logger.info('✅ Phase 6 AI Governance tables migrated successfully.');
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('migrate_phase6_ai_governance.js')) {
  (async () => {
    try {
      await connectDB();
      await migrateAIGovernance();
      process.exit(0);
    } catch (err) {
      logger.error('Migration script failed:', err);
      process.exit(1);
    }
  })();
}
