import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Shield, Lock, FileText, Search, Users, Sparkles, 
  ChevronDown, Check, ArrowRight, 
  FileCheck, Layers, Cpu, Database, ExternalLink
} from 'lucide-react'

import MarqueeScroller from '../components/MarqueeScroller'
import AIChatBox from '../components/AIChatBox'
import InteractiveMap from '../components/InteractiveMap'
import CookieBanner from '../components/CookieBanner'
import LoadingScreen from '../components/LoadingScreen'

// ─── 1. LANDING PAGE ───────────────────────────────────────
let hasShownLoading = false

export const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(!hasShownLoading)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index)
  }

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen 
            onComplete={() => {
              setIsLoading(false)
              hasShownLoading = true
            }} 
          />
        )}
      </AnimatePresence>

      <div className="w-full flex-1 flex flex-col font-sans transition-colors duration-300">
        {/* HERO SECTION */}
        <section className="w-full bg-[#f4f6fb] dark:bg-[#070b15] transition-colors duration-300 pt-28 pb-14 md:pt-32 md:pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/50 blur-3xl" />
            <div className="absolute top-24 right-[-5rem] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute bottom-[-4rem] left-[-4rem] h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
          </div>

          <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 max-w-3xl space-y-8 text-left">
                

                <div className="space-y-5 max-w-xl">
                  <h1 className="font-sans font-semibold tracking-tight text-[42px] md:text-[60px] lg:text-[66px] leading-[0.95] text-slate-950 dark:text-white">
                    Design confidently.
                  </h1>
                  <p className="text-[16px] md:text-[18px] text-slate-600 dark:text-slate-400 leading-8 max-w-xl font-normal">
                    CogniVault gives teams a clean, modern home for documents, approvals, search, and AI insights without sacrificing control.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold px-6 py-3.5 shadow-lg shadow-blue-600/20 transition-all duration-300 cursor-pointer"
                  >
                    Get started free
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/documentation"
                    className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[14px] font-semibold px-6 py-3.5 shadow-sm transition-all duration-300 cursor-pointer"
                  >
                    View docs
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
                  {[
                    ['99.9%', 'workspace availability'],
                    ['<2s', 'typical response time'],
                    ['24/7', 'audit visibility'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                      <div className="text-[26px] font-semibold tracking-tight text-slate-950">{value}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <div className="w-full max-w-[680px] overflow-hidden rounded-[36px] shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
                  <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-cyan-500/10" />
                    <img
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=90"
                      alt="Professional team member working at a desk"
                      className="relative z-10 block w-full h-[470px] object-cover object-center select-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE LOGO SCROLLER (Immediately under hero container) */}
        <div className="py-8">
          <MarqueeScroller />
        </div>

        {/* MAIN BODY CONTENTS - SECTIONS & WORK */}
        <main className="max-w-[1200px] mx-auto w-full px-6 md:px-10 lg:px-16 space-y-24 py-16">
          
          {/* SECTION 1: SELECTED WORK BENTO GRID */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Platform Capabilities</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-none">
                  Featured <i>solutions</i>
                </h2>
                <p className="text-[13px] text-slate-500 max-w-sm">
                  Explore how CogniVault simplifies document lifecycle, onboarding, audits, and LLM queries.
                </p>
              </div>
              <Link to="/solutions" className="btn-secondary text-[12px] px-5 py-2">
                View all solutions
              </Link>
            </div>

            {/* Capabilities Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Compliance */}
              <div className="group relative bg-white dark:bg-[#0d1424] border border-slate-200/80 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-blue-600 dark:hover:border-blue-500 transition-all text-left">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileCheck size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Audit & Compliance</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Automated audit logs, policy change tracking, and action records built to satisfy ISO 27001, GDPR, and DPDP mandates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Local RAG */}
              <div className="group relative bg-white dark:bg-[#0d1424] border border-slate-200/80 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-blue-600 dark:hover:border-blue-500 transition-all text-left">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Local RAG Copilot</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Interact with enterprise directories locally. Extract document layouts, query tabular metadata, and write reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Semantic Search */}
              <div className="group relative bg-white dark:bg-[#0d1424] border border-slate-200/80 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-blue-600 dark:hover:border-blue-500 transition-all text-left">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Search size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Knowledge Search</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sub-millisecond semantic search across scanned PDFs, complex tables, policy sheets, forms, and images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Onboarding */}
              <div className="group relative bg-white dark:bg-[#0d1424] border border-slate-200/80 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between hover:border-blue-600 dark:hover:border-blue-500 transition-all text-left">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Users size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Onboarding Catalyst</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Index internal guidelines, employee handbooks, and operations blueprints into secure, searchable local archives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: INTERACTIVE AI CHAT DEMO */}
          <section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-slate-350 dark:bg-slate-700" />
                <span className="text-[11px] text-slate-450 uppercase tracking-widest font-mono">Interactive Testing</span>
                <div className="w-6 h-px bg-slate-350 dark:bg-slate-700" />
              </div>
              <h2 className="font-sans text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                Chat with the local core database
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Click any of the questions below to test how our self-hosted intelligence engine indexes and maps files.
              </p>
            </div>
            <AIChatBox />
          </section>

          {/* SECTION 3: REPLICATION NODES MAP */}
          <section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-slate-355 dark:bg-slate-700" />
                <span className="text-[11px] text-slate-450 uppercase tracking-widest font-mono">Network Cluster Integrity</span>
                <div className="w-6 h-px bg-slate-355 dark:bg-slate-700" />
              </div>
              <h2 className="font-sans text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                Distributed Active Directory Sync
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                View nodes connection status and replication sync latency details across our local core group.
              </p>
            </div>
            <InteractiveMap />
          </section>

          {/* SECTION 4: HORIZONTAL JOURNAL (Thoughts / Case Studies) */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-px bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Journal Insights</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-none">
                  Recent <i>thoughts</i>
                </h2>
              </div>
              <Link to="/documentation" className="btn-secondary text-[12px] px-5 py-2">
                Read all articles
              </Link>
            </div>

            {/* Horizontal pills */}
            <div className="space-y-4">
              {[
                { title: "Securing AI vector embedding calculations locally under DPDP parameters", read: "5 min read", date: "June 2026", cat: "Compliance" },
                { title: "Why OCR pipeline optimizations matter for high-volume enterprise document ingestion", read: "8 min read", date: "May 2026", cat: "Engineering" },
                { title: "Building a self-healing local fallback database: A case study with JSON DB and PostgreSQL", read: "12 min read", date: "May 2026", cat: "Architecture" },
                { title: "How to run local LLMs (Qwen-3) on legacy corporate hardware with optimal latency", read: "6 min read", date: "April 2026", cat: "Infrastructure" }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-[24px] sm:rounded-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-750 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {item.cat}
                    </span>
                    <span className="text-[14px] font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{item.date}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span>{item.read}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: FAQ ACCORDION */}
          <section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                Clear answers regarding system dependencies, hardware specifications, and encryption pathways.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {[
                { q: "What hardware is required to run the local LLM?", a: "For community testing, any laptop with 16GB RAM can run Qwen-3:8B. For corporate deployment, we recommend a Linux host equipped with an NVIDIA RTX 4090 or A10G GPU to maintain sub-second response times." },
                { q: "Can it run without a database server configured?", a: "Yes. SecureVault AI features an automatic fallback module. If it detects that PostgreSQL is offline or unreachable, it switches seamlessly to local JSON file-based database modules to sustain core functions." },
                { q: "How is document layout information preserved?", a: "We ingest document files in original layout formats, calculate layout bounding boxes via high-precision OCR extraction grids, and keep structured mapping data stored as metadata fields." }
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-[14px] text-slate-800 dark:text-white cursor-pointer"
                  >
                    {faq.q}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${faqOpen === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {faqOpen === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="p-5 pt-0 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

        </main>

        <CookieBanner />
      </div>
    </>
  )
}

// ─── 2. FEATURES PAGE ──────────────────────────────────────
export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Platform Blueprint</span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Features & Modules
          </h1>
          <p className="text-[14px] text-slate-550 dark:text-slate-400 max-w-2xl leading-relaxed">
            SecureVault AI utilizes cutting-edge utilities engineered specifically for secure, low-resource self-hosted business environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: "PaddleOCR Engine", desc: "Extract clear texts from scanned PDFs, invoices, and image files automatically into structured data sheets." },
            { icon: Sparkles, title: "Local AI Copilot (RAG)", desc: "Query files conversationally. Relies on ChromaDB vector calculations and feeds local LLMs for answers." },
            { icon: Lock, title: "Audit Trails", desc: "Track document views, downloads, uploads, and search queries automatically to assist regulatory audits." },
            { icon: Layers, title: "RBAC Access Controls", desc: "Apply authorization rules for Super Admins, Managers, and Employees. Keep files strictly restricted." },
            { icon: Database, title: "Local DB Fallback", desc: "Automatic failover to JSON files if PostgreSQL becomes offline, preventing system outages." },
            { icon: Cpu, title: "Fast Vector Calc", desc: "Sub-millisecond local vector matching algorithm designed for CPU/GPU hybrid runtime parameters." }
          ].map((feat, i) => (
            <div key={i} className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-blue-600 dark:hover:border-blue-500 transition-all space-y-4 text-left">
              <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <feat.icon size={18} />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{feat.title}</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 3. SOLUTIONS PAGE ─────────────────────────────────────
export const SolutionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Corporate Solutions</span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Business Solutions
          </h1>
          <p className="text-[14px] text-slate-500 max-w-xl leading-relaxed">
            Targeted resolutions designed to solve information chaos and compliance leakage in data-heavy organizations.
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "Accelerate Employee Onboarding",
              desc: "Consolidate training plans, guidelines, and manuals in a central workspace. New employees can search policies directly and query internal resources via the AI Copilot.",
              previewTitle: "Onboarding Query",
              previewText: "Question: 'Where is the expense submission template?'\nAnswer: Found Onboarding_SOP.pdf. Submit forms via HR portal."
            },
            {
              title: "Automated ISO 27001 Prep",
              desc: "Keep records of all user actions, document classification reviews, and authorization status, simplifying compliance audits to a simple database export.",
              previewTitle: "Compliance Audit Trail",
              previewText: "User Alok Sharma (Admin) verified DPDP compliance.\nOCR system extracted metadata successfully."
            }
          ].map((sol, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm">
              <div className="flex-1 space-y-4 text-left">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sol.title}</h3>
                <p className="text-[13px] text-slate-505 dark:text-slate-400 leading-relaxed">{sol.desc}</p>
              </div>
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#080d1a] border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-md font-mono text-[11px] text-slate-550 space-y-2 text-left">
                <div className="text-blue-600 dark:text-blue-400 font-bold">{sol.previewTitle}</div>
                <div className="whitespace-pre-line leading-relaxed">{sol.previewText}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 4. INDUSTRIES PAGE ────────────────────────────────────
export const IndustriesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Sectors & Regulation</span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Industries Served
          </h1>
          <p className="text-[14px] text-slate-550 max-w-xl leading-relaxed">
            Custom knowledge layers built to support regulatory rules and file searching across key industrial sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Legal & Audits", desc: "Index contracts, verify clauses, and track audit history inside secure file systems without third-party APIs." },
            { title: "Finance & Taxation", desc: "Extract values and details from transaction sheets, tax invoices, and bank statements automatically." },
            { title: "Healthcare & Pharma", desc: "Maintain research logs, patient guidelines, and local records in complete sync with HIPPA guidelines." }
          ].map((ind, i) => (
            <div key={i} className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-blue-600 dark:hover:border-blue-500 transition-all space-y-3 text-left">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-455" />
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{ind.title}</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 5. SECURITY PAGE ──────────────────────────────────────
export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Security Parameters</span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Enterprise-Grade Security
          </h1>
          <p className="text-[14px] text-slate-550 max-w-xl leading-relaxed">
            Learn how we keep your files secure within your self-hosted infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm space-y-4 text-left">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AES-256 File Encryption</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Every document uploaded to the local cluster is encrypted using AES-256 standards. Encryption keys remain solely under your operational control.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm space-y-4 text-left">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">DPDP 2023 Principles</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              We align with personal data protection rules by providing granular user consents, complete data audit logging, and single-click file scrubbing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 6. PRICING PAGE ───────────────────────────────────────
export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-4 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Deployment Plans</span>
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Subscription Plans
          </h1>
          <p className="text-[14px] text-slate-550 dark:text-slate-400 leading-relaxed">
            Deploy SecureVault on your local server for free, or select our managed options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Community Free",
              price: "₹0",
              desc: "Run on your laptop or single Linux VPS server.",
              feats: ["Local Ollama integration", "PaddleOCR local processing", "PostgreSQL database core", "Standard audit logs"]
            },
            {
              title: "Managed Startup",
              price: "₹4,999/mo",
              desc: "Fully configured sandbox environment hosting.",
              feats: ["All Free Features", "Managed daily backups", "Configured sandbox setup", "Priority technical help"]
            },
            {
              title: "Dedicated Enterprise",
              price: "Custom",
              desc: "For multi-department corporate networks.",
              feats: ["High-volume GPU clusters", "Custom SSO integrations", "Isolated storage endpoints", "Dedicated SLA support"]
            }
          ].map((plan, i) => (
            <div key={i} className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 transition-all text-left">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.title}</h3>
                <div className="text-3xl font-sans font-black text-slate-900 dark:text-white">{plan.price}</div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">{plan.desc}</p>
                <ul className="space-y-2.5 pt-4 text-[12px] text-slate-650 dark:text-slate-400">
                  {plan.feats.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check size={12} className="text-blue-600 dark:text-blue-450" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/register" className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold py-2.5 rounded-[4px] mt-8 block transition-all shadow-sm">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 7. ABOUT PAGE ─────────────────────────────────────────
export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
          <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Corporate Vision</span>
        </div>
        <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          About CogniVault AI
        </h1>
        <div className="prose dark:prose-invert text-[14px] text-slate-600 dark:text-slate-450 space-y-6 leading-relaxed">
          <p>
            CogniVault AI was conceptualized to address document chaos and knowledge fragmentation within enterprises.
          </p>
          <p>
            Rather than sending sensitive contracts and manuals to public clouds, CogniVault implements layout-preserving OCR, indexing, and vector calculations locally.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── 8. CONTACT PAGE ───────────────────────────────────────
export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false)

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-blue-600/40 dark:bg-blue-500/40" />
            <span className="text-[11px] text-blue-650 dark:text-blue-400 font-bold uppercase tracking-widest font-sans">Get In Touch</span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Contact Support
          </h1>
          <p className="text-[14px] text-slate-550 dark:text-slate-400 leading-relaxed">
            Reach out to clarify technical specifications, deployment support, or licensing.
          </p>

          {/* Interactive Map Embed */}
          <div className="space-y-3 pt-4">
            <h4 className="text-[12px] font-bold text-slate-450 uppercase tracking-widest">Office Location</h4>
            <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative group bg-white dark:bg-slate-900">
              <iframe
                title="CogniVault Bengaluru Headquarters Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9248729352726!2d77.5926514757342!3d12.976657987338873!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1672c1017287%3A0xe5d0505191c95b6a!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1717282829201!5m2!1sen!2sin"
                className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-180 opacity-80 group-hover:opacity-100 transition-all duration-300"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a 
                href="https://maps.app.goo.gl/8vupDZwGmSWGwN4s9"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-[4px] bg-slate-900/80 text-white text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1 border border-slate-700 hover:bg-blue-600 transition-colors"
              >
                Open in Google Maps <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <Check className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Message Captured</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Our engineering team will connect with you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSub} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1">Your Name</label>
                <input required type="text" className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-[4px] px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1">Work Email</label>
                <input required type="email" className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-[4px] px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-500 mb-1">Query Message</label>
                <textarea required rows={4} className="w-full bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-[4px] px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold py-3 rounded-[4px] transition-all cursor-pointer">
                Send Query
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 9. DOCUMENTATION PAGE ─────────────────────────────────
export const DocumentationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 text-left">
        <div className="space-y-4">
          <h4 className="font-bold text-[12px] uppercase text-slate-400 tracking-wider">Overview</h4>
          <div className="flex flex-col gap-2.5 text-[13px] text-slate-655 dark:text-slate-400">
            <a href="#install" className="hover:text-blue-600 transition-colors">Installation</a>
            <a href="#docker" className="hover:text-blue-600 transition-colors">Docker Setup</a>
            <a href="#ollama" className="hover:text-blue-600 transition-colors">Ollama API</a>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <h1 className="font-sans text-4xl font-black text-slate-900 dark:text-white">Technical Docs</h1>
          
          <section id="install" className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Installation</h2>
            <p>Deploy CogniVault using our self-contained Node backend and React frontend.</p>
          </section>

          <section id="docker" className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Docker</h2>
            <pre className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              docker compose up -d
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── 10. PRIVACY POLICY PAGE ───────────────────────────────
export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed text-left">
        <h1 className="font-sans text-4xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
        <p>Your privacy and documents ownership are managed completely under self-hosted isolation patterns.</p>
      </div>
    </div>
  )
}

// ─── 11. TERMS OF SERVICE PAGE ──────────────────────────────
export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6 text-[14px] text-slate-650 dark:text-slate-400 leading-relaxed text-left">
        <h1 className="font-sans text-4xl font-black text-slate-900 dark:text-white">Terms of Service</h1>
        <p>Please read these terms carefully before deploying standard Community builds of the platform.</p>
      </div>
    </div>
  )
}
