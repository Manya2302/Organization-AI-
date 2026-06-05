// ============================================================
// API Controller: Commercial, Ecosystem & Global Scale
// ============================================================
import commercialService from '../../application/services/CommercialEcosystemService.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';

// ────────── 1. Connectors Endpoints ──────────
export const getConnectors = async (req, res) => {
  const list = await commercialService.getConnectors(req.organizationId);
  res.json({ success: true, connectors: list });
};

export const syncConnector = async (req, res) => {
  const { id } = req.params;
  const updated = await commercialService.syncConnector(req.organizationId, id);
  if (!updated) throw createError('Connector not found or failed to sync', 404);
  res.json({ success: true, connector: updated });
};

export const updateConnectorConfig = async (req, res) => {
  const { connectorType, config } = req.body;
  if (!connectorType) throw createError('connectorType is required', 400);
  const updated = await commercialService.updateConnectorConfig(req.organizationId, connectorType, config || {});
  res.json({ success: true, connector: updated });
};

// ────────── 2. Industry Editions Endpoints ──────────
export const getIndustryEditions = async (req, res) => {
  const list = await commercialService.getIndustryEditions(req.organizationId);
  res.json({ success: true, editions: list });
};

export const toggleIndustryEdition = async (req, res) => {
  const { editionName, isEnabled } = req.body;
  if (!editionName) throw createError('editionName is required', 400);
  const updated = await commercialService.toggleIndustryEdition(req.organizationId, editionName, isEnabled);
  if (!updated) throw createError('Edition toggle failed', 404);
  res.json({ success: true, edition: updated });
};

// ────────── 3. Subscriptions & Billing Endpoints ──────────
export const getSubscription = async (req, res) => {
  const sub = await commercialService.getSubscription(req.organizationId);
  res.json({ success: true, subscription: sub });
};

export const upgradeSubscription = async (req, res) => {
  const { planName } = req.body;
  if (!planName) throw createError('planName is required', 400);
  const sub = await commercialService.upgradeSubscription(req.organizationId, planName);
  res.json({ success: true, subscription: sub });
};

export const getInvoices = async (req, res) => {
  const invoices = await commercialService.getInvoices(req.organizationId);
  res.json({ success: true, invoices });
};

// ────────── 4. White Label Endpoints ──────────
export const getWhiteLabelSettings = async (req, res) => {
  const settings = await commercialService.getWhiteLabelSettings(req.organizationId);
  res.json({ success: true, settings });
};

export const updateWhiteLabelSettings = async (req, res) => {
  const { customDomain, brandingConfig, isEnabled } = req.body;
  const settings = await commercialService.updateWhiteLabelSettings(req.organizationId, {
    customDomain,
    brandingConfig,
    isEnabled
  });
  res.json({ success: true, settings });
};

// ────────── 5. Customer Onboarding Endpoints ──────────
export const getCustomerSuccessMetrics = async (req, res) => {
  const metrics = await commercialService.getCustomerSuccessMetrics(req.organizationId);
  res.json({ success: true, metrics });
};

export const updateOnboardingStep = async (req, res) => {
  const { step, completed } = req.body;
  const metrics = await commercialService.updateOnboardingStep(req.organizationId, step, completed);
  res.json({ success: true, metrics });
};

// ────────── 6. Marketplace Endpoints ──────────
export const getMarketplacePlugins = async (req, res) => {
  const plugins = await commercialService.getMarketplacePlugins(req.organizationId);
  res.json({ success: true, plugins });
};

export const installPlugin = async (req, res) => {
  const { pluginId, action } = req.body; // action: 'install', 'uninstall', 'toggle'
  if (!pluginId) throw createError('pluginId is required', 400);
  const success = await commercialService.installPlugin(req.organizationId, pluginId, action || 'install');
  res.json({ success });
};

// ────────── 7. Infrastructure Endpoints ──────────
export const getInfrastructureCluster = async (req, res) => {
  const cluster = await commercialService.getInfrastructureCluster();
  res.json({ success: true, cluster });
};

export const scaleCluster = async (req, res) => {
  const { nodeId, replicas } = req.body;
  if (!nodeId || replicas === undefined) throw createError('nodeId and replicas are required', 400);
  const node = await commercialService.scaleCluster(nodeId, replicas);
  res.json({ success: true, node });
};

// ────────── 8. Security operations Endpoints ──────────
export const getSecurityThreats = async (req, res) => {
  const threats = await commercialService.getSecurityThreats(req.organizationId);
  res.json({ success: true, threats });
};

export const resolveThreat = async (req, res) => {
  const { id } = req.params;
  const threat = await commercialService.resolveThreat(req.organizationId, id, req.user.id);
  res.json({ success: true, threat });
};
