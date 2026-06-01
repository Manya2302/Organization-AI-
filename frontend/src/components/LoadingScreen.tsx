import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BrainCircuit, Cpu } from 'lucide-react'

interface LoadingScreenProps {
  onComplete: () => void
}

const loadingWords = ["SCANNING", "EXTRACTING", "EMBEDDING", "SECURING", "READY"]

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const duration = 2500 // 2.5 seconds

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = timestamp - startTimestamp
      const percentage = Math.min(Math.floor((progress / duration) * 100), 100)
      
      setCount(percentage)

      // Cycle words based on progress percentage
      const nextWordIdx = Math.min(Math.floor((percentage / 100) * loadingWords.length), loadingWords.length - 1)
      setWordIndex(nextWordIdx)

      if (progress < duration) {
        window.requestAnimationFrame(step)
      } else {
        setTimeout(onComplete, 300)
      }
    }

    window.requestAnimationFrame(step)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] bg-[#03060f] flex flex-col justify-between p-8 md:p-12 select-none overflow-hidden"
    >
      {/* Top Left: Logo name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <BrainCircuit className="text-blue-500 w-4 h-4" />
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">
          CogniVault AI
        </div>
      </div>

      {/* Center: Animated Word cycles */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="h-16 flex items-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={wordIndex}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-4xl md:text-6xl font-display font-bold text-white tracking-wider"
            >
              {loadingWords[wordIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>
        <div className="text-[12px] text-slate-500 font-mono mt-3 uppercase tracking-[0.2em] flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 animate-spin text-blue-500" />
          Initializing Local Database Engine...
        </div>
      </div>

      {/* Bottom Counter & Progress Bar */}
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="text-slate-500 text-[11px] font-mono tracking-widest">
            SYSTEM STANDBY
          </div>
          <div className="text-6xl md:text-8xl lg:text-9xl font-display font-extrabold text-white leading-none tracking-tighter tabular-nums">
            {String(count).padStart(3, '0')}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-[3px] bg-slate-800/60 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-75"
            style={{
              width: `${count}%`,
              boxShadow: '0 0 12px rgba(59,130,246,0.5)'
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default LoadingScreen
