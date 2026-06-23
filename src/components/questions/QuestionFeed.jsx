import { motion } from 'framer-motion'
import QuestionCard from './QuestionCard'
import { QuestionCardSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { HelpCircle } from 'lucide-react'

export default function QuestionFeed({ questions, loading, onFlag }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="No questions found"
        description="Be the first to ask a question or try a different filter."
        action={{ label: 'Ask a Question', onClick: () => window.location.href = '/ask' }}
      />
    )
  }

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {questions.map((question) => (
        <motion.div
          key={question.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3 }}
        >
          <QuestionCard question={question} onFlag={onFlag} />
        </motion.div>
      ))}
    </motion.div>
  )
}
