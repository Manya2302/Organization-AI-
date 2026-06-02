import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Mail, Phone, MapPin, ArrowRight, ExternalLink
} from 'lucide-react'
import { SecureVaultLogo } from './Navbar'

// ─── Footer Column ────────────────────────────────────────
const FooterCol: React.FC<{
  title: string
  links: { label: string; href: string; external?: boolean }[]
}> = ({ title, links }) => (
  <div className="space-y-5">
    <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{title}</h4>
    <ul className="space-y-3">
      {links.map((link, i) => (
        <li key={i}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[14px] text-slate-400 hover:text-white transition-colors group"
            >
              {link.label}
              <ExternalLink size={11} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
            </a>
          ) : (
            <Link to={link.href} className="text-[14px] text-slate-450 hover:text-white transition-colors">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
)

// ─── Glass Text (Background Large Type) ──────────────────
const GlassText: React.FC = () => (
  <div className="relative w-full flex items-center justify-center select-none overflow-hidden" style={{ height: 140 }}>
    <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="footer-glass-effect" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" result="outer-shadow" />
          <feComponentTransfer in="SourceAlpha" result="alpha">
            <feFuncA type="linear" slope="1" />
          </feComponentTransfer>
          <feOffset in="alpha" dx="0" dy="4" result="offset-white" />
          <feGaussianBlur in="offset-white" stdDeviation="4" result="blur-white" />
          <feComposite in="alpha" in2="blur-white" operator="out" result="inner-white-mask" />
          <feFlood floodColor="#ffffff" floodOpacity="0.08" result="white-fill" />
          <feComposite in="white-fill" in2="inner-white-mask" operator="in" result="inner-white-final" />
          <feGaussianBlur in="alpha" stdDeviation="6" result="blur-black" />
          <feComposite in="alpha" in2="blur-black" operator="out" result="inner-black-mask" />
          <feFlood floodColor="#000000" floodOpacity="0.4" result="black-fill" />
          <feComposite in="black-fill" in2="inner-black-mask" operator="in" result="inner-black-final" />
          <feMerge>
            <feMergeNode in="outer-shadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="inner-white-final" />
            <feMergeNode in="inner-black-final" />
          </feMerge>
        </filter>
      </defs>
    </svg>
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="relative"
    >
      <h1
        className="font-display font-bold tracking-tight leading-none select-none px-4"
        style={{
          fontSize: 'min(18vw, 160px)',
          color: 'rgba(26,86,219,0.08)',
          filter: 'url(#footer-glass-effect)',
          letterSpacing: '-0.05em'
        }}
      >
        SecureVault
      </h1>
    </motion.div>
  </div>
)

// ─── Footer ──────────────────────────────────────────────
export const Footer: React.FC = () => {
  const location = useLocation()
  const isAuth = ['/login', '/register', '/register-employee', '/forgot-password', '/secure-admin-portal'].includes(location.pathname)
  const isDashboard = location.pathname.startsWith('/dashboard')
  if (isDashboard || isAuth) return null

  const platformLinks = [
    { label: 'Document Intelligence', href: '/features' },
    { label: 'AI Copilot', href: '/features#ai' },
    { label: 'Security Controls', href: '/security' },
    { label: 'Analytics', href: '/features#analytics' },
    { label: 'Team Collaboration', href: '/features#team' },
    { label: 'Knowledge Search', href: '/features#search' },
  ]

  const solutionsLinks = [
    { label: 'Enterprise', href: '/solutions' },
    { label: 'Legal & Compliance', href: '/solutions#legal' },
    { label: 'HR & Onboarding', href: '/solutions#hr' },
    { label: 'Finance & Audit', href: '/solutions#finance' },
    { label: 'Healthcare', href: '/industries' },
    { label: 'Education', href: '/industries' },
  ]

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/about#careers' },
    { label: 'Press & Media', href: '/about#press' },
    { label: 'Partners', href: '/about#partners' },
    { label: 'Contact', href: '/contact' },
  ]

  const resourcesLinks = [
    { label: 'Documentation', href: '/documentation' },
    { label: 'API Reference', href: '/documentation#api' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Status Page', href: '#', external: true },
    { label: 'Blog', href: '#', external: true },
  ]

  const socials = [
    { svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, href: '#', label: 'Twitter' },
    { svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0h.003z" /></svg>, href: '#', label: 'LinkedIn' },
    { svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>, href: '#', label: 'GitHub' },
    { svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.003 3.003 0 00-2.11 2.107C0 8.053 0 12 0 12s0 3.947.502 5.837a3.003 3.003 0 002.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.003 3.003 0 002.11-2.107C24 15.947 24 12 24 12s0-3.947-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>, href: '#', label: 'YouTube' }
  ]

  return (
    <footer className="relative bg-dark-bg border-t border-dark-border overflow-hidden">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-16 pb-8">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <SecureVaultLogo size={38} />
            <p className="text-[14px] text-slate-400 leading-relaxed max-w-xs">
              Enterprise AI platform transforming how organizations manage, secure, and extract intelligence from their document ecosystems.
            </p>
            {/* Contact info */}
            <div className="space-y-2">
              <a href="mailto:hello@securevault.ai" className="flex items-center gap-2 text-[13px] text-slate-400 hover:text-blue-400 transition-colors">
                <Mail size={13} className="text-blue-500" />
                hello@securevault.ai
              </a>
              <a href="tel:+918800000000" className="flex items-center gap-2 text-[13px] text-slate-400 hover:text-blue-400 transition-colors">
                <Phone size={13} className="text-blue-500" />
                +91 88000 00000
              </a>
              <div className="flex items-center gap-2 text-[13px] text-slate-400">
                <MapPin size={13} className="text-blue-500" />
                Ahmedabad, Gujarat, India
              </div>
            </div>
            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-800/40 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <FooterCol title="Platform" links={platformLinks} />
            <FooterCol title="Solutions" links={solutionsLinks} />
            <FooterCol title="Company" links={companyLinks} />
            <FooterCol title="Resources" links={resourcesLinks} />
          </div>
        </div>

        {/* Newsletter */}
        <div className="feature-card rounded-2xl p-6 mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div>
              <h3 className="font-display font-semibold text-white text-[16px] mb-1">Stay ahead with SecureVault AI</h3>
              <p className="text-[13px] text-slate-400">Product updates, security insights, and enterprise AI trends.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@company.com"
                className="flex-1 md:w-56 px-4 py-2.5 rounded-full bg-white/5 border border-slate-700 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold transition-all">
                Subscribe <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Glass text watermark */}
        <GlassText />

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate-500">© 2025 SecureVault AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Cookie Policy', href: '/privacy-policy#cookies' },
              { label: 'Security', href: '/security' },
            ].map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 && <div className="w-px h-3 bg-slate-700" />}
                <Link to={link.href} className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[12px] text-slate-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
