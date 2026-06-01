import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Shield, Zap, Lock, BarChart3, Sparkles, ArrowRight, Play } from 'lucide-react'

// ── Marquee partners ──────────────────────────────────────
const partners = [
  { name: 'Microsoft Azure', color: '#0078d4', bg: 'rgba(0,120,212,0.08)' },
  { name: 'AWS', color: '#ff9900', bg: 'rgba(255,153,0,0.08)' },
  { name: 'Google Cloud', color: '#4285f4', bg: 'rgba(66,133,244,0.08)' },
  { name: 'Salesforce', color: '#00a1e0', bg: 'rgba(0,161,224,0.08)' },
  { name: 'SAP', color: '#0070f2', bg: 'rgba(0,112,242,0.08)' },
  { name: 'Oracle', color: '#f80000', bg: 'rgba(248,0,0,0.08)' },
  { name: 'IBM Watson', color: '#be95ff', bg: 'rgba(190,149,255,0.08)' },
  { name: 'ServiceNow', color: '#81b5a1', bg: 'rgba(129,181,161,0.08)' },
]

const roles = ['Documents', 'Knowledge', 'Compliance', 'Intelligence', 'Security']

// ── Floating stat chips ───────────────────────────────────
const stats = [
  { value: '10M+', label: 'Documents Processed', icon: BarChart3, color: '#60a5fa' },
  { value: '99.9%', label: 'Uptime SLA', icon: Shield, color: '#34d399' },
  { value: '2.4x', label: 'Faster Retrieval', icon: Zap, color: '#fbbf24' },
  { value: 'SOC 2', label: 'Type II Certified', icon: Lock, color: '#a78bfa' },
]

export const HeroSection: React.FC = () => {
  const [roleIdx, setRoleIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setRoleIdx(i => (i + 1) % roles.length), 2800)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* ── Hero 1: Main cinematic hero ─────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden hero-gradient grid-bg">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06] animate-blob"
            style={{ background: 'radial-gradient(circle, #1a56db 0%, transparent 70%)', top: '-10%', left: '-10%' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04] animate-blob"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', bottom: '10%', right: '-5%', animationDelay: '-4s' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] animate-blob"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', top: '40%', left: '60%', animationDelay: '-8s' }} />
        </div>

        {/* Grid lines accent */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(26,86,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,86,219,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 max-w-7xl mx-auto w-full text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border"
              style={{ background: 'rgba(26,86,219,0.1)', borderColor: 'rgba(26,86,219,0.25)', color: '#93c5fd' }}>
              <Sparkles size={11} className="text-yellow-400" />
              Powered by Local AI — Zero Data Exposure
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="mb-6"
          >
            <h1 className="font-display font-bold leading-[1.08] tracking-tight text-white mb-4"
              style={{ fontSize: 'clamp(40px, 6vw, 82px)' }}>
              Your Enterprise
              <br />
              <span className="text-gradient-brand">{' '}</span>
              <span style={{ display: 'inline-block', minWidth: 280 }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={roleIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="text-gradient-brand"
                  >
                    {roles[roleIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              Operating System
            </h1>
          </motion.div>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="text-[17px] text-slate-400 max-w-2xl leading-relaxed mb-10"
          >
            Transform your document chaos into an AI-powered knowledge ecosystem. Secure, searchable, and intelligent — all running on your infrastructure.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
          >
            <Link to="/register" className="btn-primary flex items-center gap-2 text-[15px] px-7 py-3.5">
              <Zap size={16} />
              Start Free Trial
              <ArrowRight size={14} />
            </Link>
            <Link to="/features" className="btn-secondary flex items-center gap-2 text-[15px] px-7 py-3.5">
              <Play size={14} />
              See How It Works
            </Link>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-16"
          >
            {['No credit card required', '14-day free trial', 'SOC 2 Type II', 'GDPR Compliant'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px] text-slate-400">
                <div className="w-4 h-4 rounded-full border border-green-500/40 bg-green-500/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                {t}
              </div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl"
          >
            {stats.map(({ value, label, icon: Icon, color }, i) => (
              <div key={i} className="feature-card rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="font-display font-bold text-[22px] text-white mb-1">{value}</div>
                <div className="text-[11px] text-slate-400">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.25em]">Scroll</span>
          <div className="w-px h-10 bg-slate-700 relative overflow-hidden rounded-full">
            <div className="absolute inset-x-0 top-0 h-5 rounded-full animate-scroll-down"
              style={{ background: 'linear-gradient(to bottom, #1a56db, transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────── */}
      <section className="py-10 bg-dark-surface border-y border-dark-border">
        <p className="text-center text-[11px] text-slate-500 uppercase tracking-[0.2em] mb-6">
          Trusted by enterprises using
        </p>
        <div className="marquee-wrapper overflow-hidden">
          <div className="flex gap-4 animate-marquee" style={{ width: 'max-content' }}>
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="flex-shrink-0 h-12 px-6 rounded-full border border-dark-border flex items-center gap-2.5 cursor-pointer hover:border-blue-500/30 transition-all"
                style={{ background: p.bg }}>
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-[13px] font-medium text-slate-300 whitespace-nowrap">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero 2: Video showcase ───────────────────────────── */}
      <section className="relative py-24 bg-dark-bg overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <div className="relative rounded-3xl overflow-hidden border border-dark-border shadow-2xl"
              style={{ background: 'linear-gradient(145deg, #080d1a, #0d1424)' }}>
              {/* Mock dashboard screenshot */}
              <div className="aspect-[16/9] relative">
                <div className="absolute inset-0 flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-border">
                    <div className="flex gap-1.5">
                      {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
                    </div>
                    <div className="flex-1 bg-dark-bg rounded-full px-4 py-1.5 text-[12px] text-slate-500 border border-dark-border">
                      app.cognivault.ai/dashboard
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                      <Shield size={13} className="text-blue-400" />
                    </div>
                  </div>
                  {/* Dashboard layout */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-56 border-r border-dark-border p-4 space-y-1 hidden md:block">
                      {['Dashboard','Documents','AI Copilot','Search','Analytics','Team','Security','Audit Logs','Settings'].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all ${i === 2 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400'}`}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 2 ? '#60a5fa' : '#334155' }} />
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Main */}
                    <div className="flex-1 p-5 space-y-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[14px] font-semibold text-white">AI Copilot</div>
                        <div className="badge-brand text-[10px]">Powered by Ollama</div>
                      </div>
                      {/* Chat messages */}
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] text-slate-300">U</div>
                          <div className="bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[12px] text-slate-200 max-w-xs">
                            What are our Q4 compliance deadlines?
                          </div>
                        </div>
                        <div className="flex gap-3 flex-row-reverse">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                            <Sparkles size={12} className="text-white" />
                          </div>
                          <div className="feature-card rounded-2xl rounded-tr-sm px-4 py-2.5 text-[12px] text-slate-300 max-w-sm">
                            Based on your policy documents, Q4 deadlines include: ISO 27001 renewal (Dec 15), SOC 2 audit (Nov 30), and GDPR data review (Dec 31)...
                          </div>
                        </div>
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[['2,847','Documents Indexed'],['98.2%','OCR Accuracy'],['< 400ms','Query Response']].map(([v,l],i) => (
                          <div key={i} className="feature-card rounded-xl p-3 text-center">
                            <div className="font-display font-bold text-[16px] text-white">{v}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{ boxShadow: 'inset 0 0 80px rgba(26,86,219,0.04)' }} />
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
