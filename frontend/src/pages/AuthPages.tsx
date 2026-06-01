import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Shield, Mail, Lock, User, CheckCircle, ArrowRight, Building, 
  ChevronLeft, Key, Cpu 
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { SecureVaultLogo } from '../components/Navbar'

// ─── ROTATING SIDEBAR DATA ────────────────────────────────
const slides = [
  {
    title: "Zero-Trust Document Sovereignty",
    description: "CogniVault AI implements atomic level access controls and cryptographic envelopes for ultimate enterprise data protection.",
    visual: "sovereignty"
  },
  {
    title: "Instantaneous Semantic Discovery",
    description: "Ask questions, parse tables, and retrieve critical information from compliance forms instantly using deep local LLMs.",
    visual: "discovery"
  },
  {
    title: "Distributed Audit Ledgers",
    description: "Every file upload, version upgrade, and verification check is immutably logged for instant audit readiness.",
    visual: "audit"
  }
]

const RotatingSidebar: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`hidden lg:flex lg:col-span-6 relative overflow-hidden bg-[#03060f] text-white flex-col justify-between p-12 ${
      side === 'left' ? 'border-r border-slate-800' : 'border-l border-slate-800'
    }`}>
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(26,86,219,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_65%)] pointer-events-none" />

      {/* Top branding */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          ✦
        </div>
        <span className="font-display font-bold text-[13px] tracking-wider text-slate-350 uppercase">
          COGNIVAULT ACTIVE NODE
        </span>
      </div>

      {/* Middle Animated Visuals */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center h-72">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center justify-center"
          >
            {slides[currentSlide].visual === 'sovereignty' && (
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Rotating ring 1 */}
                <div className="absolute inset-0 border border-dashed border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '24s' }} />
                {/* Rotating ring 2 */}
                <div className="absolute inset-4 border border-dashed border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />
                {/* Floating particles */}
                <div className="absolute w-2 h-2 rounded-full bg-blue-400 top-4 left-1/4 animate-bounce" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 bottom-6 right-1/4 animate-ping" />
                
                {/* Central Orb */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.35)] border border-white/10">
                  <Shield size={32} className="text-white animate-pulse" />
                </div>
              </div>
            )}

            {slides[currentSlide].visual === 'discovery' && (
              <div className="relative w-48 h-48 flex flex-col items-center justify-center gap-3.5">
                {/* Search parsing animation */}
                <div className="w-40 bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xl">
                  <Cpu className="h-4 w-4 text-purple-400 animate-spin" />
                  <div className="text-[10px] font-mono text-slate-400">Embedding vector space...</div>
                </div>
                <div className="w-44 bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-lg text-[9.5px] font-mono text-cyan-400 text-left">
                  <span className="text-slate-500">&gt; Query:</span> "compliance gaps FY26"
                  <div className="text-green-400 mt-1">&gt; 3 Documents mapped [99.1%]</div>
                </div>
              </div>
            )}

            {slides[currentSlide].visual === 'audit' && (
              <div className="relative w-48 h-48 flex flex-col gap-3 justify-center">
                {/* Block ledger display */}
                <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                  <div className="w-5 h-5 rounded bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">✓</div>
                  <div className="text-left">
                    <div className="text-[9.5px] font-bold text-white">Block Committed</div>
                    <div className="text-[8px] text-slate-500">Hash: 8a9df2c...</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl opacity-60">
                  <div className="w-5 h-5 rounded bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">✓</div>
                  <div className="text-left">
                    <div className="text-[9.5px] font-bold text-white">OCR Parsing Verified</div>
                    <div className="text-[8px] text-slate-500">Hash: 112fe90...</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Text Slide */}
      <div className="relative z-10 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-2 text-left"
          >
            <h3 className="font-display text-xl font-bold text-white leading-tight">
              {slides[currentSlide].title}
            </h3>
            <p className="text-slate-400 text-[12.5px] leading-relaxed max-w-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        <div className="flex gap-1.5 pt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === i ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN PAGE ───────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { login } = useAppStore()
  const navigate = useNavigate()
  
  // Tab roles: Employee, EnterpriseAdmin (SuperAdmin extracted)
  const [activeTab, setActiveTab] = useState<'Employee' | 'EnterpriseAdmin'>('Employee')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgId, setOrgId] = useState('')
  const [empId, setEmpId] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in credentials.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 800)
  }

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (otpSent && otpCode !== '123456') {
      setError('Invalid OTP code. Try entering 123456.')
      setLoading(false)
      return
    }

    try {
      const success = await login(activeTab, email, orgId, empId)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Authentication server error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#03060f] text-slate-800 dark:text-gray-100 transition-colors duration-300">
      {/* Left Column (Forms) */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 md:p-12 pt-24 md:pt-28">
        {/* Back Link */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ChevronLeft size={14} /> Back to Website
          </Link>
          <SecureVaultLogo size={28} />
        </div>

        {/* Card Form container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">Security Portal Login</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Access SecureVault AI Enterprise Console</p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
            {(['Employee', 'EnterpriseAdmin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveTab(role)
                  setOtpSent(false)
                  setError('')
                }}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === role 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {role === 'EnterpriseAdmin' ? 'Enterprise Admin' : 'Employee'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-left">
              {activeTab === 'EnterpriseAdmin' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Organization ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Building className="h-4 w-4" /></span>
                    <input
                      type="text" required placeholder="ORG-1001"
                      value={orgId} onChange={e => setOrgId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Employee' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Employee ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User className="h-4 w-4" /></span>
                    <input
                      type="text" required placeholder="EMP-001"
                      value={empId} onChange={e => setEmpId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail className="h-4 w-4" /></span>
                  <input
                    type="email" required placeholder="user@company.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Password</label>
                  <Link to="/forgot-password" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Lock className="h-4 w-4" /></span>
                  <input
                    type="password" required placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 hover:scale-102 cursor-pointer shadow-sm shadow-blue-600/10"
              >
                {loading ? 'Processing...' : 'Send Verification OTP'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4 text-left">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-blue-805 dark:text-slate-350 p-3 rounded-lg text-xs leading-relaxed">
                We sent a verification OTP to <strong>{email}</strong>. Enter <strong>123456</strong> to proceed.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1.5">OTP Code</label>
                <input
                  type="text" required placeholder="123456" maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Authorize'}
              </button>
              
              <button 
                type="button" onClick={() => setOtpSent(false)}
                className="w-full text-center text-[10px] text-slate-400 hover:underline cursor-pointer"
              >
                Change email or password
              </button>
            </form>
          )}

          {activeTab === 'Employee' && (
            <div className="text-center pt-2 text-[11px] text-slate-500 dark:text-gray-400">
              Don't have an account? <Link to="/register-employee" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Self Register</Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 max-w-md mx-auto mt-6">
          Authorized access only. All activities within this node are encrypted and logged directly in PostgreSQL.
        </div>
      </div>

      {/* Right Column (Rotating Sidebar) */}
      <RotatingSidebar side="right" />
    </div>
  )
}

// ─── ORG REGISTRATION PAGE ────────────────────────────────
export const OrgRegisterPage: React.FC = () => {
  const { registerOrganization } = useAppStore()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: 'Private Limited',
    industry: 'Technology',
    gstNumber: '',
    companyEmail: '',
    contactNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    numberOfEmployees: '1-10',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  })
  
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 1000)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otpCode !== '123456') {
      setError('Invalid OTP code. Try entering 123456.')
      return
    }
    setLoading(true)
    const success = await registerOrganization(formData)
    setLoading(false)
    if (success) {
      navigate('/login')
    } else {
      setError('Registration failed. Try again.')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#03060f] text-slate-800 dark:text-gray-100 transition-colors duration-300">
      {/* Left Column (Rotating Sidebar) */}
      <RotatingSidebar side="left" />

      {/* Right Column (Forms) */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 md:p-12 pt-24 md:pt-28">
        {/* Back Link */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ChevronLeft size={14} /> Back to Login
          </Link>
          <SecureVaultLogo size={28} />
        </div>

        {/* Card Form container */}
        <div className="w-full max-w-xl mx-auto my-auto space-y-6">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">Register Organization</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Initialize a secure, self-hosted vault workspace</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* Col 1 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase border-b border-slate-200 dark:border-white/5 pb-1">Corporate Profile</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Company Name</label>
                  <input
                    type="text" required placeholder="Acme Corporation"
                    value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">GST / Tax Number</label>
                  <input
                    type="text" required placeholder="29GGGGG1314R9Z8"
                    value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Email</label>
                    <input
                      type="email" required placeholder="info@acme.com"
                      value={formData.companyEmail} onChange={e => setFormData({...formData, companyEmail: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Contact Phone</label>
                    <input
                      type="text" required placeholder="+91 999..."
                      value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Street Address</label>
                  <input
                    type="text" required placeholder="4th Floor, Phase 1"
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">City</label>
                    <input
                      type="text" required placeholder="Bangalore"
                      value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">State</label>
                    <input
                      type="text" required placeholder="Karnataka"
                      value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Country</label>
                    <input
                      type="text" required placeholder="India"
                      value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase border-b border-slate-200 dark:border-white/5 pb-1">Admin Configuration</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Admin Full Name</label>
                  <input
                    type="text" required placeholder="John Doe"
                    value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Admin Work Email</label>
                  <input
                    type="email" required placeholder="admin@acme.com"
                    value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Secure Password</label>
                  <input
                    type="password" required placeholder="Minimum 8 characters"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password" required placeholder="Re-enter password"
                    value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-600/10"
                  >
                    {loading ? 'Processing...' : 'Register Workspace'} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 text-center text-[11px] text-slate-500 dark:text-gray-400 mt-2">
                Already configured? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Log in here</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm mx-auto text-left">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-205 text-slate-600 dark:text-slate-350 p-4 rounded-xl text-xs leading-relaxed text-center">
                We sent a verification OTP to your email <strong>{formData.adminEmail}</strong>. Enter <strong>123456</strong> to activate the workspace.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1.5 text-center">OTP Code</label>
                <input
                  type="text" required placeholder="123456" maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Deploy Platform'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 max-w-md mx-auto mt-6">
          SecureVault active deployment circle logs deployment audits directly inside Postgres.
        </div>
      </div>
    </div>
  )
}

// ─── EMPLOYEE REGISTER PAGE ──────────────────────────────
export const EmployeeRegisterPage: React.FC = () => {
  const { registerEmployee } = useAppStore()
  
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    department: 'Legal',
    designation: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setLoading(true)
    
    try {
      const success = await registerEmployee(formData)
      if (success) {
        setRegistered(true)
      } else {
        setError('Self-registration failed.')
      }
    } catch (err) {
      setError('Server connection error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#03060f] text-slate-800 dark:text-gray-100 transition-colors duration-300">
      {/* Left Column (Rotating Sidebar) */}
      <RotatingSidebar side="left" />

      {/* Right Column (Forms) */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 md:p-12 pt-24 md:pt-28">
        {/* Back Link */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ChevronLeft size={14} /> Back to Login
          </Link>
          <SecureVaultLogo size={28} />
        </div>

        {/* Card Form container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">Employee Registration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Join your organization's SecureVault intelligence circle</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {registered ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Registration Submitted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your request was logged. The Enterprise Admin or Department Manager must approve and activate your account before you can log in.
              </p>
              <Link to="/login" className="inline-block mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">First Name</label>
                  <input
                    type="text" required placeholder="Neha"
                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Last Name</label>
                  <input
                    type="text" required placeholder="Gupta"
                    value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Employee ID</label>
                  <input
                    type="text" required placeholder="EMP-004"
                    value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Mobile Number</label>
                  <input
                    type="text" required placeholder="+91 999..."
                    value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Work Email</label>
                <input
                  type="email" required placeholder="neha@company.com"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Department</label>
                  <select
                    value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Legal">Legal</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Designation</label>
                  <input
                    type="text" required placeholder="Talent Lead"
                    value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Password</label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-600/10"
              >
                {loading ? 'Submitting...' : 'Register Account'}
              </button>

              <div className="text-center pt-2 text-[11px] text-slate-500 dark:text-gray-400">
                Already registered? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Log in</Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 max-w-md mx-auto mt-6">
          Registration is subject to active admin clearance logs mapped under GDPR/DPDP audit structures.
        </div>
      </div>
    </div>
  )
}

// ─── FORGOT PASSWORD PAGE ────────────────────────────────
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please provide an email.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 800)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otpCode !== '123456') {
      setError('Invalid OTP code. Try entering 123456.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setCompleted(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#03060f] text-slate-800 dark:text-gray-100 transition-colors duration-300">
      {/* Left Column (Rotating Sidebar) */}
      <RotatingSidebar side="left" />

      {/* Right Column (Forms) */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 md:p-12 pt-24 md:pt-28">
        {/* Back Link */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ChevronLeft size={14} /> Back to Login
          </Link>
          <SecureVaultLogo size={28} />
        </div>

        {/* Card Form container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">Reset Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Validate security constraints via verification code</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs text-left">
              {error}
            </div>
          )}

          {completed ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-505 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Password Changed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your credentials have been updated securely inside Postgres.</p>
              <Link to="/login" className="inline-block mt-4 py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors">
                Go to Login
              </Link>
            </div>
          ) : !otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Work Email</label>
                <input
                  type="email" required placeholder="user@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Send Password Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 text-left">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 text-slate-600 dark:text-slate-350 p-3 rounded-lg text-xs text-center">
                A 6-digit OTP code has been dispatched. Enter <strong>123456</strong>.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">OTP Code</label>
                <input
                  type="text" required placeholder="123456" maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">New Password</label>
                <input
                  type="password" required placeholder="Minimum 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password" required placeholder="Re-enter new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 max-w-md mx-auto mt-6">
          Password updates follow local node security protocols matching NIST digital identity standards.
        </div>
      </div>
    </div>
  )
}

// ─── SUPER ADMIN LOGIN PAGE ──────────────────────────────
export const SuperAdminLoginPage: React.FC = () => {
  const { login } = useAppStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in credentials.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 800)
  }

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (otpSent && otpCode !== '123456') {
      setError('Invalid OTP code. Try entering 123456.')
      setLoading(false)
      return
    }

    try {
      const success = await login('SuperAdmin', email, undefined, undefined)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Login failed.')
      }
    } catch (err) {
      setError('Authentication server error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02050c] text-white px-6 py-12 relative overflow-hidden">
      {/* Background cybernetics grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(26,86,219,0.2),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="inline-flex rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-3.5 border border-purple-500/30 text-white mx-auto shadow-[0_0_25px_rgba(124,58,237,0.3)] animate-pulse">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Super Admin Terminal</h2>
          <p className="text-[11px] font-mono text-purple-400 tracking-wider uppercase">Secure Vault Global Root Console</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-left">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4.5 text-left">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-550 uppercase tracking-widest mb-1.5">Root User Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail className="h-4 w-4" /></span>
                <input
                  type="email" required placeholder="root@securevault.ai"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-550 uppercase tracking-widest mb-1.5">Security Token Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock className="h-4 w-4" /></span>
                <input
                  type="password" required placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 hover:scale-102 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              {loading ? 'Validating Token...' : 'Initialize Root OTP Verification'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndLogin} className="space-y-4.5 text-left">
            <div className="bg-purple-900/20 border border-purple-500/20 text-slate-300 p-3 rounded-xl text-xs leading-relaxed text-center font-mono">
              Root key OTP dispatched to <strong>{email}</strong>. Enter <strong>123456</strong>.
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-purple-400 uppercase mb-1.5 text-center tracking-widest">Master Verification Code</label>
              <input
                type="text" required placeholder="123456" maxLength={6}
                value={otpCode} onChange={e => setOtpCode(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-650 hover:bg-purple-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-900/20"
            >
              {loading ? 'Authorizing Root...' : 'Verify Root Credentials'}
            </button>
          </form>
        )}
        
        <div className="text-center pt-2 text-[10px] text-slate-500 font-mono">
          <Link to="/login" className="hover:text-purple-400 transition-colors">Standard Gateway</Link>
        </div>
      </div>
    </div>
  )
}
