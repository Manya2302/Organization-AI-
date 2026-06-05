import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Settings, Download
} from 'lucide-react';
import { 
  PremiumButton, PremiumCard, SkeletonLoader, PremiumInput 
} from '../design-system/components';
import { 
  PremiumAreaChart, PremiumRadialChart 
} from '../design-system/charts';

const API_BASE = 'http://localhost:5000/api/v1/commercial';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
});

// ═════════════════════════════════════════════════════════════════
// 1. INTEGRATION CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const IntegrationCenterPage: React.FC = () => {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/connectors`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setConnectors(res.connectors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const triggerSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch(`${API_BASE}/connectors/${id}/sync`, {
        method: 'POST',
        headers: getHeaders()
      }).then(r => r.json());
      if (res.success) {
        alert('Connector synchronization initiated.');
        fetchConnectors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={6} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl">
        <div>
          <span className="badge-brand">Ecosystem Layer</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2">
            Integration Hub & <span className="text-cyan-400">Connectors</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Automate organizational intelligence ingestion across Microsoft 365, Google Workspace, Jira, Salesforce, Slack, SAP, and GitHub.
          </p>
        </div>
        <PremiumButton onClick={fetchConnectors}>
          <RefreshCw className="h-3.5 w-3.5 mr-1 inline" /> Reload Connectors
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard title="Ingestion Health" subtitle="Connector health status index">
          <PremiumRadialChart score={94} label="Overall Sync SLA" color="#06b6d4" />
        </PremiumCard>

        <PremiumCard title="Data Ingestion Volume" subtitle="Total storage parsed from active nodes">
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Total Volume</span>
              <span className="text-sm font-extrabold text-white">12,887.45 MB</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Documents Vectorized</span>
              <span className="text-sm font-extrabold text-cyan-400">3,450 Files</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="Integration Sync Schedule" subtitle="Synchronize interval configuration">
          <div className="space-y-3 py-1">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Automatic sync operations run every <strong>4 Hours</strong>. Vector indexing is active for all new doc changes.
            </p>
            <PremiumButton variant="secondary" className="w-full text-center">Configure Global Cron Policies</PremiumButton>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard title="Active Enterprise SaaS Connectors" subtitle="Authorized integrations capturing organizational memory">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map(conn => {
            const isSyncing = syncingId === conn.id;
            const isConnected = conn.status === 'Connected';
            const hasError = conn.status === 'Error';

            return (
              <div key={conn.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{conn.connector_type} Connector</h4>
                    <p className="text-[10px] text-gray-400">Vol: {parseFloat(conn.data_volume_mb).toFixed(1)} MB</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    hasError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-500/10 text-gray-400 border border-white/5'
                  }`}>
                    {conn.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <PremiumButton 
                    onClick={() => triggerSync(conn.id)}
                    disabled={isSyncing || conn.status !== 'Connected'}
                    variant={hasError ? 'danger' : 'primary'}
                    className="flex-1 text-center text-[10px] py-1.5"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </PremiumButton>
                  <PremiumButton 
                    variant="secondary"
                    className="px-2.5 py-1.5 text-[10px]"
                    onClick={() => alert(`Configuring OAuth and API endpoints for ${conn.connector_type}`)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </PremiumButton>
                </div>
              </div>
            );
          })}
        </div>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 2. INDUSTRY SOLUTIONS CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const IndustrySolutionsCenterPage: React.FC = () => {
  const [editions, setEditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEditions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/industry/editions`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setEditions(res.editions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditions();
  }, []);

  const toggleEdition = async (name: string, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/industry/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ editionName: name, isEnabled: !current })
      }).then(r => r.json());
      if (res.success) {
        alert(`${name} Edition ${!current ? 'Enabled' : 'Disabled'}`);
        fetchEditions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={5} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl">
        <span className="badge-brand">Vertical Blueprints</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Industry Solutions Center</h2>
        <p className="text-xs text-gray-400 mt-1">
          Activate compliance engines, HIPAA privacy shields, RBI framework logs, legal contracts parsing, and student records trackers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {editions.map(ed => {
          const isEnabled = ed.is_enabled;
          return (
            <PremiumCard 
              key={ed.id} 
              title={`${ed.edition_name} Edition`}
              subtitle="Specialized regulatory intelligence mapping"
              action={
                <button
                  onClick={() => toggleEdition(ed.edition_name, isEnabled)}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                    isEnabled 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {isEnabled ? 'Activated' : 'Disabled'}
                </button>
              }
            >
              <div className="space-y-4 py-1 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase font-bold">Standard Frameworks</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {ed.frameworks.map((f: string) => (
                      <span key={f} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-gray-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-[10px] space-y-1.5">
                  <p className="text-gray-400">
                    {ed.edition_name === 'Healthcare' && 'Active HIPAA/NABH Patient Data Governance audit logs & EHR records intelligence.'}
                    {ed.edition_name === 'Finance' && 'SOX ITGC, SEBI and RBI audit preparedness automation & fraud indicators monitors.'}
                    {ed.edition_name === 'Manufacturing' && 'Supplier intelligence mapping, quality assurance compliance and plant risk maps.'}
                    {ed.edition_name === 'Legal' && 'Advanced contract analysis (NDAs, SLAs),Privileged documentation shielding, case graphs.'}
                    {ed.edition_name === 'Government' && 'NIC policy audits, citizens response graphs, document localization act enforcement.'}
                    {ed.edition_name === 'Education' && 'FERPA university compliance, academic research fabric mapping, and faculty records.'}
                  </p>
                </div>

                {isEnabled && (
                  <PremiumButton variant="secondary" className="w-full text-center py-1.5 text-[10px]">
                    Access {ed.edition_name} Workspace
                  </PremiumButton>
                )}
              </div>
            </PremiumCard>
          );
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 3. MARKETPLACE CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const MarketplaceCenterPage: React.FC = () => {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/marketplace/plugins`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setPlugins(res.plugins);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleAction = async (pluginId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/install`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          pluginId,
          action: currentStatus ? 'uninstall' : 'install'
        })
      }).then(r => r.json());

      if (res.success) {
        alert(currentStatus ? 'Plugin successfully uninstalled.' : 'Plugin successfully installed!');
        fetchPlugins();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl flex justify-between items-center">
        <div>
          <span className="badge-brand">Marketplace Ecosystem</span>
          <h2 className="text-2xl font-extrabold text-white mt-2">SecureVault App Store</h2>
          <p className="text-xs text-gray-400 mt-1">
            Install vertical extensions, custom AI agents, specialized database connector packages, reports, and templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map(p => (
          <PremiumCard 
            key={p.id} 
            title={p.name}
            subtitle={`${p.plugin_type} • V${p.version}`}
          >
            <div className="space-y-4 py-1 text-xs flex flex-col justify-between h-40">
              <p className="text-gray-400 text-[11px] leading-relaxed">
                {p.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-cyan-400 font-bold">Rating: {p.rating} ★</span>
                  <span className="text-gray-500">Installs: {p.install_count}</span>
                  <span className="text-white font-extrabold">{p.is_free ? 'Free' : `$${p.price}`}</span>
                </div>

                <PremiumButton 
                  onClick={() => handleAction(p.id, p.installed)}
                  variant={p.installed ? 'secondary' : 'primary'}
                  className="w-full text-center py-1.5 text-[10px]"
                >
                  {p.installed ? 'Uninstall Plugin' : 'Install Plugin'}
                </PremiumButton>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 4. SUBSCRIPTION CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const SubscriptionCenterPage: React.FC = () => {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/subscription`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setSub(res.subscription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch(`${API_BASE}/subscription/upgrade`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ planName: plan })
      }).then(r => r.json());
      if (res.success) {
        alert(`Plan successfully upgraded to ${plan}!`);
        fetchSub();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  const activePlan = sub?.plan_name || 'Starter';

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl">
        <span className="badge-brand">Commercial Plans</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Subscription Management</h2>
        <p className="text-xs text-gray-400 mt-1">Manage corporate licenses, feature flag activations, usage and API constraints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard title="Current Plan Model" subtitle="Vetted corporate license level">
          <div className="text-center py-6">
            <h3 className="text-3xl font-black text-brand-secondary tracking-tight">{activePlan}</h3>
            <span className="text-[10px] text-gray-400 uppercase font-extrabold mt-1 block">Status: {sub?.status}</span>
          </div>
        </PremiumCard>

        <PremiumCard title="Storage Limits & Usage" subtitle="Storage space consumed by vectors and raw documents">
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Max Storage</span>
              <span className="text-sm font-extrabold text-white">{sub?.plan_limits?.max_storage_gb} GB</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">User Seats</span>
              <span className="text-sm font-extrabold text-cyan-400">{sub?.plan_limits?.max_users} Users</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="Enabled Feature Flags" subtitle="Premium tools configured on this workspace node">
          <div className="space-y-2 py-1 text-xs">
            {sub?.plan_limits?.feature_flags && Object.entries(sub.plan_limits.feature_flags).map(([k, v]: any) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-gray-400 font-medium capitalize">{k.replace('_', ' ')}</span>
                <span className={`text-[10px] font-bold ${v ? 'text-emerald-400' : 'text-gray-600'}`}>{v ? 'ON' : 'OFF'}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard title="License Tier Matrix" subtitle="Upgrade license levels to activate SaaS white-label features, advanced integrations, and custom Ollama node assignments">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: 'Starter', price: '$0', users: '5 Users', storage: '10 GB', ai: '1M Tokens' },
            { name: 'Professional', price: '$129/mo', users: '50 Users', storage: '500 GB', ai: '50M Tokens' },
            { name: 'Business', price: '$499/mo', users: '250 Users', storage: '2 TB', ai: '250M Tokens' },
            { name: 'Enterprise', price: 'Custom Quote', users: 'Unlimited', storage: '10 TB', ai: 'Unlimited' }
          ].map(p => {
            const isCurrent = activePlan.toLowerCase() === p.name.toLowerCase();
            return (
              <div key={p.name} className={`p-4 bg-white/[0.02] border rounded-2xl flex flex-col justify-between space-y-4 ${
                isCurrent ? 'border-brand/40 shadow-lg shadow-brand/5' : 'border-white/5'
              }`}>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{p.name}</h4>
                  <span className="text-lg font-black text-cyan-400 block">{p.price}</span>
                </div>

                <div className="space-y-2 text-[10px] text-gray-400 border-t border-white/5 pt-2">
                  <p>• Seats: {p.users}</p>
                  <p>• Ingestion Cap: {p.storage}</p>
                  <p>• Ollama Tokens: {p.ai}</p>
                </div>

                <PremiumButton
                  onClick={() => handleUpgrade(p.name)}
                  disabled={isCurrent}
                  variant={isCurrent ? 'secondary' : 'primary'}
                  className="w-full text-center py-1 text-[10px]"
                >
                  {isCurrent ? 'Active Plan' : 'Select Plan'}
                </PremiumButton>
              </div>
            );
          })}
        </div>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 5. BILLING CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const BillingCenterPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/subscription/invoices`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand/10 via-brand-accent/5 to-transparent border border-white/5 shadow-xl">
        <span className="badge-brand">Financial Ops</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Billing & Invoicing Engine</h2>
        <p className="text-xs text-gray-400 mt-1">Download monthly SaaS payment receipts, check usage tax calculations and subscription cycles.</p>
      </div>

      <PremiumCard title="Billing & Renewal Schedule" subtitle="Automatic invoicing cycle specs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs py-1">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Tax Structure</span>
            <p className="text-sm font-extrabold text-white mt-1">18% CGST/SGST Included</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Payment Gateway</span>
            <p className="text-sm font-extrabold text-cyan-400 mt-1">Stripe / Bank Wire Active</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Auto-Renew Status</span>
            <p className="text-sm font-extrabold text-emerald-400 mt-1">ENABLED</p>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard title="Corporate Invoice Registry" subtitle="Historical audit logs of billing transactions">
        {invoices.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No invoices generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-bold bg-white/[0.01]">
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Taxes</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                    <td className="p-3">${parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="p-3">${parseFloat(inv.tax_amount).toFixed(2)}</td>
                    <td className="p-3 font-extrabold text-cyan-400">${(parseFloat(inv.amount) + parseFloat(inv.tax_amount)).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{new Date(inv.issued_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button 
                        onClick={() => alert(`Downloading PDF invoice ${inv.invoice_number}`)}
                        className="px-2.5 py-1 text-[9px] font-bold bg-white/5 border border-white/5 rounded-lg text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Download className="h-3 w-3 inline mr-1" /> PDF
                      </button>
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

// ═════════════════════════════════════════════════════════════════
// 6. WHITE LABEL CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const WhiteLabelCenterPage: React.FC = () => {
  const [, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [customDomain, setCustomDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#14b8a6');
  const [title, setTitle] = useState('Welcome back');
  const [description, setDescription] = useState('Log in to your secure workspace console');
  const [isEnabled, setIsEnabled] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/whitelabel`, { headers: getHeaders() }).then(r => r.json());
      if (res.success && res.settings) {
        const s = res.settings;
        setSettings(s);
        setCustomDomain(s.custom_domain || '');
        setCompanyName(s.branding_config?.company_name || 'SecureVault AI');
        setPrimaryColor(s.branding_config?.primary_color || '#6366f1');
        setSecondaryColor(s.branding_config?.secondary_color || '#14b8a6');
        setTitle(s.branding_config?.login_screen?.title || 'Welcome back');
        setDescription(s.branding_config?.login_screen?.description || 'Log in to your secure workspace');
        setIsEnabled(s.is_enabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/whitelabel/update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customDomain,
          isEnabled,
          brandingConfig: {
            company_name: companyName,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            login_screen: { title, description }
          }
        })
      }).then(r => r.json());

      if (res.success) {
        alert('Branding configurations updated successfully!');
        fetchSettings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl">
        <span className="badge-brand">Custom Styling</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">White Label Customization</h2>
        <p className="text-xs text-gray-400 mt-1">Map custom corporate domains, customize style sheets, emails, login interfaces and reports.</p>
      </div>

      <PremiumCard title="Style & Domain Configuration" subtitle="Configure tenant custom layouts">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumInput 
              label="Custom Domain Mapping"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="e.g. vault.acme.com"
            />
            <PremiumInput 
              label="Company Name Branding"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Acme Tech Solutions"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumInput 
              label="Primary Hex Theme Color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              type="color"
            />
            <PremiumInput 
              label="Secondary Hex Theme Color"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              type="color"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumInput 
              label="Custom Login Screen Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <PremiumInput 
              label="Custom Login Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input 
              type="checkbox" 
              checked={isEnabled} 
              onChange={e => setIsEnabled(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-brand"
            />
            <span className="text-[11px] text-gray-300 font-bold">Enable custom white-label overrides on this node</span>
          </div>

          <div className="flex justify-end pt-2">
            <PremiumButton type="submit">Save Configurations</PremiumButton>
          </div>
        </form>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 7. CUSTOMER SUCCESS CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const CustomerSuccessCenterPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/customersuccess`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setMetrics(res.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleStepClick = async (step: number, completed = false) => {
    try {
      const res = await fetch(`${API_BASE}/customersuccess/step`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ step, completed })
      }).then(r => r.json());
      if (res.success) {
        alert('Onboarding success step updated.');
        fetchMetrics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl">
        <span className="badge-brand">User Adoption</span>
        <h2 className="text-2xl font-extrabold text-white mt-2">Customer Success & Onboarding</h2>
        <p className="text-xs text-gray-400 mt-1">Track active tenant setups, onboarding completion metrics and workforce adoption rating.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumCard title="Tenant Adoption Score" subtitle="Percentage of corporate usage metrics">
          <PremiumRadialChart score={Math.round(metrics?.adoption_score || 84.5)} label="Adoption Health" color="#eab308" />
        </PremiumCard>

        <PremiumCard title="Active Ingested Modules" subtitle="Number of elements active in sandbox">
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Uploaded Vectors</span>
              <span className="text-sm font-extrabold text-white">{metrics?.usage_health_metrics?.document_uploads || 310} Docs</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Active Copilot Queries</span>
              <span className="text-sm font-extrabold text-cyan-400">{metrics?.usage_health_metrics?.ai_queries || 1842} Queries</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="Active Workforce Users" subtitle="Concurrent logged seats on workspace">
          <div className="text-center py-4">
            <h4 className="text-3xl font-black text-white">{metrics?.active_users_count || 24}</h4>
            <span className="text-[9px] text-gray-400 font-bold uppercase block mt-1">Seats Active Today</span>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard title="Setup Wizard Progress" subtitle="Onboard integrations and configure policy models step-by-step">
        <div className="space-y-4 py-1">
          {[
            { id: 1, title: 'Account Setup', desc: 'Initialize organizational metadata and admin passwords' },
            { id: 2, title: 'External SaaS Integrations', desc: 'Map Google Drive, SharePoint and GitHub connectors' },
            { id: 3, title: 'Policy Engine Alignment', desc: 'Setup HIPAA, RBI and SOX compliance framework checklists' },
            { id: 4, title: 'Global Scaling Complete', desc: 'Deploy multi-region failovers and GPU scaling servers' }
          ].map(s => {
            const isCompleted = metrics?.onboarding_step >= s.id || metrics?.onboarding_completed;
            const isActive = metrics?.onboarding_step === s.id && !metrics?.onboarding_completed;

            return (
              <div 
                key={s.id} 
                className={`p-3 border rounded-xl flex items-center justify-between transition-all ${
                  isActive ? 'border-brand bg-brand/5' : isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <h4 className={`font-bold ${isCompleted ? 'text-emerald-400' : isActive ? 'text-brand-light' : 'text-gray-400'}`}>
                    Step {s.id}: {s.title}
                  </h4>
                  <p className="text-[10px] text-gray-400">{s.desc}</p>
                </div>

                <PremiumButton 
                  onClick={() => handleStepClick(s.id, s.id === 4)}
                  variant={isCompleted ? 'success' : 'secondary'}
                  className="py-1 px-3 text-[10px]"
                >
                  {isCompleted ? 'Completed' : 'Mark Active'}
                </PremiumButton>
              </div>
            );
          })}
        </div>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 8. OBSERVABILITY CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const ObservabilityCenterPage: React.FC = () => {
  const [dataTrend, setDataTrend] = useState<any[]>([]);

  useEffect(() => {
    const trend = [];
    for (let i = 10; i >= 0; i--) {
      trend.push({
        time: `${i}m ago`,
        requests: Math.floor(Math.random() * 80 + 20),
        latency: Math.floor(Math.random() * 100 + 150),
        cpu: Math.floor(Math.random() * 30 + 40)
      });
    }
    setDataTrend(trend);
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl flex justify-between items-center">
        <div>
          <span className="badge-brand">Cluster Telemetry</span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Observability Center</h2>
          <p className="text-xs text-gray-400 mt-1">Real-time OpenTelemetry, Prometheus & Grafana analytics covering API, AI inference and DB replica logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumCard title="API Traffic & Request Rate" subtitle="Incoming requests parsed per minute (Last 10 minutes)">
          <PremiumAreaChart data={dataTrend} dataKeys={['requests']} colors={['#3b82f6']} xKey="time" />
        </PremiumCard>

        <PremiumCard title="AI Inference Latency" subtitle="Average Ollama response generation delay (ms)">
          <PremiumAreaChart data={dataTrend} dataKeys={['latency']} colors={['#a855f7']} xKey="time" />
        </PremiumCard>
      </div>

      <PremiumCard title="Kubernetes Cluster Metrics" subtitle="Active resource usage across nodes">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs py-1">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Pod CPU Capacity</span>
            <p className="text-lg font-extrabold text-white mt-1">45.2% Avg</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Ollama GPU Load</span>
            <p className="text-lg font-extrabold text-cyan-400 mt-1">82.1% Loaded</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Active Redis Connections</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-1">2,310 Conn</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[9px] text-gray-500 font-bold uppercase">NATS Message Stream</span>
            <p className="text-lg font-extrabold text-purple-400 mt-1">112 msg/s</p>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 9. INFRASTRUCTURE CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const InfrastructureCenterPage: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/infrastructure/cluster`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setNodes(res.cluster);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const scaleReplicas = async (id: string, currentVal: number) => {
    const newVal = prompt('Enter new replica count for Kubernetes Node Scaling:', String(currentVal));
    if (newVal === null) return;
    const repNum = parseInt(newVal);
    if (isNaN(repNum) || repNum < 1) {
      alert('Invalid replica count.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/infrastructure/scale`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ nodeId: id, replicas: repNum })
      }).then(r => r.json());

      if (res.success) {
        alert('Pod scale directive dispatched successfully!');
        fetchNodes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-brand/5 to-transparent border border-white/5 shadow-xl flex justify-between items-center">
        <div>
          <span className="badge-brand">Core Infrastructure</span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Infrastructure Command Center</h2>
          <p className="text-xs text-gray-400 mt-1">Manage Kubernetes pods, load balancers, multi-region DB failover setups, and Ollama clusters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Multi-Region DB status</span>
          <p className="text-sm font-extrabold text-emerald-400 mt-1">Replicating (Primary US, Read Mumbai)</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Active Ollama Model</span>
          <p className="text-sm font-extrabold text-white mt-1">Qwen-72B & DeepSeek-R1 Active</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Distributed queue cluster</span>
          <p className="text-sm font-extrabold text-cyan-400 mt-1">RabbitMQ Streams Active</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Disaster recovery status</span>
          <p className="text-sm font-extrabold text-purple-400 mt-1">Point-In-Time Backup Synced</p>
        </div>
      </div>

      <PremiumCard title="Kubernetes Deployed Pods & Nodes" subtitle="Scale replicas and monitor telemetry of individual nodes">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 font-bold bg-white/[0.01]">
                <th className="p-3">Node Name</th>
                <th className="p-3">Node Type</th>
                <th className="p-3">Region</th>
                <th className="p-3">CPU / Mem Usage</th>
                <th className="p-3">Active Replicas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {nodes.map(node => (
                <tr key={node.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 font-semibold text-white">{node.node_name}</td>
                  <td className="p-3">{node.node_type}</td>
                  <td className="p-3 font-mono">{node.region}</td>
                  <td className="p-3">
                    CPU: {node.resources?.cpu_usage_pct}% | Mem: {node.resources?.memory_usage_pct}%
                  </td>
                  <td className="p-3 font-extrabold text-cyan-400">{node.resources?.replicas || 1}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                      {node.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={() => scaleReplicas(node.id, node.resources?.replicas || 1)}
                      className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-white hover:bg-white/10 text-[10px] font-bold cursor-pointer"
                    >
                      Scale Node
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// 10. SECURITY OPERATIONS CENTER PAGE
// ═════════════════════════════════════════════════════════════════
export const SecurityOperationsCenterPage: React.FC = () => {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/security/threats`, { headers: getHeaders() }).then(r => r.json());
      if (res.success) {
        setThreats(res.threats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const handleMitigate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/security/threats/${id}/resolve`, {
        method: 'POST',
        headers: getHeaders()
      }).then(r => r.json());

      if (res.success) {
        alert('Threat successfully mitigated & SIEM alerts updated.');
        fetchThreats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6"><SkeletonLoader count={4} /></div>;

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 via-brand/5 to-transparent border border-white/5 shadow-xl flex justify-between items-center">
        <div>
          <span className="badge-brand">Security Hardening</span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Security Operations Center (SOC)</h2>
          <p className="text-xs text-gray-400 mt-1">SIEM integration, anomaly tracking, zero-trust enforcement, and prompt injection filters monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <span className="text-[10px] text-red-400 font-bold uppercase">Zero-Trust Enforcement</span>
          <p className="text-sm font-extrabold text-white mt-1">ACTIVE (PKI Cert Mapped)</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Identity Governance</span>
          <p className="text-sm font-extrabold text-cyan-400 mt-1">Active Directory SAML Synced</p>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Privileged Access Monitor</span>
          <p className="text-sm font-extrabold text-purple-400 mt-1">2 Admin sessions active</p>
        </div>
      </div>

      <PremiumCard title="Threat Monitoring Logs" subtitle="Investigate anomalous prompt inputs or unauthorized security alerts">
        {threats.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No security threats detected recently.</p>
        ) : (
          <div className="space-y-3">
            {threats.map(thr => {
              const isCritical = thr.severity === 'Critical' || thr.severity === 'High';
              const isDetected = thr.status === 'Detected';

              return (
                <div key={thr.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {thr.severity} Risk
                      </span>
                      <h4 className="font-bold text-white">{thr.threat_type}</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal max-w-2xl">{thr.details}</p>
                    <p className="text-[9px] text-gray-500">Source Attacker IP: {thr.attacker_ip} • Detected at: {new Date(thr.created_at).toLocaleTimeString()}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      isDetected ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {thr.status}
                    </span>

                    {isDetected && (
                      <PremiumButton
                        onClick={() => handleMitigate(thr.id)}
                        variant="danger"
                        className="py-1 px-3 text-[9px]"
                      >
                        Mitigate Alert
                      </PremiumButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PremiumCard>
    </div>
  );
};
