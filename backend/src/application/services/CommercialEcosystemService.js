// ============================================================
// CommercialEcosystemService — Phase 10: SaaS & Enterprise Scalability
// Connectors, Industry Modules, Billing, Custom Domains, Clusters
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class CommercialEcosystemService {

  // ──────────────────────────────────────────────────────────
  // 1. INTEGRATION ECOSYSTEM LAYER
  // ──────────────────────────────────────────────────────────

  async getConnectors(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM integration_connectors WHERE organization_id = $1 ORDER BY connector_type ASC`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultConnectors(organizationId);
      }
      return res.rows;
    } catch (err) {
      logger.warn('CommercialEcosystemService.getConnectors using mock data:', err.message);
      return this._mockConnectors();
    }
  }

  async syncConnector(organizationId, connectorId) {
    try {
      const check = await query(`SELECT * FROM integration_connectors WHERE id = $1 AND organization_id = $2`, [connectorId, organizationId]);
      if (check.rows.length === 0) return null;

      const connector = check.rows[0];
      const volumeAddition = parseFloat((Math.random() * 50 + 5).toFixed(2));
      const newVolume = parseFloat(connector.data_volume_mb) + volumeAddition;
      
      const newSyncEntry = {
        timestamp: new Date().toISOString(),
        status: 'Completed',
        volume_added_mb: volumeAddition,
        items_synced: Math.floor(Math.random() * 120 + 10)
      };

      const syncHistory = Array.isArray(connector.sync_history) ? connector.sync_history : [];
      syncHistory.unshift(newSyncEntry);

      const res = await query(
        `UPDATE integration_connectors 
         SET status = 'Syncing', last_sync_at = NOW(), data_volume_mb = $1, sync_history = $2, error_count = 0
         WHERE id = $3 AND organization_id = $4
         RETURNING *`,
        [newVolume, JSON.stringify(syncHistory.slice(0, 10)), connectorId, organizationId]
      );

      // Simulate a quick complete status update
      setTimeout(async () => {
        try {
          await query(
            `UPDATE integration_connectors SET status = 'Connected' WHERE id = $1`,
            [connectorId]
          );
        } catch (e) {
          logger.error('Failed to complete connector sync background update:', e);
        }
      }, 3000);

      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.syncConnector error:', err);
      return null;
    }
  }

  async updateConnectorConfig(organizationId, connectorType, config) {
    try {
      const check = await query(
        `SELECT * FROM integration_connectors WHERE organization_id = $1 AND connector_type = $2`,
        [organizationId, connectorType]
      );

      if (check.rows.length > 0) {
        const res = await query(
          `UPDATE integration_connectors 
           SET config = $1, status = 'Connected', auth_status = '{"authenticated": true}', updated_at = NOW()
           WHERE organization_id = $2 AND connector_type = $3
           RETURNING *`,
          [JSON.stringify(config), organizationId, connectorType]
        );
        return res.rows[0];
      } else {
        const res = await query(
          `INSERT INTO integration_connectors (organization_id, connector_type, status, config, auth_status, last_sync_at, data_volume_mb)
           VALUES ($1, $2, 'Connected', $3, '{"authenticated": true}', NOW(), 12.5)
           RETURNING *`,
          [organizationId, connectorType, JSON.stringify(config)]
        );
        return res.rows[0];
      }
    } catch (err) {
      logger.error('CommercialEcosystemService.updateConnectorConfig error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 2. INDUSTRY EDITIONS
  // ──────────────────────────────────────────────────────────

  async getIndustryEditions(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM industry_editions WHERE organization_id = $1`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultIndustryEditions(organizationId);
      }
      return res.rows;
    } catch (err) {
      logger.warn('CommercialEcosystemService.getIndustryEditions using mock:', err.message);
      return this._mockIndustryEditions();
    }
  }

  async toggleIndustryEdition(organizationId, editionName, isEnabled) {
    try {
      const res = await query(
        `UPDATE industry_editions 
         SET is_enabled = $1, updated_at = NOW()
         WHERE organization_id = $2 AND edition_name = $3
         RETURNING *`,
        [isEnabled, organizationId, editionName]
      );
      return res.rows[0] || null;
    } catch (err) {
      logger.error('CommercialEcosystemService.toggleIndustryEdition error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3. SUBSCRIPTIONS & BILLING
  // ──────────────────────────────────────────────────────────

  async getSubscription(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM enterprise_subscriptions WHERE organization_id = $1`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultSubscription(organizationId);
      }
      return res.rows[0];
    } catch (err) {
      logger.warn('CommercialEcosystemService.getSubscription using mock:', err.message);
      return this._mockSubscription();
    }
  }

  async upgradeSubscription(organizationId, planName) {
    try {
      let limits = {
        max_users: 50,
        max_storage_gb: 500,
        ai_usage_limit_tokens: 50000000,
        feature_flags: {
          white_label: true,
          advanced_integrations: true,
          industry_modules: true
        }
      };

      if (planName === 'Enterprise' || planName === 'Government') {
        limits = {
          max_users: 9999,
          max_storage_gb: 10000,
          ai_usage_limit_tokens: 9999999999,
          feature_flags: {
            white_label: true,
            advanced_integrations: true,
            industry_modules: true,
            dedicated_gpu: true,
            zero_trust: true
          }
        };
      } else if (planName === 'Business') {
        limits = {
          max_users: 250,
          max_storage_gb: 2000,
          ai_usage_limit_tokens: 250000000,
          feature_flags: {
            white_label: true,
            advanced_integrations: true,
            industry_modules: true
          }
        };
      }

      const res = await query(
        `UPDATE enterprise_subscriptions
         SET plan_name = $1, plan_limits = $2, updated_at = NOW()
         WHERE organization_id = $3
         RETURNING *`,
        [planName, JSON.stringify(limits), organizationId]
      );

      // Create an invoice for upgrading
      const amount = planName === 'Enterprise' ? 2499.00 : planName === 'Business' ? 499.00 : 129.00;
      await this.createInvoice(organizationId, amount, planName);

      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.upgradeSubscription error:', err);
      return null;
    }
  }

  async getInvoices(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM billing_invoices WHERE organization_id = $1 ORDER BY issued_at DESC`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        await this.createInvoice(organizationId, 129.00, 'Starter Subscription');
        const retry = await query(
          `SELECT * FROM billing_invoices WHERE organization_id = $1 ORDER BY issued_at DESC`,
          [organizationId]
        );
        return retry.rows;
      }
      return res.rows;
    } catch (err) {
      logger.warn('CommercialEcosystemService.getInvoices using mock:', err.message);
      return this._mockInvoices();
    }
  }

  async createInvoice(organizationId, amount, planName) {
    try {
      const invoiceNum = 'INV-' + Math.floor(100000 + Math.random() * 900000);
      const tax = parseFloat((amount * 0.18).toFixed(2));
      const res = await query(
        `INSERT INTO billing_invoices (organization_id, invoice_number, amount, tax_amount, status, billing_details)
         VALUES ($1, $2, $3, $4, 'Paid', $5)
         RETURNING *`,
        [organizationId, invoiceNum, amount, tax, JSON.stringify({ item: planName + ' Plan Upgrade', period: 'Current Month' })]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.createInvoice error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4. WHITE LABEL SERVICE
  // ──────────────────────────────────────────────────────────

  async getWhiteLabelSettings(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM white_label_config WHERE organization_id = $1`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultWhiteLabel(organizationId);
      }
      return res.rows[0];
    } catch (err) {
      logger.warn('CommercialEcosystemService.getWhiteLabelSettings using mock:', err.message);
      return this._mockWhiteLabel();
    }
  }

  async updateWhiteLabelSettings(organizationId, { customDomain, brandingConfig, isEnabled }) {
    try {
      const res = await query(
        `UPDATE white_label_config 
         SET custom_domain = $1, branding_config = $2, is_enabled = $3, updated_at = NOW()
         WHERE organization_id = $4
         RETURNING *`,
        [customDomain, JSON.stringify(brandingConfig), isEnabled, organizationId]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.updateWhiteLabelSettings error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 5. CUSTOMER SUCCESS & ONBOARDING
  // ──────────────────────────────────────────────────────────

  async getCustomerSuccessMetrics(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM customer_success_health WHERE organization_id = $1`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultCustomerSuccess(organizationId);
      }
      return res.rows[0];
    } catch (err) {
      logger.warn('CommercialEcosystemService.getCustomerSuccessMetrics using mock:', err.message);
      return this._mockCustomerSuccess();
    }
  }

  async updateOnboardingStep(organizationId, step, completed = false) {
    try {
      const adoption = completed ? 90.00 : parseFloat((step * 20 + Math.random() * 10).toFixed(2));
      const res = await query(
        `UPDATE customer_success_health
         SET onboarding_step = $1, onboarding_completed = $2, adoption_score = $3, updated_at = NOW()
         WHERE organization_id = $4
         RETURNING *`,
        [step, completed, adoption, organizationId]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.updateOnboardingStep error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 6. MARKETPLACE PLUGINS
  // ──────────────────────────────────────────────────────────

  async getMarketplacePlugins(organizationId) {
    try {
      // Get all plugins
      const pluginsRes = await query(`SELECT * FROM marketplace_plugins ORDER BY name ASC`);
      
      let allPlugins = pluginsRes.rows;
      if (allPlugins.length === 0) {
        await this._seedMarketplacePlugins();
        const retry = await query(`SELECT * FROM marketplace_plugins ORDER BY name ASC`);
        allPlugins = retry.rows;
      }

      // Check which ones are installed
      const installedRes = await query(`SELECT plugin_id, status FROM installed_plugins WHERE organization_id = $1`, [organizationId]);
      const installedMap = {};
      installedRes.rows.forEach(r => {
        installedMap[r.plugin_id] = r.status;
      });

      return allPlugins.map(plugin => ({
        ...plugin,
        installed: !!installedMap[plugin.id],
        active: installedMap[plugin.id] === 'Active'
      }));
    } catch (err) {
      logger.warn('CommercialEcosystemService.getMarketplacePlugins using mock:', err.message);
      return this._mockMarketplacePlugins();
    }
  }

  async installPlugin(organizationId, pluginId, action = 'install') {
    try {
      if (action === 'install') {
        await query(
          `INSERT INTO installed_plugins (organization_id, plugin_id, status)
           VALUES ($1, $2, 'Active')
           ON CONFLICT (organization_id, plugin_id) DO UPDATE SET status = 'Active'`,
          [organizationId, pluginId]
        );
        // Increment install count
        await query(`UPDATE marketplace_plugins SET install_count = install_count + 1 WHERE id = $1`, [pluginId]);
      } else if (action === 'uninstall') {
        await query(
          `DELETE FROM installed_plugins WHERE organization_id = $1 AND plugin_id = $2`,
          [organizationId, pluginId]
        );
      } else if (action === 'toggle') {
        const check = await query(`SELECT status FROM installed_plugins WHERE organization_id = $1 AND plugin_id = $2`, [organizationId, pluginId]);
        if (check.rows.length > 0) {
          const nextStatus = check.rows[0].status === 'Active' ? 'Disabled' : 'Active';
          await query(`UPDATE installed_plugins SET status = $1 WHERE organization_id = $2 AND plugin_id = $3`, [nextStatus, organizationId, pluginId]);
        }
      }
      return true;
    } catch (err) {
      logger.error('CommercialEcosystemService.installPlugin error:', err);
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 7. INFRASTRUCTURE & CLUSTER MANAGER
  // ──────────────────────────────────────────────────────────

  async getInfrastructureCluster() {
    try {
      const res = await query(`SELECT * FROM infrastructure_nodes ORDER BY node_type ASC, node_name ASC`);
      if (res.rows.length === 0) {
        return await this._seedDefaultNodes();
      }
      return res.rows;
    } catch (err) {
      logger.warn('CommercialEcosystemService.getInfrastructureCluster using mock:', err.message);
      return this._mockNodes();
    }
  }

  async scaleCluster(nodeId, replicas) {
    try {
      const res = await query(
        `UPDATE infrastructure_nodes 
         SET resources = jsonb_set(resources, '{replicas}', $1::jsonb), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(replicas), nodeId]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.scaleCluster error:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 8. SECURITY OPERATIONS CENTER
  // ──────────────────────────────────────────────────────────

  async getSecurityThreats(organizationId) {
    try {
      const res = await query(
        `SELECT * FROM security_threats WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [organizationId]
      );
      if (res.rows.length === 0) {
        return await this._seedDefaultThreats(organizationId);
      }
      return res.rows;
    } catch (err) {
      logger.warn('CommercialEcosystemService.getSecurityThreats using mock:', err.message);
      return this._mockThreats();
    }
  }

  async resolveThreat(organizationId, threatId, userId) {
    try {
      const res = await query(
        `UPDATE security_threats 
         SET status = 'Mitigated', resolved_by = $1, resolved_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND organization_id = $3
         RETURNING *`,
        [userId, threatId, organizationId]
      );
      return res.rows[0];
    } catch (err) {
      logger.error('CommercialEcosystemService.resolveThreat error:', err);
      return null;
    }
  }


  // ──────────────────────────────────────────────────────────
  // INTERNAL SEEDING HELPERS (For DB Resilience)
  // ──────────────────────────────────────────────────────────

  async _seedDefaultConnectors(organizationId) {
    const defaultTypes = [
      { name: 'SharePoint', type: 'SharePoint', vol: 1540.20 },
      { name: 'OneDrive', type: 'OneDrive', vol: 890.50 },
      { name: 'Google Workspace', type: 'GoogleDrive', vol: 2450.80 },
      { name: 'Jira Software', type: 'Jira', vol: 45.30 },
      { name: 'ServiceNow ITSM', type: 'ServiceNow', vol: 88.60 },
      { name: 'SAP ERP Connect', type: 'SAP', vol: 5410.00 },
      { name: 'Salesforce CRM', type: 'Salesforce', vol: 320.40 },
      { name: 'Slack Workplace', type: 'Slack', vol: 1120.15 },
      { name: 'Microsoft Teams', type: 'Teams', vol: 780.00 },
      { name: 'GitHub Enterprise', type: 'GitHub', vol: 350.50 }
    ];

    const results = [];
    for (const d of defaultTypes) {
      try {
        const config = { auth_type: 'OAuth2', scope: 'ReadWrite', url: `https://api.external.com/v1/${d.type}` };
        const hist = [{ timestamp: new Date().toISOString(), status: 'Completed', volume_added_mb: 1.5, items_synced: 12 }];
        const health = { status: 'Healthy', latency_ms: Math.floor(Math.random() * 200 + 40) };
        const auth = { authenticated: true, token_expires: new Date(Date.now() + 86400000).toISOString() };

        const insert = await query(
          `INSERT INTO integration_connectors (organization_id, connector_type, status, config, last_sync_at, data_volume_mb, sync_history, health_status, auth_status)
           VALUES ($1, $2, 'Connected', $3, NOW(), $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, d.type, JSON.stringify(config), d.vol, JSON.stringify(hist), JSON.stringify(health), JSON.stringify(auth)]
        );
        if (insert.rows[0]) results.push(insert.rows[0]);
      } catch (err) {
        logger.warn(`Failed to seed connector ${d.type}:`, err.message);
      }
    }
    return results.length > 0 ? results : this._mockConnectors();
  }

  async _seedDefaultIndustryEditions(organizationId) {
    const editions = [
      { name: 'Healthcare', frameworks: ['HIPAA', 'HL7 v2/v3', 'NABH Digital Controls'], enabled: false },
      { name: 'Finance', frameworks: ['RBI Cyber Security guidelines', 'SEBI Cyber Audit', 'PCI DSS v4', 'SOX ITGC'], enabled: false },
      { name: 'Manufacturing', frameworks: ['ISO 9001 Integration', 'Supplier Code of Conduct', 'OHSAS 18001 Audit'], enabled: false },
      { name: 'Legal', frameworks: ['NDA Governance', 'Client Privilege Matrix', 'Litigation Retention Policy'], enabled: false },
      { name: 'Government', frameworks: ['NIC Security Guidelines', 'Data Localization Act', 'Public Records Act'], enabled: false },
      { name: 'Education', frameworks: ['FERPA Compliance', 'Accreditation Matrix', 'HECVAT Security Assessment'], enabled: false }
    ];

    const results = [];
    for (const ed of editions) {
      try {
        const insert = await query(
          `INSERT INTO industry_editions (organization_id, edition_name, frameworks, is_enabled)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT(organization_id, edition_name) DO UPDATE SET frameworks = $3
           RETURNING *`,
          [organizationId, ed.name, JSON.stringify(ed.frameworks), ed.enabled]
        );
        if (insert.rows[0]) results.push(insert.rows[0]);
      } catch (err) {
        logger.warn(`Failed to seed industry edition ${ed.name}:`, err.message);
      }
    }
    return results.length > 0 ? results : this._mockIndustryEditions();
  }

  async _seedDefaultSubscription(organizationId) {
    try {
      const res = await query(
        `INSERT INTO enterprise_subscriptions (organization_id, plan_name, status)
         VALUES ($1, 'Starter', 'Active')
         RETURNING *`,
        [organizationId]
      );
      return res.rows[0];
    } catch (err) {
      return this._mockSubscription();
    }
  }

  async _seedDefaultWhiteLabel(organizationId) {
    try {
      const res = await query(
        `INSERT INTO white_label_config (organization_id, custom_domain, is_enabled)
         VALUES ($1, 'vault.yourorganization.com', false)
         RETURNING *`,
        [organizationId]
      );
      return res.rows[0];
    } catch (err) {
      return this._mockWhiteLabel();
    }
  }

  async _seedDefaultCustomerSuccess(organizationId) {
    try {
      const res = await query(
        `INSERT INTO customer_success_health (organization_id, onboarding_completed, onboarding_step, adoption_score)
         VALUES ($1, false, 2, 45.50)
         RETURNING *`,
        [organizationId]
      );
      return res.rows[0];
    } catch (err) {
      return this._mockCustomerSuccess();
    }
  }

  async _seedMarketplacePlugins() {
    const list = [
      { name: 'Dynamic Compliance Auditor API', type: 'Extension', desc: 'Allows direct execution of compliance audit checklists over developer repositories.', rating: 4.8, count: 125, free: true, price: 0 },
      { name: 'Autonomous HIPAA Guard Agent', type: 'Agent', desc: 'Active scanning agent that automatically detects and flags HIPAA violations in clinical notes.', rating: 4.9, count: 88, free: false, price: 99.00 },
      { name: 'SAP Finance Controls Extractor', type: 'Connector', desc: 'Ingests real-time General Ledger and procurement control events directly into the Audit Planner.', rating: 4.6, count: 54, free: false, price: 249.00 },
      { name: 'Cybersecurity Threat Intelligence Map', type: 'Report', desc: 'Dashboard overlay reporting regional threat intelligence metrics and active CVE database matches.', rating: 4.7, count: 210, free: true, price: 0 },
      { name: 'Premium Glassmorphism Dark Theme', type: 'Theme', desc: 'A gorgeous dark theme style set customized for clean high-contrast dashboard visualization.', rating: 5.0, count: 420, free: true, price: 0 }
    ];

    for (const plugin of list) {
      try {
        await query(
          `INSERT INTO marketplace_plugins (name, plugin_type, description, rating, install_count, is_free, price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [plugin.name, plugin.type, plugin.desc, plugin.rating, plugin.count, plugin.free, plugin.price]
        );
      } catch (err) {
        logger.warn(`Failed to seed marketplace plugin: ${plugin.name}`);
      }
    }
  }

  async _seedDefaultNodes() {
    const nodes = [
      { name: 'frontend-k8s-pod-1', type: 'Frontend Pod', region: 'us-east-1', cpu: 12.4, mem: 45.2, status: 'Healthy', reps: 3 },
      { name: 'frontend-k8s-pod-2', type: 'Frontend Pod', region: 'us-west-2', cpu: 8.1, mem: 42.0, status: 'Healthy', reps: 3 },
      { name: 'api-server-pod-1', type: 'API Pod', region: 'us-east-1', cpu: 32.5, mem: 60.8, status: 'Healthy', reps: 4 },
      { name: 'worker-node-1', type: 'Worker Pod', region: 'us-east-1', cpu: 5.4, mem: 12.0, status: 'Healthy', reps: 2 },
      { name: 'ollama-gpu-node-primary', type: 'AI Node', region: 'us-east-1', cpu: 45.0, mem: 75.0, gpu: 85.0, status: 'Healthy', reps: 1 },
      { name: 'ollama-gpu-node-backup', type: 'AI Node', region: 'us-west-2', cpu: 0.0, mem: 10.0, gpu: 0.0, status: 'Healthy', reps: 1 },
      { name: 'postgres-primary-rbi', type: 'Database Node', region: 'us-east-1', cpu: 15.6, mem: 35.4, status: 'Healthy', reps: 1 },
      { name: 'postgres-replica-mumbai', type: 'Database Node', region: 'ap-south-1', cpu: 10.2, mem: 34.0, status: 'Healthy', reps: 1 }
    ];

    const results = [];
    for (const node of nodes) {
      try {
        const resources = { cpu_usage_pct: node.cpu, memory_usage_pct: node.mem, gpu_usage_pct: node.gpu || 0, replicas: node.reps };
        const insert = await query(
          `INSERT INTO infrastructure_nodes (node_name, node_type, status, region, resources, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [node.name, node.type, node.status, node.region, JSON.stringify(resources), `10.128.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`]
        );
        if (insert.rows[0]) results.push(insert.rows[0]);
      } catch (err) {
        logger.warn(`Failed to seed node ${node.name}:`, err.message);
      }
    }
    return results.length > 0 ? results : this._mockNodes();
  }

  async _seedDefaultThreats(organizationId) {
    const list = [
      { type: 'AI Prompt Injection', sev: 'High', det: 'Ollama filter intercepted a jailbreak attempt containing characters targeting executive approval overrides.' },
      { type: 'Anomalous Query', sev: 'Medium', det: 'Employee account requested 54 compliance document extracts in under 2 minutes, breaching behavioral thresholds.' },
      { type: 'Data Leakage', sev: 'Critical', det: 'Outgoing sync transfer to OneDrive detected plain text credit card sequences in ISO Audit document draft.' }
    ];

    const results = [];
    for (const thr of list) {
      try {
        const insert = await query(
          `INSERT INTO security_threats (organization_id, threat_type, severity, status, details, attacker_ip)
           VALUES ($1, $2, $3, 'Detected', $4, '198.51.100.42')
           RETURNING *`,
          [organizationId, thr.type, thr.sev, thr.det]
        );
        if (insert.rows[0]) results.push(insert.rows[0]);
      } catch (err) {
        logger.warn(`Failed to seed threat event ${thr.type}:`, err.message);
      }
    }
    return results.length > 0 ? results : this._mockThreats();
  }


  // ──────────────────────────────────────────────────────────
  // HARDCODED MOCKS (In Case Tables Don't Exist)
  // ──────────────────────────────────────────────────────────

  _mockConnectors() {
    return [
      { id: '1', connector_type: 'SharePoint', status: 'Connected', data_volume_mb: 1540.20, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '2', connector_type: 'OneDrive', status: 'Connected', data_volume_mb: 890.50, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '3', connector_type: 'GoogleDrive', status: 'Connected', data_volume_mb: 2450.80, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '4', connector_type: 'Jira', status: 'Connected', data_volume_mb: 45.30, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '5', connector_type: 'ServiceNow', status: 'Disconnected', data_volume_mb: 0.00, error_count: 1, last_sync_at: null, auth_status: { authenticated: false } },
      { id: '6', connector_type: 'SAP', status: 'Connected', data_volume_mb: 5410.00, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '7', connector_type: 'Salesforce', status: 'Connected', data_volume_mb: 320.40, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '8', connector_type: 'Slack', status: 'Connected', data_volume_mb: 1120.15, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '9', connector_type: 'Teams', status: 'Connected', data_volume_mb: 780.00, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } },
      { id: '10', connector_type: 'GitHub', status: 'Connected', data_volume_mb: 350.50, error_count: 0, last_sync_at: new Date().toISOString(), auth_status: { authenticated: true } }
    ];
  }

  _mockIndustryEditions() {
    return [
      { edition_name: 'Healthcare', frameworks: ['HIPAA', 'HL7', 'NABH Digital Controls'], is_enabled: false },
      { edition_name: 'Finance', frameworks: ['RBI Guidelines', 'SEBI Audit', 'PCI DSS', 'SOX'], is_enabled: true },
      { edition_name: 'Manufacturing', frameworks: ['Supplier Intelligence', 'Plant Compliance', 'Quality Control Standards'], is_enabled: false },
      { edition_name: 'Legal', frameworks: ['Contract Compliance', 'NDA Control', 'Matter Management Audit'], is_enabled: false },
      { edition_name: 'Government', frameworks: ['Policy Audit Trail', 'Public Sector Standards', 'GIGW'], is_enabled: false },
      { edition_name: 'Education', frameworks: ['FERPA Privacy', 'University Accreditation Framework'], is_enabled: false }
    ];
  }

  _mockSubscription() {
    return {
      plan_name: 'Business',
      status: 'Active',
      plan_limits: {
        max_users: 50,
        max_storage_gb: 500,
        ai_usage_limit_tokens: 50000000,
        feature_flags: {
          white_label: true,
          advanced_integrations: true,
          industry_modules: true
        }
      },
      billing_cycle: 'Monthly',
      next_billing_date: new Date(Date.now() + 86400000 * 20).toISOString()
    };
  }

  _mockInvoices() {
    return [
      { id: 'inv-1', invoice_number: 'INV-784291', amount: 499.00, tax_amount: 89.82, status: 'Paid', issued_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'inv-2', invoice_number: 'INV-712895', amount: 499.00, tax_amount: 89.82, status: 'Paid', issued_at: new Date(Date.now() - 86400000 * 35).toISOString() }
    ];
  }

  _mockWhiteLabel() {
    return {
      custom_domain: 'vault.acmetech.com',
      branding_config: {
        company_name: 'Acme Enterprise Vault',
        primary_color: '#4f46e5',
        secondary_color: '#06b6d4',
        logo_url: null,
        favicon_url: null,
        login_screen: {
          title: 'Acme Vault Entry',
          description: 'Secure corporate intelligence interface'
        },
        custom_email_sender: 'compliance@acmetech.com'
      },
      is_enabled: true
    };
  }

  _mockCustomerSuccess() {
    return {
      onboarding_completed: true,
      onboarding_step: 4,
      adoption_score: 84.50,
      active_users_count: 24,
      usage_health_metrics: {
        document_uploads: 310,
        ai_queries: 1842,
        syncs_running: 8
      }
    };
  }

  _mockMarketplacePlugins() {
    return [
      { id: 'p1', name: 'Dynamic Compliance Auditor API', plugin_type: 'Extension', description: 'Allows direct execution of compliance audit checklists over developer repositories.', rating: 4.8, install_count: 125, is_free: true, price: 0.00, installed: true, active: true },
      { id: 'p2', name: 'Autonomous HIPAA Guard Agent', plugin_type: 'Agent', description: 'Active scanning agent that automatically detects and flags HIPAA violations in clinical notes.', rating: 4.9, install_count: 88, is_free: false, price: 99.00, installed: false, active: false },
      { id: 'p3', name: 'SAP Finance Controls Extractor', plugin_type: 'Connector', description: 'Ingests real-time General Ledger and procurement control events directly into the Audit Planner.', rating: 4.6, install_count: 54, is_free: false, price: 249.00, installed: false, active: false },
      { id: 'p4', name: 'Cybersecurity Threat Intelligence Map', plugin_type: 'Report', description: 'Dashboard overlay reporting regional threat intelligence metrics and active CVE database matches.', rating: 4.7, install_count: 210, is_free: true, price: 0.00, installed: true, active: true },
      { id: 'p5', name: 'Premium Glassmorphism Dark Theme', plugin_type: 'Theme', description: 'A gorgeous dark theme style set customized for clean high-contrast dashboard visualization.', rating: 5.0, install_count: 420, is_free: true, price: 0.00, installed: false, active: false }
    ];
  }

  _mockNodes() {
    return [
      { id: 'n1', node_name: 'frontend-k8s-pod-1', node_type: 'Frontend Pod', region: 'us-east-1', resources: { cpu_usage_pct: 12.4, memory_usage_pct: 45.2, replicas: 3 }, status: 'Healthy' },
      { id: 'n2', node_name: 'api-server-pod-1', node_type: 'API Pod', region: 'us-east-1', resources: { cpu_usage_pct: 32.5, memory_usage_pct: 60.8, replicas: 4 }, status: 'Healthy' },
      { id: 'n3', node_name: 'worker-node-1', node_type: 'Worker Pod', region: 'us-east-1', resources: { cpu_usage_pct: 5.4, memory_usage_pct: 12.0, replicas: 2 }, status: 'Healthy' },
      { id: 'n4', node_name: 'ollama-gpu-node-primary', node_type: 'AI Node', region: 'us-east-1', resources: { cpu_usage_pct: 45.0, memory_usage_pct: 75.0, gpu_usage_pct: 85.0, replicas: 1 }, status: 'Healthy' },
      { id: 'n5', node_name: 'postgres-primary-rbi', node_type: 'Database Node', region: 'us-east-1', resources: { cpu_usage_pct: 15.6, memory_usage_pct: 35.4, replicas: 1 }, status: 'Healthy' }
    ];
  }

  _mockThreats() {
    return [
      { id: 't1', threat_type: 'AI Prompt Injection', severity: 'High', status: 'Detected', details: 'Ollama filter intercepted a jailbreak attempt containing characters targeting executive approval overrides.', attacker_ip: '198.51.100.42', created_at: new Date().toISOString() },
      { id: 't2', threat_type: 'Anomalous Query', severity: 'Medium', status: 'Mitigated', details: 'Employee account requested 54 compliance document extracts in under 2 minutes, breaching behavioral thresholds.', attacker_ip: '198.51.100.45', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 't3', threat_type: 'Data Leakage', severity: 'Critical', status: 'Detected', details: 'Outgoing sync transfer to OneDrive detected plain text credit card sequences in ISO Audit document draft.', attacker_ip: '198.51.100.22', created_at: new Date(Date.now() - 7200000).toISOString() }
    ];
  }
}

export default new CommercialEcosystemService();
