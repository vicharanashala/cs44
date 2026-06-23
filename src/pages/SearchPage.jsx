import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import SearchResults from '@/components/search/SearchResults'
import TrendingSearches from '@/components/search/TrendingSearches'
import Card from '@/components/ui/Card'
import { useSearch } from '@/hooks/useSearch'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { results, loading, searchQuestions, trendingSearches, fetchTrendingSearches } = useSearch()
  
  const qParam = searchParams.get('q') || ''
  const [prevQueryParam, setPrevQueryParam] = useState(qParam)
  const [query, setQuery] = useState(qParam)

  if (qParam !== prevQueryParam) {
    setPrevQueryParam(qParam)
    setQuery(qParam)
  }

  useEffect(() => {
    fetchTrendingSearches()
  }, [fetchTrendingSearches])

  useEffect(() => {
    if (query) {
      searchQuestions(query)
    }
  }, [query, searchQuestions])

  const handleSearch = (q) => {
    setQuery(q)
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`, { replace: true })
      searchQuestions(q)
    }
  }

  const handleTrendingClick = (term) => {
    handleSearch(term)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-4">
          <Search className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Search Questions
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Find answers to your questions using fuzzy search
        </p>
      </div>

      <div className="mb-8">
        <SearchBar
          variant="page"
          onSearch={handleSearch}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <SearchResults results={results} query={query} loading={loading} />
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5">
            <TrendingSearches
              searches={trendingSearches}
              onSearch={handleTrendingClick}
            />
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
