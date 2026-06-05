import React, { useState, useEffect } from 'react';
import {
  Network, Play, RefreshCw, Layers, TrendingUp, Cpu, Calendar,
  CheckCircle2, Activity, AlertTriangle, Bot, Zap, Target, CheckCircle,
  Sparkles, Flame, AlertCircle, Radio, Award
} from 'lucide-react';
import {
  PremiumButton, PremiumCard, SkeletonLoader, PremiumInput
} from '../design-system/components';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const API_BASE = 'http://localhost:5000/api/v1';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ═════════════════════════════════════════════════════════════════
// 1. ENTERPRISE DIGITAL TWIN CENTER
// ═════════════════════════════════════════════════════════════════
export const DigitalTwinCenterPage: React.FC = () => {
  const [twinData, setTwinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [isContinuous, setIsContinuous] = useState(true);
  const [twinHealth, setTwinHealth] = useState(98);

  const fetchTwin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/twin/entities`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setTwinData({ entities: res.entities, relationships: res.relationships });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerIncrementalSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/twin/sync-incremental`, { method: 'POST', headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setTwinHealth(res.healthScore || 98);
        fetchTwin();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  const filteredEntities = twinData?.entities.filter((e: any) => filterType === 'All' || e.entity_type === filterType) || [];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-brand-primary" /> Enterprise Digital Twin Center
          </h2>
          <p className="text-xs text-gray-400">Living virtual replica mapping employees, projects, compliance rules, risks, and vendor dependencies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-3.5 py-1.5 rounded-xl">
            <Radio className={`h-4 w-4 ${isContinuous ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Continuous Sync</span>
            <button
              onClick={() => setIsContinuous(!isContinuous)}
              className={`w-8 h-4 rounded-full p-0.5 transition-all ${isContinuous ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white transition-all transform ${isContinuous ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
          <PremiumButton onClick={triggerIncrementalSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 text-xs">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Incremental Live Sync'}
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Topology Map */}
        <div className="lg:col-span-7">
          <PremiumCard title="Graph Topology Map" subtitle="2D dependency relationships mapping current corporate controls and workforce nodes">
            <div className="h-80 w-full rounded-2xl bg-slate-900/60 border border-white/5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              {loading ? (
                <SkeletonLoader count={2} />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute bg-brand-primary/20 border border-brand-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-brand-primary/10">HQ Org</div>
                  <div className="absolute top-12 left-16 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/10">Legal Dept</div>
                  <div className="absolute top-16 right-16 bg-blue-500/20 border border-blue-500 text-blue-300 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/10">Vault Project</div>
                  <div className="absolute bottom-16 left-24 bg-purple-500/20 border border-purple-500 text-purple-300 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-purple-500/10">Compliance Control</div>
                  <div className="absolute bottom-12 right-24 bg-red-500/20 border border-red-500 text-red-300 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/10">Key-Man Risk</div>
                  
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="70%" y2="85%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <line x1="25%" y1="20%" x2="30%" y2="80%" stroke="rgba(16,185,129,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="75%" y1="25%" x2="70%" y2="85%" stroke="rgba(239,68,68,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                  </svg>
                  
                  <span className="absolute bottom-3 right-4 text-[9px] font-mono text-gray-500 tracking-wider">GRAPH ENGINE ACTIVE (EIOS-v2)</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs text-center">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-gray-400 block mb-1">Entities</span>
                <span className="text-lg font-extrabold text-white">{twinData?.entities.length || 0}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-gray-400 block mb-1">Relationships</span>
                <span className="text-lg font-extrabold text-brand-primary">{twinData?.relationships.length || 0}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-gray-400 block mb-1">Twin Health Score</span>
                <span className="text-lg font-extrabold text-emerald-400">{twinHealth}%</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-gray-400 block mb-1">Last Sync State</span>
                <span className="text-xs font-bold text-emerald-400 block mt-1.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                </span>
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Entity Listing */}
        <div className="lg:col-span-5">
          <PremiumCard title="Entity Directory" subtitle="Inspect properties of logged nodes in the twin database">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['All', 'Employee', 'Department', 'Project', 'Vendor', 'Risk', 'Workflow'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    filterType === t
                      ? 'bg-brand-primary text-white border-brand-primary/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredEntities.map((e: any) => (
                  <div key={e.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-start text-xs hover:border-brand-primary/20 transition-all">
                    <div>
                      <span className="font-extrabold text-white block">{e.entity_name}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Type: {e.entity_type}</span>
                      {e.properties && (
                        <div className="mt-1.5 text-[10px] text-gray-400 space-y-0.5 bg-black/20 p-2 rounded-lg border border-white/5 font-mono">
                          {Object.entries(e.properties).map(([key, val]: any) => (
                            <div key={key} className="truncate">
                              <span className="text-gray-500">{key}:</span> {String(val)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 2. SCENARIO PLANNING STUDIO
// ═════════════════════════════════════════════════════════════════
export const ScenarioPlanningStudioPage: React.FC = () => {
  const [decisionName, setDecisionName] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionName.trim()) return;
    setRunning(true);
    setResult(null);

    try {
      await fetch(`${API_BASE}/scenarios`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: `Strategic: ${decisionName}`, description: 'Interactive testing', scenarioType: 'Policy Change', config: {} })
      }).then(r => r.json());

      const testRes = await fetch(`${API_BASE}/scenarios/test`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ decisionName })
      });
      const data = await testRes.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const selectPrebuilt = (preset: string) => {
    setDecisionName(preset);
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-brand-secondary" /> Scenario Planning Studio
        </h2>
        <p className="text-xs text-gray-400">Evaluate the systemic impact of major strategic decisions on cost, timelines, and organizational risks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <PremiumCard title="Strategic Decision Parameters" subtitle="Specify a proposed operational shift to evaluate">
            <form onSubmit={handleTestScenario} className="space-y-4 text-xs">
              <PremiumInput
                label="Strategic Decision / Shift proposal"
                value={decisionName}
                onChange={e => setDecisionName(e.target.value)}
                placeholder="e.g. Hiring 100 developers OR adopting ISO 27001 standard"
                required
              />

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Quick Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => selectPrebuilt('Hiring 100 new employees')} className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all text-[10px] font-bold text-left text-gray-300">
                    👥 Hiring 100 employees
                  </button>
                  <button type="button" onClick={() => selectPrebuilt('Losing top data storage vendor')} className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all text-[10px] font-bold text-left text-gray-300">
                    🏢 Losing core storage vendor
                  </button>
                  <button type="button" onClick={() => selectPrebuilt('Adopting ISO 27001 compliance standards')} className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all text-[10px] font-bold text-left text-gray-300">
                    🛡️ Adopting ISO 27001
                  </button>
                  <button type="button" onClick={() => selectPrebuilt('Reduce compliance staff by 50%')} className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all text-[10px] font-bold text-left text-gray-300">
                    📉 Reducing compliance staff
                  </button>
                </div>
              </div>

              <PremiumButton type="submit" disabled={running} className="w-full py-2.5">
                {running ? 'Running Simulation Models...' : 'Execute Scenario Analysis'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>

        <div className="lg:col-span-7">
          <PremiumCard title="Strategic Simulation Output" subtitle="Predictive risk summaries and cost implications">
            {running ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" /> Evaluating dependency graph path vulnerabilities...
              </div>
            ) : result ? (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-400 block mb-1">Success Probability</span>
                    <span className={`text-2xl font-black block ${result.successProbability > 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.successProbability}%
                    </span>
                  </div>
                  <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-400 block mb-1">Hiring & Setup Cost</span>
                    <span className="text-xl font-extrabold text-white block mt-0.5">
                      ${result.costForecast.implementation.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-400 block mb-1">Ongoing Annual Cost</span>
                    <span className="text-xl font-extrabold text-white block mt-0.5">
                      ${result.costForecast.ongoingAnnual.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-bold text-brand-secondary uppercase block mb-1.5 tracking-wider">AI Impact Summary</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{result.reportText}</p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Simulated Vulnerability Triggers</span>
                  <div className="space-y-2">
                    {result.riskReport.items.map((r: string, idx: number) => (
                      <div key={idx} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <span className="text-xs text-gray-300">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Timeline Impact:</span>
                    <span className="font-bold text-white font-mono">+{result.impactForecast.timelineExtensionDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Workload Delta:</span>
                    <span className={`font-bold font-mono ${result.impactForecast.resourceOverloadPercent < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.impactForecast.resourceOverloadPercent}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-gray-500 text-xs">
                No active scenario simulation has been calculated. Run a planning scenario on the left panel to begin.
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 3. SIMULATION CENTER (What-If Templates Integration)
// ═════════════════════════════════════════════════════════════════
export const SimulationCenterPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingKey, setSimulatingKey] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tempRes = await fetch(`${API_BASE}/twin/simulation-templates`, { headers: getHeaders() }).then(r => r.json());
      const runRes = await fetch(`${API_BASE}/twin/simulate`, { headers: getHeaders() }).then(r => r.json());
      if (tempRes.success) setTemplates(tempRes.templates);
      if (runRes.success) setRuns(runRes.runs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunTemplate = async (templateKey: string) => {
    setSimulatingKey(templateKey);
    try {
      const res = await fetch(`${API_BASE}/twin/simulate-template`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ templateKey })
      }).then(r => r.json());

      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingKey(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Cpu className="h-6 w-6 text-brand-primary" /> Simulation Center
        </h2>
        <p className="text-xs text-gray-400">Trigger organizational failure models to identify single points of compromise and resilience bounds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates */}
        <div className="lg:col-span-6">
          <PremiumCard title="What-If Simulation Templates" subtitle="Simulate specific, pre-built high-risk enterprise events">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {templates.map(t => (
                  <div key={t.key} className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl hover:border-brand-primary/20 transition-all text-xs flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="font-extrabold text-white text-[13px] block">{t.name}</span>
                      <span className="text-[10px] text-gray-400 block leading-relaxed">{t.description}</span>
                      <span className="inline-block text-[9px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-mono font-bold uppercase mt-1">
                        {t.scenario_type}
                      </span>
                    </div>

                    <PremiumButton
                      onClick={() => handleRunTemplate(t.key)}
                      disabled={simulatingKey !== null}
                      className="text-[10px] py-1.5 px-3 flex items-center gap-1 shrink-0"
                    >
                      <Play className="h-3 w-3 fill-current" /> {simulatingKey === t.key ? 'Running...' : 'Execute'}
                    </PremiumButton>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        {/* Simulation Runs Log */}
        <div className="lg:col-span-6">
          <PremiumCard title="Simulation Run Records" subtitle="Audit logs of past threat environment results and business stability score outcomes">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {runs.map(r => (
                  <div key={r.id} className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div>
                        <span className="font-bold text-white block">{r.simulation_name}</span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">Date: {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Stability Score</span>
                        <span className={`text-base font-black font-mono ${r.resilience_score > 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {parseFloat(r.resilience_score).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {r.impact_analysis && (
                      <p className="text-[11px] text-gray-300 leading-relaxed">{r.impact_analysis.summary}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-[10px] bg-black/20 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-gray-500 font-bold block mb-0.5">Affected Depts:</span>
                        <span className="text-white block font-medium">{r.affected_departments.join(', ') || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-bold block mb-0.5">Blocked Projects:</span>
                        <span className="text-white block font-medium">{r.affected_projects.join(', ') || 'None'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 font-bold block mb-0.5">Breached Controls:</span>
                        <span className="text-white block font-medium">{r.affected_controls.join(', ') || 'None'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 font-bold block mb-0.5">Vulnerable Revenue:</span>
                        <span className="text-red-400 block font-extrabold font-mono">${parseFloat(r.affected_revenue).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 4. FORECAST INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const ForecastIntelligencePage: React.FC = () => {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forecasts`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setForecasts(res.forecasts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/forecasts`, { method: 'POST', headers: getHeaders() }).then(r => r.json());
      if (res.success) setForecasts(res.forecasts);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-brand-primary" /> Forecast Intelligence Center
          </h2>
          <p className="text-xs text-gray-400">Time-series forecasting on compliance statuses, risk vectors, and staff capacities</p>
        </div>
        <PremiumButton onClick={regenerate} disabled={generating} className="flex items-center gap-1.5 text-xs px-3.5 py-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} /> {generating ? 'Regenerating Models...' : 'Regenerate Models'}
        </PremiumButton>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forecasts.map(f => {
            const chartData = [
              { name: 'Current', score: parseFloat(f.forecast_30d.score) - 4 },
              { name: '30 Days', score: parseFloat(f.forecast_30d.score) },
              { name: '90 Days', score: parseFloat(f.forecast_90d.score) },
              { name: '1 Year', score: parseFloat(f.forecast_1y.score) },
              { name: '3 Years', score: parseFloat(f.forecast_3y.score) }
            ];

            return (
              <PremiumCard key={f.id} title={f.target_metric} subtitle={`Predictive model: ${f.model_name} | Accuracy: ${f.accuracy}%`}>
                <div className="h-48 w-full text-[10px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${f.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill={`url(#grad-${f.id})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                  <span className="text-[9px] font-bold text-brand-secondary uppercase block tracking-wider">Predictive Trend Drivers</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(f.forecast_90d.drivers || ['Model stability indices verified']).map((d: string, idx: number) => (
                      <span key={idx} className="bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded text-[10px]">
                        💡 {d}
                      </span>
                    ))}
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 5. STRATEGIC INTELLIGENCE (Quantified Recommendation Engine)
// ═════════════════════════════════════════════════════════════════
export const StrategicIntelligencePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/warroom`, { headers: getHeaders() }).then(r => r.json());
      const recRes = await fetch(`${API_BASE}/twin/strategic-recommendations`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res.strategySummary);
      if (recRes.success) setRecommendations(recRes.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Target className="h-6 w-6 text-brand-primary" /> Strategic Intelligence Center
        </h2>
        <p className="text-xs text-gray-400">High-level executive priorities, risk vectors, opportunities, and model advisory boards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quantified Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          <PremiumCard title="Prioritized Recommendation Model Actions" subtitle="AI Council generated action items with projected ROI, costs, and risk reduction deltas">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-3">
                {recommendations.map(r => (
                  <div key={r.id} className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3 text-xs hover:border-brand-primary/20 transition-all">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-bold text-white text-[13px]">💡 Recommendation Action</span>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border ${
                        r.priority === 'Critical' || r.priority === 'High'
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                      }`}>
                        {r.priority} Priority
                      </span>
                    </div>

                    <p className="text-gray-200 leading-relaxed text-[12px]">{r.recommendation}</p>

                    {/* Financial & Risk deltas */}
                    {r.details && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] font-mono">
                        <div>
                          <span className="text-gray-500 block">Expected ROI</span>
                          <span className="text-emerald-400 font-extrabold text-xs">+{r.details.expectedRoi}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Risk Reduction</span>
                          <span className="text-blue-400 font-extrabold text-xs">-{r.details.riskReduction}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Estimated Cost</span>
                          <span className="text-white font-extrabold text-xs">${parseFloat(r.details.expectedCost).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Success Probability</span>
                          <span className="text-brand-primary font-extrabold text-xs">{r.details.successProbability}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        {/* Sidebar priorities */}
        <div className="lg:col-span-4 space-y-6">
          <PremiumCard title="Current Executive Priorities" subtitle="Urgent tasks to complete in the next board lifecycle">
            <div className="space-y-3 text-xs">
              {data?.priorities?.map((p: any, idx: number) => (
                <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                  <span className="font-bold text-white block">{p.task}</span>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span className="text-amber-500 font-bold">{p.status}</span>
                    <span>Deadline: {p.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard title="Sovereign Growth Opportunities" subtitle="Identified project directions for compliance superiority">
            {loading ? (
              <SkeletonLoader count={1} />
            ) : (
              <div className="space-y-3 text-xs">
                {data?.opportunities?.map((o: any) => (
                  <div key={o.id} className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-1">
                    <span className="font-bold text-brand-light block">{o.title}</span>
                    <span className="text-[10px] text-gray-400 block leading-normal">{o.description}</span>
                    <span className="text-[9px] text-emerald-400 font-mono block pt-1">Benefit: {o.potential_benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 6. DECISION SIMULATION CENTER (Decision Memory Integration)
// ═════════════════════════════════════════════════════════════════
export const DecisionSimulationPage: React.FC = () => {
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Decision Memory State
  const [history, setHistory] = useState<any[]>([]);
  const [accuracyRating, setAccuracyRating] = useState(95);
  
  // Actual Outcome Log form
  const [selectedSimId, setSelectedSimId] = useState('');
  const [actualSuccess, setActualSuccess] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [loggingOutcome, setLoggingOutcome] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/twin/decision-history`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setHistory(res.decisions);
        setAccuracyRating(res.modelAccuracyRating || 95);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal.trim()) return;
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`${API_BASE}/decisions/simulate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ decisionProposal: proposal })
      }).then(r => r.json());

      if (res.success) {
        setResults(res.simulation);
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSimId || !actualSuccess) return;
    setLoggingOutcome(true);

    try {
      const res = await fetch(`${API_BASE}/twin/decision-actual`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          decisionSimulationId: selectedSimId,
          actualSuccessRate: parseFloat(actualSuccess),
          notes: outcomeNotes
        })
      }).then(r => r.json());

      if (res.success) {
        setActualSuccess('');
        setOutcomeNotes('');
        setSelectedSimId('');
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOutcome(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-brand-primary" /> Decision Simulation Center
        </h2>
        <p className="text-xs text-gray-400">Run sandbox simulations of business proposals and compare them against historical actual outcomes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Proposal Input & Outcome Logger */}
        <div className="lg:col-span-5 space-y-6">
          <PremiumCard title="Simulate Strategic Proposal" subtitle="Model the consequence of operational or vendor adjustments before execution">
            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <PremiumInput
                label="Strategic proposal details"
                value={proposal}
                onChange={e => setProposal(e.target.value)}
                placeholder="e.g. Replace Vendor A with Vendor B OR reduce compliance headcount"
                required
              />

              <PremiumButton type="submit" disabled={loading} className="w-full py-2.5">
                {loading ? 'Executing Network Simulations...' : 'Simulate Proposal'}
              </PremiumButton>
            </form>
          </PremiumCard>

          {/* Outcome Logger (Memory learning) */}
          <PremiumCard title="Record Actual Decision Outcome" subtitle="Log actual results to let the predictive model learn from discrepancies">
            <form onSubmit={handleLogOutcome} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block mb-1">Select Simulated Proposal</label>
                <select
                  value={selectedSimId}
                  onChange={e => setSelectedSimId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Select Decision Simulation --</option>
                  {history.filter(h => h.actual_success_rate === null).map(h => (
                    <option key={h.id} value={h.id}>{h.decision_proposal.substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PremiumInput
                  label="Actual Success Rate (%)"
                  type="number"
                  value={actualSuccess}
                  onChange={e => setActualSuccess(e.target.value)}
                  placeholder="0 - 100"
                  required
                />
                <PremiumInput
                  label="Outcome Notes"
                  value={outcomeNotes}
                  onChange={e => setOutcomeNotes(e.target.value)}
                  placeholder="Reasoning, learnings, etc."
                />
              </div>

              <PremiumButton type="submit" disabled={loggingOutcome} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700">
                {loggingOutcome ? 'Recording...' : 'Log Actual Result'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>

        {/* Impact Output & Accuracy Engine */}
        <div className="lg:col-span-7 space-y-6">
          {/* Accuracy Rating */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between md:col-span-2">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AI Forecasting Accuracy</span>
                <span className="text-2xl font-black text-emerald-400 block mt-1">{accuracyRating}%</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-normal mt-2">Historical model deviation index rating comparing simulated predictions vs logged business outcomes.</p>
            </div>
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-center flex flex-col justify-center items-center">
              <Award className="h-7 w-7 text-brand-primary mb-1" />
              <span className="text-[10px] text-gray-400 block font-bold">Decision Memory</span>
              <span className="text-sm font-extrabold text-white block mt-0.5">{history.length} Saved Logs</span>
            </div>
          </div>

          <PremiumCard title="Projected Strategic Impact / Memory Log" subtitle="Multilateral risk assessment score outcomes">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" /> Calculating impact indices on workflows...
              </div>
            ) : results ? (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Estimated Success Probability</span>
                    <span className={`text-2xl font-black block mt-0.5 ${results.success_probability > 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(results.success_probability).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Financial Outcome Delta</span>
                    <span className={`text-lg font-black block mt-0.5 ${parseFloat(results.cost_impact) < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(results.cost_impact) < 0 ? `-$${Math.abs(parseFloat(results.cost_impact)).toLocaleString()} (Savings)` : `+$${parseFloat(results.cost_impact).toLocaleString()} (Cost)`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-gray-500 block font-bold mb-0.5">Risk Exposure:</span>
                    <span className="text-white block font-medium">{results.risk_impact}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-gray-500 block font-bold mb-0.5">Compliance Impact:</span>
                    <span className="text-white block font-medium">{results.compliance_impact}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-gray-500 block font-bold mb-0.5">Operational Stability:</span>
                    <span className="text-white block font-medium">{results.operational_impact}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-gray-500 block font-bold mb-0.5">Knowledge Loss Delta:</span>
                    <span className="text-white block font-medium">{results.knowledge_impact}</span>
                  </div>
                </div>

                <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl">
                  <span className="text-[9px] font-bold text-brand-secondary uppercase block mb-1.5 tracking-wider">Strategic Recommendation</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{results.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {history.map(h => (
                  <div key={h.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-2 hover:border-brand-primary/10">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white block truncate max-w-sm">{h.decision_proposal}</span>
                      <span className={`text-[10px] font-bold ${h.actual_success_rate !== null ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {h.actual_success_rate !== null ? 'Completed' : 'Simulated'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Simulated success: {parseFloat(h.success_probability).toFixed(1)}%</span>
                      {h.actual_success_rate !== null && (
                        <>
                          <span className="text-white">Actual success: {parseFloat(h.actual_success_rate).toFixed(1)}%</span>
                          <span className="text-brand-secondary">Deviation: {Math.abs(parseFloat(h.success_probability) - parseFloat(h.actual_success_rate)).toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 7. ENTERPRISE RESILIENCE (Enterprise Health Index Integration)
// ═════════════════════════════════════════════════════════════════
export const EnterpriseResiliencePage: React.FC = () => {
  const [healthIndex, setHealthIndex] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/twin/health-index`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setHealthIndex(res);
        setHistory(res.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-brand-primary" /> Enterprise Resilience Center
        </h2>
        <p className="text-xs text-gray-400">Evaluate stability indexes across continuity, compliance, and systems integration channels</p>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Gauges & Health Index */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Unified Company Metric</span>
                <h3 className="text-2xl font-black text-white">Enterprise Health Index</h3>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed mt-2">Combined real-time score representing data architecture, risk exposure, compliance drift, and project delivery timelines.</p>
              </div>

              {/* Index Radial Chart */}
              <div className="h-32 w-32 relative flex items-center justify-center">
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-brand-primary font-mono">{healthIndex?.enterpriseHealthIndex}%</span>
                  <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mt-0.5">Health</span>
                </div>
                <div className="w-full h-full rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <PremiumCard title="Stability Score Breakdown" subtitle="System calculated real-time capability percentages across 8 categories">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                {[
                  { label: 'Knowledge Health', val: healthIndex?.components.knowledgeHealth, color: 'text-purple-400' },
                  { label: 'Compliance Health', val: healthIndex?.components.complianceHealth, color: 'text-brand-primary' },
                  { label: 'Audit Health', val: healthIndex?.components.auditHealth, color: 'text-emerald-400' },
                  { label: 'Risk Health', val: healthIndex?.components.riskHealth, color: 'text-red-400' },
                  { label: 'Workforce Health', val: healthIndex?.components.workforceHealth, color: 'text-blue-400' },
                  { label: 'Vendor Health', val: healthIndex?.components.vendorHealth, color: 'text-amber-500' },
                  { label: 'AI Health', val: healthIndex?.components.aiHealth, color: 'text-rose-400' },
                  { label: 'Project Health', val: healthIndex?.components.projectHealth, color: 'text-pink-400' }
                ].map((m, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between items-center h-24">
                    <span className="text-gray-500 block font-bold text-[9px] truncate w-full">{m.label}</span>
                    <span className={`text-xl font-black block mt-1 ${m.color}`}>{parseFloat(m.val).toFixed(0)}%</span>
                    <div className="w-12 bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-brand-primary h-full" style={{ width: `${m.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumCard>
          </div>

          {/* History chart */}
          <div className="lg:col-span-5">
            <PremiumCard title="Enterprise Score History" subtitle="Composite stability changes over past sync cycles">
              <div className="h-64 w-full text-[10px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.map(h => ({ name: new Date(h.metric_date).toLocaleDateString(), score: parseFloat(h.score) })).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="score" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 8. EXECUTIVE WAR ROOM
// ═════════════════════════════════════════════════════════════════
export const ExecutiveWarRoomPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchWarRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/warroom`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const res = await fetch(`${API_BASE}/warroom/resolve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ alertId })
      }).then(r => r.json());
      if (res.success) {
        fetchWarRoom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    fetchWarRoom();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Flame className="h-6 w-6 text-brand-primary animate-pulse" /> Executive War Room
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black ${
            data?.status === 'Red' ? 'bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse' :
            data?.status === 'Yellow' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            Status: {data?.status || 'Green'}
          </span>
        </h2>
        <p className="text-xs text-gray-400">Strategic board panel for real-time risk assessment monitoring and active threat isolation</p>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Critical Alerts */}
          <div className="lg:col-span-6 space-y-6">
            <PremiumCard title="Critical System Flags" subtitle="Pending board alerts requiring manual acknowledgment">
              <div className="space-y-3">
                {data?.alerts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                    <span>No critical threat indicators registered. System stable.</span>
                  </div>
                ) : (
                  data?.alerts.map((a: any) => (
                    <div key={a.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-white text-sm block">{a.alert_title}</span>
                          <span className="text-gray-300 leading-normal block mt-1">{a.alert_message}</span>
                        </div>
                      </div>
                      <PremiumButton
                        onClick={() => handleResolveAlert(a.id)}
                        disabled={resolvingId === a.id}
                        className="w-full text-[10px] py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-400 flex justify-center items-center gap-1.5"
                      >
                        {resolvingId === a.id ? 'Acknowledging...' : 'Acknowledge & Mitigate'}
                      </PremiumButton>
                    </div>
                  ))
                )}
              </div>
            </PremiumCard>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Resilience Score */}
            <PremiumCard title="Composite Readiness Score" subtitle="Aggregated organizational risk level metrics">
              <div className="flex justify-between items-center p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Enterprise Resilience Score</span>
                  <span className="text-4xl font-black text-brand-primary block mt-1.5">
                    {data?.resilience?.enterprise_score || 90.00}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Active Threats Count</span>
                  <span className={`text-2xl font-black block mt-1 text-center ${data?.alerts.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {data?.alerts.length || 0}
                  </span>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard title="Proposed Advisory Steps" subtitle="Active advice generated by AI Council sessions">
              <div className="space-y-3 text-xs">
                {data?.strategySummary?.recommendations.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="p-3.5 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 font-mono">Source: {r.source}</span>
                      <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                    </div>
                    <span className="text-gray-300 block leading-normal">{r.recommendation}</span>
                  </div>
                ))}
              </div>
            </PremiumCard>
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 9. COGNITIVE AI COUNCIL CENTER
// ═════════════════════════════════════════════════════════════════
export const AICouncilPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/council`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setSessions(res.sessions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setSession(null);

    try {
      const res = await fetch(`${API_BASE}/council`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ topic })
      }).then(r => r.json());

      if (res.success) {
        setSession(res.session);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-brand-primary" /> Cognitive AI Council
        </h2>
        <p className="text-xs text-gray-400">Launch multi-agent collaborative debates where specialized advisors reconcile risks and strategies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <PremiumCard title="Convene AI Council Session" subtitle="Submit a compliance, workforce, or risk dilemma for debate">
            <form onSubmit={handleStartSession} className="space-y-4 text-xs">
              <PremiumInput
                label="Debate Topic / Dilemma"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Impact of replacing Cloudflare node with domestic storage"
                required
              />

              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Active Advisor Board</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono">
                  <div>• Compliance Advisor</div>
                  <div>• Risk Advisor</div>
                  <div>• Audit Advisor</div>
                  <div>• Strategy Advisor</div>
                </div>
              </div>

              <PremiumButton type="submit" disabled={loading} className="w-full py-2.5 flex justify-center items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-white" /> Convene Council Session
              </PremiumButton>
            </form>
          </PremiumCard>

          <PremiumCard title="Previous Council Sessions" subtitle="Audit logs of past internal debates">
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {sessions.map(s => (
                <div key={s.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:border-brand-primary/10">
                  <span className="font-bold text-white block truncate">{s.topic}</span>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1">
                    <span>Session: {new Date(s.created_at).toLocaleDateString()}</span>
                    <span>{s.recommendations?.length || 0} Recommendations</span>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>

        <div className="lg:col-span-7">
          <PremiumCard title="Advisory Debate Transcript" subtitle="Live stream of advisor debates and unified guidance summaries">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" /> Initializing debate models...
              </div>
            ) : session ? (
              <div className="space-y-5 text-xs">
                <div className="space-y-3 bg-black/25 p-4 rounded-2xl border border-white/5 max-h-[280px] overflow-y-auto">
                  {session.debateLog.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-light font-mono text-[10px]">{log.agent}</span>
                        <span className="text-[9px] text-gray-500 font-mono">Panelist</span>
                      </div>
                      <span className="text-gray-300 leading-normal block">{log.statement}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Unified Executive Guidance</span>
                  <div className="space-y-2.5">
                    {session.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-white text-xs">✔️ {rec.agent_name} recommendation</span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Confidence: {rec.confidence}%
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-40 text-center text-gray-500 text-xs">
                Submit a topic on the left to activate the advisors board debate simulator.
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 10. ENTERPRISE STRATEGY CENTER
// ═════════════════════════════════════════════════════════════════
export const EnterpriseStrategyPage: React.FC = () => {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stratType, setStratType] = useState('Compliance Strategy');

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/strategy`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setStrategies(res.strategies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/strategy`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ strategyType: stratType })
      }).then(r => r.json());
      if (res.success) {
        fetchStrategy();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand-primary" /> Enterprise Strategy Center
          </h2>
          <p className="text-xs text-gray-400">Generate, view, and trace corporate compliance, audit, and AI governance roadmaps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <PremiumCard title="Generate Roadmap Plan" subtitle="Synthesize new multi-quarter milestone sequences">
            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Strategy Category</label>
                <select
                  value={stratType}
                  onChange={e => setStratType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-primary"
                >
                  <option value="Compliance Strategy">Compliance Strategy</option>
                  <option value="Audit Strategy">Audit Strategy</option>
                  <option value="AI Governance Strategy">AI Governance Strategy</option>
                </select>
              </div>

              <PremiumButton type="submit" disabled={generating} className="w-full py-2.5">
                {generating ? 'Compiling Milestones...' : 'Generate Strategic Plan'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>

        <div className="lg:col-span-8">
          <PremiumCard title="Strategic Plan Roadmaps" subtitle="Live milestones tracking and target dates">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                {strategies.map(strat => (
                  <div key={strat.id} className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-4 text-xs">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div>
                        <span className="font-extrabold text-white text-sm block">{strat.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono">Category: {strat.strategy_type}</span>
                      </div>
                      <span className="text-[9px] font-mono text-brand-primary font-bold bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded">
                        Active Plan
                      </span>
                    </div>

                    {strat.roadmap_data && (
                      <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-2">
                        <p className="text-gray-300 leading-normal"><strong className="text-white">Vision:</strong> {strat.roadmap_data.vision}</p>
                        <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-gray-400">
                          <div><strong className="text-white block">Q1 Focus:</strong> {strat.roadmap_data.quarterlyGoal}</div>
                          <div><strong className="text-white block">Annual Goal:</strong> {strat.roadmap_data.annualGoal}</div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3.5 pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Milestones Sequence</span>
                      <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4">
                        {strat.milestones?.map((m: any, idx: number) => (
                          <div key={m.id} className="relative">
                            <span className="absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full bg-slate-950 border border-brand-primary flex items-center justify-center text-[8px] text-brand-primary font-black">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{m.title}</span>
                              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-0.5">
                                <span>Target: {new Date(m.target_date).toLocaleDateString()}</span>
                                <span className="text-emerald-400 font-bold">{m.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};
