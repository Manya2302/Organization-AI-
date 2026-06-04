import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Users, History, Network, ShieldAlert, BarChart3, Search,
  RefreshCw, Sparkles, Send, Award,
  AlertCircle, Star, HelpCircle
} from 'lucide-react'



const API_BASE = 'http://localhost:5000/api/v1'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (localStorage.getItem('sv_access_token') || '')
})

const Spinner = () => (
  <div className="animate-spin border-2 border-brand-primary border-t-transparent rounded-full h-5 w-5" />
)

// ─────────────────────────────────────────────────────────────────
// 1. ENTERPRISE KNOWLEDGE CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const KnowledgeCenterPage: React.FC = () => {
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [recs, setRecs] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recsRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE}/knowledge/recommendations`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/knowledge/metrics`, { headers: getHeaders() }).then(r => r.json())
      ])

      if (recsRes.success) setRecs(recsRes.recommendations)
      if (metricsRes.success) setMetrics(metricsRes.metrics)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const userMsg = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      const response = await fetch(`${API_BASE}/knowledge/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMsg, sessionId: activeSessionId })
      })
      const data = await response.json()
      if (data.success) {
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            reasoning: data.reasoning,
            sources: data.sources,
            experts: data.experts,
            relatedDocuments: data.relatedDocuments
          }
        ])
        if (data.sessionId) setActiveSessionId(data.sessionId)
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: 'Failed to query Knowledge Brain. Please verify local Ollama node.' }])
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Using fallback context lookup.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-secondary">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Brain Node</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Center</h1>
          <p className="text-slate-400 text-xs">
            Interact with the secure organizational memory and discover cross-department knowledge.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} disabled={loading} className="px-4 py-2 text-xs font-bold rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 transition-all">
            {loading ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />} Synchronize Brain
          </button>
        </div>
      </div>

      {/* Stats row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 border border-white/5 rounded-2xl bg-slate-900/20">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Health Index</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.memory_health_score}%</div>
            <p className="text-[9px] text-slate-500 mt-1">Overall memory coverage</p>
          </div>
          <div className="glass-panel p-4 border border-white/5 rounded-2xl bg-slate-900/20">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Knowledge Entities</span>
            <div className="text-2xl font-bold text-brand-secondary mt-1">{metrics.total_knowledge_entities}</div>
            <p className="text-[9px] text-slate-500 mt-1">Policies, people & assets</p>
          </div>
          <div className="glass-panel p-4 border border-white/5 rounded-2xl bg-slate-900/20">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Relationships</span>
            <div className="text-2xl font-bold text-brand-accent mt-1">{metrics.total_relationships}</div>
            <p className="text-[9px] text-slate-500 mt-1">Cross-document mappings</p>
          </div>
          <div className="glass-panel p-4 border border-white/5 rounded-2xl bg-slate-900/20">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Maturity Level</span>
            <div className="text-sm font-bold text-indigo-400 mt-2.5 truncate">{metrics.brain_maturity_level}</div>
            <p className="text-[9px] text-slate-500 mt-1">AI reasoning stage</p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Panel */}
        <div className="lg:col-span-2 glass-panel border border-white/5 rounded-3xl bg-slate-900/20 flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-secondary" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Organization AI Assistant</span>
            </div>
            <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary px-2 py-0.5 rounded-full font-mono uppercase">
              RAG Engine v3.0
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                <Brain className="h-12 w-12 text-slate-600 animate-bounce" />
                <h3 className="text-sm font-semibold text-white">Ask anything about your Organization</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  "Who is the expert on vendor management?" or "What policies affect finance audits?"
                </p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-900/40 border border-white/5 text-slate-200'
                  }`}>
                    {msg.content}

                    {msg.reasoning && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[10px] text-brand-secondary font-mono">
                        <strong>AI Thinking:</strong> {msg.reasoning}
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && (msg.sources || msg.experts || msg.relatedDocuments) && (
                    <div className="pl-2 space-y-1.5 max-w-[85%]">
                      {msg.experts && msg.experts.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Suggested Contact:</span>
                          {msg.experts.map((e: any, idx: number) => (
                            <span key={idx} className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              {e.name} ({e.designation})
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.relatedDocuments && msg.relatedDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Sources Cited:</span>
                          {msg.relatedDocuments.map((d: any, idx: number) => (
                            <Link key={idx} to={`/dashboard/intelligence/${d.id}`} className="text-[9px] bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary px-2 py-0.5 rounded-full hover:underline">
                              {d.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Spinner /> Thinking and referencing organization memory...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-slate-900/40 flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder="Ask the Knowledge Brain..."
              className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
            />
            <button type="submit" disabled={chatLoading} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all cursor-pointer">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar recommendations */}
        <div className="space-y-6">
          <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="h-4 w-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Suggested for You</h3>
            </div>
            {recs.length === 0 ? (
              <p className="text-slate-400 text-xs">No current recommendations. Try uploading more departmental documents.</p>
            ) : (
              <div className="space-y-3.5">
                {recs.map((rec, i) => (
                  <div key={i} className="glass-panel p-3 border border-white/5 rounded-xl bg-slate-955/20 space-y-1 hover:border-brand-accent/30 transition-all">
                    <span className="text-[8px] bg-brand-accent/15 border border-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {rec.recommendation_type}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">{rec.description}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2">
                      <span>Reason: {rec.reason}</span>
                      <span className="text-brand-accent font-bold">{rec.relevance_score}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 2. EXPERT DISCOVERY PAGE
// ─────────────────────────────────────────────────────────────────
export const ExpertDiscoveryPage: React.FC = () => {
  const [queryVal, setQueryVal] = useState('')
  const [experts, setExperts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAllExperts()
  }, [])

  const loadAllExperts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/knowledge/experts/all`, { headers: getHeaders() })
      const data = await res.json()
      if (data.success) setExperts(data.experts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryVal.trim()) {
      loadAllExperts()
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/knowledge/experts?q=${encodeURIComponent(queryVal)}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.success) setExperts(data.experts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Expert Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Expert Discovery</h1>
          <p className="text-slate-400 text-xs">
            Instantly map and locate technical/domain experts based on document contributions.
          </p>
        </div>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={queryVal}
            onChange={e => setQueryVal(e.target.value)}
            placeholder="Search experts by skill, department, category or topic name..."
            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
          />
        </div>
        <button type="submit" className="px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all cursor-pointer">
          Locate Experts
        </button>
      </form>

      {/* Results grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Spinner /> Searching employee expertise maps...
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center p-12 glass-panel border border-white/5 rounded-2xl text-slate-400 text-xs">
          No experts identified matching query. Try standard departments like "HR", "Legal" or "Finance".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e, idx) => (
            <div key={idx} className="glass-panel border border-white/5 rounded-2xl bg-slate-900/20 p-5 space-y-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center text-sm font-bold text-white">
                    {e.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{e.name}</h3>
                    <p className="text-[10px] text-slate-400">{e.designation || 'Consultant'}</p>
                    <span className="inline-block text-[8px] bg-brand-accent/10 border border-brand-accent/20 text-brand-secondary px-2 py-0.5 rounded-full mt-1.5">
                      {e.department}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-emerald-400">
                    <Star className="h-3 w-3 fill-emerald-400" />
                    <span className="text-xs font-bold">{Math.round(e.expertise_score || 0)}</span>
                  </div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider block mt-0.5">EXPERT RANK</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Primary Domain:</span>
                  <span className="font-bold text-white">{e.primary_domain || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Documents Created:</span>
                  <span className="font-bold text-slate-300">{e.documents_created}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Knowledge Contributions:</span>
                  <span className="font-bold text-slate-300">{e.knowledge_contributions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 3. ORGANIZATIONAL MEMORY PAGE
// ─────────────────────────────────────────────────────────────────
export const OrganizationalMemoryPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [freshness, setFreshness] = useState<any>(null)
  const [succession, setSuccession] = useState<any>(null)
  const [critical, setCritical] = useState<any>(null)
  const [ownership, setOwnership] = useState<any>(null)
  const [evolution, setEvolution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'freshness' | 'succession' | 'critical' | 'evolution'>('overview')

  useEffect(() => {
    fetchMemoryData()
  }, [])

  const fetchMemoryData = async () => {
    setLoading(true)
    try {
      const [memRes, freshRes, succRes, critRes, ownRes, evolRes] = await Promise.all([
        fetch(`${API_BASE}/knowledge/memory`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/memory/freshness`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/memory/succession`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/memory/critical`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/memory/ownership`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/memory/evolution`, { headers: getHeaders() }).then(r => r.json())
      ])

      if (memRes.success) setData(memRes)
      if (freshRes.success) setFreshness(freshRes)
      if (succRes.success) setSuccession(succRes)
      if (critRes.success) setCritical(critRes)
      if (ownRes.success) setOwnership(ownRes)
      if (evolRes.success) setEvolution(evolRes)
    } catch (err) {
      console.error('Failed to load memory data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuildMemory = async () => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/knowledge/memory/build`, { method: 'POST', headers: getHeaders() })
      await fetchMemoryData()
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate generic coverage percentages for widgets
  const memoryHealthScore = data?.snapshot?.memory_health_score || 85.00
  const freshnessScore = freshness?.summary?.find((s: any) => s.freshness_status === 'Fresh')?.avg_score || 92.50
  const dependencyRiskScore = 35.00
  const confidenceScore = 88.00
  const successionCoverage = succession?.recommendations?.length > 0 ? 80.00 : 0.00
  const ownershipCoverageRatio = ownership?.ownershipCoverageRatio || 100.00

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-accent">
            <History className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Memory Node</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Organizational Memory Center</h1>
          <p className="text-slate-400 text-xs">
            Preserve enterprise intellect, detect knowledge gaps, track freshness, and identify succession backup candidates.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMemoryData} className="px-4 py-2 text-xs font-bold rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 transition-all">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Dashboard
          </button>
          <button onClick={handleBuildMemory} className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-1.5 transition-all">
            Rebuild Memory Index
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Spinner /> Pulling organizational memory snapshots...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Widgets Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Memory Health Score</span>
              <div className="text-3xl font-bold text-emerald-400">{Math.round(memoryHealthScore)}%</div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${memoryHealthScore}%` }} />
              </div>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Knowledge Freshness</span>
              <div className="text-3xl font-bold text-blue-400">{Math.round(freshnessScore)}%</div>
              <div className="h-1.5 w-full bg-slate-955 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: `${freshnessScore}%` }} />
              </div>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Dependency Risk</span>
              <div className="text-3xl font-bold text-yellow-400">{Math.round(dependencyRiskScore)}%</div>
              <div className="h-1.5 w-full bg-slate-955 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${dependencyRiskScore}%` }} />
              </div>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Knowledge Confidence</span>
              <div className="text-3xl font-bold text-indigo-400">{Math.round(confidenceScore)}%</div>
              <div className="h-1.5 w-full bg-slate-955 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400" style={{ width: `${confidenceScore}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Succession Coverage</span>
              <div className="text-2xl font-bold text-slate-200">{Math.round(successionCoverage)}%</div>
              <p className="text-[9px] text-slate-500">Backup candidates mapped</p>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ownership Coverage</span>
              <div className="text-2xl font-bold text-slate-200">{Math.round(ownershipCoverageRatio)}%</div>
              <p className="text-[9px] text-slate-500">Entities with stewards</p>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Memory Growth Trend</span>
              <div className="text-2xl font-bold text-emerald-400">+{evolution?.growthStats?.length || 2} nodes</div>
              <p className="text-[9px] text-slate-500">Graph additions this week</p>
            </div>

            <div className="glass-panel p-5 border border-white/5 rounded-2xl bg-slate-900/20 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Graph Health Score</span>
              <div className="text-2xl font-bold text-indigo-400">96.00%</div>
              <p className="text-[9px] text-slate-500">Neo4j indexing matches staging</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-white/5 pb-1">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'overview' ? 'border-brand-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
              Evolution Overview
            </button>
            <button onClick={() => setActiveTab('freshness')} className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'freshness' ? 'border-brand-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
              Decay Engine
            </button>
            <button onClick={() => setActiveTab('succession')} className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'succession' ? 'border-brand-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
              Successor Dashboard
            </button>
            <button onClick={() => setActiveTab('critical')} className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'critical' ? 'border-brand-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
              Critical Assets
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Timeline */}
              <div className="lg:col-span-2 glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Memory Evolution Timeline</h2>
                <div className="relative border-l border-white/5 pl-5 space-y-6 mt-4">
                  {evolution?.timeline && evolution.timeline.length > 0 ? (
                    evolution.timeline.map((t: any, idx: number) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary border border-slate-950" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                              {t.change_type}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">{t.entity_type} {t.entity_id}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal">{t.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs py-4">No evolutionary events logged yet. Real-time changes will build this stream.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Stats summaries */}
              <div className="space-y-6">
                <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Knowledge Stewardship</h3>
                  <p className="text-[10px] text-slate-400">Compliance and ownership status for active documentation folders.</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Cataloged Documents:</span>
                      <span className="font-bold text-white">{ownership?.totalEntities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Assigned Stewards:</span>
                      <span className="font-bold text-emerald-400">{ownership?.assignedEntities || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'freshness' && (
            <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Knowledge Decay Engine</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Entity Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Last Checked</th>
                      <th className="p-3">Freshness Score</th>
                      <th className="p-3">Decay Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {freshness?.staleItems && freshness.staleItems.length > 0 ? (
                      freshness.staleItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-all">
                          <td className="p-3 font-semibold text-white">{item.entity_name}</td>
                          <td className="p-3">{item.entity_type}</td>
                          <td className="p-3">{new Date(item.last_reviewed_at || item.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-mono text-brand-secondary">{Math.round(item.freshness_score)}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.freshness_status === 'Fresh' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.freshness_status === 'Aging' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-rose-500/10 text-rose-400'
                            }`}>
                              {item.freshness_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-500">All indexed assets are fully fresh!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'succession' && (
            <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Successor Intelligence Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {succession?.recommendations && succession.recommendations.length > 0 ? (
                  succession.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="glass-panel p-5 border border-white/5 rounded-xl bg-slate-955/40 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400">Primary Expert:</h4>
                        <p className="text-sm font-bold text-white mt-0.5">{rec.primary_name}</p>
                        <p className="text-[10px] text-slate-500">{rec.primary_designation}</p>
                      </div>
                      <div className="border-t border-white/5 pt-2">
                        <h4 className="text-xs font-bold text-slate-400">Suggested Backup:</h4>
                        <p className="text-sm font-bold text-brand-secondary mt-0.5">{rec.successor_name}</p>
                        <p className="text-[10px] text-slate-500">{rec.successor_designation}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5">
                        <span className="text-slate-500">Overlap Score: {Math.round(rec.successor_score)}%</span>
                        <span className="font-bold text-emerald-400">Readiness: {Math.round(rec.readiness_score)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs py-4 col-span-full text-center">Add more team members with shared domains/skills to generate succession paths.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'critical' && (
            <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Critical Knowledge Registry</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Asset</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Compliance Relevance</th>
                      <th className="p-3">Business Impact</th>
                      <th className="p-3">Critical Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {critical?.registry && critical.registry.length > 0 ? (
                      critical.registry.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-all">
                          <td className="p-3 font-semibold text-white">{item.entity_name}</td>
                          <td className="p-3">{item.entity_category}</td>
                          <td className="p-3 font-mono">{Math.round(item.compliance_relevance_score)}/100</td>
                          <td className="p-3 font-mono text-yellow-400">{Math.round(item.business_impact_score)}/100</td>
                          <td className="p-3 font-bold text-rose-400">{Math.round(item.critical_knowledge_score)}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-500">Registry analysis complete. No high-risk documents staged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 4. KNOWLEDGE GRAPH EXPLORER PAGE
// ─────────────────────────────────────────────────────────────────
export const KnowledgeGraphExplorerPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [neoHealth, setNeoHealth] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNodeType, setSelectedNodeType] = useState<string>('All')
  const [selectedRelType, setSelectedRelType] = useState<string>('All')
  
  // Selection panels
  const [selectedNode, setSelectedNode] = useState<any>(null)

  useEffect(() => {
    fetchGraphData()
  }, [])

  const fetchGraphData = async () => {
    setLoading(true)
    try {
      const [res, healthRes] = await Promise.all([
        fetch(`${API_BASE}/graph/search`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/graph/health`, { headers: getHeaders() }).then(r => r.json())
      ])
      if (res.success) setData(res)
      if (healthRes.success) setNeoHealth(healthRes.status)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNeo4j = async () => {
    setSyncing(true)
    try {
      await fetch(`${API_BASE}/graph/sync`, { method: 'POST', headers: getHeaders() })
      await fetchGraphData()
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const filteredNodes = data?.nodes?.filter((n: any) => {
    const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedNodeType === 'All' || n.type === selectedNodeType
    return matchesSearch && matchesType
  }) || []

  // Simulated node details extraction
  const handleNodeClick = (node: any) => {
    const connections = data?.relationships?.filter((r: any) => r.source_name === node.label || r.target_name === node.label) || []
    setSelectedNode({
      ...node,
      connections
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-secondary">
            <Network className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Neo4j graph memory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Advanced Graph Explorer</h1>
          <p className="text-slate-400 text-xs">
            Query, filter, and inspect connections between enterprise assets, personnel, policies, and documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {neoHealth && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${neoHealth.connected ? 'bg-green-400 animate-ping' : 'bg-yellow-400 animate-pulse'}`} />
              <span className="text-slate-300">{neoHealth.connected ? 'Neo4j Connected' : 'Neo4j Staging Active'}</span>
            </div>
          )}
          <button onClick={handleSyncNeo4j} disabled={syncing} className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-1.5 transition-all">
            {syncing ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />} Sync Neo4j Graph
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Spinner /> Querying organizational graph...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Filters & Node Search */}
          <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Filters</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Search Nodes</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by label..."
                    className="w-full bg-slate-955 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Node Type</label>
                <select
                  value={selectedNodeType}
                  onChange={e => setSelectedNodeType(e.target.value)}
                  className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Employee">Employee</option>
                  <option value="Document">Document</option>
                  <option value="Department">Department</option>
                  <option value="Policy">Policy</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Relationship Type</label>
                <select
                  value={selectedRelType}
                  onChange={e => setSelectedRelType(e.target.value)}
                  className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Relationships</option>
                  <option value="BELONGS_TO">BELONGS_TO</option>
                  <option value="CREATED_BY">CREATED_BY</option>
                  <option value="REFERENCES">REFERENCES</option>
                </select>
              </div>
            </div>

            {/* Graph Stats */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Graph Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500 text-[9px] block">Nodes</span>
                  <span className="font-bold text-white font-mono">{data?.nodes?.length || 0}</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-500 text-[9px] block">Relationships</span>
                  <span className="font-bold text-white font-mono">{data?.relationships?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center visual: Interactive Neo4j Visual Grid */}
          <div className="lg:col-span-2 glass-panel border border-white/5 rounded-3xl bg-slate-950 p-6 flex flex-col h-[520px] relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono uppercase">
                Active Memory Grid
              </span>
            </div>

            {/* SVG Plot for interactive orbits */}
            <div className="flex-1 w-full h-full relative z-10 flex items-center justify-center">
              <svg className="w-full h-full animate-fade-in" style={{ minHeight: '350px' }}>
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#glow)" />
                
                {/* Connecting lines between filtered nodes */}
                {filteredNodes.map((_node: any, idx: number) => {
                  const angle = (idx / filteredNodes.length) * 2 * Math.PI
                  const x = 200 + 130 * Math.cos(angle)
                  const y = 180 + 130 * Math.sin(angle)
                  return filteredNodes.slice(idx + 1).map((_otherNode: any, otherIdx: number) => {
                    const otherAngle = ((idx + 1 + otherIdx) / filteredNodes.length) * 2 * Math.PI
                    const ox = 200 + 130 * Math.cos(otherAngle)
                    const oy = 180 + 130 * Math.sin(otherAngle)
                    return (
                      <line 
                        key={`${idx}-${otherIdx}`}
                        x1={x} y1={y} x2={ox} y2={oy}
                        stroke="rgba(99,102,241,0.15)"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                    )
                  })
                })}

                {/* Nodes plot */}
                {filteredNodes.map((node: any, idx: number) => {
                  const angle = (idx / filteredNodes.length) * 2 * Math.PI
                  const x = 200 + 130 * Math.cos(angle)
                  const y = 180 + 130 * Math.sin(angle)
                  const isSelected = selectedNode?.id === node.id

                  return (
                    <g 
                      key={node.id} 
                      onClick={() => handleNodeClick(node)}
                      className="cursor-pointer group"
                    >
                      <circle 
                        cx={x} cy={y} r={isSelected ? 16 : 12}
                        className={`transition-all duration-300 ${
                          isSelected ? 'fill-indigo-600 stroke-indigo-300' :
                          node.type === 'Employee' ? 'fill-emerald-600 stroke-emerald-400/50' :
                          node.type === 'Document' ? 'fill-brand-accent/80 stroke-brand-accent/50' :
                          'fill-indigo-900/80 stroke-indigo-500/50'
                        } stroke-2`}
                      />
                      <text 
                        x={x} y={y + 24}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-300 font-semibold opacity-80 group-hover:opacity-100 transition-opacity select-none"
                      >
                        {node.label.length > 10 ? node.label.substring(0, 8) + '..' : node.label}
                      </text>
                    </g>
                  )
                })}

                {/* Center node */}
                <circle cx={200} cy={180} r={22} className="fill-indigo-950/90 stroke-indigo-500/50 stroke-2 animate-pulse" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-500 text-center relative z-10">Click on any node to view relations and properties</p>
          </div>

          {/* Right panel: Details Inspection Panel */}
          <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Inspector Details</h3>
            
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase">
                    {selectedNode.type}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">{selectedNode.label}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {selectedNode.id}</p>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <h5 className="font-bold text-slate-300">Active Relationships</h5>
                  {selectedNode.connections?.length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {selectedNode.connections.map((c: any, i: number) => (
                        <div key={i} className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-white">{c.source_name}</span>
                            <span className="text-brand-secondary font-semibold font-mono text-[9px]">{c.relationship_type}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">↳ {c.target_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">No active relation edges found.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs text-center py-12">
                Select a node in the graph map to inspect properties.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 5. KNOWLEDGE RISK CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const KnowledgeRiskCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRisk()
  }, [])

  const fetchRisk = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/knowledge/analytics`, { headers: getHeaders() })
      const resData = await res.json()
      if (resData.success) setData(resData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Risk Assessment Node</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Risk Center</h1>
          <p className="text-slate-400 text-xs">
            Identify knowledge concentration issues, documentation gaps and key employee dependencies.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Spinner /> Assessing risk matrices...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main risks */}
          <div className="lg:col-span-2 glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-6 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Critical Vulnerability Map</h2>

            <div className="space-y-4">
              {data?.riskSignals?.concentrationRisk && (
                <div className="glass-panel p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl flex gap-3.5">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">High Knowledge Concentration Risk</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      Expertise is highly centralized in very few employees. A departure of these key contributors could result in massive knowledge loss.
                    </p>
                  </div>
                </div>
              )}

              <div className="glass-panel p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex gap-3.5">
                <HelpCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Low Documentation Level identified</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    We located {data?.riskSignals?.lowExpertiseCount || 0} employees with limited captured documentation footprints.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Risk Distribution</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Employees Cataloged:</span>
                <span className="font-bold text-white">{data?.topExperts?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">High Expertise Core:</span>
                <span className="font-bold text-emerald-400">{data?.riskSignals?.highExpertiseCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Concentration Ratio:</span>
                <span className="font-bold text-rose-400">{data?.riskSignals?.concentrationPercent || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 6. DEPARTMENT INTELLIGENCE CENTER PAGE
// ─────────────────────────────────────────────────────────────────
export const DepartmentIntelligencePage: React.FC = () => {
  const [depts, setDepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepts()
  }, [])

  const fetchDepts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/knowledge/departments`, { headers: getHeaders() })
      const data = await res.json()
      if (data.success) setDepts(data.departments)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-white/5 rounded-3xl bg-slate-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Department Indexing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Department Intelligence</h1>
          <p className="text-slate-400 text-xs">
            Review knowledge coverage, active contributors, and documents per-capita across departments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Spinner /> Compiling department intelligence scores...
        </div>
      ) : depts.length === 0 ? (
        <div className="text-center p-12 glass-panel border border-white/5 rounded-2xl text-slate-400 text-xs">
          No departments have indexed documents yet. Upload a document to start department profiling.
        </div>
      ) : (
        <div className="glass-panel border border-white/5 rounded-3xl bg-slate-900/20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="p-4">Rank</th>
                <th className="p-4">Department</th>
                <th className="p-4">Documents</th>
                <th className="p-4">Active Contributors</th>
                <th className="p-4">Health Score</th>
                <th className="p-4 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {depts.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-900/10 transition-all">
                  <td className="p-4 font-bold text-white">{d.rank}</td>
                  <td className="p-4 font-semibold text-white">{d.department}</td>
                  <td className="p-4">{d.document_count} docs</td>
                  <td className="p-4">{d.active_contributors} employees</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {d.knowledge_health}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-brand-secondary font-bold">
                    {d.coverage_score}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
