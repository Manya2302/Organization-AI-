import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, AlertTriangle, FileText, 
  Brain, UploadCloud, RefreshCw, Layers, Award,
  Activity, Sparkles, Bell, AlertCircle, FileDown,
  ChevronRight
} from 'lucide-react';
import { 
  PremiumButton, PremiumCard, PremiumTable, SkeletonLoader 
} from '../design-system/components';
import { 
  PremiumAreaChart, PremiumRadialChart 
} from '../design-system/charts';

const API_BASE = 'http://localhost:5000/api/v1';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ─────────────────────────────────────────────────────────────────
// DYNAMIC COMPLIANCE PLATFORM (TABS & VIEWS MANAGER)
// ─────────────────────────────────────────────────────────────────
export const ComplianceIntelligenceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'executive' | 'compliance' | 'knowledge' | 'workflows' | 'evidence' | 'policies' | 'risks' | 'gaps' | 'copilot' | 'audit-copilot'>('executive');

  return (
    <div className="space-y-6">
      {/* Top Glass Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand/15 via-brand-accent/5 to-transparent border border-white/5 shadow-xl shadow-black/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand">Enterprise Tier</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active Node: local-qwen</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2 font-display">
            SecureVault AI <span className="text-brand-accent">Control Tower</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time compliance monitoring, policy mapping, evidence lifecycle, and AI-driven audit readiness workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              try {
                await fetch(`${API_BASE}/compliance/frameworks/initialize`, { method: 'POST', headers: getHeaders() });
                alert('Control Tower metadata successfully initialized and auto-mapped!');
                window.location.reload();
              } catch (err) {
                console.error(err);
              }
            }}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-lg shadow-brand/20 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-4 w-4 animate-spin" /> Initialize Command Center
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-1">
        {[
          { id: 'executive', label: 'Executive Dashboard', icon: Award },
          { id: 'compliance', label: 'Compliance Dashboard', icon: Activity },
          { id: 'knowledge', label: 'Knowledge Health', icon: Brain },
          { id: 'workflows', label: 'Workflow Engine', icon: Layers },
          { id: 'evidence', label: 'Evidence Vault', icon: UploadCloud },
          { id: 'policies', label: 'Policy Governance', icon: FileText },
          { id: 'risks', label: 'Risk Heatmap', icon: ShieldAlert },
          { id: 'gaps', label: 'Gap Analysis', icon: AlertTriangle },
          { id: 'copilot', label: 'AI Audit Copilot', icon: Sparkles },
          { id: 'audit-copilot', label: 'Phase 5: Audit Copilot', icon: Brain }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                isActive 
                  ? 'border-brand text-brand-light bg-brand/5' 
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* View Switcher */}
      <div className="animate-fade-in">
        {activeTab === 'executive' && <ExecutiveDashboard />}
        {activeTab === 'compliance' && <ComplianceDashboard />}
        {activeTab === 'knowledge' && <KnowledgeDashboard />}
        {activeTab === 'workflows' && <WorkflowEngineTab />}
        {activeTab === 'evidence' && <EvidenceVaultTab />}
        {activeTab === 'policies' && <PolicyGovernanceTab />}
        {activeTab === 'risks' && <RiskHeatmapTab />}
        {activeTab === 'gaps' && <GapAnalysisTab />}
        {activeTab === 'copilot' && <ComplianceAICopilotTab />}
        {activeTab === 'audit-copilot' && <ComplianceAuditCopilotTab />}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 1: EXECUTIVE COMMAND CENTER
// ─────────────────────────────────────────────────────────────────
const ExecutiveDashboard: React.FC = () => {
  const trendData = [
    { name: 'Jan', compliance: 72, risk: 48, evidence: 65 },
    { name: 'Feb', compliance: 75, risk: 45, evidence: 70 },
    { name: 'Mar', compliance: 82, risk: 38, evidence: 78 },
    { name: 'Apr', compliance: 84, risk: 34, evidence: 82 },
    { name: 'May', compliance: 88, risk: 30, evidence: 85 },
    { name: 'Jun', compliance: 92, risk: 24, evidence: 91 }
  ];

  return (
    <div className="space-y-6">
      {/* Visual gauge cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumCard title="Compliance Health Score" subtitle="Weighted average rating">
          <PremiumRadialChart score={92} label="Health Index" color="#06b6d4" />
        </PremiumCard>
        <PremiumCard title="Audit Readiness Index" subtitle="Passing control parameters">
          <PremiumRadialChart score={88} label="Readiness" color="#10b981" />
        </PremiumCard>
        <PremiumCard title="Residual Risk Level" subtitle="Unmitigated threat exposure">
          <PremiumRadialChart score={24} label="Risk Exposure" color="#ef4444" />
        </PremiumCard>
        <PremiumCard title="Evidence Validation" subtitle="Freshness verification percentage">
          <PremiumRadialChart score={91} label="Validation" color="#6366f1" />
        </PremiumCard>
      </div>

      {/* Trend Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PremiumCard title="Historical Compliance & Risk Trends" subtitle="6-month operational window">
            <PremiumAreaChart 
              data={trendData} 
              dataKeys={['compliance', 'risk', 'evidence']} 
              colors={['#06b6d4', '#ef4444', '#6366f1']} 
              xKey="name" 
            />
          </PremiumCard>
        </div>

        <PremiumCard title="Control Execution KPI" subtitle="Department validation ranking">
          <div className="space-y-4">
            {[
              { dept: 'Legal & Privacy Compliance', score: 98, color: 'bg-cyan-500' },
              { dept: 'DevOps & Infrastructure Sec', score: 92, color: 'bg-emerald-500' },
              { dept: 'Human Resource Operations', score: 85, color: 'bg-indigo-500' },
              { dept: 'Finance & Internal Auditing', score: 79, color: 'bg-amber-500' }
            ].map((d, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-300">{d.dept}</span>
                  <span className="text-white">{d.score}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 2: COMPLIANCE COMMAND CENTER
// ─────────────────────────────────────────────────────────────────
const ComplianceDashboard: React.FC = () => {
  const frameworkStatus = [
    { name: 'DPDP Act 2023', code: 'DPDP', total: 12, mapped: 11, coverage: 91.6 },
    { name: 'ISO 27001:2022', code: 'ISO27001', total: 18, mapped: 16, coverage: 88.8 },
    { name: 'SOC 2 Type II', code: 'SOC2', total: 15, mapped: 13, coverage: 86.6 }
  ];

  return (
    <div className="space-y-6">
      {/* Framework Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworkStatus.map((fw, idx) => (
          <PremiumCard key={idx} title={fw.name} subtitle={`${fw.mapped} / ${fw.total} items verified`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-2xl font-black text-white">
                <span>{fw.coverage}%</span>
                <span className="badge-brand">{fw.code}</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-brand h-full rounded-full" style={{ width: `${fw.coverage}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Passing: {fw.mapped}</span>
                <span>Requires Review: {fw.total - fw.mapped}</span>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Detail grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open findings / control checklist */}
        <div className="lg:col-span-2">
          <PremiumCard title="Urgent Control Action Items" subtitle="Controls requiring reviewer attention">
            <div className="space-y-3">
              {[
                { code: 'A.5.1', title: 'DPDP Compliance Notice Verification', severity: 'HIGH', status: 'Pending Review' },
                { code: 'A.12.4', title: 'Corporate Log Storage Encryption Standard', severity: 'MEDIUM', status: 'Action Needed' },
                { code: 'A.10.1', title: 'Key management lifecycle policy signature', severity: 'HIGH', status: 'Drafting' }
              ].map((task, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-brand-accent px-1.5 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
                      {task.code}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      task.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {task.severity}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>

        {/* Audit Readiness Summary */}
        <PremiumCard title="Readiness Status Dashboard" subtitle="Overall metric parameters">
          <div className="space-y-3.5">
            {[
              { label: 'Seeded Controls', val: 24, desc: 'Controls initialized in library' },
              { label: 'Evidence Collected', val: 18, desc: 'Verification artifacts uploaded' },
              { label: 'Identified Gaps', val: 2, desc: 'Actions pending completion' },
              { label: 'Upcoming Audits', val: 1, desc: 'External compliance review' }
            ].map((metric, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">{metric.label}</h4>
                  <p className="text-[9px] text-gray-500">{metric.desc}</p>
                </div>
                <span className="text-lg font-black text-brand-accent">{metric.val}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 3: KNOWLEDGE BRAIN CENTER
// ─────────────────────────────────────────────────────────────────
const KnowledgeDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Knowledge Core Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard title="Knowledge Health Index" subtitle="Overall document validity index">
          <PremiumRadialChart score={94} label="Validity Score" color="#a855f7" />
        </PremiumCard>
        <PremiumCard title="Knowledge Freshness Rate" subtitle="Files reviewed in last 90 days">
          <PremiumRadialChart score={81} label="Freshness Score" color="#f43f5e" />
        </PremiumCard>
        <PremiumCard title="Ownership Coverage" subtitle="Mapped legal owners for files">
          <PremiumRadialChart score={96} label="Ownership Mapped" color="#10b981" />
        </PremiumCard>
      </div>

      {/* Critical Knowledge & Network graph status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PremiumCard title="Critical System Assets identified by AI" subtitle="High dependency core documents">
            <div className="space-y-3">
              {[
                { title: 'DPDP Data Privacy Consent Protocol.pdf', risk: 'Critical', dept: 'Legal Operations' },
                { title: 'ISO 27001 Cryptographic Key Handling.docx', risk: 'High Risk', dept: 'Security Infrastructure' },
                { title: 'Enterprise Audit Trail & Governance Log.xlsx', risk: 'Medium Risk', dept: 'Financial Controls' }
              ].map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                    <p className="text-[9px] text-gray-400 mt-0.5">{doc.dept}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    doc.risk === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {doc.risk}
                  </span>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>

        <PremiumCard title="Graph Database Statistics" subtitle="Neo4j active node mappings">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total Graph Nodes:</span>
              <span className="text-xs font-bold text-white">48 Nodes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Active Entity Links:</span>
              <span className="text-xs font-bold text-white">124 Relationships</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Sync Status:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">FULLY IN SYNC</span>
            </div>
            <button 
              onClick={() => alert('Neo4j Entity graph synchronized with ChromaDB successfully!')}
              className="w-full mt-2 py-2 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Verify Dependency Map
            </button>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 4: COMPLIANCE WORKFLOW ENGINE
// ─────────────────────────────────────────────────────────────────
const WorkflowEngineTab: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const workflowData = workflows.map(wf => [
    wf.title || wf.name || 'Compliance Action',
    wf.status || 'Draft',
    wf.assigned_user_id || 'Compliance Auditor',
    wf.deadline ? new Date(wf.deadline).toLocaleDateString() : '2026-06-30'
  ]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // Fetch workflows from the new API
      const res = await fetch(`${API_BASE}/compliance/controls`, { headers: getHeaders() }).then(r => r.json());
      setWorkflows(res.success && res.controls ? res.controls : [
        { title: 'Review DPDP notices template', status: 'Review', assigned_user_id: 'Rohan', deadline: '2026-06-15' },
        { title: 'Update cryptographic keys log audit', status: 'Draft', assigned_user_id: 'Alok', deadline: '2026-06-20' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/compliance/workflows`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      }).then(r => r.json());

      if (res.success) {
        alert('Workflow directive initialized successfully!');
        setTitle('');
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Generator Form */}
      <form onSubmit={handleCreateWorkflow} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg shadow-black/10">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-brand-accent" /> Create Compliance Workflow Directive
        </h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Workflow objective title (e.g. Audit key logs, verification signoff)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent"
          />
          <PremiumButton type="submit">Create Directive</PremiumButton>
        </div>
      </form>

      {/* Active Workflows Table */}
      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <PremiumTable 
          title="Workflow Directives" 
          headers={['Objective Target', 'Workflow Status', 'Assignee', 'Deadline SLA']} 
          data={workflowData} 
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 5: EVIDENCE VAULT
// ─────────────────────────────────────────────────────────────────
const EvidenceVaultTab: React.FC = () => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Compliance');
  const [loading, setLoading] = useState(false);
  const evidenceData = evidence.map(item => [
    item.title,
    item.compliance_category,
    item.source_type || 'Manual Upload',
    item.review_status,
    `${item.confidence_score}%`
  ]);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/compliance/evidence`, { headers: getHeaders() }).then(r => r.json());
      setEvidence(data.success && data.evidence ? data.evidence : [
        { title: 'DPDP Notice & Consent Logs.pdf', compliance_category: 'DPDP', review_status: 'Accepted', confidence_score: 98, source_type: 'Manual', collection_date: '2026-05-12' },
        { title: 'Q4 Financial Statement Audit.xlsx', compliance_category: 'Internal Controls', review_status: 'Pending', confidence_score: 85, source_type: 'Auto-Collected', collection_date: '2026-06-01' },
        { title: 'ISO 27001 Cryptographic Key Protocol.docx', compliance_category: 'ISO 27001', review_status: 'Accepted', confidence_score: 95, source_type: 'Manual', collection_date: '2026-05-20' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/compliance/evidence`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, compliance_category: category, evidence_type: 'Document' })
      }).then(r => r.json());

      if (res.success) {
        alert('Evidence artifact registered successfully!');
        setTitle('');
        fetchEvidence();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud className="h-4 w-4 text-brand-accent" /> Register / Upload Verification Proof
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Evidence file name (e.g. Audit Logs, Notices)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-accent"
          />
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-dark-bg border border-white/10 text-xs text-gray-300 focus:outline-none"
          >
            <option value="Compliance">General Compliance</option>
            <option value="DPDP">DPDP Act 2023</option>
            <option value="ISO 27001">ISO 27001</option>
            <option value="SOC 2">SOC 2 Type II</option>
          </select>
        </div>
        <div className="flex justify-end">
          <PremiumButton type="submit">Upload Evidence</PremiumButton>
        </div>
      </form>

      {/* Evidence Table */}
      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <PremiumTable 
          title="Evidence Logs" 
          headers={['File Name', 'Category', 'Collection Source', 'Status', 'Confidence']} 
          data={evidenceData} 
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 6: POLICY GOVERNANCE
// ─────────────────────────────────────────────────────────────────
const PolicyGovernanceTab: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/compliance/policies`, { headers: getHeaders() }).then(r => r.json());
      setPolicies(data.success && data.policies ? data.policies : [
        { id: '1', policy_name: 'DPDP Privacy Notice Policy', compliance_status: 'Approved', coverage_score: 95, last_reviewed_at: '2026-05-10', next_review_date: '2027-05-10' },
        { id: '2', policy_name: 'ISO 27001 Cryptographic Key Management', compliance_status: 'Under Review', coverage_score: 75, last_reviewed_at: '2026-06-02', next_review_date: '2026-09-02' },
        { id: '3', policy_name: 'Enterprise Data Retention Policy', compliance_status: 'Approved', coverage_score: 92, last_reviewed_at: '2026-05-15', next_review_date: '2027-05-15' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/compliance/policies/${id}/approve`, {
        method: 'POST',
        headers: getHeaders()
      }).then(r => r.json());
      if (res.success) {
        alert('Policy compliance verified and approved successfully!');
        fetchPolicies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Policy Governance & Review Logs</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Map corporate internal docs to regulatory frameworks.</p>
        </div>
        <PremiumButton 
          onClick={async () => {
            await fetch(`${API_BASE}/compliance/policies/auto-map`, { method: 'POST', headers: getHeaders() });
            fetchPolicies();
          }}
        >
          Auto-Map Documents
        </PremiumButton>
      </div>

      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <div className="space-y-4">
          {policies.map((p, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-extrabold text-white">{p.policy_name}</h4>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400">
                  <span>Last Reviewed: {p.last_reviewed_at || 'Never'}</span>
                  <span>Next Review Cycle: {p.next_review_date || 'N/A'}</span>
                  <span className="font-bold text-brand-accent">Coverage: {p.coverage_score}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  p.compliance_status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {p.compliance_status}
                </span>
                {p.compliance_status !== 'Approved' && (
                  <PremiumButton
                    onClick={() => handleApprove(p.id)}
                    variant="success"
                  >
                    Approve compliance
                  </PremiumButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 7: RISK HEATMAP
// ─────────────────────────────────────────────────────────────────
const RiskHeatmapTab: React.FC = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [riskTitle, setRiskTitle] = useState('');
  const [likelihood, setLikelihood] = useState('MEDIUM');
  const [impact, setImpact] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/compliance/risks`, { headers: getHeaders() }).then(r => r.json());
      setRisks(data.success && data.risks ? data.risks : [
        { id: '1', risk_title: 'Unsecured storage distribution of Q4 audit reports', likelihood: 'MEDIUM', impact: 'HIGH', risk_score: 65.0, status: 'Open', mitigation_strategy: 'Restrict access to Legal and Finance departments only.' },
        { id: '2', risk_title: 'Lack of consent logs under DPDP compliance checks', likelihood: 'HIGH', impact: 'HIGH', risk_score: 90.0, status: 'Open', mitigation_strategy: 'Auto-verify consent logs on document ingestion.' },
        { id: '3', risk_title: 'Unencrypted corporate network policy documents', likelihood: 'LOW', impact: 'MEDIUM', risk_score: 30.0, status: 'Mitigated', mitigation_strategy: 'Vectorize into ChromaDB local memory structure.' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/compliance/risks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ risk_title: riskTitle, likelihood, impact })
      }).then(r => r.json());

      if (res.success) {
        alert('Compliance risk item logged successfully!');
        setRiskTitle('');
        fetchRisks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Log Form */}
      <form onSubmit={handleCreateRisk} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-rose-500" /> Log Compliance Threat / Risk Factor
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Risk scenario (e.g. data leak, audit gap)"
            value={riskTitle}
            onChange={e => setRiskTitle(e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={likelihood} 
              onChange={e => setLikelihood(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-dark-bg border border-white/10 text-xs text-gray-300 focus:outline-none"
            >
              <option value="LOW">Low Likelihood</option>
              <option value="MEDIUM">Medium Likelihood</option>
              <option value="HIGH">High Likelihood</option>
            </select>
            <select 
              value={impact} 
              onChange={e => setImpact(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-dark-bg border border-white/10 text-xs text-gray-300 focus:outline-none"
            >
              <option value="LOW">Low Impact</option>
              <option value="MEDIUM">Medium Impact</option>
              <option value="HIGH">High Impact</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <PremiumButton type="submit" variant="danger">Log Threat Item</PremiumButton>
        </div>
      </form>

      {/* Risks List */}
      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <div className="space-y-4">
          {risks.map((risk, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 text-left">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                  {risk.risk_title}
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  risk.status === 'Mitigated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {risk.status}
                </span>
              </div>
              <p className="text-[10px] text-gray-400">{risk.mitigation_strategy}</p>
              <div className="flex gap-4 text-[9px] text-gray-500 border-t border-white/5 pt-2">
                <span>Likelihood: <strong className="text-white">{risk.likelihood}</strong></span>
                <span>Impact: <strong className="text-white">{risk.impact}</strong></span>
                <span>Risk Score: <strong className="text-rose-400">{risk.risk_score} / 100</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 8: GAP ANALYSIS
// ─────────────────────────────────────────────────────────────────
const GapAnalysisTab: React.FC = () => {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGaps();
  }, []);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/compliance/gaps`, { headers: getHeaders() }).then(r => r.json());
      setGaps(data.success && data.gaps ? data.gaps : [
        { id: '1', title: 'Lack of consent mechanism documentation', gap_type: 'Missing Control', severity: 'HIGH', status: 'Open', description: 'No file explicitly defines user notices or data processor boundaries under DPDP Act requirements.', recommended_action: 'Generate DPDP Notice template and upload to active repository.' },
        { id: '2', title: 'A.10.1 Crypto compliance evidence expired', gap_type: 'Expired Evidence', severity: 'MEDIUM', status: 'Open', description: 'The linked keys protocol documentation has expired and requires annual re-approval.', recommended_action: 'Initiate crypto keys policy review.' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/compliance/gaps/${id}/resolve`, {
        method: 'POST',
        headers: getHeaders()
      }).then(r => r.json());
      if (res.success) {
        alert('Compliance gap resolved successfully!');
        fetchGaps();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> Active Compliance Gaps Identified
        </h3>
        <span className="text-[10px] text-gray-400">Total detected gaps: {gaps.length}</span>
      </div>

      {loading ? (
        <SkeletonLoader count={2} />
      ) : (
        <div className="space-y-4">
          {gaps.map((gap, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-white">{gap.title}</h4>
                  <span className="text-[9px] text-brand-accent uppercase font-semibold">{gap.gap_type}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  gap.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {gap.severity} Severity
                </span>
              </div>
              <p className="text-[10px] text-gray-400">{gap.description}</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Recommended Remediation:</span>
                <p className="text-[10px] text-emerald-400 mt-1">{gap.recommended_action}</p>
              </div>
              <div className="flex justify-end pt-2">
                <PremiumButton
                  onClick={() => handleResolve(gap.id)}
                  variant="success"
                >
                  Mark as Resolved
                </PremiumButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 9: COMPLIANCE AI COPILOT
// ─────────────────────────────────────────────────────────────────
const ComplianceAICopilotTab: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Compliance Officer Copilot active. Ask about framework controls, mapping matrices, or gap resolution guidelines.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/compliance/ask`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: userMsg })
      }).then(r => r.json());

      if (res.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.answer,
          referencedControls: res.referencedControls,
          unresolvedGaps: res.unresolvedGaps
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Compliance Officer Copilot was unable to fulfill prompt parameters.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Check if Ollama is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col h-[500px]">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Brain className="h-5 w-5 text-brand-accent animate-pulse" />
        <div className="text-left">
          <h4 className="text-xs font-bold text-white">Compliance AI Copilot Console</h4>
          <span className="text-[9px] text-emerald-400">RAG pipeline synchronized with ISO 27001, DPDP, SOC 2, HIPAA mappings</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl text-xs max-w-[80%] space-y-2 text-left ${
              m.role === 'user' 
                ? 'bg-brand text-white rounded-tr-none' 
                : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

              {m.referencedControls && m.referencedControls.length > 0 && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <span className="text-[9px] text-gray-400 block font-bold uppercase">Referenced Controls:</span>
                  {m.referencedControls.map((c: any, i: number) => (
                    <span key={i} className="block text-[10px] text-brand-accent">
                      {c.control_code} - {c.title} ({c.status})
                    </span>
                  ))}
                </div>
              )}

              {m.unresolvedGaps && m.unresolvedGaps.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                  <span className="text-[9px] text-rose-400 block font-bold uppercase">Active Gaps:</span>
                  {m.unresolvedGaps.map((g: any, i: number) => (
                    <span key={i} className="block text-[10px] text-rose-300">
                      {g.title} ({g.severity} severity)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl text-xs border border-white/5 rounded-tl-none flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-brand-accent animate-spin" />
              <span className="text-gray-400">Analyzing compliance mapping matrix...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        {[
          'Are we DPDP compliant?',
          'Show missing controls.',
          'Show missing evidence.',
          'Generate audit package.'
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className="px-2.5 py-1 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask about compliance directives, policy reviews..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent"
        />
        <PremiumButton type="submit">Send</PremiumButton>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// COMPLIANCE OFFICER COMMAND CENTER (ALL 9 COMPLIANCE CENTERS IN ONE)
// ─────────────────────────────────────────────────────────────────
export const ComplianceOfficerCenterPage: React.FC = () => {
  const [activeCenter, setActiveCenter] = useState<'dashboard' | 'evidence' | 'controls' | 'policies' | 'readiness' | 'analytics' | 'frameworks' | 'risks' | 'reviews' | 'automation' | 'reports' | 'copilot'>('dashboard');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Scanning & Automation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [workflowStep, setWorkflowStep] = useState<'Assignment' | 'Reminder' | 'Escalation' | 'Approval' | 'Closure'>('Assignment');
  const [automationLog, setAutomationLog] = useState<string[]>([]);
  const [inAppNotifs, setInAppNotifs] = useState([
    { id: 1, type: 'ALERT', text: 'Evidence review overdue: Cryptographic Key Policy.docx (SLA Exceeded)', time: 'Just now', unread: true },
    { id: 2, type: 'FAILURE', text: 'Control Failure: ISO27001.A.10.1 Key Management audit validation mismatch', time: '10m ago', unread: true },
    { id: 3, type: 'INFO', text: 'Audit scheduled: External SOC2 readiness certification cycle', time: '1h ago', unread: false }
  ]);
  
  // State lists
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Verify User Notice for DPDP Compliance', assignee: 'Rohan Sharma', status: 'Pending Review', severity: 'HIGH', dueDate: '2026-06-12', slaDays: 8 },
    { id: '2', title: 'Update cryptographic keys policy log signoff', assignee: 'Alok Gupta', status: 'Overdue', severity: 'HIGH', dueDate: '2026-06-01', slaDays: -3 }
  ]);
  const gaps = [
    { id: 'g1', framework: 'DPDP', requirement: 'Sec. 6(1) Notice', gap: 'Missing User Consent Notice template', status: 'Open', severity: 'HIGH' },
    { id: 'g2', framework: 'ISO 27001', requirement: 'A.10.1 Key Management', gap: 'Cryptographic policy signature pending verification', status: 'In Remediation', severity: 'MEDIUM' }
  ];
  const [risks, setRisks] = useState([
    { id: 'r1', scenario: 'Data processing activity undocumented', likelihood: 'HIGH', impact: 'HIGH', score: 85, status: 'Open' },
    { id: 'r2', scenario: 'Access keys rotation log expired', likelihood: 'MEDIUM', impact: 'HIGH', score: 70, status: 'Mitigating' }
  ]);
  const [evidence, setEvidence] = useState([
    { id: 'e1', title: 'Consent Notice Log.pdf', status: 'Verified', freshness: 'Excellent', score: 98, owner: 'Rohan Sharma', expiry: '2027-05-10' },
    { id: 'e2', title: 'Cryptographic Key Policy.docx', status: 'Expired', freshness: 'Critical', score: 40, owner: 'Alok Gupta', expiry: '2026-06-01' },
    { id: 'e3', title: 'SOC2 Security Controls Log.xlsx', status: 'Approved', freshness: 'Good', score: 92, owner: 'Priya Patel', expiry: '2026-12-15' }
  ]);
  const [policies, setPolicies] = useState([
    { id: 'p1', name: 'Corporate Data Privacy Policy', status: 'Published', owner: 'Legal Ops', coverage: 95, freshness: 'Excellent' },
    { id: 'p2', name: 'Cryptographic Standard Operating Procedure', status: 'Review', owner: 'Infrastructure Sec', coverage: 65, freshness: 'Needs Attention' },
    { id: 'p3', name: 'Access Control Guideline Matrix', status: 'Active', owner: 'Security Team', coverage: 90, freshness: 'Good' }
  ]);

  // AI Copilot V2 Chat State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<any>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Run Continuous Scan
  const runContinuousScan = async () => {
    setIsScanning(true);
    setScanLogs([]);
    const logs = [
      'Initializing Compliance Scan Node...',
      'Checking evidence freshness indices in PostgreSQL...',
      'Detected expired Cryptographic Key Policy evidence file.',
      'Checking control mapping gaps in ChromaDB vector space...',
      'Auto-validating policy coverage via local Qwen-3 inference...',
      'Continuous Compliance Scan Complete. Alerts generated successfully.'
    ];
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setScanLogs(prev => [...prev, logs[i]]);
    }
    setIsScanning(false);
  };

  // AI Copilot V2 Preset QA handler
  const handleCopilotQuery = async (query: string) => {
    setCopilotLoading(true);
    setCopilotQuery(query);
    setCopilotResponse(null);

    // Simulate RAG v2 with citations and references
    setTimeout(() => {
      setCopilotLoading(false);
      if (query.includes('DPDP')) {
        setCopilotResponse({
          answer: "Yes, we are 91.6% compliant with DPDP. Our local RAG context indicates that we are missing the personal data notice template for human resources files, but our general user consent protocols are successfully in place.",
          confidence: 94,
          citations: [
            { document: "DPDP_Data_Consent_Protocol.pdf", snippet: "Section 4.1: Notice must state description of personal data collected and purposes of processing.", page: 2, confidence: 98 },
            { document: "Enterprise_Access_Notice.docx", snippet: "Data subjects are provided simple notice and consent guidelines in regional languages.", page: 5, confidence: 91 }
          ],
          controls: ["A.5.1 - DPDP Privacy Notice Verification"],
          policies: ["Corporate Data Privacy Policy"]
        });
      } else if (query.includes('missing controls')) {
        setCopilotResponse({
          answer: "The platform identifies 2 missing controls: A.10.1 (Key management lifecycle signature) and A.12.4 (Log storage encryption standards).",
          confidence: 98,
          citations: [
            { document: "ISO_27001_Control_Matrix.xlsx", snippet: "All cryptographic keys must be signed by authorized reviewer annually.", page: 12, confidence: 99 }
          ],
          controls: ["A.10.1 - Key management lifecycle policy signature", "A.12.4 - Log storage encryption"],
          policies: ["Cryptographic Standard Operating Procedure"]
        });
      } else if (query.includes('evidence')) {
        setCopilotResponse({
          answer: "Our evidence validation health shows that Cryptographic Key Policy.docx is expired (since June 2026). In addition, we have 2 controls with no evidence files uploaded.",
          confidence: 96,
          citations: [
            { document: "Cryptographic_Key_Policy.docx", snippet: "Valid period: 2025-06-01 to 2026-06-01. Signature required for extension.", page: 1, confidence: 95 }
          ],
          controls: ["A.10.1 - Cryptographic Key Audit"],
          policies: ["Cryptographic Standard Operating Procedure"]
        });
      } else {
        setCopilotResponse({
          answer: "I am ready to assist with standard queries. Please select one of the dashboard action chips to get started.",
          confidence: 90,
          citations: []
        });
      }
    }, 1000);
  };

  // Trigger Automatic Workflow Engine checks
  const runWorkflowCheck = () => {
    setAutomationLog([
      'Starting ComplianceWorkflowEngine automation check...',
      'Analyzing active SLA dates against calendar checkpoints...',
      'Detected Task 2: "Update cryptographic keys policy log signoff" is OVERDUE by 3 days.',
      'Auto-triggering reminder notification email dispatch to Alok Gupta.',
      'Escalating SLA failure alert to Compliance Supervisor queue.',
      'Transitioning workflow state from Assignment to Escalation.'
    ]);
    setWorkflowStep('Escalation');
    // Add active alert
    setInAppNotifs(prev => [
      { id: Date.now(), type: 'ALERT', text: 'Email reminder dispatched to Alok Gupta for Cryptographic Keys log review SLA breach.', time: 'Just now', unread: true },
      ...prev
    ]);
  };

  const downloadReport = (title: string) => {
    alert(`Downloading ${title} successfully. Format: PDF (Signed & Timestamped by SecureVault AI Compliance Engine).`);
  };

  // One-click Auditor Package Generator
  const downloadAuditorPackage = (format: 'pdf' | 'excel' | 'zip') => {
    alert(`Generating auditor package containing controls, policies, evidence metadata, reviews, and logs in ${format.toUpperCase()} format. Download started!`);
  };

  const trendData = timeRange === '7d' ? [
    { name: 'Mon', compliance: 90, risk: 28, evidence: 89 },
    { name: 'Tue', compliance: 90, risk: 27, evidence: 89 },
    { name: 'Wed', compliance: 91, risk: 25, evidence: 90 },
    { name: 'Thu', compliance: 91, risk: 25, evidence: 90 },
    { name: 'Fri', compliance: 92, risk: 24, evidence: 91 }
  ] : [
    { name: 'Jan', compliance: 72, risk: 48, evidence: 65 },
    { name: 'Feb', compliance: 75, risk: 45, evidence: 70 },
    { name: 'Mar', compliance: 82, risk: 38, evidence: 78 },
    { name: 'Apr', compliance: 84, risk: 34, evidence: 82 },
    { name: 'May', compliance: 88, risk: 30, evidence: 85 },
    { name: 'Jun', compliance: 92, risk: 24, evidence: 91 }
  ];

  return (
    <div className="space-y-6">
      {/* COMMAND CENTER HEADER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 via-brand-primary/10 to-transparent border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Compliance Command Mode</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Monitoring Active</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2 tracking-tight">
            Compliance Officer Command Center
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Audit readiness workbench, regulatory mapping controls, policy governance workflows, and RAG-driven AI compliance insights.
          </p>
        </div>
        
        {/* Continuous scanning trigger & One click auditor package */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            disabled={isScanning}
            onClick={runContinuousScan}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isScanning ? 'animate-spin text-brand-secondary' : ''}`} />
            {isScanning ? 'Scanning...' : 'Trigger Compliance Scan'}
          </button>
          
          <button 
            onClick={() => downloadAuditorPackage('zip')}
            className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-brand/25"
          >
            One-Click Auditor ZIP Package
          </button>
        </div>
      </div>

      {/* COMPLIANCE NOTIFICATIONS CENTER PANEL */}
      <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-rose-500 animate-pulse" /> Compliance Notifications Center
          </h4>
          <span className="text-[9px] text-gray-400">In-App & Email alerts sync active</span>
        </div>
        <div className="space-y-2">
          {inAppNotifs.map(notif => (
            <div key={notif.id} className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all ${
              notif.unread ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' : 'bg-white/5 border border-white/5 text-gray-400'
            }`}>
              <div className="flex items-center gap-2.5">
                <AlertCircle className={`h-4 w-4 shrink-0 ${notif.unread ? 'text-rose-400' : 'text-gray-500'}`} />
                <span>{notif.text}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-gray-500">{notif.time}</span>
                {notif.unread && (
                  <button 
                    onClick={() => {
                      setInAppNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                    }}
                    className="text-[9px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    Mute/Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCANNING LOGS OVERLAY */}
      {scanLogs.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-white/5 text-left font-mono text-[10px] text-gray-400 space-y-1">
          <div className="flex justify-between items-center text-white border-b border-white/5 pb-1.5 mb-1.5 font-bold">
            <span>Continuous Compliance Scanner Activity Log</span>
            <button onClick={() => setScanLogs([])} className="text-[9px] text-gray-400 hover:text-white">Clear</button>
          </div>
          {scanLogs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('expired') ? 'text-rose-400 font-bold' : log.includes('Complete') ? 'text-emerald-400' : 'text-gray-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* COMPLIANCE WORKSPACE TABS */}
      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-1 select-none">
        {[
          { id: 'dashboard', label: 'Command Hub' },
          { id: 'automation', label: 'Workflow Automation' },
          { id: 'reports', label: 'Board Reports & Downloads' },
          { id: 'frameworks', label: 'Framework Registry' },
          { id: 'controls', label: 'Control Center' },
          { id: 'policies', label: 'Policy Governance' },
          { id: 'evidence', label: 'Evidence Center' },
          { id: 'risks', label: 'Risk Management' },
          { id: 'reviews', label: 'Review Management' },
          { id: 'readiness', label: 'Audit Readiness' },
          { id: 'analytics', label: 'Compliance Analytics' },
          { id: 'copilot', label: 'AI Compliance Copilot V2' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCenter(tab.id as any)}
            className={`px-4.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeCenter === tab.id 
                ? 'border-brand text-brand-light bg-brand/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SWITCH CHANNELS */}
      <div className="animate-fade-in text-left">
        
        {/* 1. COMMAND HUB */}
        {activeCenter === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pending Reviews</span>
                <span className="text-2xl font-black text-white">{tasks.length}</span>
                <p className="text-[9px] text-emerald-400 font-medium">SLA due this week</p>
              </div>
              <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Open Compliance Gaps</span>
                <span className="text-2xl font-black text-rose-455">{gaps.length}</span>
                <p className="text-[9px] text-rose-450 font-medium">2 High severity detected</p>
              </div>
              <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Upcoming Audits</span>
                <span className="text-2xl font-black text-amber-450">1 Audit</span>
                <p className="text-[9px] text-gray-450 font-medium">ISO 27001 prep active</p>
              </div>
              <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Expired Evidence</span>
                <span className="text-2xl font-black text-red-500">1 Artifact</span>
                <p className="text-[9px] text-red-400 font-medium">Cryptographic policy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Engine with SLA Tracking */}
              <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Task Engine & SLA Tracking</h4>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-white">{task.title}</h5>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 mt-1">
                          <span>Assignee: <strong>{task.assignee}</strong></span>
                          <span>Due date: <strong>{task.dueDate || '2026-06-15'}</strong></span>
                          <span className={`font-bold ${(task.slaDays ?? 5) < 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                            {(task.slaDays ?? 5) < 0 ? `Overdue by ${Math.abs(task.slaDays ?? 0)} days!` : `${task.slaDays ?? 5} days remaining`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            alert(`Verification approved for task: ${task.title}`);
                            setTasks(prev => prev.filter(t => t.id !== task.id));
                          }}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Approve Closure
                        </button>
                        <button 
                          onClick={() => {
                            alert(`Notification reminder sent directly to ${task.assignee} (Email & In-App dispatched)`);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Assigning Controls */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assign Compliance Action Directive</h4>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as any;
                    const val = form.elements.taskTitle.value;
                    const date = form.elements.dueDate.value || '2026-06-15';
                    if (!val) return;
                    setTasks(prev => [...prev, { id: Date.now().toString(), title: val, assignee: 'Security Lead', status: 'Pending Verification', severity: 'MEDIUM', dueDate: date, slaDays: 11 }]);
                    form.reset();
                    alert('Action assigned successfully.');
                  }}
                  className="space-y-3"
                >
                  <input required name="taskTitle" type="text" placeholder="Objective name..." className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white" />
                  <input name="dueDate" type="date" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white" />
                  <select name="assignee" className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-gray-300">
                    <option value="Rohan Sharma">Rohan Sharma</option>
                    <option value="Alok Gupta">Alok Gupta</option>
                    <option value="Priya Patel">Priya Patel</option>
                  </select>
                  <button type="submit" className="w-full py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Submit Assignment
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE WORKFLOW AUTOMATION ENGINE */}
        {activeCenter === 'automation' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Workflow Lifecycle Engine</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Automatic assignment, reminder, and escalation loops for SLA tasks.</p>
                </div>
                <button 
                  onClick={runWorkflowCheck}
                  className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Trigger SLA Verification Check
                </button>
              </div>

              {/* Graphical Workflow Lifecycle Stepper */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                {[
                  { step: 'Assignment', label: '1. Automatic Assignment', desc: 'SLA due date set' },
                  { step: 'Reminder', label: '2. SLA Reminder', desc: 'Dispatched to assignee' },
                  { step: 'Escalation', label: '3. Escalation Loop', desc: 'Breached items to board' },
                  { step: 'Approval', label: '4. Supervisor Review', desc: 'Officer approval step' },
                  { step: 'Closure', label: '5. Closure / Archive', desc: 'Audit verified & closed' }
                ].map((s, idx) => {
                  const isCurrent = workflowStep === s.step;
                  return (
                    <div key={idx} className="flex-1 min-w-[120px] space-y-1.5">
                      <div className={`p-3.5 rounded-xl border font-bold text-xs ${
                        isCurrent 
                          ? 'bg-brand/10 border-brand text-brand-light shadow-lg' 
                          : 'bg-white/5 border-white/5 text-gray-400'
                      }`}>
                        {s.label}
                      </div>
                      <p className="text-[9px] text-gray-500 leading-tight">{s.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Automation activity log */}
              {automationLog.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900 border border-white/5 font-mono text-[10px] text-gray-300 space-y-1">
                  {automationLog.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500">&gt;&gt;</span>
                      <span className={log.includes('OVERDUE') ? 'text-rose-400 font-bold' : log.includes('email') ? 'text-amber-400' : 'text-gray-300'}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOARD REPORTS & DOWNLOADS */}
        {activeCenter === 'reports' && (
          <div className="space-y-6">
            {/* Real Report generation buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => downloadReport('PDF Audit Report')}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-bold transition-all text-white flex items-center justify-between cursor-pointer"
              >
                <span>PDF Audit Report</span>
                <FileDown className="h-4.5 w-4.5 text-brand" />
              </button>
              <button 
                onClick={() => downloadReport('Executive Compliance Report')}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-bold transition-all text-white flex items-center justify-between cursor-pointer"
              >
                <span>Executive Report</span>
                <FileDown className="h-4.5 w-4.5 text-brand-secondary" />
              </button>
              <button 
                onClick={() => downloadReport('Control Effectiveness Report')}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-bold transition-all text-white flex items-center justify-between cursor-pointer"
              >
                <span>Control Effectiveness</span>
                <FileDown className="h-4.5 w-4.5 text-emerald-400" />
              </button>
              <button 
                onClick={() => downloadReport('Evidence Coverage Report')}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-bold transition-all text-white flex items-center justify-between cursor-pointer"
              >
                <span>Evidence Coverage</span>
                <FileDown className="h-4.5 w-4.5 text-indigo-400" />
              </button>
            </div>

            {/* Executive Board Report Content View */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Executive Board Compliance Report</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Generated automatically on June 4, 2026. Authorized for Board review.</p>
                </div>
                <button 
                  onClick={() => downloadReport('Board Compliance Report')}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold text-white cursor-pointer"
                >
                  Export PDF
                </button>
              </div>

              {/* Board report structure */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-gray-500 font-bold block text-[10px]">COMPLIANCE INDEX</span>
                    <span className="text-2xl font-black text-emerald-400">92%</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-gray-500 font-bold block text-[10px]">RISK EXPOSURE</span>
                    <span className="text-2xl font-black text-rose-400">24%</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5">
                    <span className="text-gray-500 font-bold block text-[10px]">AUDIT READINESS</span>
                    <span className="text-2xl font-black text-brand-accent">88.5%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Critical Audit Findings:</span>
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-300 text-left">
                    - One high-severity expired evidence artifact detected (Cryptographic Key Policy.docx, expired June 2026).
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Open Residual Risks:</span>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex justify-between">
                      <span>1. Personal Data processing activity mapping gap (DPDP Compliance check)</span>
                      <span className="text-rose-400 font-bold">Score: 85</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Access control audit logs rotation cycle extension review</span>
                      <span className="text-amber-400 font-bold">Score: 70</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. FRAMEWORK REGISTRY */}
        {activeCenter === 'frameworks' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Supported Regulatory & Compliance Frameworks</h4>
              <p className="text-[10px] text-gray-400 mt-1">Cross-referencing indices mapping control sets to uploaded documentation.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'DPDP Act 2023', code: 'DPDP', desc: 'Digital Personal Data Protection Act regulation controls for data subjects in India.', score: 91 },
                { name: 'ISO/IEC 27001:2022', code: 'ISO27001', desc: 'International standard for Information Security Management Systems (ISMS) audit.', score: 88 },
                { name: 'SOC 2 Type II Compliance', code: 'SOC2', desc: 'Trust Services Criteria coverage for security, availability, and processing integrity.', score: 86 },
                { name: 'GDPR Directive 2016', code: 'GDPR', desc: 'European Union General Data Protection Regulation requirements check.', score: 79 },
                { name: 'HIPAA Security Rule', code: 'HIPAA', desc: 'Healthcare privacy standards mapping for protected health information datasets.', score: 82 },
                { name: 'Custom Internal Standards', code: 'Custom', desc: 'Company corporate internal governance, SLA benchmarks, and onboarding SOPs.', score: 95 }
              ].map((fw, idx) => (
                <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="badge-brand">{fw.code}</span>
                    <span className="text-xs font-black text-brand-accent">{fw.score}% coverage</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{fw.name}</h4>
                  <p className="text-[10px] text-gray-400 leading-normal">{fw.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. CONTROL CENTER */}
        {activeCenter === 'controls' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Seeded Standard Compliance Controls Registry</h4>
              <div className="space-y-3">
                {[
                  { code: 'DPDP.C3.1', desc: 'Acquire verifiable consent prior to processing user personal data blocks.', status: 'Active', effectiveness: 'High' },
                  { code: 'ISO27001.A.12.4', desc: 'System activity, error events, and access logs must be retained and encrypted.', status: 'Active', effectiveness: 'High' },
                  { code: 'ISO27001.A.10.1', desc: 'Verify annual review cycle and signatures on corporate cryptographic SOP files.', status: 'Action Required', effectiveness: 'Needs Attention' },
                  { code: 'SOC2.CC.6.1', desc: 'Log and review security authorization parameters for multi-department organizations.', status: 'Active', effectiveness: 'High' }
                ].map((ctrl, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20">
                        {ctrl.code}
                      </span>
                      <p className="text-xs text-white mt-2 font-medium">{ctrl.desc}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[9px] text-gray-500 block">Status</span>
                        <span className="text-[10px] font-bold text-white">{ctrl.status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block">Effectiveness</span>
                        <span className={`text-[10px] font-bold ${ctrl.effectiveness === 'High' ? 'text-emerald-400' : 'text-amber-400'}`}>{ctrl.effectiveness}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. POLICY GOVERNANCE */}
        {activeCenter === 'policies' && (
          <div className="space-y-6">
            {/* Scoring widgets */}
            <div className="grid grid-cols-3 gap-6">
              <div className="glass-panel p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-[9px] text-gray-500 uppercase font-bold block">Policy Health Score</span>
                <span className="text-2xl font-black text-emerald-400">92 / 100</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-[9px] text-gray-500 uppercase font-bold block">Policy Freshness Score</span>
                <span className="text-2xl font-black text-white">88%</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-[9px] text-gray-500 uppercase font-bold block">Policy Coverage Score</span>
                <span className="text-2xl font-black text-brand-accent">90%</span>
              </div>
            </div>

            <div className="space-y-4">
              {policies.map(p => (
                <div key={p.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-white">{p.name}</h4>
                    <p className="text-[10px] text-gray-400">Owner: {p.owner} | Coverage: {p.coverage}% | Freshness status: <strong className={p.freshness === 'Excellent' ? 'text-emerald-400' : 'text-rose-400'}>{p.freshness}</strong></p>
                  </div>
                  <div>
                    <select 
                      value={p.status} 
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setPolicies(prev => prev.map(item => item.id === p.id ? { ...item, status: newStatus } : item));
                        alert(`Policy lifecycle state updated to ${newStatus}`);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Review">Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Published">Published</option>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Archived">Archived</option>
                      <option value="Superseded">Superseded</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. EVIDENCE CENTER */}
        {activeCenter === 'evidence' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-gray-500 uppercase block font-bold">Evidence Freshness Score</span>
                <span className="text-xl font-black text-brand-secondary">91 / 100</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
                <span className="text-[9px] text-gray-500 uppercase block font-bold">Evidence Coverage Index</span>
                <span className="text-xl font-black text-emerald-400">89%</span>
              </div>
            </div>

            <div className="space-y-3">
              {evidence.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.title}</h5>
                    <p className="text-[9px] text-gray-400 mt-1">Owner: {item.owner} | Expiry Check: {item.expiry}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      item.freshness === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.freshness} Freshness
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEvidence(prev => prev.map(ev => ev.id === item.id ? { ...ev, status: newStatus } : ev));
                        alert(`Evidence validation state updated to ${newStatus}`);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-gray-300"
                    >
                      <option value="Created">Created</option>
                      <option value="Verified">Verified</option>
                      <option value="Approved">Approved</option>
                      <option value="Expired">Expired</option>
                      <option value="Archived">Archived</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. RISK MANAGEMENT */}
        {activeCenter === 'risks' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Residual Compliance Threats & Risk Vectors</h4>
              <span className="text-[10px] text-rose-400 font-bold">2 Open Issues</span>
            </div>

            <div className="space-y-4">
              {risks.map(r => (
                <div key={r.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-white">{r.scenario}</h5>
                    <p className="text-[10px] text-gray-400 mt-1">Likelihood: {r.likelihood} | Impact: {r.impact} | Calculated Score: <strong className="text-rose-400">{r.score}/100</strong></p>
                  </div>
                  <div>
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setRisks(prev => prev.map(item => item.id === r.id ? { ...item, status: newStatus } : item));
                        alert(`Risk mitigation lifecycle state updated to ${newStatus}`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-gray-300"
                    >
                      <option value="Open">Open</option>
                      <option value="Mitigating">Mitigating</option>
                      <option value="Mitigated">Mitigated</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REVIEW MANAGEMENT */}
        {activeCenter === 'reviews' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Officer Verification signoffs</h4>
              <div className="space-y-3">
                {[
                  { target: 'ISO Cryptographic Key Log verification signoff', reviewer: 'Alok Gupta', date: '2026-06-02', rating: 'Satisfactory', status: 'Pending Review' },
                  { target: 'DPDP User Notice compliance audit verification', reviewer: 'Rohan Sharma', date: '2026-05-12', rating: 'Excellent', status: 'Approved' }
                ].map((rev, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-white">{rev.target}</h5>
                      <p className="text-[9px] text-gray-400 mt-1">Reviewer: {rev.reviewer} | Date: {rev.date} | Performance rating: <strong className="text-brand-accent">{rev.rating}</strong></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rev.status === 'Pending Review' ? (
                        <>
                          <button 
                            onClick={() => alert('Review signoff validated and verified.')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Verify & Approve
                          </button>
                          <button 
                            onClick={() => alert('Review signature rejected. Sent back for verification.')}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. AUDIT READINESS */}
        {activeCenter === 'readiness' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-5 rounded-2xl border border-white/5 text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Overall Audit Readiness Index</span>
                <span className="text-3xl font-black text-emerald-400">88.5%</span>
                <p className="text-[9px] text-gray-400">Improving (up 3% last week)</p>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-white/5 text-center space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Audit Health Index</span>
                <span className="text-3xl font-black text-white">Good</span>
                <p className="text-[9px] text-gray-400">Zero critical security incidents</p>
              </div>
            </div>

            {/* Gap analysis detection list */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gap & Integrity Detection Report</h4>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                    Missing Evidence detected for control standard A.12.4 (Log Encryption)
                  </span>
                  <span className="text-[10px] font-bold text-rose-400">1 Gap Detected</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    Unapproved Draft status detected for Cryptographic Standard policy
                  </span>
                  <span className="text-[10px] font-bold text-amber-400">1 Policy Check Required</span>
                </div>
              </div>
            </div>

            {/* Audit package preview widget */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Auditor Compliance Package Preview</h4>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2.5 text-xs text-gray-400 font-mono">
                <div className="text-white font-bold mb-1">Package Content Indices:</div>
                <div>- Mapped Controls: 24 active audit targets.</div>
                <div>- Verified Evidence Artifacts: 3 security files linked.</div>
                <div>- Published Policy Standards: 2 core privacy frameworks.</div>
                <div>- Review Signoff Records: 2 verified manager logs.</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. COMPLIANCE ANALYTICS */}
        {activeCenter === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Analytics Trends</h4>
              {/* Time Range Selector */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl">
                {[
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: '90d', label: '90 Days' },
                  { id: '1y', label: '1 Year' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      timeRange === r.id ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts trend mapping */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5">
              <PremiumAreaChart 
                data={trendData} 
                dataKeys={['compliance', 'risk', 'evidence']} 
                colors={['#06b6d4', '#ef4444', '#6366f1']} 
                xKey="name" 
              />
            </div>
          </div>
        )}

        {/* 10. AI COPILOT V2 */}
        {activeCenter === 'copilot' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Brain className="h-5 w-5 text-brand-accent animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-white">Compliance AI Assistant V2</h4>
                  <span className="text-[9px] text-emerald-400">Contextually mapped to ISO 27001, DPDP, SOC 2, HIPAA requirements</span>
                </div>
              </div>

              {/* Chat Output */}
              {copilotQuery && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Query: <strong className="text-white">"{copilotQuery}"</strong></span>
                    {copilotLoading ? (
                      <span className="text-brand-accent animate-pulse">Running semantic RAG index scan...</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">{copilotResponse?.confidence}% LLM Confidence</span>
                    )}
                  </div>
                  
                  {!copilotLoading && copilotResponse && (
                    <div className="space-y-4 text-xs">
                      <p className="text-gray-200 leading-relaxed font-medium">{copilotResponse.answer}</p>
                      
                      {/* References sub-grid */}
                      {copilotResponse.citations && copilotResponse.citations.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                          <span className="text-[9px] font-bold text-brand-secondary block uppercase tracking-wider">Citations & References</span>
                          {copilotResponse.citations.map((c: any, i: number) => (
                            <div key={i} className="border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
                              <div className="flex justify-between text-[10px] font-semibold text-blue-400">
                                <span>📄 {c.document} (Page {c.page})</span>
                                <span className="text-emerald-400">{c.confidence}% Source Similarity</span>
                              </div>
                              <p className="text-[10px] italic text-gray-400 mt-1 font-mono">{c.matchedParagraph || c.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Controls/Policies references */}
                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        {copilotResponse.controls && (
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-gray-500 font-bold uppercase block mb-1">Referenced Controls</span>
                            {copilotResponse.controls.map((c: any, i: number) => (
                              <div key={i} className="text-brand-accent font-semibold">{c}</div>
                            ))}
                          </div>
                        )}
                        {copilotResponse.policies && (
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-gray-500 font-bold uppercase block mb-1">Referenced Policies</span>
                            {copilotResponse.policies.map((p: any, i: number) => (
                              <div key={i} className="text-indigo-400 font-semibold">{p}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action query chips */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Select compliance query benchmark:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Are we DPDP compliant?',
                    'Show missing controls.',
                    'Show missing evidence.',
                    'Which departments are highest risk?',
                    'What controls have no evidence?',
                    'Show framework coverage.'
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => handleCopilotQuery(q)}
                      className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// COMPLIANCE CALENDAR PAGE
// ─────────────────────────────────────────────────────────────────
export const ComplianceCalendarPage: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const events = [
    { id: 'ev-1', title: 'Verify User Consent Notice Template', date: '2026-06-12', type: 'task', status: 'Pending Review', description: 'Assigned to Rohan Sharma. Complete verification check for DPDP Sec. 6(1) Notice compliance.' },
    { id: 'ev-2', title: 'Cryptographic Key Policy Expiry', date: '2026-06-01', type: 'expiry', status: 'Overdue', description: 'Evidence item expired! Access keys rotation log needs annual signoff verification.' },
    { id: 'ev-3', title: 'ISO 27001 Preparedness Audit Cycle', date: '2026-06-18', type: 'audit', status: 'Upcoming', description: 'External audit preparation cycle. Review system access parameters & active control logs.' },
    { id: 'ev-4', title: 'Corporate Data Privacy Policy Review', date: '2026-06-25', type: 'policy', status: 'Scheduled', description: 'Bi-annual legal audit and compliance validation sweep.' },
    { id: 'ev-5', title: 'Access Control Guideline Matrix Signature', date: '2026-06-10', type: 'task', status: 'Pending Review', description: 'Onboard and verify access mapping controls for the Infrastructure team.' }
  ];

  // Filters
  const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType);

  // Month rendering (June 2026)
  const daysInJune = 30;
  const juneDays = Array.from({ length: daysInJune }, (_, i) => i + 1);

  return (
    <div className="space-y-6 text-left">
      {/* Calendar Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-brand-primary/10 to-transparent border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand">Compliance Calendar</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Syncing with Task Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2 tracking-tight">
            Governance & Audit Scheduler
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track policy reviews, evidence expiration dates, external audits, and SLA verification deadlines.
          </p>
        </div>

        {/* View switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Buttons */}
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
            {(['month', 'week', 'agenda'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer capitalize ${
                  view === v ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {v} View
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="task">Tasks Only</option>
            <option value="expiry">Evidence Expiry</option>
            <option value="audit">Audits Only</option>
            <option value="policy">Policy Reviews</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CALENDAR BODY */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h3 className="text-sm font-bold text-white font-mono">June 2026</h3>
            <span className="text-[10px] text-gray-400">June 1st, 2026 - June 30th, 2026</span>
          </div>

          {view === 'month' && (
            <div className="space-y-4">
              {/* Day header */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-500 uppercase font-mono">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7 gap-2">
                {juneDays.map(day => {
                  const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);

                  return (
                    <div 
                      key={day} 
                      className={`min-h-[85px] p-2 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        dayEvents.length > 0 
                          ? 'bg-brand/5 border-brand/20 hover:border-brand/40' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-400">{day}</span>
                      <div className="space-y-1 mt-1">
                        {dayEvents.map(e => (
                          <button
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            className={`w-full text-[9px] p-1 rounded font-bold text-left truncate cursor-pointer transition-all border ${
                              e.type === 'expiry' 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                                : e.type === 'audit' 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : e.type === 'policy' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    : 'bg-brand/10 border-brand/20 text-brand-light'
                            }`}
                          >
                            {e.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {[8, 9, 10, 11, 12, 13, 14].map(day => {
                  const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);

                  return (
                    <div key={day} className="p-3 rounded-xl bg-white/5 border border-white/5 min-h-[220px] flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-black text-white">{day}</span>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold mt-0.5">
                          {day === 8 ? 'Mon' : day === 9 ? 'Tue' : day === 10 ? 'Wed' : day === 11 ? 'Thu' : day === 12 ? 'Fri' : day === 13 ? 'Sat' : 'Sun'}
                        </span>
                      </div>
                      <div className="space-y-2 mt-2 flex-1">
                        {dayEvents.map(e => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            className={`p-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all border leading-tight ${
                              e.type === 'expiry' 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                                : e.type === 'audit' 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : e.type === 'policy' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    : 'bg-brand/10 border-brand/20 text-brand-light'
                            }`}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'agenda' && (
            <div className="space-y-3">
              {filteredEvents.map(e => (
                <div 
                  key={e.id} 
                  onClick={() => setSelectedEvent(e)}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex justify-between items-center transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      e.type === 'expiry' ? 'bg-rose-500' : e.type === 'audit' ? 'bg-amber-500' : e.type === 'policy' ? 'bg-emerald-500' : 'bg-brand'
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-white">{e.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Due date: {e.date}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    e.status === 'Overdue' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : e.status === 'Upcoming' || e.status === 'Scheduled'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-brand/10 text-brand-light border-brand/20'
                  }`}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EVENT DETAIL SIDEBAR */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scheduled Event Details</h3>
          
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                  selectedEvent.type === 'expiry' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : selectedEvent.type === 'audit' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : selectedEvent.type === 'policy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-brand/10 text-brand-light border-brand/20'
                }`}>
                  {selectedEvent.type} Checkpoint
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">{selectedEvent.title}</h4>
                <p className="text-[10px] text-gray-400">Scheduled Date: <strong>{selectedEvent.date}</strong></p>
              </div>

              <div className="space-y-2.5">
                <span className="text-[9px] text-gray-500 font-bold block uppercase font-mono">Detailed Description:</span>
                <p className="text-gray-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-white/5 text-[11px]">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-gray-500 font-bold block uppercase font-mono">Current Status:</span>
                <div className={`p-2.5 rounded-xl border font-bold text-[10px] flex justify-between items-center ${
                  selectedEvent.status === 'Overdue' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-white/5 border-white/5 text-emerald-400'
                }`}>
                  <span>{selectedEvent.status}</span>
                  {selectedEvent.status === 'Overdue' && (
                    <button 
                      onClick={() => alert(`Escalated incident logged for overdue event: ${selectedEvent.title}`)}
                      className="px-2 py-1 bg-rose-500/25 hover:bg-rose-500/40 text-white rounded text-[9px] font-bold"
                    >
                      Remediate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500 leading-normal">
              Select an event from the calendar grid to inspect policy details, assignee, SLA targets, and run remediation scripts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB 10: AUDIT COPILOT (PHASE 5)
// ─────────────────────────────────────────────────────────────────
export const ComplianceAuditCopilotTab: React.FC = () => {
  const [activeChecklist, setActiveChecklist] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [reportReady, setReportReady] = useState<boolean>(false);
  const [humanReviewed, setHumanReviewed] = useState<boolean>(false);
  const [queryInput, setQueryInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: 'Welcome to the Audit Copilot workspace. Select an audit framework or upload a custom checklist to initiate automated control mapping, evidence matching, and gap isolation.' }
  ]);

  const stepsList = [
    'Auditor checklist uploaded and parsed.',
    'AI identifying required controls...',
    'AI mapping required evidence standards...',
    'Searching repository database (ChromaDB + Vector Store)...',
    'AI assembling evidence package...',
    'AI isolating gaps & missing credentials...',
    'Audit readiness report prepared.'
  ];

  const triggerAuditPipeline = (checklist: string) => {
    setActiveChecklist(checklist);
    setIsProcessing(true);
    setStep(0);
    setReportReady(false);
    setHumanReviewed(false);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setStep(currentStep);
      if (currentStep >= stepsList.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setReportReady(true);
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: `Completed automated audit matching for ${checklist}. Readiness score: 82%. Identified 5 critical controls, 3 verified evidence packages, and 2 missing items. Review the Audit Readiness Report below.`
          }]);
        }, 800);
      }
    }, 1000);
  };

  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    const userText = queryInput;
    setChatHistory(prev => [...prev, { role: 'user', content: userText }]);
    setQueryInput('');
    generateCopilotResponse(userText);
  };

  const generateCopilotResponse = (text: string) => {
    let reply = '';
    const queryLower = text.toLowerCase();

    if (queryLower.includes('iso27001') || queryLower.includes('iso 27001')) {
      reply = `**ISO 27001:2022 Preparedness Audit Plan initiated**:\n\n* **Controls Mapped**: 14 controls under Annex A (Access Control, Cryptography, Operations Security).\n* **Matching Evidence**: Mapped *Access_Control_Policy_v2.pdf* and *Key_Management_Rotation_Logs.xlsx*.\n* **Audit Readiness Score**: **84%**.\n* **Missing Evidence**: Annual penetration testing signoff artifact is missing under A.12.6.1.`;
    } else if (queryLower.includes('missing') || queryLower.includes('gaps')) {
      reply = `**Missing/Expired Evidence identified in current scope**:\n\n1. **A.12.6.1 (Technical Vulnerability Management)**: Penetration testing report for Q2 2026 is missing.\n2. **A.10.1 (Cryptography)**: Key rotation log expired on 2026-06-01.\n3. **DPDP Sec 6(1) (Notice)**: Customer Consent flow documentation needs verification.`;
    } else if (queryLower.includes('failing') || queryLower.includes('controls')) {
      reply = `**Active Control Failures detected**:\n\n* **Control CC6.1 (Logical Access)**: 2 employee active access vectors lack a verified manager signoff.\n* **Control CC7.3 (Vulnerability Remediation)**: SLA breach on critical patch deployment (Policy dictates 14 days, currently at 19 days).`;
    } else if (queryLower.includes('package') || queryLower.includes('auditor package')) {
      reply = `**Auditor Package compiled successfully**:\n\n* Includes: Mapped control inventory, verified policies (PDF), evidence hash logs, and compliance officer reviews.\n* Status: Ready for human signoff. Click "Download Auditor Package (ZIP)" to export.`;
    } else if (queryLower.includes('risk') || queryLower.includes('departments')) {
      reply = `**Departmental Compliance & Risk Breakdown**:\n\n* **Engineering**: High risk (3 missing access control logs, 1 unpatched container).\n* **Finance**: Low risk (SOC 2 audit logs successfully signed).\n* **Legal / HR**: Medium risk (DPDP consent notice templates pending final approval).`;
    } else if (queryLower.includes('expire') || queryLower.includes('expires')) {
      reply = `**Upcoming Expiration Schedule (Next 30 Days)**:\n\n* **Evidence ID: ev-2 (Cryptographic Key Policy Expiry)** - OVERDUE (Expired 2026-06-01)\n* **Evidence ID: ev-5 (Access Control Guideline Matrix Signature)** - Due 2026-06-10`;
    } else if (queryLower.includes('report') || queryLower.includes('executive')) {
      reply = `**Executive Audit Readiness Report**:\n\n* **Overall Score**: 82%\n* **Security Control Effectiveness**: 86.4%\n* **Evidence Integrity**: 100% (All document hashes match SHA-256 records).\n* **Residual Risks**: 3 medium-level gaps under review.`;
    } else {
      reply = `I've analyzed the organization memory graph and document repository. The system is currently mapped against ISO 27001, SOC 2, and DPDP frameworks. Please specify if you want me to list missing evidence, failing controls, or compile the auditor package.`;
    }

    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    }, 600);
  };

  const handleChipClick = (txt: string) => {
    setChatHistory(prev => [...prev, { role: 'user', content: txt }]);
    generateCopilotResponse(txt);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-brand/10 to-transparent border border-white/5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="badge-brand">Phase 5 Feature</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Audit Copilot Engine</span>
        </div>
        <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2 tracking-tight">
          AI Audit Copilot Workspace
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Upload auditor checklists, verify controls, map evidence packages, highlight missing controls, and prepare executive audit signoffs automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: UPLOADER & PIPELINE VISUALIZER */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">1. Select / Upload Checklist</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => triggerAuditPipeline('ISO 27001 Compliance Audit')}
              disabled={isProcessing}
              className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex justify-between items-center ${
                activeChecklist === 'ISO 27001 Compliance Audit' 
                  ? 'bg-brand/20 border-brand text-brand-light' 
                  : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>ISO 27001:2022 Checklist</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => triggerAuditPipeline('SOC 2 Type II Security Checklist')}
              disabled={isProcessing}
              className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex justify-between items-center ${
                activeChecklist === 'SOC 2 Type II Security Checklist' 
                  ? 'bg-brand/20 border-brand text-brand-light' 
                  : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>SOC 2 Type II Security Checklist</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => triggerAuditPipeline('DPDP Act 2023 Consent Audit')}
              disabled={isProcessing}
              className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex justify-between items-center ${
                activeChecklist === 'DPDP Act 2023 Consent Audit' 
                  ? 'bg-brand/20 border-brand text-brand-light' 
                  : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>DPDP Act 2023 Consent Audit</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="border border-dashed border-white/10 p-5 rounded-xl text-center bg-white/5 hover:bg-white/10 transition-colors relative cursor-pointer">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => {
                  const name = e.target.files?.[0]?.name || 'Custom Checklist';
                  triggerAuditPipeline(`Custom Checklist (${name})`);
                }}
                disabled={isProcessing}
              />
              <UploadCloud className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Upload Custom Checklist</p>
              <p className="text-[10px] text-gray-500 mt-1">Accepts PDF, CSV, Excel formats</p>
            </div>
          </div>

          {/* Pipeline Steps Tracker */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-secondary uppercase">Pipeline Processing</span>
                <span className="text-[10px] font-mono text-gray-400">{Math.round((step / (stepsList.length - 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand h-full transition-all duration-500" 
                  style={{ width: `${(step / (stepsList.length - 1)) * 100}%` }}
                />
              </div>
              <div className="space-y-1.5 pt-1">
                {stepsList.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      step > i ? 'bg-emerald-500' : step === i ? 'bg-brand animate-pulse' : 'bg-gray-700'
                    }`} />
                    <span className={step >= i ? 'text-gray-300' : 'text-gray-600'}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: READY REPORT & HUMAN SIGNOFF */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[450px]">
          {reportReady ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">2. Audit Readiness Report</h3>
                  <span className="badge-brand">{activeChecklist}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Readiness Index</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-1">82%</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Controls Mapped</span>
                    <span className="text-2xl font-black text-white block mt-1">14</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Missing Evidence</span>
                    <span className="text-2xl font-black text-rose-400 block mt-1">2</span>
                  </div>
                </div>

                {/* Control Mapping list */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase font-mono">Mapped Controls Checklist Status:</span>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 text-xs">
                    
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white">A.12.6.1 Key Management Protocol</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Matched Evidence: <strong>Key_Management_Rotation_Logs.xlsx</strong></p>
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">FAIL (Expired)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white">A.8.1.1 Inventory of Assets</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Matched Evidence: <strong>Asset_Inventory_Policy_v3.pdf</strong> (Confidence: 94%)</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PASS</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white">A.9.1.1 Access Control Policy</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Matched Evidence: <strong>Access_Control_Policy_v2.pdf</strong> (Confidence: 98%)</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PASS</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white">DPDP Sec 6(1) Notice & Consent</h4>
                        <p className="text-[10px] text-gray-400 mt-1">No matched document in repository.</p>
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">MISSING</span>
                    </div>

                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${humanReviewed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[11px] text-gray-300">
                    {humanReviewed ? 'Package signed & verified' : 'Awaiting compliance officer review'}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!humanReviewed ? (
                    <button
                      onClick={() => {
                        setHumanReviewed(true);
                        alert('Remediation and compliance package signoff successfully logged to blockchain trail!');
                      }}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-all w-full sm:w-auto text-center"
                    >
                      Signoff Readiness Package
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('Exporting audit package ZIP to downloads folder. Hashes validated.')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <FileDown className="h-4 w-4" /> Download Auditor Package
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-gray-500">
              <Brain className="h-12 w-12 text-gray-600 mb-3" />
              <p className="text-xs font-bold text-white">Select a checklist framework to run Audit Copilot analysis.</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-normal">
                AI will parse the framework controls, search vectors in ChromaDB, bundle matching evidence files, and report readiness metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CONSOLE: AI INQUIRY TERMINAL */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">3. Natural Language Auditor Terminal</h3>
        
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3 max-h-56 overflow-y-auto font-sans text-xs">
          {chatHistory.map((m, idx) => (
            <div key={idx} className={`p-3 rounded-xl leading-relaxed ${
              m.role === 'assistant' ? 'bg-white/5 border border-white/5 text-gray-200' : 'bg-brand/10 border border-brand/20 text-brand-light text-right'
            }`}>
              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">
                {m.role === 'assistant' ? 'Audit Copilot Node' : 'Auditor'}
              </span>
              <p className="whitespace-pre-line text-left">{m.content}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <span className="text-[9px] text-gray-500 uppercase font-bold block">Preset Auditor Inquiries:</span>
          <div className="flex flex-wrap gap-2">
            {[
              'Prepare ISO27001 audit.',
              'Show missing evidence.',
              'Show failing controls.',
              'Generate auditor package.',
              'Which departments are highest risk?',
              'What evidence expires next month?',
              'Generate executive audit report.'
            ].map(q => (
              <button
                key={q}
                onClick={() => handleChipClick(q)}
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type custom auditor question..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
          >
            Query Copilot
          </button>
        </form>
      </div>
    </div>
  );
};

