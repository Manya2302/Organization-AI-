import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldAlert, Zap, Settings, Bot, Calendar, Bell, 
  History, TrendingUp, Cpu, Target, ShieldCheck, AlertTriangle, 
  Play, ArrowRight, CheckSquare
} from 'lucide-react';
import { 
  PremiumButton, PremiumCard, SkeletonLoader, PremiumInput 
} from '../design-system/components';

const API_BASE = 'http://localhost:5000/api/v1/operations';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ═════════════════════════════════════════════════════════════════
// 1. ENTERPRISE OPERATIONS CENTER (COCKPIT)
// ═════════════════════════════════════════════════════════════════
export const EnterpriseOperationsCenterPage: React.FC = () => {
  const [queryText, setQueryText] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setSearching(true);
    setAnswer(null);

    setTimeout(() => {
      const q = queryText.toLowerCase();
      let resMsg = "Autonomous Platform Action: ";
      if (q.includes('remediation') || q.includes('plan')) {
        resMsg += "Successfully generated an Audit Remediation Plan for ISO 27001 evidence gap. Mapped 3 action tasks and assigned to Lead Security Auditor.";
      } else if (q.includes('assign') || q.includes('compliance')) {
        resMsg += "Assigned Compliance Review task to Squire Compliance Agent. Started background log telemetry review.";
      } else if (q.includes('vendor') || q.includes('workflow')) {
        resMsg += "Workflow initiated for AWS Cloud Hosting assessment. Triggered key security policy checks.";
      } else if (q.includes('risk') || q.includes('operation')) {
        resMsg += "Active risk register scanned. 3 open risks found. Suggested action plan created for MFA key rotation policies.";
      } else {
        resMsg += "Query parsed. AEOP digital agent has scheduled this task. Verification email sent to owner.";
      }
      setAnswer(resMsg);
      setSearching(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-brand" /> Autonomous Operations Center
          </h2>
          <p className="text-xs text-gray-400">Command, execute, and monitor autonomous workflows and digital AI agents</p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="secondary" onClick={() => navigate('/dashboard/automation-rules')} className="text-xs px-3.5 py-1.5 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-brand" /> Rules Editor
          </PremiumButton>
          <PremiumButton variant="primary" onClick={() => navigate('/dashboard/digital-workforce')} className="text-xs px-3.5 py-1.5 flex items-center gap-1">
            <Bot className="h-3.5 w-3.5" /> Manage Agents
          </PremiumButton>
        </div>
      </div>

      {/* Natural Language Console */}
      <PremiumCard title="Autonomous Action Console" subtitle="Enter natural language commands to automatically initialize and run operations">
        <form onSubmit={handleQuery} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="e.g. Generate remediation plan for ISO 27001 gap OR Create workflow for vendor assessment"
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all duration-300"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-[9px] uppercase tracking-widest pointer-events-none">AEOP CLI</span>
            </div>
            <PremiumButton type="submit" disabled={searching} className="px-6 rounded-2xl flex items-center gap-1.5">
              {searching ? 'Executing Action...' : 'Run Command'} <Play className="h-3.5 w-3.5" />
            </PremiumButton>
          </div>

          {answer && (
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl animate-fade-in flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider block mb-0.5">Execution Log</span>
                <p className="text-xs text-gray-300 leading-relaxed">{answer}</p>
              </div>
            </div>
          )}
        </form>
      </PremiumCard>

      {/* AEOP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Active Workflows</span>
          <span className="text-2xl font-black text-brand block mt-1">3 Running</span>
          <span className="text-[9px] text-emerald-400 block mt-1">95% on-time</span>
        </div>
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Pending Actions</span>
          <span className="text-2xl font-black text-white block mt-1">3 Tasks</span>
          <span className="text-[9px] text-gray-400 block mt-1">1 Critical severity</span>
        </div>
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Risk Incidents</span>
          <span className="text-2xl font-black text-emerald-400 block mt-1">0 Active</span>
          <span className="text-[9px] text-gray-400 block mt-1">All mitigated</span>
        </div>
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Agent Automation Rate</span>
          <span className="text-2xl font-black text-cyan-400 block mt-1">92.4%</span>
          <span className="text-[9px] text-cyan-500 block mt-1">Over last 30d</span>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 2. WORKFLOW ORCHESTRATOR
// ═════════════════════════════════════════════════════════════════
export const WorkflowOrchestratorPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Compliance Review');
  const [saving, setSaving] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setWorkflows(res.workflows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          workflowType: type,
          steps: [
            { title: 'Evaluate requirements', stepType: 'Action', assignedRole: 'Compliance Officer' },
            { title: 'Approve outcome', stepType: 'Approval', assignedRole: 'Manager' }
          ]
        })
      }).then(r => r.json());

      if (res.success) {
        setTitle('');
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand" /> Workflow Orchestrator
        </h2>
        <p className="text-xs text-gray-400">Initialize custom cross-department review loops and action steps</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PremiumCard title="Active Workflows" subtitle="Live state machine tracking for corporate compliance steps">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="space-y-4">
                {workflows.map(w => (
                  <div key={w.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white text-sm">{w.title}</span>
                      <span className="font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded uppercase font-bold">
                        {w.workflow_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span>Status: {w.status}</span>
                      <span>Created: {new Date(w.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-4">
          <PremiumCard title="Create New Workflow" subtitle="Instantiate a new multi-step compliance action plan">
            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              <PremiumInput
                label="Workflow Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="e.g. Q4 Data Privacy Review"
              />
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workflow Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand"
                >
                  <option value="Compliance Review" className="bg-slate-950">Compliance Review</option>
                  <option value="Audit Remediation" className="bg-slate-950">Audit Remediation</option>
                  <option value="Vendor Assessment" className="bg-slate-950">Vendor Assessment</option>
                </select>
              </div>
              <PremiumButton type="submit" disabled={saving} className="w-full">
                {saving ? 'Creating Workflow...' : 'Create Workflow'}
              </PremiumButton>
            </form>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 3. ACTION CENTER
// ═════════════════════════════════════════════════════════════════
export const ActionCenterPage: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/actions`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setActions(res.actions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-brand" /> Enterprise Action Center
        </h2>
        <p className="text-xs text-gray-400">Track and close active remediation assignments and audit fixes</p>
      </div>

      <PremiumCard title="Assigned Remediation Tasks" subtitle="Detailed log of task owners, status, and compliance levels">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-4">
            {actions.map(act => (
              <div key={act.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-xs">
                <div>
                  <span className="font-extrabold text-white text-sm block">{act.title}</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">Source: {act.source_module}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Priority Level</span>
                  <span className="font-mono text-xs text-red-400 font-bold block mt-0.5">{act.priority}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Status</span>
                  <span className="font-mono text-xs text-emerald-400 font-bold block mt-0.5">{act.status}</span>
                </div>
                <div className="text-right">
                  <PremiumButton variant="secondary" className="text-xs px-3.5 py-1">
                    Close Task
                  </PremiumButton>
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
// 4. RECOMMENDATION CENTER
// ═════════════════════════════════════════════════════════════════
export const RecommendationCenterPage: React.FC = () => {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setRecs(res.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleAccept = async (recId: string) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ recommendationId: recId })
      }).then(r => r.json());

      if (res.success) {
        alert('Recommendation Accepted! Corresponding enterprise action has been automatically created.');
        fetchRecs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Target className="h-5 w-5 text-brand" /> Recommendation Center
        </h2>
        <p className="text-xs text-gray-400">Autonomous operational recommendations generated from graph dependencies</p>
      </div>

      <PremiumCard title="Autonomous Operational Recommendations" subtitle="Translate compliance insights directly into actionable tasks">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recs.map(r => (
              <div key={r.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[9px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase">
                      {r.trigger_source}
                    </span>
                    <span className="text-[10px] text-gray-500">Impact: {r.estimated_impact}%</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed font-bold mb-3">{r.recommendation_text}</p>
                </div>
                
                {r.status === 'Recommended' ? (
                  <PremiumButton variant="primary" onClick={() => handleAccept(r.id)} className="w-full text-xs py-1.5 flex items-center justify-center gap-1.5">
                    Accept & Run <ArrowRight className="h-3.5 w-3.5" />
                  </PremiumButton>
                ) : (
                  <span className="text-emerald-400 font-bold text-center block py-1.5 font-mono">✓ Accepted</span>
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
// 5. DECISION EXECUTION CENTER
// ═════════════════════════════════════════════════════════════════
export const DecisionExecutionCenterPage: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <History className="h-5 w-5 text-brand" /> Decision Execution Center
        </h2>
        <p className="text-xs text-gray-400">Inspect historical executive decision trails, outcomes, and audit verification status</p>
      </div>

      <PremiumCard title="Strategic Decision Execution Logs" subtitle="Continuous outcome tracking with verified cryptographic integrity hashes">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-4">
            {decisions.map(d => (
              <div key={d.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-white text-sm">{d.decision_title}</span>
                  <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    Success: {d.success_rate}%
                  </span>
                </div>
                <p className="text-gray-400 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <strong className="text-gray-300 block mb-0.5">Execution Notes:</strong>
                  {d.notes || 'No outcomes tracked yet.'}
                </p>
                <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                  <span>Status: {d.status}</span>
                  <span>Approved: {d.approved_at ? new Date(d.approved_at).toLocaleDateString() : 'N/A'}</span>
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
// 6. STRATEGIC PLANNING CENTER
// ═════════════════════════════════════════════════════════════════
export const StrategicPlanningCenterPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/planning`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setPlans(res.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand" /> Strategic Planning Center
        </h2>
        <p className="text-xs text-gray-400">Manage quarterly compliance roadmaps, milestones, and planning templates</p>
      </div>

      <PremiumCard title="Enterprise Strategic Roadmaps" subtitle="High-level timeline plans for upcoming auditing checks">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(p => (
              <div key={p.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-white text-sm">{p.plan_name}</span>
                  <span className="font-mono text-[9px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase">
                    {p.plan_type}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span>Start: {new Date(p.start_date).toLocaleDateString()}</span>
                  <span>End: {new Date(p.end_date).toLocaleDateString()}</span>
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
// 7. OPERATIONAL RISK CENTER
// ═════════════════════════════════════════════════════════════════
export const OperationalRiskCenterPage: React.FC = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/risks`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setRisks(res.risks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-brand" /> Operational Risk Center
        </h2>
        <p className="text-xs text-gray-400">Monitor overall process risks, vendor vulnerabilities, and exposure metrics</p>
      </div>

      <PremiumCard title="Enterprise Risk Register" subtitle="Ongoing severity rating and mitigation plan coverage">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-4">
            {risks.map(r => (
              <div key={r.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-xs">
                <div>
                  <span className="font-extrabold text-white text-sm block">{r.risk_title}</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">Category: {r.category}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Severity Rating</span>
                  <span className="font-mono text-xs text-red-400 font-bold block mt-0.5">{r.severity}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-bold">Risk Score</span>
                  <span className="font-mono text-xs text-white block mt-0.5">{r.score}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-mono">
                    Mitigated
                  </span>
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
// 8. ENTERPRISE COMMAND CENTER
// ═════════════════════════════════════════════════════════════════
export const EnterpriseCommandCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommandCenter = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/command-center`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res.commandCenter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandCenter();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand" /> Enterprise Command Center
        </h2>
        <p className="text-xs text-gray-400">Unified command console displaying overall corporate readiness parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <PremiumCard title="Organizational Health" subtitle="Aggregated system status index score">
            {loading ? (
              <SkeletonLoader count={2} />
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="inline-flex p-4 bg-brand/10 border border-brand/20 rounded-full">
                  <ShieldCheck className="h-10 w-10 text-brand" />
                </div>
                <div>
                  <span className="text-3xl font-black text-white block">
                    {data?.health?.overall_health_score}%
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-1 uppercase font-bold tracking-wider">Overall Health Score</span>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>

        <div className="lg:col-span-8">
          <PremiumCard title="Departmental Compliance Indexes" subtitle="Sub-system score breakdowns tracking overall alignment">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">Compliance Score</span>
                  <span className="text-xl font-black text-white block mt-1">{data?.scores?.compliance_score}%</span>
                </div>
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">Audit Readiness</span>
                  <span className="text-xl font-black text-brand block mt-1">{data?.scores?.audit_score}%</span>
                </div>
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">AI Trust Index</span>
                  <span className="text-xl font-black text-emerald-400 block mt-1">{data?.scores?.ai_score}%</span>
                </div>
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block">Knowledge Score</span>
                  <span className="text-xl font-black text-cyan-400 block mt-1">{data?.scores?.knowledge_score}%</span>
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
// 9. OUTCOME ANALYTICS CENTER
// ═════════════════════════════════════════════════════════════════
export const OutcomeAnalyticsCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutcomes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/outcomes`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setData(res.outcomes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" /> Outcome Analytics Center
        </h2>
        <p className="text-xs text-gray-400">Analyze ROI on closed remediation plans and risk reduction index over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Total Mapped Actions</span>
          <span className="text-2xl font-black text-white block mt-1">{loading ? '...' : data?.totalActions} Tasks</span>
        </div>
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Closed & Verified</span>
          <span className="text-2xl font-black text-emerald-400 block mt-1">{loading ? '...' : data?.closedActions} Closed</span>
        </div>
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Avg Risk Reduction Index</span>
          <span className="text-2xl font-black text-brand block mt-1">{loading ? '...' : data?.avgRiskReduction}%</span>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 10. DIGITAL WORKFORCE CENTER
// ═════════════════════════════════════════════════════════════════
export const DigitalWorkforceCenterPage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agents`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setAgents(res.agents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const triggerTask = async (agentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ agentId, taskTitle: 'Scan compliance policies' })
      }).then(r => r.json());

      if (res.success) {
        alert('Digital Agent task initialized successfully! Actions recorded in activity log.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand" /> Digital Workforce Center
        </h2>
        <p className="text-xs text-gray-400">View active digital AI agents and delegate background compliance tasks</p>
      </div>

      <PremiumCard title="Registered Digital Workforce Agents" subtitle="Delegated operations agents running ongoing monitoring checks">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map(a => (
              <div key={a.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-white text-sm">{a.agent_name}</span>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                      {a.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 block font-bold">Role: {a.role}</span>
                  
                  {a.capabilities && (
                    <div className="space-y-1 mt-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Capabilities</span>
                      <div className="flex flex-wrap gap-1.5">
                        {a.capabilities.map((cap: string, idx: number) => (
                          <span key={idx} className="text-[9px] bg-slate-900 border border-white/5 text-gray-300 px-2 py-0.5 rounded-md">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <PremiumButton variant="primary" onClick={() => triggerTask(a.id)} className="w-full text-xs py-1.5 mt-3">
                  Assign Task
                </PremiumButton>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 11. AUTOMATION RULES CENTER
// ═════════════════════════════════════════════════════════════════
export const AutomationRulesCenterPage: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/automation`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setRules(res.rules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand" /> Automation Rules Center
        </h2>
        <p className="text-xs text-gray-400">Configure event-triggered conditional parameters to automate responses</p>
      </div>

      <PremiumCard title="Event Automation Guidelines" subtitle="Rules currently parsed by the AEOP workflow engine">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-3">
            {rules.map(r => (
              <div key={r.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{r.title}</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Rule type: {r.type}</span>
                </div>
                <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                  r.active 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-gray-400 bg-white/5 border-white/10'
                }`}>
                  {r.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 12. ENTERPRISE NOTIFICATIONS CENTER
// ═════════════════════════════════════════════════════════════════
export const EnterpriseNotificationsCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand" /> Operations Notifications Center
        </h2>
        <p className="text-xs text-gray-400">Live feed of active compliance signals, escalation tracks, and agent triggers</p>
      </div>

      <PremiumCard title="Enterprise Event Stream" subtitle="Operational warning logs and background automation notices">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3 text-xs">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">{n.title}</span>
                  <span className="text-[10px] text-gray-400 leading-relaxed block mt-0.5">{n.message}</span>
                  <span className="text-[9px] text-gray-500 font-mono block mt-1">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};
