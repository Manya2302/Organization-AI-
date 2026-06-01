import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield, ChevronDown, Menu, X, Zap, Lock, 
  BarChart3, Users, FileText, Search, HelpCircle,
  Building2, Sparkles, Sun, Moon
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

// ─── Logo ────────────────────────────────────────────────
export const SecureVaultLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div className="flex items-center gap-2.5 select-none">
    {/* Clean Geometric corporate brandmark */}
    <svg
      viewBox="0 0 100 100"
      className="shrink-0"
      style={{ width: size, height: size }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arch 1: Corporate Globe Wing (TCS wave-style) */}
      <path 
        d="M15,50 C15,30 35,15 60,15 C75,15 85,25 85,35" 
        stroke="currentColor" 
        strokeWidth="10" 
        strokeLinecap="round"
        className="text-blue-600 dark:text-blue-500" 
      />
      {/* Arch 2: Interlocking Wave (Tech Mahindra style) */}
      <path 
        d="M40,85 C65,85 85,70 85,50 C85,38 75,30 65,30" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
        className="text-slate-400 dark:text-slate-650" 
      />
      {/* Center Pillar representing high-security Vaulting */}
      <line 
        x1="50" 
        y1="35" 
        x2="50" 
        y2="65" 
        stroke="currentColor" 
        strokeWidth="10" 
        strokeLinecap="round"
        className="text-blue-600 dark:text-blue-500" 
      />
    </svg>
    
    {/* Professional Corporate Wordmark */}
    <div className="flex flex-col leading-none text-left">
      <span className="font-sans font-black tracking-tight flex items-center text-slate-900 dark:text-white" style={{ fontSize: size * 0.48, letterSpacing: '-0.02em' }}>
        Cogni<span className="text-blue-600 dark:text-blue-500 font-extrabold">Vault</span>
        <span className="ml-1.5 px-1 py-0.5 rounded-[4px] text-[7.5px] bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 font-bold uppercase tracking-normal font-sans">AI</span>
      </span>
      <span style={{ fontSize: size * 0.22, letterSpacing: '0.08em' }} className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.08em] font-sans mt-1">
        Enterprise Systems
      </span>
    </div>
  </div>
)

// ─── Nav Data ────────────────────────────────────────────
const navItems = [
  {
    label: 'Platform',
    href: null,
    submenu: [
      { label: 'Document Intelligence', href: '/features', icon: FileText, desc: 'AI-powered document management & OCR' },
      { label: 'Security & Compliance', href: '/security', icon: Lock, desc: 'Enterprise-grade security controls' },
      { label: 'Knowledge Search', href: '/features#search', icon: Search, desc: 'Semantic search across all content' },
      { label: 'Analytics Dashboard', href: '/features#analytics', icon: BarChart3, desc: 'Real-time insights & reporting' },
      { label: 'Team Collaboration', href: '/features#team', icon: Users, desc: 'Role-based access & permissions' },
      { label: 'AI Copilot', href: '/features#ai', icon: Sparkles, desc: 'Conversational AI for your documents' },
    ]
  },
  {
    label: 'Solutions',
    href: null,
    submenu: [
      { label: 'Enterprise', href: '/solutions', icon: Building2, desc: 'Large-scale organizational deployment' },
      { label: 'Legal & Compliance', href: '/solutions#legal', icon: Shield, desc: 'Contract & regulatory management' },
      { label: 'HR & Onboarding', href: '/solutions#hr', icon: Users, desc: 'Employee knowledge management' },
      { label: 'Finance & Audit', href: '/solutions#finance', icon: BarChart3, desc: 'Audit trails & financial records' },
    ]
  },
  {
    label: 'Industries',
    href: '/industries',
    submenu: null
  },
  {
    label: 'Pricing',
    href: '/pricing',
    submenu: null
  },
  {
    label: 'Resources',
    href: null,
    submenu: [
      { label: 'Documentation', href: '/documentation', icon: FileText, desc: 'API docs & integration guides' },
      { label: 'About Us', href: '/about', icon: Building2, desc: 'Our mission & team' },
      { label: 'Contact', href: '/contact', icon: HelpCircle, desc: 'Get in touch with our team' },
    ]
  },
]

// ─── Mega Dropdown ───────────────────────────────────────
const MegaDropdown: React.FC<{ items: typeof navItems[0]['submenu'] }> = ({ items }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.98 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className="absolute top-full left-1/2 -translate-x-1/2 mt-3.5 z-50"
    style={{ minWidth: 440 }}
  >
    <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-xl">
      <div className="grid gap-1" style={{ gridTemplateColumns: items!.length > 4 ? '1fr 1fr' : '1fr' }}>
        {items!.map((item, i) => (
          <Link
            key={i}
            to={item.href}
            className="flex items-start gap-3 p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group text-left"
          >
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <item.icon size={15} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-850 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </motion.div>
)

// ─── Navbar ──────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  
  const { theme, toggleTheme } = useAppStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveMenu(null)
  }, [location])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isAuth = ['/login', '/register', '/register-employee', '/forgot-password', '/secure-admin-portal'].includes(location.pathname)
  const isDashboard = location.pathname.startsWith('/dashboard')
  if (isDashboard || isAuth) return null

  return (
    <>
      {/* Fixed Full-Width Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-white/95 dark:bg-[#03060f]/95 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm' 
            : 'bg-white/70 dark:bg-[#03060f]/40 border-transparent backdrop-blur-[2px]'
        }`}
      >
        <div
          ref={menuRef}
          className="w-full max-w-[1440px] mx-auto flex items-center justify-between px-6 py-3.5"
        >
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 mr-6">
            <SecureVaultLogo size={34} />
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-850 mr-6 hidden md:block" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 flex-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {item.href && !item.submenu ? (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 py-2 text-[14px] font-bold transition-all border-b-2 ${
                      location.pathname === item.href
                        ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'text-slate-650 border-transparent hover:text-blue-600 hover:border-blue-600 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    className={`flex items-center gap-1 py-2 text-[14px] font-bold transition-all cursor-pointer border-b-2 ${
                      activeMenu === item.label 
                        ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                        : 'text-slate-650 border-transparent hover:text-blue-600 hover:border-blue-600 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}

                <AnimatePresence>
                  {activeMenu === item.label && item.submenu && (
                    <MegaDropdown items={item.submenu} />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Right Controls & CTA */}
          <div className="hidden md:flex items-center gap-5 ml-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link
              to="/login"
              className="text-[14px] font-bold text-slate-700 hover:text-blue-600 dark:text-slate-350 dark:hover:text-white py-2 transition-colors"
            >
              Sign In
            </Link>
            
            <Link
              to="/register"
              className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-4.5 py-2.5 rounded-[4px] transition-all shadow-sm cursor-pointer"
            >
              <Zap size={13} />
              Get Started
            </Link>
          </div>

          {/* Mobile Theme Toggle + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-18 z-50 bg-white dark:bg-[#080d1a] rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 md:hidden"
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between px-3 py-3 text-[14px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                      >
                        {item.label}
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {mobileExpanded === item.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-4"
                          >
                            {item.submenu.map((sub, i) => (
                              <Link
                                key={i}
                                to={sub.href}
                                className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                              >
                                <sub.icon size={13} className="text-blue-600 dark:text-blue-400" />
                                {sub.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to={item.href!}
                      className="block px-3 py-3 text-[14px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 flex flex-col gap-2">
                <Link to="/login" className="text-center py-3 text-[14px] font-medium text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="flex items-center justify-center gap-2 py-3 text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-all">
                  <Zap size={14} />
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
