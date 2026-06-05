import React, { useState, useRef, useEffect } from 'react'
import { Link, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts'
import { 
  FileText, Users, HardDrive, ShieldAlert, UploadCloud, Search, Trash2, RotateCcw, 
  Trash, UserPlus, CheckCircle, Activity, Key, Brain, Send, 
  ChevronRight, RefreshCcw, FolderOpen, Eye, Info, Network, TrendingUp,
  Sun, Moon, LogOut, History, BarChart3, Layers, Calendar, FileDown,
  Menu, Bell, Pin, Building2, Database, CheckSquare, Settings, ChevronLeft,
  Sparkles, AlertTriangle, Shield, Globe, Briefcase, Bot, Zap, Cpu, Target, Flame,
  Award, ShoppingBag, CreditCard
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Document } from '../store/useAppStore'
import { DocumentIntelligencePage, SimilarDocumentsPage, AIInsightsPage, AIQueuePage } from './AIPages'
import {
  AIGovernanceDashboardPage,
  AIModelRegistryPage,
  PromptGovernancePage,
  InjectionDefensePage,
  AIRiskTrustPage,
  AIApprovalsPage,
  AIUsagePoliciesPage,
  AIExplainabilityCenterPage,
  AIExecutiveDashboardPage
} from './AIGovernancePages'
import {
  EnterpriseIntelligenceCenterPage,
  ExecutiveIntelligenceCenterPage,
  DecisionIntelligenceCenterPage,
  WorkforceIntelligenceCenterPage,
  VendorIntelligenceCenterPage,
  ProjectIntelligenceCenterPage,
  KnowledgeFabricExplorerPage,
  DigitalTwinExplorerPage,
  EnterprisePredictionCenterPage,
  RelationshipGraphExplorerPage
} from './EIOSPages'
import {
  EnterpriseOperationsCenterPage,
  WorkflowOrchestratorPage,
  ActionCenterPage,
  RecommendationCenterPage,
  DecisionExecutionCenterPage,
  StrategicPlanningCenterPage,
  OperationalRiskCenterPage,
  EnterpriseCommandCenterPage,
  OutcomeAnalyticsCenterPage,
  DigitalWorkforceCenterPage,
  AutomationRulesCenterPage,
  EnterpriseNotificationsCenterPage
} from './AEOPPages'
import {
  KnowledgeCenterPage,
  ExpertDiscoveryPage,
  OrganizationalMemoryPage,
  KnowledgeGraphExplorerPage,
  KnowledgeRiskCenterPage,
  DepartmentIntelligencePage
} from './KnowledgePages'
import { ComplianceIntelligenceCenter, ComplianceOfficerCenterPage, ComplianceCalendarPage } from './CompliancePages'
import {
  DigitalTwinCenterPage,
  ScenarioPlanningStudioPage,
  SimulationCenterPage,
  ForecastIntelligencePage,
  StrategicIntelligencePage,
  DecisionSimulationPage,
  EnterpriseResiliencePage,
  ExecutiveWarRoomPage,
  AICouncilPage,
  EnterpriseStrategyPage
} from './DigitalTwinStrategyPages'
import {
  AuditCopilotCenterPage,
  AuditPlannerPage,
  AuditRiskCenterPage,
  EvidenceReadinessCenterPage,
  AIAuditorWorkspacePage,
  ExecutiveAuditCenterPage
} from './AuditCopilotPages'
import {
  IntegrationCenterPage,
  IndustrySolutionsCenterPage,
  MarketplaceCenterPage,
  SubscriptionCenterPage,
  BillingCenterPage,
  WhiteLabelCenterPage,
  CustomerSuccessCenterPage,
  ObservabilityCenterPage,
  InfrastructureCenterPage,
  SecurityOperationsCenterPage
} from './CommercialEcosystemPages'


// --- DASHBOARD CONTAINER & NAVIGATION ---
export const DashboardLayout: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAppStore()
  const navigate = useNavigate()

  // Sidebar States
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Selectors States
  const [activeOrg, setActiveOrg] = useState('Acme Tech (HQ)')
  const [activeDept, setActiveDept] = useState('Legal & Privacy')
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)

  // Top Nav Dropdowns
  const [showNotifications, setShowNotifications] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // References for click-outside
  const orgRef = useRef<HTMLDivElement>(null)
  const deptRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'Employee' && (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/')) {
      navigate('/dashboard/documents')
    }
  }, [user, navigate])

  // Close dropdowns on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false)
      }
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setShowDeptDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (taskRef.current && !taskRef.current.contains(event.target as Node)) {
        setShowTasks(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  // Mock organizations
  const organizations = [
    'Acme Tech (HQ)',
    'CogniVault Global Node',
    'SecureLabs Research'
  ]

  // Mock departments
  const departments = [
    'Legal & Privacy',
    'Infrastructure Sec',
    'Human Resources',
    'Finance & Audit'
  ]

  // Pinned / Favorites
  const favorites = [
    { label: 'Compliance Center', path: '/dashboard/compliance', icon: Layers },
    { label: 'Graph Explorer', path: '/dashboard/graph', icon: Network },
    { label: 'Documents Repository', path: '/dashboard/documents', icon: FolderOpen }
  ]

  // Recent Items
  const recents = [
    { label: 'DPDP Notice & Consent Logs.pdf', path: '/dashboard/documents' },
    { label: 'ISO 27001 Key Protocol.docx', path: '/dashboard/documents' },
    { label: 'Q4 Financial Statement Audit.xlsx', path: '/dashboard/documents' }
  ]

  // Notifications
  const notifications = [
    { id: 1, title: 'DPDP scan: 2 expired consent notice files detected.', time: '10m ago', unread: true },
    { id: 2, title: 'New compliance evidence artifact registered.', time: '1h ago', unread: true },
    { id: 3, title: 'Workflow: ISO 27001 Cryptographic Key review signed off.', time: '4h ago', unread: false }
  ]

  // Tasks
  const tasks = [
    { id: 1, text: 'Remediate gap: User Consent Notice', done: false, severity: 'HIGH' },
    { id: 2, text: 'Review annual Cryptographic Key Management', done: false, severity: 'MEDIUM' },
    { id: 3, text: 'Validate Q4 external financial reports', done: true, severity: 'LOW' }
  ]

  // Navigation Links structure
  const navGroups = [
    {
      title: 'ANALYTICS & VAULT',
      items: [
        ...(user.role !== 'Employee' ? [{ label: 'Console Analytics', path: '/dashboard', icon: Activity }] : []),
        { label: 'Documents Repository', path: '/dashboard/documents', icon: FolderOpen },
        ...(user.role !== 'Employee' ? [{ label: 'Employees / Team', path: '/dashboard/team', icon: Users }] : []),
        ...(user.role !== 'Employee' ? [{ label: 'Security Audit Logs', path: '/dashboard/audit', icon: ShieldAlert }] : []),
        { label: 'My Security Profile', path: '/dashboard/profile', icon: Key }
      ]
    },
    {
      title: 'ARTIFICIAL INTELLIGENCE',
      items: [
        ...(user.role !== 'Employee' ? [{ label: 'AI Insights', path: '/dashboard/insights', icon: TrendingUp }] : []),
        { label: 'Similarity Hub', path: '/dashboard/similar', icon: Network },
        ...(user.role !== 'Employee' ? [{ label: 'AI Queue Status', path: '/dashboard/queue', icon: Activity }] : [])
      ]
    },
    {
      title: 'ENTERPRISE GRAPH BRAIN',
      items: [
        { label: 'Knowledge Center', path: '/dashboard/knowledge-center', icon: Brain },
        { label: 'Expert Discovery', path: '/dashboard/experts', icon: Users },
        { label: 'Org Memory', path: '/dashboard/memory', icon: History },
        { label: 'Graph Explorer', path: '/dashboard/graph', icon: Network },
        { label: 'Dept Intelligence', path: '/dashboard/departments/intelligence', icon: BarChart3 },
        ...(user.role !== 'Employee' ? [{ label: 'Risk Center', path: '/dashboard/knowledge-risk', icon: ShieldAlert }] : [])
      ]
    },
    ...(user.role !== 'Employee' ? [
      {
        title: 'COMPLIANCE & AUDIT',
        items: [
          { label: 'Compliance Center', path: '/dashboard/compliance', icon: Layers },
          { label: 'Officer Command Center', path: '/dashboard/compliance-officer', icon: ShieldAlert },
          { label: 'Compliance Calendar', path: '/dashboard/compliance-calendar', icon: Calendar },
          { label: 'Audit Copilot', path: '/dashboard/audit-copilot', icon: Brain },
          { label: 'AI Auditor Workspace', path: '/dashboard/audit-ai', icon: Sparkles },
          { label: 'Executive Audit', path: '/dashboard/executive-audit', icon: BarChart3 },
          { label: 'Audit Planner', path: '/dashboard/audit-planner', icon: Sparkles },
          { label: 'Audit Risks', path: '/dashboard/audit-risks', icon: AlertTriangle },
          { label: 'Evidence Readiness', path: '/dashboard/evidence-readiness', icon: FileText }
        ]
      },
      {
        title: 'AI GOVERNANCE & CONTROL',
        items: [
          { label: 'Governance Console', path: '/dashboard/ai-governance', icon: Shield },
          { label: 'Model Registry', path: '/dashboard/ai-models', icon: Database },
          { label: 'Prompt Governance', path: '/dashboard/ai-prompts', icon: FileText },
          { label: 'Injection Defense', path: '/dashboard/ai-defense', icon: ShieldAlert },
          { label: 'Risk & Trust Engine', path: '/dashboard/ai-risks', icon: AlertTriangle },
          { label: 'Human-in-the-Loop', path: '/dashboard/ai-approvals', icon: Users },
          { label: 'Adoption & Policies', path: '/dashboard/ai-analytics', icon: BarChart3 },
          { label: 'AI Explainability', path: '/dashboard/ai-explainability', icon: Brain },
          { label: 'AI Executive', path: '/dashboard/ai-executive', icon: Activity }
        ]
      },
      {
        title: 'ENTERPRISE INTELLIGENCE OS',
        items: [
          { label: 'Intelligence Center', path: '/dashboard/eios', icon: Globe },
          { label: 'Executive Intelligence', path: '/dashboard/executive-intel', icon: Activity },
          { label: 'Decision Intelligence', path: '/dashboard/decisions', icon: History },
          { label: 'Workforce Intelligence', path: '/dashboard/workforce-intel', icon: Users },
          { label: 'Vendor Intelligence', path: '/dashboard/vendors-intel', icon: Building2 },
          { label: 'Project Intelligence', path: '/dashboard/projects-intel', icon: Briefcase },
          { label: 'Knowledge Fabric', path: '/dashboard/knowledge-fabric', icon: Brain },
          { label: 'Digital Twin Explorer', path: '/dashboard/digital-twin', icon: Activity },
          { label: 'Prediction Center', path: '/dashboard/enterprise-predictions', icon: TrendingUp },
          { label: 'Relationship Graph', path: '/dashboard/relationship-graph', icon: Network }
        ]
      },
      {
        title: 'AUTONOMOUS OPERATIONS',
        items: [
          { label: 'Operations Console', path: '/dashboard/aeop', icon: Cpu },
          { label: 'Workflows', path: '/dashboard/workflows', icon: Settings },
          { label: 'Action Center', path: '/dashboard/actions', icon: CheckSquare },
          { label: 'Recommendations', path: '/dashboard/recommendations', icon: Target },
          { label: 'Decision Outcomes', path: '/dashboard/decision-execution', icon: History },
          { label: 'Strategic Planning', path: '/dashboard/planning', icon: Calendar },
          { label: 'Operational Risk', path: '/dashboard/operational-risk', icon: ShieldAlert },
          { label: 'Command Center', path: '/dashboard/command-center', icon: Activity },
          { label: 'Outcome Analytics', path: '/dashboard/outcomes', icon: TrendingUp },
          { label: 'Digital Workforce', path: '/dashboard/digital-workforce', icon: Bot },
          { label: 'Automation Rules', path: '/dashboard/automation-rules', icon: Zap },
          { label: 'Notifications Feed', path: '/dashboard/notifications-feed', icon: Bell }
        ]
      },
      {
        title: 'COGNITIVE DIGITAL TWIN',
        items: [
          { label: 'Digital Twin Center', path: '/dashboard/digital-twin-center', icon: Network },
          { label: 'Scenario Studio', path: '/dashboard/scenario-planning', icon: Calendar },
          { label: 'Simulation Center', path: '/dashboard/simulation-center', icon: Cpu },
          { label: 'Forecast Intel', path: '/dashboard/forecast-intel', icon: TrendingUp },
          { label: 'Strategic Intel', path: '/dashboard/strategic-intel', icon: Target },
          { label: 'Decision Simulator', path: '/dashboard/decision-simulation', icon: Activity },
          { label: 'Resilience Center', path: '/dashboard/resilience-center', icon: Layers },
          { label: 'Executive War Room', path: '/dashboard/war-room', icon: Flame },
          { label: 'AI Council Center', path: '/dashboard/ai-council', icon: Bot },
          { label: 'Strategy Center', path: '/dashboard/strategy-center', icon: Zap }
        ]
      },
      {
        title: 'COMMERCIAL & SCALE',
        items: [
          { label: 'Integration Hub', path: '/dashboard/commercial/integrations', icon: Globe },
          { label: 'Industry Solutions', path: '/dashboard/commercial/industry', icon: Award },
          { label: 'App Marketplace', path: '/dashboard/commercial/marketplace', icon: ShoppingBag },
          { label: 'Subscription Center', path: '/dashboard/commercial/subscription', icon: CreditCard },
          { label: 'Billing & Invoices', path: '/dashboard/commercial/billing', icon: FileDown },
          { label: 'White Label Panel', path: '/dashboard/commercial/whitelabel', icon: Settings },
          { label: 'Customer Success', path: '/dashboard/commercial/customersuccess', icon: Users },
          { label: 'Observability Telemetry', path: '/dashboard/commercial/observability', icon: Activity },
          { label: 'Cluster Infrastructure', path: '/dashboard/commercial/infrastructure', icon: Cpu },
          { label: 'Security Operations', path: '/dashboard/commercial/security', icon: Shield }
        ]
      }
    ] : [])
  ]

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`relative z-40 bg-slate-950/70 border-r border-white/5 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out select-none ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Workspace Brand / Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-black text-white text-sm shadow-md shadow-brand-primary/20 shrink-0">
              SV
            </div>
            {!isCollapsed && (
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-brand-secondary tracking-widest block uppercase">SecureVault AI</span>
                <span className="text-xs font-extrabold text-white truncate max-w-[120px] block mt-0.5">Control Tower</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* SELECTORS SECTION */}
        {!isCollapsed && (
          <div className="p-3 border-b border-white/5 space-y-2 shrink-0">
            {/* Org Selector */}
            <div ref={orgRef} className="relative">
              <button 
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-200 hover:bg-white/10 transition-all font-semibold"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-brand-secondary shrink-0" />
                  <span className="truncate">{activeOrg}</span>
                </div>
                <ChevronRight className={`h-3 w-3 text-gray-500 transition-transform ${showOrgDropdown ? 'rotate-90' : ''}`} />
              </button>
              {showOrgDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                  {organizations.map(org => (
                    <button
                      key={org}
                      onClick={() => {
                        setActiveOrg(org)
                        setShowOrgDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${activeOrg === org ? 'bg-brand text-white font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dept Selector */}
            <div ref={deptRef} className="relative">
              <button 
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-200 hover:bg-white/10 transition-all font-semibold"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Activity className="h-3.5 w-3.5 text-brand-accent shrink-0" />
                  <span className="truncate">{activeDept} Dept</span>
                </div>
                <ChevronRight className={`h-3 w-3 text-gray-500 transition-transform ${showDeptDropdown ? 'rotate-90' : ''}`} />
              </button>
              {showDeptDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                  {departments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => {
                        setActiveDept(dept)
                        setShowDeptDropdown(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${activeDept === dept ? 'bg-brand text-white font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      {dept} Dept
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 pr-1">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed ? (
                <span className="text-[9px] font-bold text-slate-500 tracking-widest block uppercase px-3.5 py-1 text-left">
                  {group.title}
                </span>
              ) : (
                <div className="border-t border-white/5 my-2 mx-2" />
              )}
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = window.location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className={`flex items-center rounded-xl transition-all ${
                      isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3.5 py-2'
                    } ${
                      isActive 
                        ? 'bg-brand/10 text-brand-light font-bold border border-brand/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand' : ''}`} />
                    {!isCollapsed && <span className="text-xs font-semibold text-left">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* PINNED / FAVORITES SECTION */}
          {!isCollapsed && (
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[9px] font-bold text-slate-500 tracking-widest block uppercase px-3.5 py-1 text-left flex items-center gap-1">
                <Pin className="h-3 w-3 text-brand-secondary" /> Pinned Favorites
              </span>
              {favorites.map((fav, i) => {
                const Icon = fav.icon
                return (
                  <Link
                    key={i}
                    to={fav.path}
                    className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-all border border-transparent"
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-accent/70 shrink-0" />
                    <span className="truncate">{fav.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* RECENT ITEMS SECTION */}
          {!isCollapsed && (
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[9px] font-bold text-slate-500 tracking-widest block uppercase px-3.5 py-1 text-left flex items-center gap-1">
                <History className="h-3 w-3 text-brand-secondary" /> Recent Activity
              </span>
              {recents.map((rec, i) => (
                <Link
                  key={i}
                  to={rec.path}
                  className="block px-3.5 py-1.5 rounded-xl text-[10px] text-gray-400 hover:bg-white/5 hover:text-white transition-all truncate text-left font-medium"
                  title={rec.label}
                >
                  📄 {rec.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SYSTEM STATUS WIDGET */}
        {!isCollapsed && (
          <div className="p-3 border-t border-white/5 shrink-0">
            <div className="p-3 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 border border-brand-primary/20 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-secondary uppercase">
                <Database className="h-3.5 w-3.5" /> Ollama Node Local
              </div>
              <p className="text-[9px] text-gray-400 leading-tight">
                Model: <strong>Qwen3 (8B)</strong> active. ChromaDB vectorized.
              </p>
            </div>
          </div>
        )}

        {/* Theme + Toggle Sidebar Footer */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-1.5 shrink-0">
          <div className="flex gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-yellow-400" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex-1 flex items-center justify-center p-2 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 text-red-400 transition-colors cursor-pointer"
              title="Logout Node"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent"
              title="Expand Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER (TOP NAVIGATION + COMPONENT ROUTE) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
          
          {/* Left: Collapsible toggle + Search Input */}
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            {isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}

            {/* Global Search Input */}
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
              <input
                type="text"
                placeholder="Global vault search (press '/' to focus)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 focus:bg-white/[0.07] transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-gray-400 font-bold">
                Ctrl+K
              </span>
            </div>
          </div>

          {/* Right: Health badge + Notifications + Tasks + Profile */}
          <div className="flex items-center gap-4.5">
            
            {/* System Health Badges Panel */}
            <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-[10px]">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-400 font-semibold uppercase">Ollama</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-gray-400 font-semibold uppercase">Chroma</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-gray-400 font-semibold uppercase">Neo4j</span>
              </div>
            </div>

            {/* Tasks checklist dropdown */}
            <div ref={taskRef} className="relative">
              <button 
                onClick={() => {
                  setShowTasks(!showTasks)
                  setShowNotifications(false)
                  setShowProfileDropdown(false)
                }}
                className="relative p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent"
              >
                <CheckSquare className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-secondary" />
              </button>

              {showTasks && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left glass-panel">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Tasks</h4>
                    <span className="badge-brand">2 open</span>
                  </div>
                  <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-2.5 border border-transparent">
                        <input
                          type="checkbox"
                          checked={task.done}
                          readOnly
                          className="mt-0.5 rounded border-white/10 bg-white/5 text-brand"
                        />
                        <div className="flex-1">
                          <span className={`text-[11px] font-semibold block leading-tight ${task.done ? 'line-through text-gray-500' : 'text-white'}`}>
                            {task.text}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                            task.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {task.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Alert Dropdown */}
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowTasks(false)
                  setShowProfileDropdown(false)
                }}
                className="relative p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-accent animate-ping" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-accent" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left glass-panel">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Alerts</h4>
                    <button 
                      onClick={() => alert('All compliance notices marked read.')}
                      className="text-[10px] font-bold text-brand-secondary hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors space-y-1 border border-transparent">
                        <div className="flex justify-between items-center">
                          <span className={`h-1.5 w-1.5 rounded-full ${n.unread ? 'bg-brand' : 'bg-transparent'}`} />
                          <span className="text-[9px] text-gray-500 font-bold">{n.time}</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-200 leading-normal">{n.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button 
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown)
                  setShowTasks(false)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all text-left cursor-pointer border border-transparent"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center font-bold text-white text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block leading-tight text-xs pr-1">
                  <h4 className="font-extrabold text-white truncate max-w-[100px]">{user.name || 'User'}</h4>
                  <span className="text-[9px] text-brand-accent block uppercase font-bold mt-0.5">{user.role}</span>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-left glass-panel">
                  <div className="p-2 border-b border-white/5 mb-1.5">
                    <p className="text-[10px] text-gray-500 font-bold truncate">{user.email}</p>
                  </div>
                  <Link 
                    to="/dashboard/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 transition-colors font-semibold"
                  >
                    <Settings className="h-3.5 w-3.5 text-gray-400" /> System Settings
                  </Link>
                  <button 
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-400" /> Sign Out Node
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* CONTAINER ROUTE VIEW */}
        <main className="flex-1 bg-slate-50 dark:bg-dark-bg p-6 overflow-y-auto text-slate-800 dark:text-gray-100 transition-colors duration-300">
          <Routes>
            {user.role !== 'Employee' ? (
              <Route path="/" element={<ConsoleAnalytics />} />
            ) : (
              <Route path="/" element={<Navigate to="/dashboard/documents" replace />} />
            )}
            <Route path="/documents" element={<DocumentsRepository />} />
            {user.role !== 'Employee' && <Route path="/team" element={<TeamManagement />} />}
            {user.role !== 'Employee' && <Route path="/audit" element={<AuditLogsView />} />}
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/intelligence/:docId" element={<DocumentIntelligencePage />} />
            <Route path="/similar" element={<SimilarDocumentsPage />} />
            {user.role !== 'Employee' && <Route path="/insights" element={<AIInsightsPage />} />}
            {user.role !== 'Employee' && <Route path="/queue" element={<AIQueuePage />} />}
            
            {/* Phase 3 Knowledge Brain Routes */}
            <Route path="/knowledge-center" element={<KnowledgeCenterPage />} />
            <Route path="/experts" element={<ExpertDiscoveryPage />} />
            <Route path="/memory" element={<OrganizationalMemoryPage />} />
            <Route path="/graph" element={<KnowledgeGraphExplorerPage />} />
            <Route path="/departments/intelligence" element={<DepartmentIntelligencePage />} />
            {user.role !== 'Employee' && <Route path="/knowledge-risk" element={<KnowledgeRiskCenterPage />} />}
            {user.role !== 'Employee' && (
              <>
                <Route path="/compliance" element={<ComplianceIntelligenceCenter />} />
                <Route path="/compliance-officer" element={<ComplianceOfficerCenterPage />} />
                <Route path="/compliance-calendar" element={<ComplianceCalendarPage />} />
                
                {/* Phase 5 Audit Copilot Routes */}
                <Route path="/audit-copilot" element={<AuditCopilotCenterPage />} />
                <Route path="/audit-ai" element={<AIAuditorWorkspacePage />} />
                <Route path="/executive-audit" element={<ExecutiveAuditCenterPage />} />
                <Route path="/audit-planner" element={<AuditPlannerPage />} />
                <Route path="/audit-risks" element={<AuditRiskCenterPage />} />
                <Route path="/evidence-readiness" element={<EvidenceReadinessCenterPage />} />
                
                {/* Phase 6 AI Governance Routes */}
                <Route path="/ai-governance" element={<AIGovernanceDashboardPage />} />
                <Route path="/ai-models" element={<AIModelRegistryPage />} />
                <Route path="/ai-prompts" element={<PromptGovernancePage />} />
                <Route path="/ai-defense" element={<InjectionDefensePage />} />
                <Route path="/ai-risks" element={<AIRiskTrustPage />} />
                <Route path="/ai-approvals" element={<AIApprovalsPage />} />
                <Route path="/ai-analytics" element={<AIUsagePoliciesPage />} />
                <Route path="/ai-explainability" element={<AIExplainabilityCenterPage />} />
                <Route path="/ai-executive" element={<AIExecutiveDashboardPage />} />
                
                {/* Phase 7 EIOS Routes */}
                <Route path="/eios" element={<EnterpriseIntelligenceCenterPage />} />
                <Route path="/executive-intel" element={<ExecutiveIntelligenceCenterPage />} />
                <Route path="/decisions" element={<DecisionIntelligenceCenterPage />} />
                <Route path="/workforce-intel" element={<WorkforceIntelligenceCenterPage />} />
                <Route path="/vendors-intel" element={<VendorIntelligenceCenterPage />} />
                <Route path="/projects-intel" element={<ProjectIntelligenceCenterPage />} />
                <Route path="/knowledge-fabric" element={<KnowledgeFabricExplorerPage />} />
                <Route path="/digital-twin" element={<DigitalTwinExplorerPage />} />
                <Route path="/enterprise-predictions" element={<EnterprisePredictionCenterPage />} />
                <Route path="/relationship-graph" element={<RelationshipGraphExplorerPage />} />
                
                {/* Phase 8 AEOP Routes */}
                <Route path="/aeop" element={<EnterpriseOperationsCenterPage />} />
                <Route path="/workflows" element={<WorkflowOrchestratorPage />} />
                <Route path="/actions" element={<ActionCenterPage />} />
                <Route path="/recommendations" element={<RecommendationCenterPage />} />
                <Route path="/decision-execution" element={<DecisionExecutionCenterPage />} />
                <Route path="/planning" element={<StrategicPlanningCenterPage />} />
                <Route path="/operational-risk" element={<OperationalRiskCenterPage />} />
                <Route path="/command-center" element={<EnterpriseCommandCenterPage />} />
                <Route path="/outcomes" element={<OutcomeAnalyticsCenterPage />} />
                <Route path="/digital-workforce" element={<DigitalWorkforceCenterPage />} />
                <Route path="/automation-rules" element={<AutomationRulesCenterPage />} />
                <Route path="/notifications-feed" element={<EnterpriseNotificationsCenterPage />} />

                {/* Phase 9 Digital Twin & Strategy Routes */}
                <Route path="/digital-twin-center" element={<DigitalTwinCenterPage />} />
                <Route path="/scenario-planning" element={<ScenarioPlanningStudioPage />} />
                <Route path="/simulation-center" element={<SimulationCenterPage />} />
                <Route path="/forecast-intel" element={<ForecastIntelligencePage />} />
                <Route path="/strategic-intel" element={<StrategicIntelligencePage />} />
                <Route path="/decision-simulation" element={<DecisionSimulationPage />} />
                <Route path="/resilience-center" element={<EnterpriseResiliencePage />} />
                <Route path="/war-room" element={<ExecutiveWarRoomPage />} />
                <Route path="/ai-council" element={<AICouncilPage />} />
                <Route path="/strategy-center" element={<EnterpriseStrategyPage />} />
                
                {/* Phase 10 Commercial, Ecosystem & Scaling Routes */}
                <Route path="/commercial/integrations" element={<IntegrationCenterPage />} />
                <Route path="/commercial/industry" element={<IndustrySolutionsCenterPage />} />
                <Route path="/commercial/marketplace" element={<MarketplaceCenterPage />} />
                <Route path="/commercial/subscription" element={<SubscriptionCenterPage />} />
                <Route path="/commercial/billing" element={<BillingCenterPage />} />
                <Route path="/commercial/whitelabel" element={<WhiteLabelCenterPage />} />
                <Route path="/commercial/customersuccess" element={<CustomerSuccessCenterPage />} />
                <Route path="/commercial/observability" element={<ObservabilityCenterPage />} />
                <Route path="/commercial/infrastructure" element={<InfrastructureCenterPage />} />
                <Route path="/commercial/security" element={<SecurityOperationsCenterPage />} />
              </>
            )}
            
            <Route path="*" element={<Navigate to="/dashboard/documents" replace />} />
          </Routes>
        </main>

      </div>

      {/* Floating Chat Copilot Panel */}
      <FloatingAICopilot />
    </div>
  )
}

// --- 1. CONSOLE ANALYTICS ---
const ConsoleAnalytics: React.FC = () => {
  const { documents, employees, auditLogs, theme } = useAppStore()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const gridStroke = isDark ? '#161a29' : '#e2e8f0'
  const tooltipBg = isDark ? '#0b0d16' : '#ffffff'
  const tooltipBorder = isDark ? '#161a29' : '#cbd5e1'
  const tooltipColor = isDark ? '#fff' : '#0f172a'
  const textStroke = isDark ? '#6b7280' : '#475569'

  const totalDocs = documents.filter(d => !d.isDeleted).length
  const totalEmployees = employees.length
  const recentLogs = auditLogs.slice(0, 5)

  // Chart Mock Data
  const uploadHistoryData = [
    { name: 'May 26', count: 3 },
    { name: 'May 27', count: 5 },
    { name: 'May 28', count: 8 },
    { name: 'May 29', count: 4 },
    { name: 'May 30', count: 12 },
    { name: 'May 31', count: 7 },
    { name: 'Jun 01', count: documents.length }
  ]

  const storageByDeptData = [
    { name: 'Legal', size: 2.4 },
    { name: 'Finance', size: 1.8 },
    { name: 'HR', size: 0.95 },
    { name: 'Engineering', size: 0.5 },
    { name: 'Marketing', size: 0.2 }
  ]

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Console Analytics</h2>
          <p className="text-xs text-gray-400">Real-time repository telemetry and compliance tracking</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
          <CheckCircle className="h-4 w-4 text-green-400" /> DB Connection Secure (PostgreSQL)
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Documents</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-white">{totalDocs}</span>
            <FileText className="h-5 w-5 text-brand-secondary" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Team Size</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-white">{totalEmployees}</span>
            <Users className="h-5 w-5 text-brand-accent" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Storage Utilization</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-white">5.15 MB</span>
            <HardDrive className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="w-full bg-white/5 rounded-full h-1">
            <div className="bg-brand-primary h-1 rounded-full" style={{ width: '4%' }}></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Security Alerts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-green-400">0</span>
            <ShieldAlert className="h-5 w-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Daily Document Uploads Activity</h4>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadHistoryData}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={textStroke} />
                <YAxis stroke={textStroke} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipColor }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Department Data Volume Allocation (MB)</h4>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storageByDeptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={textStroke} />
                <YAxis stroke={textStroke} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipColor }} />
                <Bar dataKey="size" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {storageByDeptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#06b6d4' : '#a855f7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Copilot Readiness & Security Telemetry Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Readiness Card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Audit Readiness Score</h4>
            <p className="text-[10px] text-gray-400 mt-1">AI-calculated composite framework compliance status</p>
          </div>
          <div className="flex items-center gap-4 py-2">
            <span className="text-4xl font-extrabold text-brand-light">85%</span>
            <div className="text-xs text-gray-300">
              <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Controls: 92%</div>
              <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Evidence: 78%</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard/audit-copilot')}
            className="w-full py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Open Copilot Center
          </button>
        </div>

        {/* Missing Requirements Counters */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Framework Requirement Gaps</h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="block text-xl font-bold text-red-400">3</span>
              <span className="text-[8px] text-gray-400 uppercase font-bold block mt-1">Missing Evidence</span>
            </div>
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="block text-xl font-bold text-amber-400">2</span>
              <span className="text-[8px] text-gray-400 uppercase font-bold block mt-1">Missing Policies</span>
            </div>
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="block text-xl font-bold text-yellow-400">1</span>
              <span className="text-[8px] text-gray-400 uppercase font-bold block mt-1">Gapped Controls</span>
            </div>
          </div>
        </div>

        {/* Risk & Remediation Widget */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Audit Risks & Control Health</h4>
            <p className="text-[10px] text-gray-400 mt-1">Dynamic simulation of pre-audit failure points</p>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-300">Open Risk Items:</span>
            <span className="text-red-400 font-bold">2 High Risks</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-300">Control Coverage:</span>
            <span className="text-emerald-400 font-bold">14 / 15 Passed</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard/audit-risks')}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl border border-white/5 transition-all cursor-pointer"
          >
            Review Audit Risks
          </button>
        </div>
      </div>

      {/* Recent Activity Log Snippet */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent System Audit Activity</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-2 font-bold">User</th>
                <th className="pb-2 font-bold">Action</th>
                <th className="pb-2 font-bold">Details</th>
                <th className="pb-2 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 font-medium">{log.user} ({log.role})</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-white/5 text-brand-secondary font-semibold">{log.action}</span></td>
                  <td className="py-2.5 text-gray-400">{log.details}</td>
                  <td className="py-2.5 text-gray-500">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- 2. DOCUMENTS REPOSITORY (CRUD, OCR, PREVIEW & VERSIONING) ---
const DocumentsRepository: React.FC = () => {
  const { documents, uploadDocument, deleteDocument, restoreDocument, addNewVersion, searchQuery, setSearchQuery } = useAppStore()
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const handleDocumentDownload = async (docId: string, filename: string) => {
    try {
      const token = localStorage.getItem('sv_access_token') || '';
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      
      const response = await fetch(`${API_BASE}/documents/${docId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download file. Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    }
  };
  
  // Form states
  const [category, setCategory] = useState('Compliance')
  const [tagsInput, setTagsInput] = useState('')
  const [dept, setDept] = useState('Legal')
  
  // Trash bin display toggle
  const [showTrash, setShowTrash] = useState(false)
  
  // Custom file upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const versionInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadDocument(
        { name: file.name, size: file.size, type: file.type },
        category,
        tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        dept
      )
      // reset forms
      setTagsInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleNewVersionUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      addNewVersion(docId, file.name, sizeStr)
      if (versionInputRef.current) versionInputRef.current.value = ''
      
      // Update selected doc in view modal to show latest changes
      setTimeout(() => {
        const latestDoc = useAppStore.getState().documents.find(d => d.id === docId)
        if (latestDoc) setSelectedDoc(latestDoc)
      }, 200)
    }
  }

  // Filter out files based on search and trash view state
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (showTrash) {
      return doc.isDeleted && matchesSearch
    } else {
      return !doc.isDeleted && matchesSearch
    }
  })

  return (
    <div className="space-y-6 text-left relative">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Documents Repository</h2>
        <p className="text-xs text-gray-400">AES encrypted storage with automatic PaddleOCR text extraction</p>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Search className="h-4 w-4" /></span>
          <input
            type="text"
            placeholder="Search by filename, tag, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTrash(!showTrash)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showTrash ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/10 text-gray-300'
            }`}
          >
            {showTrash ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {showTrash ? 'Console Repository' : 'Trash'}
          </button>
        </div>
      </div>

      {/* Upload Panel (Show only if not viewing trash) */}
      {!showTrash && (
        <div className="glass-panel p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
            <select 
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-dark-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Compliance">Compliance</option>
              <option value="Legal">Legal</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Contracts">Contracts</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Department</label>
            <select 
              value={dept} onChange={e => setDept(e.target.value)}
              className="w-full bg-dark-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Legal">Legal</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Comma Tags</label>
            <input 
              type="text" placeholder="e.g. DPDP, audit, Q4"
              value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <input 
              type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.png,.jpg,.jpeg" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" /> Upload Document
            </button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 text-xs">
            No files found in {showTrash ? 'trash' : 'workspace'}.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-brand-primary/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3 text-left">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-secondary border border-brand-primary/10">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-bold text-brand-accent uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                    {doc.category}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-bold text-sm text-white truncate" title={doc.name}>{doc.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Size: {doc.size} | Ver: {doc.version}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                <span className="text-[9px] text-gray-500">By {doc.uploadedBy}</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="View details & OCR text"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <Link 
                    to={`/dashboard/intelligence/${doc.id}`}
                    className="p-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-secondary transition-colors"
                    title="AI Intelligence Analysis"
                  >
                    <Brain className="h-3.5 w-3.5" />
                  </Link>
                  <button 
                    onClick={() => handleDocumentDownload(doc.id, doc.name)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                    title="Download document"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                  </button>
                  {showTrash ? (
                    <button 
                      onClick={() => restoreDocument(doc.id)}
                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                      title="Restore document"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Move to trash"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL & PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-dark-surface border border-white/10 rounded-2xl shadow-2xl p-6 glass-panel-glow text-left space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Head */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-white">{selectedDoc.name}</h3>
                <p className="text-xs text-gray-400">File Reference ID: {selectedDoc.id}</p>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-3 py-1 rounded bg-white/5 text-xs text-gray-300 hover:text-white"
              >
                Close Dialog
              </button>
            </div>

            {/* Split layout: Info & Versions VS OCR display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column - Metadata & Version Updates */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider block">Security Metadata</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>Category: <strong>{selectedDoc.category}</strong></div>
                    <div>Department: <strong>{selectedDoc.department}</strong></div>
                    <div>Uploaded By: <strong>{selectedDoc.uploadedBy}</strong></div>
                    <div>Date: <strong>{selectedDoc.uploadedAt}</strong></div>
                  </div>
                  <Link 
                    to={`/dashboard/intelligence/${selectedDoc.id}`}
                    onClick={() => setSelectedDoc(null)}
                    className="w-full mt-2 py-2 rounded-xl bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/30 text-brand-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Brain className="h-4 w-4" /> Open AI Intelligence Center
                  </Link>
                </div>

                {/* Upload version */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">Upload New Version</span>
                  <input 
                    type="file" ref={versionInputRef} 
                    onChange={(e) => handleNewVersionUpload(e, selectedDoc.id)}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => versionInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/30 text-brand-secondary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload Revision
                  </button>
                </div>

                {/* Versions Log list */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">Revision Log History</span>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {selectedDoc.versions.map((ver, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-gray-200">Version {ver.version} ({ver.fileSize})</p>
                          <span className="text-[9px] text-gray-500">{ver.uploadedAt} | By {ver.uploadedBy}</span>
                        </div>
                        <button 
                          onClick={() => handleDocumentDownload(selectedDoc.id, ver.fileName || selectedDoc.name)}
                          className="text-[10px] text-brand-secondary font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - OCR extracted text */}
              <div className="space-y-3 flex flex-col">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Info className="h-4 w-4 text-brand-secondary" /> PaddleOCR Extracted Text Index
                </span>
                <div className="flex-1 bg-dark-bg border border-white/5 rounded-xl p-4 font-mono text-[11px] text-gray-400 overflow-y-auto max-h-72 leading-relaxed">
                  {selectedDoc.ocrText || 'No text extracted. Triggering OCR process...'}
                </div>
                <div className="rounded-lg bg-brand-primary/10 border border-brand-primary/15 p-2.5 text-[10px] text-brand-secondary">
                  <strong>Compliance Note:</strong> This text has been vectorized into ChromaDB database structure for local AI search.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- 3. EMPLOYEE & TEAM MANAGEMENT (ADMIN CONTROLS) ---
const TeamManagement: React.FC = () => {
  const { employees, addEmployee, deleteEmployee, departments } = useAppStore()
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [empId, setEmpId] = useState('')
  const [role, setRole] = useState<'DepartmentManager' | 'Employee'>('Employee')
  const [dept, setDept] = useState('Legal')
  const [desig, setDesig] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    addEmployee({
      employeeId: empId || 'EMP' + Math.floor(Math.random() * 1000),
      name,
      email,
      role,
      department: dept,
      designation: desig || 'Specialist',
      joiningDate: new Date().toISOString().split('T')[0],
      skills: ['Office', 'Security']
    })
    // Reset forms
    setName(''); setEmail(''); setEmpId(''); setDesig('')
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Employee & Team Access</h2>
        <p className="text-xs text-gray-400">Configure role-based access controls for document access permissions</p>
      </div>

      {/* Add Employee Form */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-brand-secondary" /> Add New Employee Profile
        </h4>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Employee ID</label>
            <input 
              type="text" placeholder="EMP-005" required
              value={empId} onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
            <input 
              type="text" placeholder="Karan Malhotra" required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Work Email</label>
            <input 
              type="email" placeholder="karan@company.com" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Role Type</label>
            <select 
              value={role} onChange={e => setRole(e.target.value as any)}
              className="w-full bg-dark-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Employee">Employee</option>
              <option value="DepartmentManager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Department</label>
            <select 
              value={dept} onChange={e => setDept(e.target.value)}
              className="w-full bg-dark-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <button 
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold text-xs cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>

      {/* Employees Table Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Workspace Personnel</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-3 font-bold">Employee ID</th>
                <th className="pb-3 font-bold">Name</th>
                <th className="pb-3 font-bold">Email</th>
                <th className="pb-3 font-bold">Department</th>
                <th className="pb-3 font-bold">Role</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="py-3 font-mono text-gray-400">{emp.employeeId || 'N/A'}</td>
                  <td className="py-3 font-medium text-white">{emp.name}</td>
                  <td className="py-3 text-gray-400">{emp.email}</td>
                  <td className="py-3 text-gray-400">{emp.department || 'N/A'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      emp.role === 'EnterpriseAdmin' ? 'bg-brand-primary/20 text-brand-secondary border border-brand-primary/10' : 
                      emp.role === 'DepartmentManager' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/10' : 
                      'bg-white/5 text-gray-300'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => deleteEmployee(emp.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Revoke access"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- 4. SECURITY AUDIT LOGS ---
const AuditLogsView: React.FC = () => {
  const { auditLogs } = useAppStore()
  const [filterAction, setFilterAction] = useState('')

  const filteredLogs = auditLogs.filter(log => {
    if (!filterAction) return true
    return log.action.toLowerCase().includes(filterAction.toLowerCase())
  })

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Security Audit Log</h2>
        <p className="text-xs text-gray-400">Immutability ledger tracking actions inside Postgres storage</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Search className="h-4 w-4" /></span>
          <input
            type="text" placeholder="Filter by action..."
            value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-3 font-bold">Timestamp</th>
                <th className="pb-3 font-bold">Account</th>
                <th className="pb-3 font-bold">Role</th>
                <th className="pb-3 font-bold">Action Event</th>
                <th className="pb-3 font-bold">Detailed logs</th>
                <th className="pb-3 font-bold">IP Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-400">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-gray-500 font-mono">{log.timestamp}</td>
                  <td className="py-3 font-medium text-white">{log.user}</td>
                  <td className="py-3">{log.role}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-secondary border border-brand-primary/10 font-mono font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-xs">{log.details}</td>
                  <td className="py-3 font-mono text-gray-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- 5. MY SECURITY PROFILE ---
const ProfileView: React.FC = () => {
  const { user, updateProfile } = useAppStore()
  
  const [name, setName] = useState(user?.name || '')
  const [mobile, setMobile] = useState(user?.mobileNumber || '')
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '')
  const [pass, setPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    updateProfile({
      name,
      mobileNumber: mobile,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean)
    })
    setMessage('Profile settings updated successfully.')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (pass !== confirmPass) {
      setError('Passwords do not match.')
      return
    }
    if (pass.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setPass('')
    setConfirmPass('')
    setMessage('Your password has been changed.')
  }

  if (!user) return null

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Security Profile</h2>
        <p className="text-xs text-gray-400">Manage security settings, personal records, and credentials</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info Form */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-brand-secondary uppercase border-b border-white/5 pb-1">Personal Profile Details</h3>
          <form onSubmit={handleUpdateInfo} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Employee ID Reference</label>
              <input type="text" disabled value={user.employeeId || 'SUPER_ADMIN'} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
              <input type="email" disabled value={user.email} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Phone</label>
              <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Skills (comma-separated)</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-secondary text-dark-bg font-bold text-xs cursor-pointer">
              Update Profile Info
            </button>
          </form>
        </div>

        {/* Password Reset Form */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-brand-accent uppercase border-b border-white/5 pb-1">Modify System Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Password</label>
              <input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Password</label>
              <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs cursor-pointer">
              Apply New Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// --- FLOATING AI COPILOT INTERFACE PANEL (LOCAL RAG SIMULATION) ---
const FloatingAICopilot: React.FC = () => {
  const { documents } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your local SecureVault Copilot running on Ollama (Qwen3 8B). Ask me any question about your organization\'s documents.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setInput('')
    setLoading(true)

    // Simulate RAG Search delay
    setTimeout(() => {
      let response = "I couldn't find any direct reference to that topic in the uploaded documents. Under our RAG architecture, I search ChromaDB and local PaddleOCR indexes first. Try uploading documents containing details about your query."
      
      const normalizedQuery = userText.toLowerCase()

      // Simple mock semantic query resolver
      if (normalizedQuery.includes('gst') || normalizedQuery.includes('financial') || normalizedQuery.includes('tax') || normalizedQuery.includes('audit')) {
        const doc = documents.find(d => d.id === 'doc-2')
        if (doc) {
          response = `[RAG Hit: ${doc.name}]\nBased on the Q4 Finance Audit Report, our revenue stands at ₹45,20,00,000 with operating cost savings of 4% and a profit margin of 18.5%. OCR scanner verified the document structure successfully.`
        }
      } else if (normalizedQuery.includes('handbook') || normalizedQuery.includes('onboarding') || normalizedQuery.includes('sop') || normalizedQuery.includes('claim') || normalizedQuery.includes('expense')) {
        const doc = documents.find(d => d.id === 'doc-3')
        if (doc) {
          response = `[RAG Hit: ${doc.name}]\nThe Employee Onboarding SOP dictates a 5-step process. Submit your expense claims directly to the HR portal after policy NDA sign-off. Asset allocation belongs to Step 1.`
        }
      } else if (normalizedQuery.includes('dpdp') || normalizedQuery.includes('policy') || normalizedQuery.includes('privacy') || normalizedQuery.includes('consent')) {
        const doc = documents.find(d => d.id === 'doc-1')
        if (doc) {
          response = `[RAG Hit: ${doc.name}]\nThe DPDP Act compliance document outlines consent criteria in Section 4. Data fiduciaries must seek granular, clear consent from users prior to collecting information. Section 8 details data safety mandates.`
        }
      } else if (normalizedQuery.includes('uploaded') || normalizedQuery.includes('documents') || normalizedQuery.includes('files')) {
        const nonDeleted = documents.filter(d => !d.isDeleted)
        response = `You have ${nonDeleted.length} active documents indexed in your local repository:\n` + 
          nonDeleted.map((d, i) => `${i+1}. ${d.name} (${d.category})`).join('\n')
      }

      setMessages(prev => [...prev, { sender: 'ai', text: response }])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Toggle button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center h-12 w-12 rounded-full text-white shadow-2xl transition-all duration-300 bg-gradient-to-tr from-brand-primary to-brand-accent hover:scale-105"
      >
        {isOpen ? <ChevronRight className="h-6 w-6" /> : <Brain className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] rounded-2xl border border-white/10 bg-dark-surface mt-3 flex flex-col shadow-2xl glass-panel-glow text-left overflow-hidden">
          {/* Header */}
          <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-secondary" />
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">SecureVault AI Copilot</h4>
                <p className="text-[9px] text-green-400">Ollama: Qwen3 8B (Local)</p>
              </div>
            </div>
            <span className="text-[9px] text-brand-accent font-mono tracking-wide bg-brand-accent/10 px-2 py-0.5 rounded-full font-bold">RAG READY</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user' 
                    ? 'ml-auto bg-brand-primary text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/5 text-gray-300 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 flex items-center gap-2">
                <RefreshCcw className="h-3.5 w-3.5 animate-spin text-brand-secondary" /> Search ChromaDB vector space...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-white/5 flex gap-2">
            <input 
              type="text"
              placeholder="Query corporate vault..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
            />
            <button 
              type="submit"
              className="p-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
