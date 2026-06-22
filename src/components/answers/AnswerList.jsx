import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, SortAsc } from 'lucide-react'
import AnswerCard from './AnswerCard'
import { AnswerSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function AnswerList({ answers, loading, isAdmin, userId, onVerify, onReject, onDelete, onSpam, onFlag }) {
  const [sortBy, setSortBy] = useState('newest')

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <AnswerSkeleton key={i} />
        ))}
      </div>
    )
  }

  const sorted = [...(answers || [])].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sortBy === 'upvoted') return (b.upvotes || 0) - (a.upvotes || 0)
    return 0
  })

  const verifiedCount = sorted.filter(a => a.verification_status === 'verified').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          {verifiedCount} Verified {verifiedCount === 1 ? 'Answer' : 'Answers'}
          {sorted.length > verifiedCount && (
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({sorted.length - verifiedCount} pending)
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="upvoted">Most upvoted</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No answers yet"
          description="Be the first to answer this question!"
        />
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {sorted.map((answer) => (
            <motion.div
              key={answer.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <AnswerCard
                answer={answer}
                isOwner={userId === answer.user_id}
                isAdmin={isAdmin}
                onVerify={onVerify}
                onReject={onReject}
                onDelete={onDelete}
                onSpam={onSpam}
                onFlag={onFlag}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
