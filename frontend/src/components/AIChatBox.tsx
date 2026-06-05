import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Cpu, BrainCircuit } from 'lucide-react'

interface Citation {
  document: string
  matchedParagraph: string
  page: number
  confidence: number
}

interface Message {
  sender: 'user' | 'assistant'
  text: string
  source?: string
  citations?: Citation[]
}

interface QAPair {
  question: string
  answer: string
  source: string
  snippet: string
  page: number
  confidence: number
}

const PREDEFINED_QA: QAPair[] = [
  {
    question: "Is my data sent to external servers?",
    answer: "No, absolutely zero bytes leave your network. SecureVault AI runs completely on-premises. All text extractions (PaddleOCR) and Vector Database operations (ChromaDB) run on your self-hosted instance, backed by a local Ollama LLM runtime.",
    source: "Enterprise Security Architecture",
    snippet: "Data Isolation Clause 4.2: All indexed document text blocks, vector spaces, and user prompt payloads must remain locked on the system node network cluster. Transmitting telemetry or prompt texts to external API endpoints is strictly prohibited.",
    page: 12,
    confidence: 99
  },
  {
    question: "How does the OCR engine process scanned PDFs?",
    answer: "The platform features a multi-threaded PaddleOCR queue. When a scanned PDF or receipt is uploaded, the background worker slices the document into page images, performs high-precision text recognition, indexes it into PostgreSQL for full-text search, and stores it in ChromaDB for AI embedding queries.",
    source: "OCR Engine Pipeline & Worker SOP",
    snippet: "OCR Stage 1 & 2: Uploaded files pass directly into local PaddleOCR worker. Bounding box coordinates are retained, and output strings are transformed into semantic token blocks.",
    page: 3,
    confidence: 96
  },
  {
    question: "Can we restrict documents to specific departments?",
    answer: "Yes. Using the built-in Role-Based Access Control (RBAC), you can lock document classifications (e.g. Finance, HR, Legal). Audit logs trace all read/edit operations, giving security administrators complete transparency over data access pathways.",
    source: "Role Access Controls & Audits",
    snippet: "Section 7.1: Department level segregation restricts all default employee roles. Any audit bypass attempts automatically trigger standard alerts to the Security Audit Console.",
    page: 8,
    confidence: 98
  },
  {
    question: "How does it protect against data loss when employees resign?",
    answer: "SecureVault AI acts as your organization's permanent memory core. By consolidating chats, manuals, and project logs under a single searchable intelligence layer, onboarding a replacement takes hours instead of weeks, preserving corporate memory indefinitely.",
    source: "Organizational Graph Strategy",
    snippet: "Memory Consolidation: Retain structural relationships, metadata schemas, and chat histories under Neo4j graph schemas to guarantee institutional knowledge persistence.",
    page: 24,
    confidence: 95
  }
]

export const AIChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: "Hello! I am the SecureVault AI Local Copilot. Ask me anything about our data privacy, OCR extraction, or self-hosted compliance deployment models." }
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

    // Simulate local LLM retrieval & word-by-word streaming
    setTimeout(() => {
      setTyping(false)
      
      const words = qa.answer.split(' ')
      let currentText = ''
      let wordIdx = 0

      // Add a blank placeholder assistant message
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: '',
        source: qa.source,
        citations: [
          {
            document: qa.source,
            matchedParagraph: qa.snippet,
            page: qa.page,
            confidence: qa.confidence
          }
        ]
      }])

      const interval = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx]
          setMessages(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: currentText
              }
            }
            return updated
          })
          wordIdx++
        } else {
          clearInterval(interval)
        }
      }, 35) // Elegant natural streaming speed
    }, 1200)
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <BrainCircuit className="text-blue-500 w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              SecureVault Local Copilot
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">MODEL: QWEN-3 8B (LOCAL HOSTED)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">0% External Leakage</span>
          <Cpu className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
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
              
              {/* Citations list block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400 tracking-widest block uppercase">Source Citations</span>
                  {msg.citations.map((cit, idx) => (
                    <div key={idx} className="flex flex-col gap-1 first:border-t-0 border-t border-slate-200 dark:border-white/5 pt-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">📄 {cit.document}</span>
                        <div className="flex gap-2 text-slate-400 font-bold">
                          <span>Page {cit.page}</span>
                          <span>•</span>
                          <span className="text-emerald-500">{cit.confidence}% Match</span>
                        </div>
                      </div>
                      <p className="text-[10px] italic text-slate-500 dark:text-gray-400 leading-normal bg-white/20 dark:bg-white/5 p-2 rounded-lg border border-slate-250 dark:border-white/5 mt-1 font-mono">
                        {cit.matchedParagraph}
                      </p>
                    </div>
                  ))}
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
        <div className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-left">
          Select a predefined question to test query RAG:
        </div>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_QA.map((qa, idx) => (
            <button
              key={idx}
              disabled={typing}
              onClick={() => handleSelectQuestion(qa)}
              className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 px-3.5 py-1.5 rounded-full transition-all text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer disabled:opacity-50"
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
