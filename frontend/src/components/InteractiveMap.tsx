import React, { useState } from 'react'
import { Globe, Server } from 'lucide-react'

interface NodeLocation {
  city: string
  region: string
  ip: string
  docs: string
  status: 'Healthy' | 'Syncing' | 'Backup'
  ping: string
  x: number // SVG percentage
  y: number // SVG percentage
}

const locations: NodeLocation[] = [
  { city: 'Ahmedabad', region: 'Primary Core Cluster', ip: '10.140.0.4', docs: '849,203', status: 'Healthy', ping: '0.4ms', x: 65, y: 68 },
  { city: 'Mumbai', region: 'Edge Replication Node', ip: '10.142.12.8', docs: '128,495', status: 'Healthy', ping: '1.2ms', x: 55, y: 55 },
  { city: 'New Delhi', region: 'Gov & Compliance Node', ip: '10.144.3.1', docs: '344,091', status: 'Healthy', ping: '2.1ms', x: 62, y: 35 },
  { city: 'Singapore', region: 'APAC Archive Node', ip: '10.150.8.2', docs: '1,495,200', status: 'Syncing', ping: '28ms', x: 88, y: 80 }
]

export const InteractiveMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeLocation>(locations[0])

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl p-6 md:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Map Graphics */}
      <div className="lg:col-span-2 relative min-h-[300px] border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/40 p-4 flex items-center justify-center">
        {/* Futuristic Grid Map Background */}
        <svg className="w-full h-full min-h-[260px] opacity-75" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Grid Lines */}
          <defs>
            <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-300 dark:text-slate-800" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#map-grid)" />

          {/* Abstract India/APAC border representation */}
          <path d="M45,20 Q52,15 60,25 T70,35 T72,55 T65,80 T50,85 T40,65 T38,45 Z"
            fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="text-blue-500/20 dark:text-blue-500/10" />

          {/* Sync Connection lines between selected node and other nodes */}
          {locations.map((loc, idx) => (
            <line
              key={idx}
              x1={selectedNode.x}
              y1={selectedNode.y}
              x2={loc.x}
              y2={loc.y}
              stroke="url(#line-grad)"
              strokeWidth="0.4"
              strokeDasharray="2 2"
            />
          ))}

          <defs>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Location Pins */}
          {locations.map((loc, idx) => (
            <g key={idx} className="cursor-pointer" onClick={() => setSelectedNode(loc)}>
              {/* Outer pulsing ring */}
              <circle
                cx={loc.x}
                cy={loc.y}
                r="3.5"
                fill="none"
                stroke={loc.status === 'Syncing' ? '#fbbf24' : '#3b82f6'}
                strokeWidth="0.7"
                className={selectedNode.city === loc.city ? "animate-pulse" : ""}
              />
              {/* Inner core circle */}
              <circle
                cx={loc.x}
                cy={loc.y}
                r="1.8"
                fill={loc.status === 'Syncing' ? '#fbbf24' : '#3b82f6'}
              />
            </g>
          ))}
        </svg>

        <div className="absolute bottom-4 left-4 text-[11px] text-slate-400 font-mono bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
          NODE REPLICATION MAP (LOCAL CLUSTER GROUP 0)
        </div>
      </div>

      {/* Node details */}
      <div className="flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="badge-brand block mb-2">Node Selected</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              {selectedNode.city} Node
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-mono mt-1">{selectedNode.region}</p>
          </div>

          <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Node IP Address</span>
              <span className="font-mono font-medium text-slate-800 dark:text-white">{selectedNode.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Documents Sync Index</span>
              <span className="font-medium text-slate-800 dark:text-white">{selectedNode.docs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Local Cluster Latency</span>
              <span className="font-mono font-medium text-green-600 dark:text-green-400">{selectedNode.ping}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Replication Integrity</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${selectedNode.status === 'Healthy'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                }`}>
                {selectedNode.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action item */}
        <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
          <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <Globe className="text-blue-500 w-4 h-4 flex-shrink-0" />
            <span>SecureVault database replication runs in multi-primary cluster mode for 100% data durability.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveMap
