import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Clock, ThumbsUp, Eye } from 'lucide-react'
import QuestionFeed from '@/components/questions/QuestionFeed'
import CategoryPills from '@/components/questions/CategoryPills'
import Sidebar from '@/components/layout/Sidebar'
import { useQuestions } from '@/hooks/useQuestions'
import { useCategories } from '@/hooks/useCategories'
import ReportModal from '@/components/ui/ReportModal'

const sortOptions = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'upvoted', label: 'Most Upvoted', icon: ThumbsUp },
  { value: 'viewed', label: 'Most Viewed', icon: Eye },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
]

export default function HomePage() {
  const { questions, loading, fetchQuestions } = useQuestions()
  const { categories, fetchCategories } = useCategories()
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeSort, setActiveSort] = useState('newest')
  const [reportModal, setReportModal] = useState({ open: false, type: 'question', id: null })

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchQuestions({ category: activeCategory, sort: activeSort })
  }, [activeCategory, activeSort, fetchQuestions])

  const handleCategorySelect = (category) => {
    setActiveCategory(category)
  }

  const handleFlagClick = (id) => {
    setReportModal({ open: true, type: 'question', id })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <div className="text-center mb-10 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/15 dark:border-indigo-500/20">
              ⚡ Institutional Knowledge Hub
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-500 dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent mb-4">
            Get Answers. Share Expertise.
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            A minimalist, high-speed space designed for engineers and students to resolve issues, archive solutions, and share knowledge instantly.
          </p>
        </motion.div>
      </div>

      {/* Category Pills */}
      <div className="mb-8">
        <CategoryPills
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Feed */}
        <div className="lg:col-span-8">
          {/* Segmented Capsule Sort Controls */}
          <div className="flex items-center mb-6">
            <div className="bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/40 p-1 rounded-xl flex items-center gap-0.5 shadow-inner">
              {sortOptions.map((option) => {
                const Icon = option.icon
                const isActive = activeSort === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setActiveSort(option.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <QuestionFeed questions={questions} loading={loading} onFlag={handleFlagClick} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 hidden lg:block">
          <Sidebar />
        </div>
      </div>

      {/* Report Modal */}
      {reportModal.open && (
        <ReportModal
          isOpen={reportModal.open}
          onClose={() => setReportModal({ open: false, type: 'question', id: null })}
          contentType={reportModal.type}
          contentId={reportModal.id}
        />
      )}
    </motion.div>
  )
}
