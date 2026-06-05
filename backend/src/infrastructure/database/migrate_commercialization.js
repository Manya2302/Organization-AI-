// ============================================================
// Database Migration — Phase 10: Enterprise Commercialization, Ecosystem Expansion & Global Scale
// SecureVault AI — Commercialization Schema Migration
// ============================================================
import { query } from './connection.js';
import { logger } from '../logging/logger.js';

const migrations = [
  // 1. integration_connectors
  `CREATE TABLE IF NOT EXISTS integration_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    connector_type VARCHAR(100) NOT NULL, -- 'SharePoint', 'OneDrive', 'Outlook', 'GoogleDrive', 'Jira', 'ServiceNow', 'SAP', 'Salesforce', 'Slack', 'Teams', 'GitHub'
    status VARCHAR(50) DEFAULT 'Disconnected', -- 'Connected', 'Disconnected', 'Syncing', 'Error'
    config JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    data_volume_mb DECIMAL(10,2) DEFAULT 0.00,
    error_count INTEGER DEFAULT 0,
    sync_history JSONB DEFAULT '[]',
    health_status JSONB DEFAULT '{"status": "Healthy", "latency_ms": 0}',
    auth_status JSONB DEFAULT '{"authenticated": false}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 2. industry_editions
  `CREATE TABLE IF NOT EXISTS industry_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    edition_name VARCHAR(100) NOT NULL, -- 'Healthcare', 'Finance', 'Manufacturing', 'Legal', 'Government', 'Education'
    frameworks JSONB DEFAULT '[]', -- HIPAA, RBI, SEBI, PCI DSS, SOX, HL7, NABH
    governance_controls JSONB DEFAULT '{}',
    patient_governance JSONB DEFAULT '{}',
    audit_readiness JSONB DEFAULT '{}',
    knowledge_mapping JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, edition_name)
  )`,

  // 3. enterprise_subscriptions
  `CREATE TABLE IF NOT EXISTS enterprise_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) DEFAULT 'Starter', -- 'Starter', 'Professional', 'Business', 'Enterprise', 'Government'
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Suspended', 'Expired', 'Trial'
    plan_limits JSONB DEFAULT '{
      "max_users": 5,
      "max_storage_gb": 10,
      "ai_usage_limit_tokens": 1000000,
      "feature_flags": {
        "white_label": false,
        "advanced_integrations": false,
        "industry_modules": false
      }
    }',
    billing_cycle VARCHAR(50) DEFAULT 'Monthly', -- 'Monthly', 'Annual'
    next_billing_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 4. billing_invoices
  `CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Paid', 'Pending', 'Failed', 'Overdue'
    payment_method JSONB DEFAULT '{}',
    billing_details JSONB DEFAULT '{}',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 5. white_label_config
  `CREATE TABLE IF NOT EXISTS white_label_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    custom_domain VARCHAR(255) UNIQUE,
    branding_config JSONB DEFAULT '{
      "company_name": "SecureVault AI",
      "primary_color": "#6366f1",
      "secondary_color": "#14b8a6",
      "logo_url": null,
      "favicon_url": null,
      "login_screen": {
        "title": "Welcome back",
        "description": "Log in to your secure workspace console"
      },
      "custom_email_sender": null
    }',
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 6. customer_success_health
  `CREATE TABLE IF NOT EXISTS customer_success_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 1, -- 1: Account Setup, 2: Integrations, 3: Policies, 4: Live
    adoption_score DECIMAL(5,2) DEFAULT 0.00, -- Scale 0 to 100
    active_users_count INTEGER DEFAULT 0,
    usage_health_metrics JSONB DEFAULT '{}',
    migration_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 7. marketplace_marketplace
  `CREATE TABLE IF NOT EXISTS marketplace_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plugin_type VARCHAR(100) NOT NULL, -- 'Plugin', 'Extension', 'Agent', 'Connector', 'Theme', 'Report', 'Template'
    description TEXT,
    developer VARCHAR(255) DEFAULT 'SecureVault AI',
    is_free BOOLEAN DEFAULT TRUE,
    price DECIMAL(10,2) DEFAULT 0.00,
    logo_url TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    install_count INTEGER DEFAULT 0,
    version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 8. installed_plugins
  `CREATE TABLE IF NOT EXISTS installed_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id UUID REFERENCES marketplace_plugins(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Disabled'
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    config JSONB DEFAULT '{}',
    UNIQUE(organization_id, plugin_id)
  )`,

  // 9. infrastructure_nodes
  `CREATE TABLE IF NOT EXISTS infrastructure_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_name VARCHAR(255) NOT NULL,
    node_type VARCHAR(100) NOT NULL, -- 'Frontend Pod', 'API Pod', 'Worker Pod', 'AI Node', 'Database Node', 'Storage Node'
    status VARCHAR(50) DEFAULT 'Healthy', -- 'Healthy', 'Warning', 'Critical', 'Offline'
    ip_address VARCHAR(100),
    region VARCHAR(100) DEFAULT 'us-east-1',
    resources JSONB DEFAULT '{
      "cpu_usage_pct": 10.0,
      "memory_usage_pct": 25.0,
      "gpu_usage_pct": 0.0,
      "replicas": 1
    }',
    routing_weight INTEGER DEFAULT 100,
    failover_target VARCHAR(255),
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 10. security_threats
  `CREATE TABLE IF NOT EXISTS security_threats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    threat_type VARCHAR(100) NOT NULL, -- 'AI Prompt Injection', 'Data Leakage', 'Anomalous Query', 'Unauthorized Privilege Escalation', 'Brute Force'
    severity VARCHAR(50) DEFAULT 'Low', -- 'Critical', 'High', 'Medium', 'Low'
    status VARCHAR(50) DEFAULT 'Detected', -- 'Detected', 'Investigating', 'Mitigated', 'False_Positive'
    details TEXT,
    attacker_ip INET,
    metadata JSONB DEFAULT '{}',
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 11. distributed_jobs
  `CREATE TABLE IF NOT EXISTS distributed_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL, -- 'Sync', 'OCR', 'AI_Inference', 'Report_Generation'
    queue_name VARCHAR(100) DEFAULT 'default',
    status VARCHAR(50) DEFAULT 'Queued', -- 'Queued', 'Processing', 'Completed', 'Failed', 'DeadLetter'
    payload JSONB DEFAULT '{}',
    attempts INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_log TEXT,
    priority INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`
];

export async function migrateCommercialization() {
  logger.info('🚀 Starting Phase 10: Enterprise Commercialization & Global Scale DDL migrations...');

  for (const q of migrations) {
    try {
      await query(q);
    } catch (err) {
      logger.error(`Failed to execute migration query: ${q.substring(0, 100)}`, err);
      throw err;
    }
  }

  logger.info('✅ Phase 10: Enterprise Commercialization & Global Scale tables migrated successfully.');
}
