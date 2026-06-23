import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, X } from 'lucide-react'
import { badgeIcons } from './badgeIcons'


// Styling details for different badge tiers
const typeConfig = {
  bronze: {
    glow: 'from-amber-600/20 via-amber-700/10 to-transparent',
    border: 'border-amber-700/30',
    titleColor: 'text-amber-700 dark:text-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/20',
    badgeText: 'text-amber-800 dark:text-amber-400',
    lightGlow: 'bg-amber-500/15',
  },
  silver: {
    glow: 'from-slate-400/20 via-slate-500/10 to-transparent',
    border: 'border-slate-400/30',
    titleColor: 'text-slate-650 dark:text-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-350',
    lightGlow: 'bg-slate-400/15',
  },
  gold: {
    glow: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    border: 'border-yellow-550/30 dark:border-yellow-500/25',
    titleColor: 'text-amber-600 dark:text-yellow-450',
    badgeBg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    badgeText: 'text-yellow-800 dark:text-yellow-450',
    lightGlow: 'bg-yellow-500/20',
  },
  diamond: {
    glow: 'from-indigo-550/25 via-violet-600/10 to-transparent',
    border: 'border-indigo-500/30 dark:border-indigo-500/20',
    titleColor: 'text-indigo-600 dark:text-indigo-450',
    badgeBg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
    badgeText: 'text-indigo-850 dark:text-indigo-400',
    lightGlow: 'bg-indigo-500/25 shadow-[0_0_30px_rgba(99,102,241,0.25)]',
  },
  special: {
    glow: 'from-purple-500/25 via-pink-600/10 to-transparent',
    border: 'border-purple-500/30 dark:border-purple-550/20',
    titleColor: 'text-purple-650 dark:text-purple-400',
    badgeBg: 'bg-purple-50/50 dark:bg-purple-950/20',
    badgeText: 'text-purple-800 dark:text-purple-400',
    lightGlow: 'bg-purple-500/25 shadow-[0_0_35px_rgba(168,85,247,0.3)]',
  }
}

export default function BadgeUnlockModal() {
  const [badge, setBadge] = useState(null)

  const particles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      y: [0, -20 - (i * 17) % 41],
      x: [0, -30 + (i * 23) % 61],
      duration: 1.5 + (i * 0.4) % 1.6,
      delay: i * 0.2
    }))
  }, [])
  
  useEffect(() => {
    function handleBadgeUnlock(e) {
      setBadge(e.detail)
    }
    
    window.addEventListener('badge-unlock', handleBadgeUnlock)
    return () => window.removeEventListener('badge-unlock', handleBadgeUnlock)
  }, [])

  if (!badge) return null

  const tier = badge.badge_type || 'bronze'
  const config = typeConfig[tier] || typeConfig.bronze
  const IconComponent = badgeIcons[badge.icon] || Award

  return (
    <AnimatePresence>
      {badge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBadge(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className={`relative overflow-hidden w-full max-w-sm rounded-3xl bg-white/95 dark:bg-[#070716]/95 border ${config.border} p-6 text-center shadow-2xl backdrop-blur-2xl`}
          >
            {/* Dynamic Radial Ambient Glow behind Icon */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr ${config.glow} blur-2xl pointer-events-none -z-10`} />

            {/* Close Button */}
            <button
              onClick={() => setBadge(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-350 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Sparkle effects for special classes */}
            <div className="flex flex-col items-center mt-3 mb-6 relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full ${config.badgeBg} border ${config.border}`}
              >
                {/* Decorative glowing ambient orb behind badge */}
                <div className={`absolute inset-0.5 rounded-full blur-sm -z-10 ${config.lightGlow}`} />
                <IconComponent className={`w-10 h-10 ${config.titleColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]`} />
              </motion.div>

              {/* Pulsing rings around badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                  className={`w-24 h-24 rounded-full border border-purple-500/20 absolute ${config.lightGlow}`}
                />
              </div>

              {/* Tiny floating particle elements */}
              {particles.map((p, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: p.y,
                    x: p.x,
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1.2, 0.5]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay
                  }}
                  className={`absolute w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-indigo-400' : 'bg-purple-400'} pointer-events-none`}
                  style={{ top: '40%' }}
                />
              ))}
            </div>

            {/* Text details */}
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.border}`}>
              {tier} achievement
            </span>

            <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-50 mt-4 tracking-tight leading-snug">
              Badge Earned!
            </h2>
            <h3 className={`text-lg font-bold ${config.titleColor} mt-1`}>
              {badge.badge_name}
            </h3>

            <p className="text-slate-500 dark:text-zinc-400 text-xs font-semibold mt-3 px-4 leading-relaxed">
              {badge.description}
            </p>

            {/* Share / Done Button */}
            <button
              onClick={() => setBadge(null)}
              className="mt-6 w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 cursor-pointer"
            >
              Fabulous!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
