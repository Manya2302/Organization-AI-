import React from 'react'

interface LogoItem {
  name: string
  colorClass: string
  svg: React.ReactNode
}

const logos: LogoItem[] = [
  {
    name: 'Procure',
    colorClass: 'group-hover:text-blue-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  {
    name: 'Shopify',
    colorClass: 'group-hover:text-emerald-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.5h-3v-1A2.5 2.5 0 0013.5 3h-3A2.5 2.5 0 008 5.5v1H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-11c0-1.1-.9-2-2-2zM9.5 5.5c0-.3.2-.5.5-.5h3c.3 0 .5.2.5.5v1h-4v-1z" />
      </svg>
    )
  },
  {
    name: 'Blender',
    colorClass: 'group-hover:text-orange-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.93-.68 3.7-1.8 5.1z" />
      </svg>
    )
  },
  {
    name: 'Figma',
    colorClass: 'group-hover:text-purple-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.5 2C6.57 2 5 3.57 5 5.5S6.57 9 8.5 9H12V2H8.5zm7 0C13.57 2 12 3.57 12 5.5V9h3.5C17.43 9 19 7.43 19 5.5S17.43 2 15.5 2zm-7 7C6.57 9 5 10.57 5 12.5S6.57 16 8.5 16H12V9H8.5zm7 0C13.57 9 12 10.57 12 12.5V16h3.5c1.93 0 3.5-1.57 3.5-3.5S17.43 9 15.5 9zM8.5 16C6.57 16 5 17.57 5 19.5S6.57 23 8.5 23s3.5-1.57 3.5-3.5V16H8.5z" />
      </svg>
    )
  },
  {
    name: 'Spotify',
    colorClass: 'group-hover:text-green-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.42c-.18.29-.56.38-.85.2-2.34-1.43-5.28-1.75-8.75-.96-.33.07-.65-.14-.72-.47-.07-.33.14-.65.47-.72 3.8-.87 7.05-.51 9.65 1.08.3.18.39.57.2.87zm1.22-2.72c-.22.36-.7.48-1.06.26-2.67-1.64-6.75-2.12-9.91-1.16-.4.12-.83-.1-.95-.5-.12-.4.1-.83.5-.95 3.61-1.1 8.11-.56 11.16 1.31.36.22.48.7.26 1.06zm.11-2.82C14.73 8.87 9.57 8.7 6.57 9.61c-.48.14-.98-.12-1.13-.6-.14-.48.12-.98.6-.13 3.46-1.05 9.17-.85 12.83 1.32.43.26.57.82.31 1.25-.25.42-.81.56-1.25.31z" />
      </svg>
    )
  },
  {
    name: 'Lottielab',
    colorClass: 'group-hover:text-pink-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v18M3 12h18M12 3l4 4M12 21l-4-4M3 12l4 4M21 12l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    name: 'Google Cloud',
    colorClass: 'group-hover:text-blue-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      </svg>
    )
  },
  {
    name: 'Bing',
    colorClass: 'group-hover:text-teal-500',
    svg: (
      <svg className="w-6 h-6 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 18.2L4 16V8.8l8 4 8-4V16l-8 4.2z" />
      </svg>
    )
  }
]

export const MarqueeScroller: React.FC = () => {
  return (
    <div className="w-full py-5 overflow-hidden relative border-y border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10">
      {/* Edge fading gradient mask */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-white via-transparent to-white dark:from-[#03060f] dark:to-[#03060f]" />
      
      <div className="flex gap-16 animate-marquee" style={{ width: 'max-content' }}>
        {[...logos, ...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="group flex items-center gap-2.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer py-1.5"
          >
            <div className={`text-slate-400 ${logo.colorClass} transition-colors duration-300`}>
              {logo.svg}
            </div>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 font-sans tracking-wide">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarqueeScroller
