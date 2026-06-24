import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trash2, Clock, Paperclip, ChevronDown, ChevronUp, AlertCircle, FileText, MessageSquare, RotateCcw } from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { QuestionCardSkeleton } from '@/components/ui/Skeleton'
function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
const statusVariants = {
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
  spam: 'danger',
}
export default function ModerationTable({
  items = [],
  answers = [], // fallback support for older parent callers
  loading,
  onVerify, // maps to Approve
  onReject,
  onSpam,   // maps to Mark Spam
  onDelete,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}) {
  const displayItems = items.length > 0 ? items : answers
  const [expandedIds, setExpandedIds] = useState([])
  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(4)].map((_, i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (displayItems.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">Moderation queue is empty</p>
        <p className="text-sm mt-1">No items require review at this time.</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
            <th className="py-4 px-4 w-12">
              <input
                type="checkbox"
                checked={selectedIds.length === displayItems.length && displayItems.length > 0}
                onChange={() => onSelectAll?.()}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>
            <th className="py-4 px-4 w-10"></th>
            <th className="py-4 px-4">Content</th>
            <th className="py-4 px-4 w-48">Author</th>
            <th className="py-4 px-4 w-44">Spam telemetry</th>
            <th className="py-4 px-4 w-28">Status</th>
            <th className="py-4 px-4 w-28">Date</th>
            <th className="py-4 px-4 w-44 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {displayItems.map((item, index) => {
            const isExpanded = expandedIds.includes(item.id)
            const scorePct = Math.round((item.spam_score || 0) * 100)
            const isQuestion = item.content_type === 'question'
            
            // Score color config
            let scoreColor = 'bg-emerald-500'
            let scoreText = 'text-emerald-500'
            if (item.spam_score >= 0.7) {
              scoreColor = 'bg-red-500'
              scoreText = 'text-red-500'
            } else if (item.spam_score >= 0.3) {
              scoreColor = 'bg-amber-500'
              scoreText = 'text-amber-500'
            }
            return (
              <>
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors ${
                    isExpanded ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => onToggleSelect?.(item.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1 max-w-[280px] md:max-w-[350px]">
                      <div className="flex items-center gap-2">
                        {isQuestion ? (
                          <Badge variant="category" icon={FileText}>Question</Badge>
                        ) : (
                          <Badge variant="info" icon={MessageSquare}>Answer</Badge>
                        )}
                        {isQuestion && (
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                            {item.question?.category || 'General'}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {isQuestion ? (item.title || 'Untitled Question') : (item.answer?.questions?.title || 'Reply on Question')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.content}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={item.users?.avatar} name={item.users?.name || 'User'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {item.users?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {item.users?.email || 'no-email@faq.com'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold ${scoreText}`}>
                        Score: {scorePct}%
                      </span>
                      <div className="h-1.5 w-28 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor}`} style={{ width: `${scorePct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={statusVariants[item.moderation_status] || 'default'}>
                      {item.moderation_status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-400 dark:text-slate-500">
                    {timeAgo(item.created_at)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Approve / Restore */}
                      {item.moderation_status !== 'verified' ? (
                        <button
                          onClick={() => onVerify?.(item.id)}
                          className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 transition-colors"
                          title={item.moderation_status === 'rejected' || item.moderation_status === 'spam' ? 'Restore False Positive' : 'Approve'}
                        >
                          {item.moderation_status === 'rejected' || item.moderation_status === 'spam' ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      ) : null}
                      {/* Reject */}
                      {item.moderation_status !== 'rejected' && item.moderation_status !== 'spam' ? (
                        <button
                          onClick={() => onReject?.(item.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                      {/* Delete */}
                      <button
                        onClick={() => onDelete?.(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 transition-colors"
                        title="Delete Content"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                {/* Collapsible rule trigger telemetry row */}
                <AnimatePresence>
                  {isExpanded && (
                    <tr className="bg-slate-50/20 dark:bg-slate-800/5">
                      <td colSpan={8} className="py-4 px-8 border-b border-slate-100 dark:border-slate-800">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-indigo-500" /> Content Body
                              </h4>
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                                {isQuestion && (
                                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                                    Title: {item.title}
                                  </p>
                                )}
                                {item.content}
                              </div>
                              {item.admin_note && (
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/30">
                                  Admin Note: "{item.admin_note}"
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                                Triggered Heuristics ({item.triggeredRules?.length || 0})
                              </h4>
                              {item.triggeredRules && item.triggeredRules.length > 0 ? (
                                <div className="space-y-1.5">
                                  {item.triggeredRules.map((rule, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                          {rule.rule?.replace('_', ' ')}
                                        </span>
                                        <span className="text-slate-400">
                                          (weight: {rule.weight})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-slate-500">
                                          Signal Score: {Math.round(rule.score * 100)}%
                                        </span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                          +{rule.contribution}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                                  No specific heuristic weights triggered (content length/short checks apply).
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
