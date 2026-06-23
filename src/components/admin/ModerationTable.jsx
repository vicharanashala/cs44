import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Shield, Trash2, Clock, Paperclip } from 'lucide-react'
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
  answers = [],
  loading,
  onVerify,
  onReject,
  onSpam,
  onDelete,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (answers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No items in this queue</p>
        <p className="text-sm mt-1">Check back later for new submissions.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4">
              <input
                type="checkbox"
                checked={selectedIds.length === answers.length && answers.length > 0}
                onChange={() => onSelectAll?.()}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Content</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {answers.map((answer, index) => (
            <motion.tr
              key={answer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(answer.id)}
                  onChange={() => onToggleSelect?.(answer.id)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {answer.questions?.title || 'Unknown Question'}
                </p>
                <p className="text-xs text-slate-400">{answer.questions?.category}</p>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Avatar src={answer.users?.avatar} name={answer.users?.name || 'User'} size="sm" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{answer.users?.name || 'Anonymous'}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[250px]">
                  {answer.content}
                </p>
                {answer.attachment_url && (
                  <Paperclip className="w-3 h-3 text-slate-400 mt-1 inline" />
                )}
              </td>
              <td className="py-3 px-4">
                <Badge variant={statusVariants[answer.verification_status] || 'default'}>
                  {answer.verification_status}
                </Badge>
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">
                {timeAgo(answer.created_at)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  {answer.verification_status !== 'verified' && (
                    <button
                      onClick={() => onVerify?.(answer.id)}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-500 transition-colors"
                      title="Verify"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {answer.verification_status !== 'rejected' && (
                    <button
                      onClick={() => onReject?.(answer.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onSpam?.(answer.id)}
                    className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 text-orange-500 transition-colors"
                    title="Mark Spam"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(answer.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
