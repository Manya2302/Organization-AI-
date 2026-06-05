import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, RefreshCw, Layers, Send, PlusCircle, ArrowRight, Sparkles,
  ShieldCheck, FileText, AlertTriangle, Package, BarChart3, Bot,
  Download, Share2, Clock, CheckCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { 
  PremiumButton, PremiumCard, SkeletonLoader 
} from '../design-system/components';

const API_BASE = 'http://localhost:5000/api/v1';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ─────────────────────────────────────────────────────────────────
// 1. AUDIT COPILOT CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const AuditCopilotCenterPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Chat state
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your Audit Copilot. Select an active audit plan to review scope, controls, evidence, and risk mappings.', timestamp: new Date().toISOString() }
  ]);
  const [queryInput, setQueryInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/plans`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0].id);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit plans:', err);
    }
  };

  const fetchPlanDetails = async (id: string) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/plan/${id}`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setPlanDetails(data.plan);
      }
    } catch (err) {
      console.error('Failed to fetch plan details:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlanDetails(selectedPlanId);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleRunAnalysis = async () => {
    if (!selectedPlanId) return;
    setAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await response.json();
      if (data.success) {
        alert('AI Pre-Audit Analysis Completed successfully!');
        fetchPlanDetails(selectedPlanId);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const userMessage = { role: 'user', content: queryInput, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = queryInput;
    setQueryInput('');

    try {
      const response = await fetch(`${API_BASE}/audit/copilot/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: currentInput, planId: selectedPlanId })
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setChatHistory(prev => [...prev, data.reply]);
      }
    } catch (err) {
      console.error('AI chat failed:', err);
    }
  };

  const handleChipClick = (q: string) => {
    setQueryInput(q);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand/15 via-brand-accent/5 to-transparent border border-white/5 shadow-xl shadow-black/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand">Phase 5 Active</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Audit Copilot Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2 font-display">
            Audit Copilot <span className="text-brand-accent">Center</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Intelligent pre-audit planning, scoping, missing evidence tracking, and risk engines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PremiumButton onClick={() => navigate('/dashboard/audit-planner')}>
            <PlusCircle className="inline-block h-3.5 w-3.5 mr-1" /> Create Audit Plan
          </PremiumButton>
          {selectedPlanId && (
            <PremiumButton 
              variant="secondary" 
              onClick={handleRunAnalysis}
              disabled={analyzing}
            >
              <RefreshCw className={`inline-block h-3.5 w-3.5 mr-1 ${analyzing ? 'animate-spin' : ''}`} /> 
              {analyzing ? 'Running AI Engine...' : 'Run Pre-Audit Analysis'}
            </PremiumButton>
          )}
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl">
          <Layers className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white uppercase">No Active Audit Plans</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Get started by initializing a framework pre-audit plan.
          </p>
          <PremiumButton className="mt-4" onClick={() => navigate('/dashboard/audit-planner')}>
            Build Audit Plan
          </PremiumButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Plan Selector & Quick Metrics */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Selected Active Audit Plan</span>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>
                  ))}
                </select>
              </div>

              {planDetails && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Composite Readiness</span>
                    <span className="text-xl font-extrabold text-brand-light block mt-1">{planDetails.readiness_score}%</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Audit Scope</span>
                    <span className="text-xs font-semibold text-white block mt-1.5 truncate">{planDetails.scope || 'Organization'}</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Open Pre-Audit Risks</span>
                    <span className="text-xl font-extrabold text-danger block mt-1">
                      {planDetails.risks?.filter((r: any) => r.status === 'Open').length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Assigned Tasks</span>
                    <span className="text-xl font-extrabold text-warning block mt-1">
                      {planDetails.tasks?.filter((t: any) => t.status === 'Pending').length || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Scope Builder and Visualizations */}
            {planDetails && (
              <PremiumCard title="Audit Scope Mapping Explorer" subtitle="Displays active boundary configurations, affected controls, and evidence mappings">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Scope Boundary</h4>
                      <div className="flex items-center justify-between text-xs text-white">
                        <span>Boundary Level:</span>
                        <span className="badge-brand">{planDetails.scope}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white mt-2">
                        <span>Department/Boundary Value:</span>
                        <span className="text-gray-300 font-bold">{planDetails.department || 'All'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Affected Assets Overview</h4>
                      <div className="space-y-1.5 text-xs text-gray-300">
                        <div className="flex justify-between">
                          <span>Framework Controls:</span>
                          <span className="font-semibold text-white">{planDetails.controls?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Evidence Checklists:</span>
                          <span className="font-semibold text-white">{planDetails.checklists?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mapped Files:</span>
                          <span className="font-semibold text-white">
                            {planDetails.evidence?.filter((e: any) => e.matching_document_id !== null).length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-left">Readiness Breakdown</h4>
                    <div className="flex justify-center py-2">
                      <div className="relative h-28 w-28 flex items-center justify-center">
                        <span className="text-2xl font-black text-brand-light">{planDetails.readiness_score}%</span>
                        {/* Fake radial chart */}
                        <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-brand animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 text-center">
                      Pre-audit planning state: <strong className="text-emerald-400">Stable</strong>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            )}

            {/* Checklist items */}
            {planDetails && (
              <PremiumCard 
                title="Active Framework Checklist Status" 
                subtitle="Verification checkpoints required to support controls mapped dynamically"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400">
                        <th className="py-2.5">Control Code</th>
                        <th className="py-2.5">Requirement</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {planDetails.checklists?.map((chk: any) => (
                        <tr key={chk.id} className="text-gray-300">
                          <td className="py-2.5 font-mono text-brand-light font-bold">{chk.control_code}</td>
                          <td className="py-2.5 max-w-xs truncate">{chk.requirement}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              chk.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400' :
                              chk.status === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {chk.status}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <select
                              value={chk.status}
                              onChange={async (e) => {
                                try {
                                  await fetch(`${API_BASE}/audit/copilot/checklist/verify`, {
                                    method: 'POST',
                                    headers: getHeaders(),
                                    body: JSON.stringify({
                                      planId: selectedPlanId,
                                      checklistId: chk.id,
                                      status: e.target.value,
                                      comments: 'Auditor review checkpoint update'
                                    })
                                  });
                                  fetchPlanDetails(selectedPlanId);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="bg-slate-900 border border-white/10 text-[10px] text-white rounded px-1 py-0.5 focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PremiumCard>
            )}
          </div>

          {/* Sidebar Chat & Assistant */}
          <div className="lg:col-span-4 space-y-6 text-left">
            {/* Audit Assistant Panel */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-4 flex flex-col h-[520px]">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
                <Brain className="h-5 w-5 text-brand-accent" />
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Audit Assistant</h3>
                  <span className="text-[9px] text-emerald-400 font-mono">Qwen3 8B • Connected</span>
                </div>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl leading-relaxed ${
                      msg.role === 'assistant' 
                        ? 'bg-white/5 border border-white/5 text-gray-200' 
                        : 'bg-brand/10 border border-brand/20 text-brand-light text-right'
                    }`}
                  >
                    <span className="text-[8px] text-gray-500 font-bold uppercase block mb-1">
                      {msg.role === 'assistant' ? 'Copilot AI' : 'User'}
                    </span>
                    <p className="whitespace-pre-line text-left">{msg.content}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              <div className="space-y-2 mb-3">
                <span className="text-[9px] text-gray-500 uppercase font-bold block">Ask Copilot:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Are we ready for audit?',
                    'What evidence is missing?',
                    'Show audit risks'
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => handleChipClick(q)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[9px] font-bold cursor-pointer transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleQuerySubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  className="p-2 bg-brand hover:bg-brand-hover text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 2. AUDIT PLANNER PAGE
// ─────────────────────────────────────────────────────────────────
export const AuditPlannerPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: 'Q3 Security and Compliance Review',
    framework: 'ISO27001',
    auditType: 'Internal',
    scope: 'Organization',
    department: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/plan`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        alert('Audit preparation plan generated successfully!');
        navigate('/dashboard/audit-copilot');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
          Intelligent Audit Planner
        </h2>
      </div>

      <PremiumCard 
        title="Generate Pre-Audit Preparation Plan" 
        subtitle="AI will scan the framework rules and auto-create checklists and evidence recommenders"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Plan Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Framework</label>
              <select
                value={formData.framework}
                onChange={(e) => setFormData({...formData, framework: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none"
              >
                <option value="ISO27001">ISO 27001 (ISMS)</option>
                <option value="SOC2">SOC 2 Type II</option>
                <option value="DPDP">DPDP Act (India)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Audit Type</label>
              <select
                value={formData.auditType}
                onChange={(e) => setFormData({...formData, auditType: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none"
              >
                <option value="Internal">Internal Audit</option>
                <option value="Vendor">Vendor Assessment</option>
                <option value="External">External Certification</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Scope Level</label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData({...formData, scope: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none"
              >
                <option value="Organization">Organization-Wide</option>
                <option value="Department">Department Specific</option>
                <option value="Project">Project/Product Boundary</option>
                <option value="Vendor">Vendor Scope</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Department / Boundary</label>
              <input
                type="text"
                placeholder="e.g. Legal, Finance, HR"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* AI Preview Section */}
          <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-secondary uppercase">
              <Brain className="h-3.5 w-3.5" /> AI Scope Planner preview
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              Selecting **{formData.framework}** will generate required controls and check evidence mapping dynamically. An initial checklist mapping will run against all workspace files.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <PremiumButton variant="secondary" type="button" onClick={() => navigate('/dashboard/audit-copilot')}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" disabled={submitting}>
              {submitting ? 'Generating Plan...' : 'Generate Plan'} <ArrowRight className="inline-block h-3.5 w-3.5 ml-1" />
            </PremiumButton>
          </div>
        </form>
      </PremiumCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 3. AUDIT RISK CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const AuditRiskCenterPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/plans`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRisks = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/risks?planId=${id}`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setRisks(data.risks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchRisks(selectedPlanId);
    }
  }, [selectedPlanId]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
            Pre-Audit Risk Center
          </h2>
          <p className="text-xs text-gray-400">Identify and remediate missing controls, ownership, and evidence gaps</p>
        </div>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
        >
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Grid */}
        <div className="md:col-span-3">
          <PremiumCard title="Detected Framework Risks & Remediation Plan">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : risks.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">No active risks detected for this audit plan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400">
                      <th className="py-2.5">Severity</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Title</th>
                      <th className="py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {risks.map(r => (
                      <tr key={r.id} className="text-gray-300">
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            r.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            r.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                          }`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold">{r.risk_type}</td>
                        <td className="py-2.5 text-white font-semibold">{r.title}</td>
                        <td className="py-2.5 max-w-sm">{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PremiumCard>
        </div>

        {/* Heatmap Widget */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-left space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase">Pre-Audit Risk Heatmap</h4>
            <div className="grid grid-cols-2 gap-2 text-center font-bold">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <span className="block text-lg">
                  {risks.filter(r => r.severity === 'CRITICAL').length}
                </span>
                <span className="text-[8px] uppercase">Critical</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <span className="block text-lg">
                  {risks.filter(r => r.severity === 'HIGH').length}
                </span>
                <span className="text-[8px] uppercase">High</span>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                <span className="block text-lg">
                  {risks.filter(r => r.severity === 'MEDIUM').length}
                </span>
                <span className="text-[8px] uppercase">Medium</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <span className="block text-lg">
                  {risks.filter(r => r.severity === 'LOW').length}
                </span>
                <span className="text-[8px] uppercase">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 4. EVIDENCE READINESS CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const EvidenceReadinessCenterPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [scores, setScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selector mappings
  const documents = useAppStore(state => state.documents) || [];
  const [mappingId, setMappingId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/plans`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanId(data.plans[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvidence = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/evidence?planId=${id}`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setScores(data.scores);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchEvidence(selectedPlanId);
    }
  }, [selectedPlanId]);

  const handleMapDocument = async (recommendationId: string) => {
    if (!selectedDocId) return;
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/evidence/map`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          planId: selectedPlanId,
          recommendationId,
          documentId: selectedDocId
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Document mapped to evidence requirement successfully!');
        setMappingId(null);
        setSelectedDocId('');
        fetchEvidence(selectedPlanId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
            Evidence Readiness Center
          </h2>
          <p className="text-xs text-gray-400">Discover evidence suggestions, match percentages and linkage controls</p>
        </div>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
        >
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>
          ))}
        </select>
      </div>

      {scores && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Evidence Completeness Score</span>
            <span className="text-2xl font-black text-emerald-400 block mt-1">{scores.completenessScore}%</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Confidence / Quality Score</span>
            <span className="text-2xl font-black text-cyan-400 block mt-1">{scores.qualityScore}%</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Discovery Coverage Meter</span>
            <span className="text-2xl font-black text-brand-light block mt-1">{scores.readinessScore}%</span>
          </div>
        </div>
      )}

      <PremiumCard title="Audit Evidence Checklist Mappings">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : recommendations.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-xs">No evidence templates found for this framework.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="py-2.5">Control</th>
                  <th className="py-2.5">Recommended Evidence Name</th>
                  <th className="py-2.5">Matched Document</th>
                  <th className="py-2.5">Match Confidence</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recommendations.map(rec => (
                  <tr key={rec.id} className="text-gray-300">
                    <td className="py-2.5 font-mono text-brand-light font-semibold">{rec.control_code}</td>
                    <td className="py-2.5 text-white font-bold">{rec.recommended_evidence_name}</td>
                    <td className="py-2.5 text-gray-400 italic">
                      {rec.matching_document_name || 'No mapped file'}
                    </td>
                    <td className="py-2.5">
                      <span className="font-bold">{rec.match_confidence}%</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'Mapped' ? 'bg-emerald-500/10 text-emerald-400' :
                        rec.status === 'Recommended' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {mappingId === rec.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={selectedDocId}
                            onChange={(e) => setSelectedDocId(e.target.value)}
                            className="bg-slate-900 border border-white/10 text-[10px] text-white rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="">Select Document...</option>
                            {documents.map(doc => (
                              <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleMapDocument(rec.id)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setMappingId(null)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[10px] rounded transition-all cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMappingId(rec.id)}
                          className="px-3 py-1 bg-brand hover:bg-brand-hover text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                        >
                          Link Document
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 5. AI AUDITOR WORKSPACE PAGE
// ─────────────────────────────────────────────────────────────────
export const AIAuditorWorkspacePage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [cycle, setCycle] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<any[]>([
    { role: 'assistant', content: 'Select an audit plan and ask me to generate a package, find missing evidence, predict audit failures, run a mock audit, or create an executive report.' }
  ]);

  const fetchPlans = async () => {
    const response = await fetch(`${API_BASE}/audit/copilot/plans`, { headers: getHeaders() });
    const data = await response.json();
    if (data.success) {
      setPlans(data.plans);
      if (data.plans[0]) setSelectedPlanId(data.plans[0].id);
    }
  };

  const fetchPackages = async (planId: string) => {
    if (!planId) return;
    const response = await fetch(`${API_BASE}/audit/copilot/packages?planId=${planId}`, { headers: getHeaders() });
    const data = await response.json();
    if (data.success) setPackages(data.packages);
  };

  useEffect(() => { fetchPlans(); }, []);
  useEffect(() => { fetchPackages(selectedPlanId); }, [selectedPlanId]);

  const runAutonomousCycle = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/autonomous/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await response.json();
      if (data.success) {
        setCycle(data);
        await fetchPackages(selectedPlanId);
      }
    } finally {
      setLoading(false);
    }
  };

  const buildPackage = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/audit/copilot/packages/build`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId, packageType: 'Auditor' })
      });
      await fetchPackages(selectedPlanId);
    } finally {
      setLoading(false);
    }
  };

  const runFullWorkflow = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/orchestrator/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId, request: { source: 'AI Auditor Workspace' } })
      });
      const data = await response.json();
      if (data.success) {
        setCycle({
          analysis: { readiness: data.steps?.find((s: any) => s.name === 'Executive Report')?.summary || {} },
          findings: data.steps?.find((s: any) => s.name === 'Finding Generation')?.output || [],
          predictions: data.steps?.find((s: any) => s.name === 'Risk Forecast')?.output || [],
          evidence: data.steps?.find((s: any) => s.name === 'Evidence Collection')?.output || {}
        });
        setChat(prev => [...prev, {
          role: 'assistant',
          content: `Full audit workflow completed across ${data.completedSteps} steps. Auditor package and executive report are ready.`
        }]);
        await fetchPackages(selectedPlanId);
      }
    } finally {
      setLoading(false);
    }
  };

  const buildOneClickPackage = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/audit/copilot/packages/one-click`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await response.json();
      if (data.success) {
        setChat(prev => [...prev, {
          role: 'assistant',
          content: `One-click auditor package is ZIP-ready: ${data.zip?.filename || 'auditor-package.zip'}`
        }]);
        await fetchPackages(selectedPlanId);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = { role: 'user', content: message };
    setChat(prev => [...prev, userMessage]);
    const current = message;
    setMessage('');
    const response = await fetch(`${API_BASE}/audit/copilot/autonomous/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message: current, planId: selectedPlanId })
    });
    const data = await response.json();
    if (data.success) {
      setChat(prev => [...prev, data.reply]);
      await fetchPackages(selectedPlanId);
    }
  };

  const statCards = [
    { label: 'Readiness', value: `${cycle?.analysis?.readiness?.readinessScore ?? 0}%`, icon: ShieldCheck, tone: 'text-emerald-400' },
    { label: 'Evidence Trust', value: `${cycle?.evidence?.trust?.trustScore ?? 0}%`, icon: FileText, tone: 'text-cyan-400' },
    { label: 'Findings', value: cycle?.findings?.length ?? 0, icon: AlertTriangle, tone: 'text-amber-400' },
    { label: 'Predictions', value: cycle?.predictions?.length ?? 0, icon: BarChart3, tone: 'text-brand-light' }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand">Phase 5 Part 4</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Autonomous Audit Copilot</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display mt-2">AI Auditor Workspace</h2>
          <p className="text-xs text-gray-400">Natural language audit assistant, evidence package generation, risk prediction and remediation guidance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none">
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>)}
          </select>
          <PremiumButton onClick={runAutonomousCycle} disabled={loading}>
            <Bot className="inline-block h-3.5 w-3.5 mr-1" /> {loading ? 'Running...' : 'Run Cycle'}
          </PremiumButton>
          <PremiumButton variant="success" onClick={runFullWorkflow} disabled={loading}>
            <Sparkles className="inline-block h-3.5 w-3.5 mr-1" /> Full Workflow
          </PremiumButton>
          <PremiumButton variant="secondary" onClick={buildPackage} disabled={loading}>
            <Package className="inline-block h-3.5 w-3.5 mr-1" /> Build Package
          </PremiumButton>
          <PremiumButton variant="secondary" onClick={buildOneClickPackage} disabled={loading}>
            <Download className="inline-block h-3.5 w-3.5 mr-1" /> One-Click ZIP
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase font-bold">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </div>
              <span className={`text-2xl font-black block mt-2 ${card.tone}`}>{card.value}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PremiumCard title="Autonomous Audit Operations" subtitle="Generated findings, remediation guidance and auditor package history">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase">Latest Findings</h4>
                {(cycle?.findings || []).slice(0, 5).map((finding: any) => (
                  <div key={finding.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-bold text-white">{finding.title}</span>
                      <span className="text-[9px] text-amber-400 font-bold">{finding.severity}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{finding.recommendation}</p>
                  </div>
                ))}
                {!cycle?.findings?.length && <p className="text-xs text-gray-500">Run the autonomous cycle to generate findings.</p>}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase">Auditor Packages</h4>
                {packages.slice(0, 5).map(pkg => (
                  <div key={pkg.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-bold text-white">{pkg.name}</span>
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Integrity: {pkg.integrity_hash?.slice(0, 12) || 'pending'} • Evidence {pkg.total_evidence}</p>
                  </div>
                ))}
                {packages.length === 0 && <p className="text-xs text-gray-500">No generated packages for this plan yet.</p>}
              </div>
            </div>
          </PremiumCard>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4 h-[520px] flex flex-col">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
              <Brain className="h-5 w-5 text-brand-accent" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Audit Intelligence Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chat.map((item, index) => (
                <div key={index} className={`p-3 rounded-xl text-xs leading-relaxed ${item.role === 'assistant' ? 'bg-white/5 text-gray-200' : 'bg-brand/10 text-brand-light'}`}>
                  <span className="text-[8px] text-gray-500 uppercase font-bold block mb-1">{item.role === 'assistant' ? 'Copilot' : 'You'}</span>
                  {item.content}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 mt-3">
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask for package, findings, risks..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
              <button type="submit" className="p-2 bg-brand hover:bg-brand-hover text-white rounded-xl"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 6. EXECUTIVE AUDIT CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const ExecutiveAuditCenterPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const fetchPlans = async () => {
    const response = await fetch(`${API_BASE}/audit/copilot/plans`, { headers: getHeaders() });
    const data = await response.json();
    if (data.success) {
      setPlans(data.plans);
      if (data.plans[0]) setSelectedPlanId(data.plans[0].id);
    }
  };

  const fetchDashboard = async (planId: string) => {
    const suffix = planId ? `?planId=${planId}` : '';
    const response = await fetch(`${API_BASE}/audit/copilot/executive-dashboard${suffix}`, { headers: getHeaders() });
    const data = await response.json();
    if (data.success) setDashboard(data.dashboard);
  };

  useEffect(() => { fetchPlans(); }, []);
  useEffect(() => { fetchDashboard(selectedPlanId); }, [selectedPlanId]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      await fetch(`${API_BASE}/audit/copilot/executive-report`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planId: selectedPlanId, reportType: 'Executive Audit Summary' })
      });
      await fetchDashboard(selectedPlanId);
    } finally {
      setGenerating(false);
    }
  };

  const latest = dashboard?.latestReport;
  const widgets = [
    { label: 'Audit Readiness', value: `${latest?.readiness_score ?? 0}%`, icon: ShieldCheck, tone: 'text-emerald-400' },
    { label: 'Maturity', value: dashboard?.maturity?.maturity_level || 'Initial', icon: Sparkles, tone: 'text-violet-300' },
    { label: 'Risk Exposure', value: `${latest?.risk_exposure ?? 0}%`, icon: AlertTriangle, tone: 'text-amber-400' },
    { label: 'Evidence Coverage', value: `${latest?.evidence_coverage ?? 0}%`, icon: FileText, tone: 'text-cyan-400' },
    { label: 'Control Coverage', value: `${latest?.control_coverage ?? 0}%`, icon: CheckCircle, tone: 'text-brand-light' },
    { label: 'Open Findings', value: latest?.open_findings ?? 0, icon: BarChart3, tone: 'text-red-400' },
    { label: 'Audit Packages', value: dashboard?.generatedPackages ?? 0, icon: Package, tone: 'text-violet-300' }
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand">Executive Audit Center</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Board-ready reporting</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-display mt-2">Executive Audit Center</h2>
          <p className="text-xs text-gray-400">Audit health, exposure, coverage, findings and report generation for leadership review</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="bg-slate-900 border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none">
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>)}
          </select>
          <PremiumButton onClick={generateReport} disabled={generating}>
            <Share2 className="inline-block h-3.5 w-3.5 mr-1" /> {generating ? 'Generating...' : 'Generate Report'}
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {widgets.map(widget => {
          const Icon = widget.icon;
          return (
            <div key={widget.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase font-bold">{widget.label}</span>
                <Icon className={`h-4 w-4 ${widget.tone}`} />
              </div>
              <span className={`text-2xl font-black block mt-2 ${widget.tone}`}>{widget.value}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PremiumCard title="Latest Executive Report" subtitle="Generated board, compliance and risk summary payload">
            {latest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">{latest.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{latest.report_payload?.executiveSummary || 'Executive report generated successfully.'}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(latest.generated_at).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['PDF', 'Excel', 'PowerPoint'].map(format => (
                    <div key={format} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">{format} Export</span>
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">Generate an executive report to populate audit health metrics.</div>
            )}
          </PremiumCard>
        </div>
        <div className="lg:col-span-4">
          <PremiumCard title="Open Findings by Severity">
            <div className="space-y-3">
              {(dashboard?.openFindingsBySeverity || []).map((item: any) => (
                <div key={item.severity} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{item.severity}</span>
                  <span className="font-black text-white">{item.count}</span>
                </div>
              ))}
              {!dashboard?.openFindingsBySeverity?.length && <p className="text-xs text-gray-500">No open findings in the latest report context.</p>}
            </div>
          </PremiumCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PremiumCard title="Department Readiness Ranking">
          <div className="space-y-3">
            {(dashboard?.departmentReadinessRanking || []).slice(0, 6).map((item: any) => (
              <div key={item.department} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{item.department}</span>
                <span className="font-black text-emerald-400">{item.readiness_score || 0}%</span>
              </div>
            ))}
            {!dashboard?.departmentReadinessRanking?.length && <p className="text-xs text-gray-500">No department readiness data yet.</p>}
          </div>
        </PremiumCard>

        <PremiumCard title="Framework Readiness Ranking">
          <div className="space-y-3">
            {(dashboard?.frameworkReadinessRanking || []).slice(0, 6).map((item: any) => (
              <div key={item.framework} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{item.framework}</span>
                <span className="font-black text-cyan-400">{item.readiness_score || 0}%</span>
              </div>
            ))}
            {!dashboard?.frameworkReadinessRanking?.length && <p className="text-xs text-gray-500">No framework ranking data yet.</p>}
          </div>
        </PremiumCard>

        <PremiumCard title="Audit Forecast">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Outlook</span>
              <span className="font-bold text-white">{dashboard?.auditForecast?.forecast || 'Pending forecast'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Failure Probability</span>
              <span className="font-black text-amber-400">{dashboard?.auditForecast?.averageFailureProbability || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">High-Risk Controls</span>
              <span className="font-black text-red-400">{dashboard?.auditForecast?.highRiskControls || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Remediation Progress</span>
              <span className="font-black text-emerald-400">{dashboard?.remediationProgress?.completionRate ?? 100}%</span>
            </div>
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumCard title="Top Risks">
          <div className="space-y-3">
            {(dashboard?.topRisks || []).slice(0, 5).map((risk: any) => (
              <div key={`${risk.title}-${risk.created_at}`} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-bold text-white">{risk.title}</span>
                  <span className="text-[9px] text-amber-400 font-bold">{risk.severity}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{risk.risk_type}</p>
              </div>
            ))}
            {!dashboard?.topRisks?.length && <p className="text-xs text-gray-500">No active top risks.</p>}
          </div>
        </PremiumCard>

        <PremiumCard title="Critical Findings">
          <div className="space-y-3">
            {(dashboard?.criticalFindings || []).slice(0, 5).map((finding: any) => (
              <div key={finding.title} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-bold text-white">{finding.title}</span>
                  <span className="text-[9px] text-red-400 font-bold">{finding.severity}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{finding.recommendation}</p>
              </div>
            ))}
            {!dashboard?.criticalFindings?.length && <p className="text-xs text-gray-500">No critical findings in the current scope.</p>}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};
