import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Cookie, Check } from 'lucide-react'

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cognivault_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cognivault_cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cognivault_cookie_consent', 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[9999]"
        >
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-500">
                <Cookie size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  Privacy Preferences
                </h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  We use cookies to enable secure sessions and maintain state when utilizing our offline fallback systems. No tracking cookies are used.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-[12px] font-semibold pt-1 border-t border-slate-100 dark:border-slate-900">
              <button
                onClick={handleDecline}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-sm shadow-blue-900/20"
              >
                <Check size={13} />
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CookieBanner
