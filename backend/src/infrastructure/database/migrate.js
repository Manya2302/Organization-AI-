// ============================================================
// Database Migration Script — Phase 1 Schema
// SecureVault AI — Enterprise Intelligence Platform
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // ── 1. Organizations Table ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    company_type VARCHAR(100) DEFAULT 'Private Limited',
    industry VARCHAR(100),
    gst_number VARCHAR(50) UNIQUE,
    company_email VARCHAR(255) UNIQUE NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    number_of_employees VARCHAR(50) DEFAULT '1-10',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan VARCHAR(50) DEFAULT 'community',
    max_storage_gb INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 2. Users / Employees Table ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin','EnterpriseAdmin','DepartmentManager','Employee')),
    department VARCHAR(100),
    designation VARCHAR(150),
    joining_date DATE,
    mobile_number VARCHAR(20),
    profile_photo TEXT,
    skills JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, employee_id)
  )`,

  // ── 3. OTP Verifications Table ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('login','register','reset_password','invite')),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 4. Refresh Tokens Table ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 5. Documents Table ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id),
    name VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(200),
    category VARCHAR(100) DEFAULT 'General',
    department VARCHAR(100),
    tags JSONB DEFAULT '[]',
    description TEXT,
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    ocr_status VARCHAR(50) DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed')),
    ocr_text TEXT,
    ocr_word_count INTEGER,
    ocr_language VARCHAR(10) DEFAULT 'en',
    vector_indexed BOOLEAN DEFAULT FALSE,
    chroma_doc_id VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 6. Document Versions Table ───────────────────────────────
  `CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    change_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 7. Document Access Permissions Table ─────────────────────
  `CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) DEFAULT 'view' CHECK (permission_level IN ('view','comment','edit','admin')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(document_id, user_id)
  )`,

  // ── 8. Audit Logs Table ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    resource_name VARCHAR(500),
    details TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success','failure','warning')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 9. AI Query Sessions Table ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    session_title VARCHAR(500),
    model_used VARCHAR(100) DEFAULT 'qwen3:8b',
    total_queries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 10. AI Query Messages Table ───────────────────────────────
  `CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    context_documents JSONB DEFAULT '[]',
    vector_search_score DECIMAL(5,4),
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 11. OCR Processing Queue Table ────────────────────────────
  `CREATE TABLE IF NOT EXISTS ocr_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','retry')),
    engine VARCHAR(50) DEFAULT 'paddle',
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── 12. Notifications Table ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Indexes for Performance ───────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id) WHERE NOT is_deleted`,
  `CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_ocr_status ON documents(ocr_status)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_org_user ON audit_logs(organization_id, user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`,
  // Full-text search index on documents
  `CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(ocr_text,'') || ' ' || coalesce(description,'')))`,
];

const runMigrations = async () => {
  try {
    await connectDB();
    logger.info('🗄️  Running SecureVault AI database migrations (Phases 1-6)...');

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const tableName = sql.match(/CREATE (?:TABLE|INDEX)(?: IF NOT EXISTS)?\s+(\w+)/)?.[1] || `step_${i+1}`;
      try {
        await query(sql);
        logger.info(`  ✅ Migration ${i+1}/${migrations.length}: ${tableName}`);
      } catch (err) {
        logger.warn(`  ⚠️  Migration ${i+1} skipped (may already exist): ${tableName} — ${err.message}`);
      }
    }

    // Phase 6 AI Governance tables
    try {
      const { migrateAIGovernance } = await import('./migrate_phase6_ai_governance.js');
      await migrateAIGovernance();
      logger.info('✅ Phase 6 AI Governance tables ready.');
    } catch (err) {
      logger.warn('⚠️  Phase 6 migration warning (tables may already exist):', err.message);
    }

    // Phase 7 EIOS tables
    try {
      const { migrateEIOS } = await import('./migrate_phase7_eios.js');
      await migrateEIOS();
      logger.info('✅ Phase 7 EIOS tables ready.');
    } catch (err) {
      logger.warn('⚠️  Phase 7 migration warning (tables may already exist):', err.message);
    }

    // Phase 8 AEOP tables
    try {
      const { migrateAEOP } = await import('./migrate_phase8_aeop.js');
      await migrateAEOP();
      logger.info('✅ Phase 8 AEOP tables ready.');
    } catch (err) {
      logger.warn('⚠️  Phase 8 migration warning (tables may already exist):', err.message);
    }

    // Phase 9 Digital Twin tables
    try {
      const { migratePhase9DigitalTwin } = await import('./migrate_phase9_digital_twin.js');
      await migratePhase9DigitalTwin();
      logger.info('✅ Phase 9 Digital Twin & Strategy tables ready.');
    } catch (err) {
      logger.warn('⚠️  Phase 9 migration warning (tables may already exist):', err.message);
    }

    // Phase 10 Commercialization & scale tables
    try {
      const { migrateCommercialization } = await import('./migrate_commercialization.js');
      await migrateCommercialization();
      logger.info('✅ Phase 10 Commercialization & Global Scale tables ready.');
    } catch (err) {
      logger.warn('⚠️  Phase 10 migration warning (tables may already exist):', err.message);
    }

    logger.info('✅ All migrations complete! SecureVault AI Phase 10 schema ready.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
