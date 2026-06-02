import React, { useState, useRef, useEffect } from 'react'
import { Link, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts'
import { 
  FileText, Users, HardDrive, ShieldAlert, UploadCloud, Search, Trash2, RotateCcw, 
  Trash, UserPlus, CheckCircle, Activity, Key, Brain, Send, 
  ChevronRight, RefreshCcw, FolderOpen, Eye, Info, Network, TrendingUp,
  Sun, Moon, LogOut
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Document } from '../store/useAppStore'
import { DocumentIntelligencePage, SimilarDocumentsPage, AIInsightsPage, AIQueuePage } from './AIPages'

// --- DASHBOARD CONTAINER & NAVIGATION ---
export const DashboardLayout: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAppStore()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role === 'Employee' && (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/')) {
      navigate('/dashboard/documents')
    }
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[90vh]">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-4 flex flex-col gap-6 text-left shrink-0">
        <div>
          <span className="text-[10px] font-bold text-brand-secondary tracking-widest block uppercase px-3">WORKSPACE</span>
          <h3 className="text-sm font-semibold text-white px-3 mt-1 truncate">{user.role === 'SuperAdmin' ? 'Super Console' : 'CogniVault Hub'}</h3>
        </div>

        <nav className="flex flex-col gap-1">
          {user.role !== 'Employee' && (
            <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
              <Activity className="h-4 w-4 text-brand-secondary" /> Console Analytics
            </Link>
          )}
          <Link to="/dashboard/documents" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
            <FolderOpen className="h-4 w-4 text-brand-accent" /> Documents Repository
          </Link>
          {user.role !== 'Employee' && (
            <Link to="/dashboard/team" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
              <Users className="h-4 w-4 text-brand-primary" /> Employees / Team
            </Link>
          )}
          {user.role !== 'Employee' && (
            <Link to="/dashboard/audit" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
              <ShieldAlert className="h-4 w-4 text-orange-400" /> Security Audit Logs
            </Link>
          )}
          <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
            <Key className="h-4 w-4 text-green-400" /> My Security Profile
          </Link>
          <div className="border-t border-slate-200 dark:border-white/5 my-1" />
          {user.role !== 'Employee' && (
            <Link to="/dashboard/insights" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
              <TrendingUp className="h-4 w-4 text-brand-secondary" /> AI Insights
            </Link>
          )}
          <Link to="/dashboard/similar" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
            <Network className="h-4 w-4 text-brand-accent" /> Similarity Hub
          </Link>
          {user.role !== 'Employee' && (
            <Link to="/dashboard/queue" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
              <Activity className="h-4 w-4 text-orange-400" /> AI Queue Status
            </Link>
          )}
        </nav>

        {/* AI Prompt Box Widget */}
        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 border border-brand-primary/20 space-y-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-brand-secondary">
            <Brain className="h-3.5 w-3.5" /> OLLAMA LOCAL ACTIVE
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            Qwen3 8B model running locally. Free semantic RAG searches activated.
          </p>
        </div>

        {/* User Theme and Logout Panel */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between px-3 py-0.5 text-slate-400 text-[10px]">
            <span className="font-semibold uppercase tracking-wider">SYSTEM NODE</span>
            <span className="font-mono text-green-400">ONLINE</span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
              title="Toggle system theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3 w-3 text-yellow-400" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-3 w-3 text-blue-400" /> Dark Mode
                </>
              )}
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold transition-all cursor-pointer"
              title="Sign out of current node"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Console Area */}
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
          <Route path="*" element={<Navigate to="/dashboard/documents" replace />} />
        </Routes>
      </main>

      {/* Floating Chat Copilot Panel */}
      <FloatingAICopilot />
    </div>
  )
}

// --- 1. CONSOLE ANALYTICS ---
const ConsoleAnalytics: React.FC = () => {
  const { documents, employees, auditLogs, theme } = useAppStore()
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
                        <a 
                          href="#" onClick={(e) => { e.preventDefault(); alert(`Simulated secure file download request logged for version ${ver.version}.`); }}
                          className="text-[10px] text-brand-secondary font-bold hover:underline"
                        >
                          Download
                        </a>
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
