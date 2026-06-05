// ============================================================
// Routes: Commercial SaaS Ecosystem & Enterprise scale
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getConnectors,
  syncConnector,
  updateConnectorConfig,
  getIndustryEditions,
  toggleIndustryEdition,
  getSubscription,
  upgradeSubscription,
  getInvoices,
  getWhiteLabelSettings,
  updateWhiteLabelSettings,
  getCustomerSuccessMetrics,
  updateOnboardingStep,
  getMarketplacePlugins,
  installPlugin,
  getInfrastructureCluster,
  scaleCluster,
  getSecurityThreats,
  resolveThreat
} from '../controllers/commercial.controller.js';

const router = Router();
router.use(authenticate);

// 1. Integrations
router.get('/connectors', getConnectors);
router.post('/connectors/:id/sync', syncConnector);
router.post('/connectors/config', updateConnectorConfig);

// 2. Industry Editions
router.get('/industry/editions', getIndustryEditions);
router.post('/industry/toggle', toggleIndustryEdition);

// 3. Subscriptions & Billing
router.get('/subscription', getSubscription);
router.post('/subscription/upgrade', upgradeSubscription);
router.get('/subscription/invoices', getInvoices);

// 4. White Label Customization
router.get('/whitelabel', getWhiteLabelSettings);
router.post('/whitelabel/update', updateWhiteLabelSettings);

// 5. Customer Onboarding Success
router.get('/customersuccess', getCustomerSuccessMetrics);
router.post('/customersuccess/step', updateOnboardingStep);

// 6. Marketplace Add-ons
router.get('/marketplace/plugins', getMarketplacePlugins);
router.post('/marketplace/install', installPlugin);

// 7. Kubernetes / Infrastructure
router.get('/infrastructure/cluster', getInfrastructureCluster);
router.post('/infrastructure/scale', scaleCluster);

// 8. Security Hardening Alerts
router.get('/security/threats', getSecurityThreats);
router.post('/security/threats/:id/resolve', resolveThreat);

export default router;
