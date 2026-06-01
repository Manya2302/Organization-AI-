import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, RefreshCw, Cpu, BrainCircuit } from 'lucide-react'

interface QAPair {
  question: string
  answer: string
  source: string
}

const PREDEFINED_QA: QAPair[] = [
  {
    question: "Is my data sent to external servers?",
    answer: "No, absolutely zero bytes leave your network. CogniVault AI runs completely on-premises. All text extractions (PaddleOCR) and Vector Database operations (ChromaDB) run on your self-hosted instance, backed by a local Ollama LLM runtime.",
    source: "Enterprise Security Architecture"
  },
  {
    question: "How does the OCR engine process scanned PDFs?",
    answer: "The platform features a multi-threaded PaddleOCR queue. When a scanned PDF or receipt is uploaded, the background worker slices the document into page images, performs high-precision text recognition, indexes it into PostgreSQL for full-text search, and stores it in ChromaDB for AI embedding queries.",
    source: "OCR Engine Pipeline & Worker SOP"
  },
  {
    question: "Can we restrict documents to specific departments?",
    answer: "Yes. Using the built-in Role-Based Access Control (RBAC), you can lock document classifications (e.g. Finance, HR, Legal). Audit logs trace all read/edit operations, giving security administrators complete transparency over data access pathways.",
    source: "Role Access Controls & Audits"
  },
  {
    question: "How does it protect against data loss when employees resign?",
    answer: "CogniVault AI acts as your organization's permanent memory core. By consolidating chats, manuals, and project logs under a single searchable intelligence layer, onboarding a replacement takes hours instead of weeks, preserving corporate memory indefinitely.",
    source: "Organizational Graph Strategy"
  }
]

export const AIChatBox: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; source?: string }[]>([
    { sender: 'assistant', text: "Hello! I am the CogniVault AI Local Copilot. Ask me anything about our data privacy, OCR extraction, or self-hosted deployment models." }
  ])
  const [typing, setTyping] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const handleSelectQuestion = (qa: QAPair) => {
    if (typing) return
    
    // Add user query
    setMessages(prev => [...prev, { sender: 'user', text: qa.question }])
    setTyping(true)

    // Simulate local LLM latency & streaming response
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: qa.answer,
        source: qa.source
      }])
    }, 1500)
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <BrainCircuit className="text-blue-500 w-5 h-5" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              CogniVault Local Copilot
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">MODEL: QWEN-3 8B (LOCAL HOSTED)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">0% Data Leakage</span>
          <Cpu className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}>
              {msg.sender === 'user' ? 'U' : 'AI'}
            </div>
            <div className="space-y-1.5 max-w-[75%]">
              <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              {msg.source && (
                <div className="text-[10px] text-blue-500 dark:text-blue-400 font-mono flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified Context Source: {msg.source}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {typing && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500">AI</div>
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-[13px] text-slate-500 flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-blue-500" />
              Thinking & reading vector chunks...
            </div>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Predefined Questions Panel */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30">
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
          Select a predefined question to test query RAG:
        </div>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_QA.map((qa, idx) => (
            <button
              key={idx}
              disabled={typing}
              onClick={() => handleSelectQuestion(qa)}
              className="text-[12px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-3.5 py-1.5 rounded-full transition-all text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {qa.question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AIChatBox
