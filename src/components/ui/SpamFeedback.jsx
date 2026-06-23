import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import Badge from '@/components/ui/Badge'
export default function SpamFeedback({ spamResult }) {
  if (!spamResult || spamResult.score === 0) return null
  const { score, status, reasons } = spamResult
  // Color config based on status
  const config = {
    Safe: {
      colorClass: 'bg-emerald-500',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-200/60 dark:border-emerald-800/40',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/10',
      icon: ShieldCheck,
      badgeVariant: 'success',
      bannerText: 'Content looks clean and ready for instant publication.',
    },
    'Needs Review': {
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-200/60 dark:border-amber-800/40',
      bgClass: 'bg-amber-50/50 dark:bg-amber-950/10',
      icon: AlertTriangle,
      badgeVariant: 'warning',
      bannerText: '⚠️ This content triggers filter warnings and will require admin approval before becoming public.',
    },
    Spam: {
      colorClass: 'bg-red-500',
      textClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-200/60 dark:border-red-800/40',
      bgClass: 'bg-red-50/50 dark:bg-red-950/10',
      icon: ShieldAlert,
      badgeVariant: 'danger',
      bannerText: '🚨 High spam rating. Automatic publication is blocked and admins will review this content.',
    },
  }[status] || {
    colorClass: 'bg-slate-500',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-700',
    bgClass: 'bg-slate-50 dark:bg-slate-800',
    icon: Info,
    badgeVariant: 'default',
    bannerText: '',
  }
  const IconComponent = config.icon
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={`p-4 rounded-xl border ${config.borderClass} ${config.bgClass} space-y-3 mt-3`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${config.textClass}`} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Spam Analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Spam Score: {Math.round(score * 100)}%
            </span>
            <Badge variant={config.badgeVariant}>{status}</Badge>
          </div>
        </div>
        {/* Custom Progress/Score Bar */}
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${config.colorClass}`}
          />
        </div>
        {/* Warning Details & Banner */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {config.bannerText}
          </p>
          {reasons.length > 0 && (
            <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5 pt-1 pl-1">
              {reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
