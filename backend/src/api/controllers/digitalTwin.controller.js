import { twinService } from '../../application/services/EnterpriseDigitalTwinService.js';
import { simulationService } from '../../application/services/SimulationEngineService.js';
import { scenarioPlanningService } from '../../application/services/ScenarioPlanningService.js';
import { forecastService } from '../../application/services/EnterpriseForecastService.js';
import { strategicIntelligenceService } from '../../application/services/StrategicIntelligenceService.js';
import { decisionSimulationService } from '../../application/services/DecisionSimulationService.js';
import { resilienceService } from '../../application/services/ResilienceEngineService.js';
import { autonomousStrategyService } from '../../application/services/AutonomousStrategyService.js';
import { warRoomService } from '../../application/services/ExecutiveWarRoomService.js';
import { councilService } from '../../application/services/AICouncilService.js';
import { twinSyncEngine } from '../../application/services/TwinSynchronizationEngine.js';
import { simulationTemplateService } from '../../application/services/SimulationTemplateService.js';
import { strategicRecommendationService } from '../../application/services/StrategicRecommendationService.js';
import { decisionMemoryService } from '../../application/services/DecisionMemoryService.js';
import { enterpriseHealthIndexService } from '../../application/services/EnterpriseHealthIndexService.js';
import { query } from '../../infrastructure/database/connection.js';

// ── 1. DIGITAL TWIN CORE ──
export const getTwinSnapshot = async (req, res) => {
  const orgId = req.organizationId;
  const snapshot = await twinService.getSnapshot(orgId);

  // If no entities yet, trigger a sync to populate initial data
  if (snapshot.entities.length === 0) {
    await twinService.syncTwin(orgId);
    const freshSnapshot = await twinService.getSnapshot(orgId);
    return res.json({ success: true, ...freshSnapshot });
  }

  res.json({ success: true, ...snapshot });
};

export const syncTwin = async (req, res) => {
  const orgId = req.organizationId;
  const result = await twinService.syncTwin(orgId);
  res.json({ success: true, message: 'Digital Twin synchronized successfully.', ...result });
};

// ── 2. SIMULATION RUNS ──
export const getSimulationRuns = async (req, res) => {
  const orgId = req.organizationId;
  const runs = await simulationService.getSimulationRuns(orgId);
  res.json({ success: true, runs });
};

export const runSimulation = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const { scenarioId } = req.body;
  const result = await simulationService.runSimulation(orgId, scenarioId, userId);
  res.json({ success: true, result });
};

// ── 3. SCENARIOS ──
export const getScenarios = async (req, res) => {
  const orgId = req.organizationId;
  const result = await scenarioPlanningService.getScenarios(orgId);

  // Seed default scenarios if empty
  if (result.length === 0) {
    const defaults = [
      { name: 'Employee Departure - Lead Legal Counsel', desc: 'Simulate departure of Priya Patel and analyze knowledge loss risks.', type: 'Employee Departure', config: { targetEntity: 'Priya Patel', department: 'Legal & Privacy', expertise: 'DPDP Audits' } },
      { name: 'Vendor Failure - Core Storage Node', desc: 'Simulate failure of Cloudflare storage node integrations and evaluate project impacts.', type: 'Vendor Failure', config: { targetEntity: 'Cloudflare Proxy Node' } },
      { name: 'Major Audit Failure - Q3 Review', desc: 'Simulate failing key GDPR compliance controls and calculate legal exposures.', type: 'Audit Failure', config: {} },
      { name: 'Data Breach - Compromised VPC Key', desc: 'Simulate unrotated server credentials breach and assess litigation costs.', type: 'Data Breach', config: {} }
    ];

    for (const d of defaults) {
      await scenarioPlanningService.createScenario(orgId, d.name, d.desc, d.type, d.config);
    }
    const freshResult = await scenarioPlanningService.getScenarios(orgId);
    return res.json({ success: true, scenarios: freshResult });
  }

  res.json({ success: true, scenarios: result });
};

export const createScenario = async (req, res) => {
  const orgId = req.organizationId;
  const { name, description, scenarioType, config } = req.body;
  const scenario = await scenarioPlanningService.createScenario(orgId, name, description, scenarioType, config);
  res.json({ success: true, scenario });
};

// ── 4. ENTERPRISE FORECASTS ──
export const getForecasts = async (req, res) => {
  const orgId = req.organizationId;
  const forecasts = await forecastService.getForecasts(orgId);

  if (forecasts.length === 0) {
    const generated = await forecastService.generateForecasts(orgId);
    return res.json({ success: true, forecasts: generated });
  }

  res.json({ success: true, forecasts });
};

export const generateForecasts = async (req, res) => {
  const orgId = req.organizationId;
  const forecasts = await forecastService.generateForecasts(orgId);
  res.json({ success: true, forecasts });
};

// ── 5. STRATEGY ROADMAPS ──
export const getStrategyRoadmaps = async (req, res) => {
  const orgId = req.organizationId;
  const strategies = await autonomousStrategyService.getStrategyRoadmaps(orgId);

  if (strategies.length === 0) {
    const userId = req.user.id;
    const defaultTypes = ['Compliance Strategy', 'Audit Strategy', 'AI Governance Strategy'];
    for (const type of defaultTypes) {
      await autonomousStrategyService.generateStrategy(orgId, type, userId);
    }
    const freshStrategies = await autonomousStrategyService.getStrategyRoadmaps(orgId);
    return res.json({ success: true, strategies: freshStrategies });
  }

  res.json({ success: true, strategies });
};

export const generateStrategy = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const { strategyType } = req.body;
  const strategy = await autonomousStrategyService.generateStrategy(orgId, strategyType, userId);
  res.json({ success: true, strategy });
};

// ── 6. DECISION SIMULATION ──
export const getDecisionSimulations = async (req, res) => {
  const orgId = req.organizationId;
  const simulations = await decisionSimulationService.getSimulations(orgId);
  res.json({ success: true, simulations });
};

export const simulateDecision = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const { decisionProposal } = req.body;
  const result = await decisionSimulationService.simulateDecision(orgId, decisionProposal, userId);
  res.json({ success: true, simulation: result });
};

// ── 7. RESILIENCE ENGINE ──
export const getResilienceMetrics = async (req, res) => {
  const orgId = req.organizationId;
  const metrics = await resilienceService.getLatestMetrics(orgId);
  const history = await resilienceService.getHistory(orgId);
  res.json({ success: true, metrics, history });
};

// ── 8. EXECUTIVE WAR ROOM ──
export const getWarRoomStatus = async (req, res) => {
  const orgId = req.organizationId;
  const status = await warRoomService.getWarRoomStatus(orgId);

  // If no strategic risks/recs seeded, run strategic analysis
  if (status.strategySummary.recommendations.length === 0) {
    await strategicIntelligenceService.runStrategicAnalysis(orgId);
    const freshStatus = await warRoomService.getWarRoomStatus(orgId);
    return res.json({ success: true, ...freshStatus });
  }

  res.json({ success: true, ...status });
};

export const createAlert = async (req, res) => {
  const orgId = req.organizationId;
  const { title, message, severity } = req.body;
  const alert = await warRoomService.createAlert(orgId, title, message, severity);
  res.json({ success: true, alert });
};

export const resolveAlert = async (req, res) => {
  const orgId = req.organizationId;
  const { alertId } = req.body;
  const result = await warRoomService.resolveAlert(orgId, alertId);
  res.json({ success: true, ...result });
};

// ── 9. COGNITIVE AI COUNCIL ──
export const getCouncilSessions = async (req, res) => {
  const orgId = req.organizationId;
  const sessions = await councilService.getSessions(orgId);
  res.json({ success: true, sessions });
};

export const runCouncilSession = async (req, res) => {
  const orgId = req.organizationId;
  const { topic } = req.body;
  const result = await councilService.runCouncilSession(orgId, topic);
  res.json({ success: true, session: result });
};

// ── 10. ADVANCED PHASE 9 FEATURES ──

export const syncTwinIncremental = async (req, res) => {
  const orgId = req.organizationId;
  const result = await twinSyncEngine.incrementalSync(orgId);
  res.json({ success: true, ...result });
};

export const getSimulationTemplates = async (req, res) => {
  const templates = await simulationTemplateService.getTemplates();
  res.json({ success: true, templates });
};

export const runTemplateSimulation = async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user.id;
  const { templateKey } = req.body;
  const result = await simulationTemplateService.runTemplateSimulation(orgId, templateKey, userId);
  res.json({ success: true, ...result });
};

export const getStrategicRecommendations = async (req, res) => {
  const orgId = req.organizationId;
  const result = await strategicRecommendationService.generateRecommendations(orgId);
  res.json({ success: true, ...result });
};

export const getDecisionHistory = async (req, res) => {
  const orgId = req.organizationId;
  const result = await decisionMemoryService.getDecisionHistory(orgId);
  res.json({ success: true, ...result });
};

export const recordActualOutcome = async (req, res) => {
  const orgId = req.organizationId;
  const { decisionSimulationId, actualSuccessRate, notes } = req.body;
  const result = await decisionMemoryService.recordActualOutcome(orgId, decisionSimulationId, actualSuccessRate, notes);
  res.json({ success: true, ...result });
};

export const getEnterpriseHealthIndex = async (req, res) => {
  const orgId = req.organizationId;
  const result = await enterpriseHealthIndexService.calculateHealthIndex(orgId);
  res.json({ success: true, ...result });
};
