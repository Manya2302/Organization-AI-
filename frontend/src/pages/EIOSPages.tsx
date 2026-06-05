import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, History, TrendingUp, Briefcase, Globe, Building, 
  Users, Brain, Activity, ShieldAlert, ChevronRight, Lock
} from 'lucide-react';
import { 
  PremiumButton, PremiumCard, SkeletonLoader, PremiumInput 
} from '../design-system/components';

const API_BASE = 'http://localhost:5000/api/v1/intelligence';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ═════════════════════════════════════════════════════════════════
// 1. ENTERPRISE INTELLIGENCE CENTER (CENTRAL COCKPIT)
// ═════════════════════════════════════════════════════════════════
export const EnterpriseIntelligenceCenterPage: React.FC = () => {
  const [queryText, setQueryText] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleBrainQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setSearching(true);
    setAnswer(null);

    // Simulated local Ollama response for EIOS natural queries
    setTimeout(() => {
      let mockAnswer = "Based on current graph analysis: ";
      const q = queryText.toLowerCase();
      if (q.includes('critical employee') || q.includes('expert')) {
        mockAnswer += "Priya Patel (Lead Legal Counsel) is identified as the most critical node due to 4 high-strength dependencies on DPDP compliance documents and project approvals.";
      } else if (q.includes('vendor') || q.includes('risk')) {
        mockAnswer += "AWS Cloud Hosting shows a risk index of 12.5%, but the secondary vendor Cloudflare Firewall requires review due to a bypass policy exposure.";
      } else if (q.includes('fail') || q.includes('project')) {
        mockAnswer += "Project Vault Secure Storage has a 94% completion probability, but GDPR Compliance Upgrade has been flagged with medium risk due to missing consent tracking dependencies.";
      } else if (q.includes('department') || q.includes('gap')) {
        mockAnswer += "The Legal Department shows a 15% knowledge gap rating because of incomplete documentation mapping for the new IT guidelines.";
      } else {
        mockAnswer += "SecureVault AI EIOS has mapped this query across 7 entity nodes and 12 relation paths. No immediate compliance risk detected.";
      }
      setAnswer(mockAnswer);
      setSearching(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand" /> Enterprise Intelligence OS (EIOS)
          </h2>
          <p className="text-xs text-gray-400">The centralized organizational brain connecting people, projects, compliance, and systems</p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="secondary" onClick={() => navigate('/dashboard/digital-twin')} className="text-xs px-3.5 py-1.5 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-brand" /> View Digital Twin
          </PremiumButton>
          <PremiumButton variant="primary" onClick={() => navigate('/dashboard/relationship-graph')} className="text-xs px-3.5 py-1.5 flex items-center gap-1">
            <Network className="h-3.5 w-3.5" /> Dependency Graph
          </PremiumButton>
        </div>
      </div>

      {/* Main Brain Input */}
      <PremiumCard title="Query the Organizational Brain" subtitle="Ask natural language questions to analyze risks, dependencies, and workforce intelligence in real-time">
        <form onSubmit={handleBrainQuery} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="e.g. Who is our most critical employee? OR Which vendor creates the highest risk?"
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all duration-300"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-[9px] uppercase tracking-widest pointer-events-none">EIOS AI</span>
            </div>
            <PremiumButton type="submit" disabled={searching} className="px-6 rounded-2xl flex items-center gap-1.5">
              {searching ? 'Analyzing Graph...' : 'Query'} <Brain className="h-3.5 w-3.5" />
            </PremiumButton>
          </div>

          {answer && (
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl animate-fade-in">
              <span className="text-[9px] font-bold text-brand uppercase tracking-wider block mb-1">EIOS Insights Engine</span>
              <p className="text-xs text-gray-300 leading-relaxed">{answer}</p>
            </div>
          )}
        </form>
      </PremiumCard>

      {/* EIOS Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard title="Knowledge Fabric" subtitle="Unified knowledge connection layer">
          <div className="space-y-3 py-2 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Total Domains Mapped</span>
              <span className="font-bold text-white">4 Domains</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Knowledge Coverage</span>
              <span className="font-bold text-emerald-400">87.7%</span>
            </div>
            <PremiumButton variant="secondary" onClick={() => navigate('/dashboard/knowledge-fabric')} className="w-full text-xs py-1.5 mt-2">
              Explore Fabric
            </PremiumButton>
          </div>
        </PremiumCard>

        <PremiumCard title="Workforce & succession" subtitle="Expert maps & key-man risks">
          <div className="space-y-3 py-2 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Succession Readiness</span>
              <span className="font-bold text-amber-500">85.0%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Key-man Exposure Nodes</span>
              <span className="font-bold text-red-400">1 Critical</span>
            </div>
            <PremiumButton variant="secondary" onClick={() => navigate('/dashboard/workforce-intelligence')} className="w-full text-xs py-1.5 mt-2">
              View Workforce
            </PremiumButton>
          </div>
        </PremiumCard>

        <PremiumCard title="Predictive Risk" subtitle="Compliance & failure forecast">
          <div className="space-y-3 py-2 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Audit Fail Probability</span>
              <span className="font-bold text-emerald-400">12.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Knowledge Loss Risk</span>
              <span className="font-bold text-amber-500">38.0%</span>
            </div>
            <PremiumButton variant="secondary" onClick={() => navigate('/dashboard/enterprise-predictions')} className="w-full text-xs py-1.5 mt-2">
              Run Forecasts
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 2. EXECUTIVE INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const ExecutiveIntelligenceCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportTitle, setReportTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchExecData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/executive`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res.executiveReport);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecData();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    setGenerating(true);
    try {
      // Mock generate report API trigger
      setTimeout(() => {
        setGenerating(false);
        alert('Executive Strategic Report Generated & Encrypted successfully!');
        setReportTitle('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand" /> Executive Intelligence Center
        </h2>
        <p className="text-xs text-gray-400">Strategic board summaries, aggregate corporate exposures, and boardroom briefings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <PremiumCard title="Strategic Health Index" subtitle="Aggregated organizational risk level metrics">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Health Score</span>
                    <span className="text-xl font-black text-brand block mt-1">{data?.healthScore}%</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Active Audits</span>
                    <span className="text-xl font-black text-white block mt-1">{data?.activeAuditsCount}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Critical Gaps</span>
                    <span className="text-xl font-black text-amber-500 block mt-1">{data?.criticalGapsCount}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Overall Exposure</span>
                    <span className="text-xl font-black text-emerald-400 block mt-1">LOW</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Priority Board Insights</span>
                  <div className="space-y-2">
                    {data?.insights?.map((ins: any) => (
                      <div key={ins.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5">
                        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-white block">{ins.title}</span>
                          <span className="text-[10px] text-gray-400 leading-relaxed block mt-0.5">{ins.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-4">
          <PremiumCard title="Compile Briefing Report" subtitle="Generate encrypted organizational summary for board meetings">
            <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
              <PremiumInput
                label="Report Title / Agenda"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                required
                placeholder="e.g. Q3 Compliance Risk Executive Summary"
              />
              <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-2">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Security Credentials Enforced</span>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Lock className="h-3 w-3 text-brand" /> SHA-256 integrity hash
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Lock className="h-3 w-3 text-brand" /> Department isolation filter
                </div>
              </div>
              <PremiumButton type="submit" disabled={generating} className="w-full">
                {generating ? 'Compiling PDF Data...' : 'Generate & Export'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 3. DECISION INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const DecisionIntelligenceCenterPage: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Strategic');
  const [reasoning, setReasoning] = useState('');
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/decisions`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setDecisions(res.decisions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/decisions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, decisionType: type, reasoning, outcome })
      }).then(r => r.json());

      if (res.success) {
        setTitle('');
        setReasoning('');
        setOutcome('');
        fetchDecisions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-brand" /> Decision Intelligence Center
          </h2>
          <p className="text-xs text-gray-400">Capture organizational strategic decisions, trace rationale, and audit evidence dependencies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PremiumCard title="Decision History Registry" subtitle="Historical audit logs of key system, network, and operational adjustments">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4">
                {decisions.map(d => (
                  <div key={d.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">{d.title}</span>
                      <span className="text-[9px] bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded font-bold uppercase font-mono">
                        {d.decision_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <strong className="text-gray-300 block mb-0.5 font-bold">Reasoning / Rationale:</strong>
                      {d.reasoning}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5 mt-2">
                      <strong className="text-emerald-400 block mb-0.5 font-bold">Outcome & Impact:</strong>
                      {d.outcome}
                    </p>
                    <div className="flex justify-between items-center pt-2 text-[10px] text-gray-500 border-t border-white/5 font-mono">
                      <span>Owner: {d.owner_name || 'System Admin'}</span>
                      <span>Recorded: {new Date(d.decision_date || d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-4">
          <PremiumCard title="Record New Decision" subtitle="Log business changes to append to the organizational brain">
            <form onSubmit={handleSaveDecision} className="space-y-4 text-xs">
              <PremiumInput
                label="Decision Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="e.g. Upgrade AWS server nodes size"
              />
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Decision Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand"
                >
                  <option value="Strategic" className="bg-slate-950">Strategic</option>
                  <option value="Infrastructure" className="bg-slate-950">Infrastructure</option>
                  <option value="Compliance" className="bg-slate-950">Compliance</option>
                  <option value="Security" className="bg-slate-950">Security</option>
                </select>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reasoning / Rationale</label>
                <textarea
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand"
                  placeholder="Explain why this decision was made..."
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Outcome & Impact Summary</label>
                <textarea
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand"
                  placeholder="What was the actual consequence/metrics impact?"
                />
              </div>
              <PremiumButton type="submit" disabled={saving} className="w-full">
                {saving ? 'Logging Decision...' : 'Log Decision'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 4. WORKFORCE INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const WorkforceIntelligenceCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkforce = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workforce`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res.workforce);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkforce();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-brand" /> Workforce Intelligence Center
        </h2>
        <p className="text-xs text-gray-400">Map expertise distribution, succession readiness, and key-man dependencies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <PremiumCard title="Subject Matter Experts" subtitle="Registered internal contributors mapped by domain expertise">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-3">
                {data?.experts?.map((exp: any) => (
                  <div key={exp.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{exp.employee_name}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{exp.domain}</span>
                    </div>
                    <span className="font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded uppercase font-bold">
                      {exp.expertise_level} ({exp.score}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <PremiumCard title="Succession & Knowledge Risk" subtitle="Key-man exposure parameters">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Key-man Risk Index</span>
                    <span className="text-2xl font-black text-red-400 block mt-1">{data?.metrics?.knowledgeLossRisk}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Succession Readiness</span>
                    <span className="text-2xl font-black text-amber-500 block mt-1">{data?.metrics?.successionReadiness}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employee Risk Profiles</span>
                  {data?.risks?.map((risk: any) => (
                    <div key={risk.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{risk.employee_name}</span>
                        <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          {risk.key_man_risk} RISK
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>Succession Plan Active: {risk.succession_plan_active ? 'Yes' : 'No'}</span>
                        <span>Knowledge Gap: {risk.knowledge_gap_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 5. VENDOR INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const VendorIntelligenceCenterPage: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendors`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setVendors(res.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Building className="h-5 w-5 text-brand" /> Vendor Intelligence Center
        </h2>
        <p className="text-xs text-gray-400">Track third-party compliance, contract lifecycles, and risk exposure thresholds</p>
      </div>

      <PremiumCard title="Registered Third-party Vendors" subtitle="Live tracking of vendor security postures and compliance scores">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vendors.map(v => (
              <div key={v.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-white text-sm block">{v.vendor_name}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{v.service_provided}</span>
                  </div>
                  <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center">
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase block font-bold">Risk Score</span>
                    <span className="text-xs font-black text-brand block mt-0.5">{v.risk_score}%</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase block font-bold">Health Score</span>
                    <span className="text-xs font-black text-emerald-400 block mt-0.5">{v.health_score}%</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase block font-bold">Compliance</span>
                    <span className="text-xs font-black text-white block mt-0.5">{v.compliance_score}%</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 flex justify-between font-mono">
                  <span>Contact: {v.contact_email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 6. PROJECT INTELLIGENCE CENTER
// ═════════════════════════════════════════════════════════════════
export const ProjectIntelligenceCenterPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setProjects(res.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand" /> Project Intelligence Center
        </h2>
        <p className="text-xs text-gray-400">Evaluate project milestones, delivery probability, and control readiness indices</p>
      </div>

      <PremiumCard title="Enterprise Project Forecast Registry" subtitle="Predictive delays and risk score values for active milestones">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{p.project_name}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{p.description || 'No description'}</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Milestone Status</span>
                  <span className="font-mono text-xs text-emerald-400 font-bold block mt-0.5">{p.status}</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Completion Prob</span>
                  <span className="font-mono text-xs text-brand font-bold block mt-0.5">{p.completion_probability}%</span>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Readiness Score</span>
                  <span className="font-mono text-xs text-white font-bold block mt-0.5">{p.readiness_score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 7. KNOWLEDGE FABRIC EXPLORER
// ═════════════════════════════════════════════════════════════════
export const KnowledgeFabricExplorerPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFabric = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fabric`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabric();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand" /> Knowledge Fabric Explorer
        </h2>
        <p className="text-xs text-gray-400">Map knowledge freshness, duplication, and coverage gaps across compliance domains</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PremiumCard title="Mapped Knowledge Domains" subtitle="Detailed audit indices of internal documentation completeness">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4">
                {data?.domains?.map((dom: any) => (
                  <div key={dom.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{dom.domain}</span>
                      <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">
                        {dom.knowledge_gap_severity} Gap
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                      {dom.details}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-bold">Coverage</span>
                        <span className="font-mono text-xs text-brand font-bold block mt-0.5">{dom.coverage_score}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-bold">Freshness</span>
                        <span className="font-mono text-xs text-emerald-400 font-bold block mt-0.5">{dom.freshness_score}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-bold">Redundancy</span>
                        <span className="font-mono text-xs text-white block mt-0.5">{dom.redundancy_score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-4">
          <PremiumCard title="Cross-domain Dependencies" subtitle="Lineage paths connecting knowledge boundaries">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between text-gray-300 font-bold">
                    <span>DPDP Privacy Act</span>
                    <ChevronRight className="h-4 w-4 text-brand" />
                    <span>Legal Audits</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block">Criticality: HIGH</span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between text-gray-300 font-bold">
                    <span>GAAP accounting</span>
                    <ChevronRight className="h-4 w-4 text-brand" />
                    <span>Finance Auditing</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block">Criticality: MEDIUM</span>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 8. DIGITAL TWIN EXPLORER
// ═════════════════════════════════════════════════════════════════
export const DigitalTwinExplorerPage: React.FC = () => {
  const [twin, setTwin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTwin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/digital-twin`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setTwin(res.digitalTwin);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand" /> Digital Twin Explorer
        </h2>
        <p className="text-xs text-gray-400">Virtual structural model representing corporate organizational departments, projects, and active systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PremiumCard title="Virtual Node Visualization" subtitle="Simulated structural layout of verified entity associations">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="relative h-96 bg-slate-950 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Simulated organigraph network map */}
                <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none" />
                <div className="space-y-6 text-center z-10">
                  <div className="inline-flex p-3 bg-brand/10 border border-brand/20 rounded-full animate-pulse">
                    <Brain className="h-8 w-8 text-brand" />
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <span className="font-bold text-white block">EIOS Active Simulator Engine</span>
                    <span>Monitoring {twin?.graphSnapshot?.nodes?.length} nodes & {twin?.graphSnapshot?.links?.length} dependency links</span>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
                    {twin?.graphSnapshot?.nodes?.map((node: any) => (
                      <span key={node.id} className="font-mono text-[9px] text-gray-300 bg-slate-900 border border-white/5 px-2.5 py-1 rounded-xl">
                        {node.type}: {node.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-4">
          <PremiumCard title="Twin Metrics Summary" subtitle="Telemetry summary of virtual parameters">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-3 py-1 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Active Departments</span>
                  <span className="font-bold text-white">{twin?.metricsSummary?.departmentsCount}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Tracked Projects</span>
                  <span className="font-bold text-white">{twin?.metricsSummary?.activeProjects}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Registered Experts</span>
                  <span className="font-bold text-white">{twin?.metricsSummary?.expertCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vendor Risk Index</span>
                  <span className="font-bold text-brand">{twin?.metricsSummary?.vendorRiskIndex}%</span>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 9. ENTERPRISE PREDICTION CENTER
// ═════════════════════════════════════════════════════════════════
export const EnterprisePredictionCenterPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predictions`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setForecasts(res.forecasts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" /> Enterprise Prediction Center
        </h2>
        <p className="text-xs text-gray-400">Evaluate corporate audit risk projections, compliance delays, and knowledge leaks</p>
      </div>

      <PremiumCard title="Organizational Risk Projections" subtitle="Predicted vulnerability parameters computed by the EIOS forecasting network">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forecasts.map(f => (
              <div key={f.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-white text-sm">{f.target_type}</span>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 font-bold">
                    Timeframe: {f.timeframe}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-900 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Failure Prob</span>
                    <span className="text-xl font-black text-brand block mt-0.5">{f.probability}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Estimated Impact</span>
                    <span className="text-xl font-black text-red-400 block mt-0.5">{f.impact_score}/100</span>
                  </div>
                </div>

                {f.factors && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Decisive Failure Factors</span>
                    <div className="space-y-1 pl-2 border-l border-brand/20">
                      {f.factors.map((fact: string, idx: number) => (
                        <span key={idx} className="text-[10px] text-gray-400 block">• {fact}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 10. RELATIONSHIP GRAPH EXPLORER
// ═════════════════════════════════════════════════════════════════
export const RelationshipGraphExplorerPage: React.FC = () => {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/relationships`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setRelationships(res.relationships);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Network className="h-5 w-5 text-brand" /> Relationship Graph Explorer
        </h2>
        <p className="text-xs text-gray-400">Inspect cross-department, vendor, and compliance boundary dependencies</p>
      </div>

      <PremiumCard title="Enterprise Dependency Connections" subtitle="Dynamic list of source-to-target entity relationship pathways">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-3">
            {relationships.map(rel => (
              <div key={rel.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{rel.source_name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({rel.source_type})</span>
                </div>
                
                <div className="flex flex-col items-center shrink-0 px-4">
                  <span className="text-[9px] font-mono text-brand font-bold uppercase bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                    {rel.relationship_type}
                  </span>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent my-1" />
                  <span className="text-[8px] text-gray-500 font-mono">strength: {rel.strength}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">({rel.target_type})</span>
                  <span className="font-bold text-white">{rel.target_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};
