import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Inbox, 
  BarChart2, 
  Settings, 
  Search, 
  Sliders, 
  Database, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  HelpCircle,
  MessageSquare,
  MessageCircle,
  Trophy,
  Coins,
  Award,
  User,
  Eye,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  RotateCcw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import MetricsCards from '@/components/admin/MetricsCards'
import ModerationTable from '@/components/admin/ModerationTable'
import BulkActions from '@/components/admin/BulkActions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useAdmin } from '@/hooks/useAdmin'
import { useAnswers } from '@/hooks/useAnswers'
import { useToast } from '@/components/ui/Toast'
import { badgeIcons } from '@/components/ui/badgeIcons'
const mainTabs = [
  { id: 'queue', label: 'Moderation Queue', icon: Inbox },
  { id: 'questions', label: 'Questions', icon: HelpCircle },
  { id: 'gamification', label: 'Gamification', icon: Trophy },
  { id: 'analytics', label: 'Spam Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Spam Settings', icon: Settings },
]
const filterTabs = [
  { id: 'all', label: 'All Items', icon: Inbox },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'verified', label: 'Approved', icon: CheckCircle },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'spam', label: 'Spam Flagged', icon: AlertTriangle },
]
const badgeTierColors = {
  bronze: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  silver: 'bg-slate-400/10 text-slate-600 dark:text-slate-400 border-slate-400/20',
  gold: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 border-yellow-500/20',
  diamond: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  special: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
}
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
function formatActionType(action) {
  switch (action) {
    case 'ask_question': return 'Asked a Question'
    case 'post_answer': return 'Posted an Answer'
    case 'question_upvote': return 'Received Question Upvote'
    case 'question_downvote': return 'Received Question Downvote'
    case 'answer_upvote': return 'Received Answer Upvote'
    case 'answer_downvote': return 'Received Answer Downvote'
    case 'answer_accepted': return 'Answer Accepted'
    case 'daily_login': return 'Daily Login Bonus'
    case 'admin_adjustment': return 'Admin Adjustment'
    default: return action.replace('_', ' ')
  }
}
export default function AdminDashboard() {
  const {
    metrics,
    moderationItems,
    auditLogs,
    spamSettings,
    spamAnalytics,
    allQuestions,
    loading,
    fetchMetrics,
    fetchModerationQueue,
    approveModerationItem,
    rejectModerationItem,
    restoreFalsePositive,
    fetchSpamSettings,
    updateSpamSettings,
    fetchSpamAnalytics,
    fetchSpamAuditLogs,
    fetchAllQuestions,
    bulkDelete,
    adminDeleteQuestion,
    bulkDeleteQuestions,
    fetchUsers,
    fetchAvailableBadges,
    fetchReputationLogs,
    adjustUserReputation,
    awardUserBadge,
    revokeUserBadge,
    fetchGamificationAnalytics
  } = useAdmin()
  const { showToast } = useToast()
  // Navigation & Filtering
  const [activeMainTab, setActiveMainTab] = useState('queue')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  // Moderation notes state
  const [adminNoteModal, setAdminNoteModal] = useState({ open: false, itemId: null, action: null })
  const [adminNote, setAdminNote] = useState('')
  // Settings State Form
  const [settingsForm, setSettingsForm] = useState(null)
  const [newKeyword, setNewKeyword] = useState('')
  // Gamification States
  const [users, setUsers] = useState([])
  const [availableBadges, setAvailableBadges] = useState([])
  const [reputationLogs, setReputationLogs] = useState([])
  const [gamificationAnalytics, setGamificationAnalytics] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [loadingGamification, setLoadingGamification] = useState(false)
  const [reputationModal, setReputationModal] = useState({ open: false, userId: null, username: '', points: '' })
  const [badgeModal, setBadgeModal] = useState({ open: false, userId: null, username: '', userBadges: [] })
  // Question States
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  // Load Gamification data
  const loadGamificationData = useCallback(async () => {
    setLoadingGamification(true)
    try {
      const [usersList, badgesList, logsList, stats] = await Promise.all([
        fetchUsers(),
        fetchAvailableBadges(),
        fetchReputationLogs(),
        fetchGamificationAnalytics()
      ])
      setUsers(usersList || [])
      setAvailableBadges(badgesList || [])
      setReputationLogs(logsList || [])
      setGamificationAnalytics(stats)
    } catch (err) {
      console.error('Error loading gamification data:', err)
      showToast('Failed to load gamification data', 'error')
    } finally {
      setLoadingGamification(false)
    }
  }, [fetchUsers, fetchAvailableBadges, fetchReputationLogs, fetchGamificationAnalytics, showToast])
  // Initial Data Fetch
  const handleRefresh = useCallback(() => {
    fetchMetrics()
    if (activeMainTab === 'queue') {
      fetchModerationQueue(activeFilter)
      setSelectedIds([])
    } else if (activeMainTab === 'questions') {
      fetchAllQuestions()
      setSelectedQuestionIds([])
    } else if (activeMainTab === 'gamification') {
      loadGamificationData()
    } else if (activeMainTab === 'analytics') {
      fetchSpamAnalytics()
      fetchSpamAuditLogs()
    } else if (activeMainTab === 'settings') {
      fetchSpamSettings().then(cfg => {
        setSettingsForm(cfg)
      })
    }
  }, [activeMainTab, activeFilter, fetchMetrics, fetchModerationQueue, fetchAllQuestions, loadGamificationData, fetchSpamAnalytics, fetchSpamAuditLogs, fetchSpamSettings])
  useEffect(() => {
    handleRefresh()
  }, [activeMainTab, handleRefresh])
  useEffect(() => {
    if (activeMainTab === 'queue') {
      fetchModerationQueue(activeFilter)
      setSelectedIds([])
    }
  }, [activeFilter, activeMainTab, fetchModerationQueue])
  // Queue Action Handlers
  const handleVerify = useCallback((itemId) => {
    const item = moderationItems.find(x => x.id === itemId)
    const isFalsePositive = item?.moderation_status === 'spam' || item?.moderation_status === 'rejected'
    setAdminNoteModal({ open: true, itemId, action: isFalsePositive ? 'restore' : 'approve' })
  }, [moderationItems])
  const handleReject = useCallback((itemId) => {
    setAdminNoteModal({ open: true, itemId, action: 'reject' })
  }, [])
  const handleNoteSubmit = async () => {
    try {
      const { itemId, action } = adminNoteModal
      if (action === 'approve' || action === 'restore') {
        await approveModerationItem(itemId, adminNote)
        showToast(action === 'restore' ? 'False positive restored and published!' : 'Content approved and published!', 'success')
      } else if (action === 'reject') {
        await rejectModerationItem(itemId, adminNote)
        showToast('Content rejected', 'info')
      }
      setAdminNoteModal({ open: false, itemId: null, action: null })
      setAdminNote('')
      handleRefresh()
    } catch (err) {
      showToast(`Failed to resolve content: ${err.message}`, 'error')
    }
  }
  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      try {
        await bulkDelete([itemId])
        showToast('Item permanently deleted', 'info')
        handleRefresh()
      } catch (err) {
        showToast('Failed to delete item', 'error')
      }
    }
  }
  // Bulk Actions
  const handleBulkVerify = async () => {
    try {
      for (const id of selectedIds) {
        await approveModerationItem(id, 'Bulk approved')
      }
      showToast(`${selectedIds.length} items approved and published!`, 'success')
      setSelectedIds([])
      handleRefresh()
    } catch (err) {
      showToast('Bulk verify failed', 'error')
      console.error(err)
    }
  }
  const handleBulkSpam = async () => {
    try {
      for (const id of selectedIds) {
        await rejectModerationItem(id, 'Bulk marked spam')
      }
      showToast(`${selectedIds.length} items flagged as spam`, 'info')
      setSelectedIds([])
      handleRefresh()
    } catch (err) {
      showToast('Bulk mark spam failed', 'error')
      console.error(err)
    }
  }
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} items?`)) {
      try {
        await bulkDelete(selectedIds)
        showToast(`${selectedIds.length} items permanently deleted`, 'info')
        setSelectedIds([])
        handleRefresh()
      } catch (err) {
        showToast('Bulk delete failed', 'error')
      }
    }
  }
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }
  const selectAll = () => {
    const filtered = getFilteredItems()
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(a => a.id))
    }
  }
  const getFilteredItems = () => {
    return (moderationItems || []).filter(item => {
      const matchesSearch = 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.users?.name && item.users.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
  }
  // Question Management Handlers
  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Are you sure you want to delete this question? This will also delete all associated answers.")) {
      try {
        await adminDeleteQuestion(id)
        showToast('Question deleted', 'info')
        handleRefresh()
      } catch (err) {
        console.error(err)
        showToast('Failed to delete question', 'error')
      }
    }
  }
  const handleBulkDeleteQuestions = async () => {
    if (window.confirm(`Are you sure you want to delete the ${selectedQuestionIds.length} selected questions? This will also delete all associated answers.`)) {
      try {
        await bulkDeleteQuestions(selectedQuestionIds)
        showToast(`${selectedQuestionIds.length} questions deleted`, 'info')
        setSelectedQuestionIds([])
        handleRefresh()
      } catch (err) {
        console.error(err)
        showToast('Bulk delete failed', 'error')
      }
    }
  }
  const filteredQuestions = (allQuestions || []).filter(q => {
    const searchLower = questionSearch.toLowerCase()
    const titleMatch = q.title?.toLowerCase().includes(searchLower)
    const descMatch = q.description?.toLowerCase().includes(searchLower)
    const authorMatch = q.users?.name?.toLowerCase().includes(searchLower)
    const categoryMatch = q.category?.toLowerCase().includes(searchLower)
    return titleMatch || descMatch || authorMatch || categoryMatch
  })
  // Gamification Handlers
  const handleAdjustReputation = async () => {
    try {
      const pts = parseInt(reputationModal.points, 10)
      if (isNaN(pts) || pts === 0) {
        showToast('Please enter a valid non-zero points adjustment', 'warning')
        return
      }
      await adjustUserReputation(reputationModal.userId, pts)
      showToast(`Reputation adjusted by ${pts > 0 ? '+' : ''}${pts} points!`, 'success')
      setReputationModal({ open: false, userId: null, username: '', points: '' })
      loadGamificationData()
    } catch (err) {
      console.error(err)
      showToast('Failed to adjust reputation points', 'error')
    }
  }
  const handleToggleBadge = async (badgeId, isEarned) => {
    try {
      if (isEarned) {
        await revokeUserBadge(badgeModal.userId, badgeId)
        showToast('Badge revoked successfully', 'info')
      } else {
        await awardUserBadge(badgeModal.userId, badgeId)
        showToast('Badge awarded successfully!', 'success')
      }
      // Refresh user's badges in modal list
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers || [])
      const currentUser = updatedUsers.find(u => u.id === badgeModal.userId)
      if (currentUser) {
        setBadgeModal(prev => ({
          ...prev,
          userBadges: currentUser.user_badges || []
        }))
      }
      // Update stats
      const stats = await fetchGamificationAnalytics()
      setGamificationAnalytics(stats)
    } catch (err) {
      console.error(err)
      showToast('Failed to modify user badges', 'error')
    }
  }
  // Settings modification handlers
  const handleConfigChange = (path, value) => {
    setSettingsForm(prev => {
      const updated = { ...prev }
      const keys = path.split('.')
      let current = updated
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return updated
    })
  }
  const handleAddKeyword = () => {
    if (newKeyword.trim() && settingsForm) {
      const updatedKeywords = [...(settingsForm.keywords || []), newKeyword.trim().toLowerCase()]
      setSettingsForm(prev => ({ ...prev, keywords: updatedKeywords }))
      setNewKeyword('')
    }
  }
  const handleRemoveKeyword = (keyword) => {
    if (settingsForm) {
      const updatedKeywords = (settingsForm.keywords || []).filter(k => k !== keyword)
      setSettingsForm(prev => ({ ...prev, keywords: updatedKeywords }))
    }
  }
  const handleSaveSettings = async () => {
    try {
      await updateSpamSettings(settingsForm)
      showToast('Spam moderation weights and thresholds saved successfully!', 'success')
      handleRefresh()
    } catch (e) {
      showToast('Failed to save settings', 'error')
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Hub</h1>
            <p className="text-sm text-slate-400">Heuristic spam settings, content queue, and gamification</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} className="hover:bg-slate-800/50">
            Refresh Data
          </Button>
        </div>
      </div>
      {/* Metrics Grid */}
      <MetricsCards metrics={metrics} />
      {/* Main Tab Selection */}
      <div className="flex gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-900 max-w-2xl overflow-x-auto">
        {mainTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeMainTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-500/5 border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* MODERATION QUEUE TAB */}
        {activeMainTab === 'queue' && (
          <motion.div
            key="queue-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filter Tabs & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-900 overflow-x-auto">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeFilter === tab.id
                  let count = metrics.pendingReviews
                  if (tab.id === 'all') count = (moderationItems || []).length
                  else if (tab.id === 'verified') count = (moderationItems || []).filter(x => x.moderation_status === 'verified').length
                  else if (tab.id === 'rejected') count = (moderationItems || []).filter(x => x.moderation_status === 'rejected').length
                  else if (tab.id === 'spam') count = (moderationItems || []).filter(x => x.moderation_status === 'spam').length
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveFilter(tab.id); setSelectedIds([]) }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search flagged content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-900 rounded-xl text-sm text-slate-205 placeholder-slate-550 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>
            {/* Bulk Actions */}
            <BulkActions
              selectedCount={selectedIds.length}
              onBulkVerify={handleBulkVerify}
              onBulkDelete={handleBulkDelete}
              onBulkSpam={handleBulkSpam}
            />
            {/* Moderation Table */}
            <div className="bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
              <ModerationTable
                items={getFilteredItems()}
                loading={loading}
                onVerify={handleVerify}
                onReject={handleReject}
                onDelete={handleDelete}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
              />
            </div>
          </motion.div>
        )}
        {/* QUESTIONS MANAGEMENT TAB */}
        {activeMainTab === 'questions' && (
          <motion.div
            key="questions-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search and Counts */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions by title, description, category..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                />
              </div>
              <div className="text-xs font-semibold text-slate-400 bg-slate-900 p-2 px-3 rounded-xl border border-slate-800">
                Total Questions: {filteredQuestions.length}
              </div>
            </div>
            {/* Bulk Actions for Questions */}
            {selectedQuestionIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4"
              >
                <span className="text-sm font-semibold text-red-400">
                  {selectedQuestionIds.length} question(s) selected
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleBulkDeleteQuestions}
                >
                  Delete Selected
                </Button>
              </motion.div>
            )}
            {/* Questions Table */}
            <div className="bg-slate-955/20 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-4 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0}
                          onChange={() => {
                            if (selectedQuestionIds.length === filteredQuestions.length) {
                              setSelectedQuestionIds([])
                            } else {
                              setSelectedQuestionIds(filteredQuestions.map(q => q.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-4">Title</th>
                      <th className="py-4 px-4 w-36">Category</th>
                      <th className="py-4 px-4 w-48">Asked By</th>
                      <th className="py-4 px-4 w-40">Stats</th>
                      <th className="py-4 px-4 w-28">Date</th>
                      <th className="py-4 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading && allQuestions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-400">
                          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                          <p className="text-sm">Loading questions...</p>
                        </td>
                      </tr>
                    ) : filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-16 text-slate-450 italic">
                          No questions found
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.includes(q.id)}
                              onChange={() => {
                                setSelectedQuestionIds(prev =>
                                  prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id]
                                )
                              }}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              to={`/question/${q.id}`}
                              className="text-sm font-semibold text-indigo-400 hover:text-indigo-350 transition-colors line-clamp-1 max-w-[320px]"
                            >
                              {q.title}
                            </Link>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{q.description}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                              {q.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar src={q.users?.avatar} name={q.users?.name || 'User'} size="sm" />
                              <span className="text-sm text-slate-300 truncate max-w-[130px]">
                                {q.users?.name || 'Anonymous'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5 text-xs text-slate-400 font-medium">
                              <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />{q.answers?.length || q.answer_count || 0} answers</span>
                              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{q.views || 0} views</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400">
                            {timeAgo(q.created_at)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg hover:bg-red-950/20 text-red-500 transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {/* GAMIFICATION MANAGEMENT TAB */}
        {activeMainTab === 'gamification' && (
          <motion.div
            key="gamification-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Gamification Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Total Rep Points</span>
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Coins className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">
                  {gamificationAnalytics?.totalReputationPoints?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Total Badges Earned</span>
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">
                  {gamificationAnalytics?.totalEarnedBadges?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Top Contributor</span>
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                {gamificationAnalytics?.topContributor ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={gamificationAnalytics.topContributor.avatar} name={gamificationAnalytics.topContributor.name} size="xs" />
                    <span className="text-sm font-semibold text-slate-200 truncate max-w-[130px]">
                      {gamificationAnalytics.topContributor.name}
                    </span>
                    <span className="text-xs text-amber-400 font-bold shrink-0">
                      ({gamificationAnalytics.topContributor.reputation_points} pts)
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No contributors yet</p>
                )}
              </div>
            </div>
            {/* Split layout: Users & History */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Users list */}
              <div className="lg:col-span-7 bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/40">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).length} Users
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-455 uppercase tracking-wider bg-slate-900/20">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4 text-right">Reputation</th>
                        <th className="py-3 px-4">Badges</th>
                        <th className="py-3 px-4 w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      {loadingGamification && users.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-400">
                            <RefreshCw className="w-6 h-6 mx-auto animate-spin opacity-50 mb-2" />
                            Loading users...
                          </td>
                        </tr>
                      ) : users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-500 italic">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).map((u) => {
                          const rep = u.reputation_points || 0
                          let tierLabel = 'New Member'
                          let tierColor = 'text-slate-500'
                          if (rep >= 2000) { tierLabel = 'Elite Expert'; tierColor = 'text-purple-400 font-bold' }
                          else if (rep >= 1000) { tierLabel = 'Community Champion'; tierColor = 'text-indigo-400 font-bold' }
                          else if (rep >= 500) { tierLabel = 'Expert Contributor'; tierColor = 'text-yellow-500 font-bold' }
                          else if (rep >= 100) { tierLabel = 'Knowledge Sharer'; tierColor = 'text-slate-350 font-bold' }
                          else if (rep >= 10) { tierLabel = 'Beginner Contributor'; tierColor = 'text-amber-500 font-bold' }
                          return (
                            <tr key={u.id} className="hover:bg-slate-800/10 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <Avatar src={u.avatar} name={u.name || 'User'} size="sm" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-205 truncate max-w-[130px]">{u.name || 'Anonymous'}</p>
                                    <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <p className="font-extrabold text-indigo-400">{rep}</p>
                                <p className={`text-[9px] uppercase tracking-wider mt-0.5 ${tierColor}`}>{tierLabel}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {u.user_badges && u.user_badges.length > 0 ? (
                                    u.user_badges.slice(0, 4).map((ub) => {
                                      const b = ub.badges
                                      if (!b) return null
                                      const Icon = badgeIcons[b.icon] || Award
                                      const tColor = badgeTierColors[b.badge_type] || badgeTierColors.bronze
                                      return (
                                        <div
                                          key={ub.id}
                                          className={`p-1 rounded border ${tColor}`}
                                          title={`${b.badge_name}: ${b.description}`}
                                        >
                                          <Icon className="w-3 h-3" />
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <span className="text-[10px] text-slate-500">None</span>
                                  )}
                                  {u.user_badges && u.user_badges.length > 4 && (
                                    <span className="text-[9px] text-slate-500 self-center font-bold">
                                      +{u.user_badges.length - 4}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setReputationModal({ open: true, userId: u.id, username: u.name, points: '' })}
                                    className="p-1 rounded hover:bg-indigo-950/20 text-indigo-400 transition-colors cursor-pointer"
                                    title="Adjust Reputation"
                                  >
                                    <Coins className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setBadgeModal({ open: true, userId: u.id, username: u.name, userBadges: u.user_badges || [] })}
                                    className="p-1 rounded hover:bg-purple-950/20 text-purple-400 transition-colors cursor-pointer"
                                    title="Manage Badges"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Log feed */}
              <div className="lg:col-span-5 bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-800 bg-slate-900/40 shrink-0">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Reputation Log Feed
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Most recent community transaction logs</p>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {loadingGamification && reputationLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 text-xs">
                      Loading transaction feed...
                    </div>
                  ) : reputationLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 italic text-xs">
                      No points changes logged
                    </div>
                  ) : (
                    reputationLogs.map((log) => {
                      const isPos = log.points_awarded >= 0
                      return (
                        <div key={log.id} className="p-2.5 bg-slate-950/20 border border-slate-900 rounded-2xl flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar src={log.users?.avatar} name={log.users?.name || 'User'} size="xs" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-300 truncate max-w-[100px]">{log.users?.name || 'Anonymous'}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{formatActionType(log.action_type)}</p>
                              <p className="text-[8px] text-slate-600 font-mono mt-0.5 truncate max-w-[100px]">Ref: {log.reference_id}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                              isPos 
                                ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20' 
                                : 'text-rose-450 bg-rose-500/10 border-rose-500/20'
                            }`}>
                              {isPos ? `+${log.points_awarded}` : log.points_awarded}
                            </span>
                            <span className="text-[8px] text-slate-500">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* SPAM ANALYTICS TAB */}
        {activeMainTab === 'analytics' && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: graphs */}
            <div className="lg:col-span-8 space-y-8">
              {/* custom velocity chart */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" /> Moderation Scan Velocity (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-800/80 px-2 gap-4">
                  {(spamAnalytics?.scansByDay || []).map((day, i) => {
                    const ratio = Math.min(100, (day.count / 20) * 100)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex justify-center gap-1.5 h-full items-end max-w-[40px]">
                          {/* checked col */}
                          <div
                            className="w-4 bg-slate-850 rounded-t group-hover:bg-slate-700 transition-all duration-300 relative"
                            style={{ height: `${Math.max(8, ratio)}%` }}
                          >
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                              Scans: {day.count}
                            </span>
                          </div>
                          {/* spam col */}
                          <div
                            className="w-4 bg-red-500/80 rounded-t group-hover:bg-red-50 transition-all duration-300 relative"
                            style={{ height: `${Math.max(4, (day.spam / 20) * 100)}%` }}
                          >
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                              Spam: {day.spam}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-1">
                          {day.date}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 justify-end text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 inline-block" /> Total Scanned
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-550 inline-block" /> Flagged Spam
                  </div>
                </div>
              </div>
              {/* audit logs */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> Moderation Activity Audit Log
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => {
                      let actionText = 'performed action'
                      let actionClass = 'bg-slate-900 text-slate-400 border-slate-805'
                      if (log.action === 'approve') {
                        actionText = 'approved content'
                        actionClass = 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                      } else if (log.action === 'reject') {
                        actionText = 'rejected content'
                        actionClass = 'bg-red-950/20 text-red-400 border-red-900/30'
                      } else if (log.action === 'flag') {
                        actionText = 'automatically flagged content'
                        actionClass = 'bg-amber-950/20 text-amber-400 border-amber-900/30'
                      } else if (log.action === 'restore') {
                        actionText = 'restored false positive'
                        actionClass = 'bg-violet-950/20 text-violet-400 border-violet-900/30'
                      } else if (log.action === 'change_settings') {
                        actionText = 'updated spam filter settings'
                        actionClass = 'bg-blue-950/20 text-blue-400 border-blue-900/30'
                      }
                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3.5 bg-slate-900/10 border border-slate-900/80 rounded-2xl text-xs gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full border font-semibold text-[10px] ${actionClass}`}>
                              {log.action}
                            </span>
                            <span className="text-slate-300">
                              <span className="font-semibold text-slate-100">{log.users?.name || 'System'}</span>{' '}
                              {actionText}{' '}
                              {log.content_type && (
                                <span className="text-indigo-400">({log.content_type})</span>
                              )}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[10px] flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-slate-500 italic text-center py-6">No audit activities recorded.</p>
                  )}
                </div>
              </div>
            </div>
            {/* Right: Heuristic diagnostics */}
            <div className="lg:col-span-4 space-y-6">
              {/* trigger freqs */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-6">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Rule Trigger Frequencies
                </h3>
                <div className="space-y-4">
                  {(spamAnalytics?.rulesTriggered || []).map((rule, idx) => {
                    const totalTriggers = (spamAnalytics?.rulesTriggered || []).reduce((acc, r) => acc + r.value, 0)
                    const pct = Math.round((rule.value / (totalTriggers || 1)) * 100)
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-300 capitalize">{rule.name?.replace('_', ' ')}</span>
                          <span className="text-slate-400">{rule.value} fires ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Accuracy index */}
              <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-900/20 p-6 rounded-3xl flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-slate-300 font-semibold text-sm">Spam Detection Accuracy</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">98.4%</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +0.2%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Accuracy index evaluated based on admin-approved false positive restorations over total flag volume.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* RULES & SETTINGS TAB */}
        {activeMainTab === 'settings' && settingsForm && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Threshold Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Decision Thresholds
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adjust the scoring range to classify submissions. Content exceeding Review goes to the queue. Content exceeding Spam is blocked and routed.
                </p>
                <div className="space-y-5 pt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Needs Review Threshold</span>
                      <span className="text-indigo-400">{Math.round((settingsForm.thresholds?.review || 0.3) * 100)}% spam rating</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={settingsForm.thresholds?.review || 0.3}
                      onChange={(e) => handleConfigChange('thresholds.review', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Absolute Spam Threshold</span>
                      <span className="text-red-400">{Math.round((settingsForm.thresholds?.spam || 0.7) * 100)}% spam rating</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={settingsForm.thresholds?.spam || 0.7}
                      onChange={(e) => handleConfigChange('thresholds.spam', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>
              </div>
              {/* Weights weights */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Heuristic Signal Weights
                </h3>
                <p className="text-xs text-slate-400">
                  Assign impact weights for individual heuristics. High weights make a signal more likely to trigger review or blocks.
                </p>
                <div className="space-y-4 pt-2">
                  {settingsForm.weights && Object.keys(settingsForm.weights).map((key) => {
                    const weight = settingsForm.weights[key]
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold capitalize">
                          <span className="text-slate-300">{key.replace('_', ' ')}</span>
                          <span className="text-indigo-400">{weight}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={weight}
                          onChange={(e) => handleConfigChange(`weights.${key}`, parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Config & keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Filter rule tweaks */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" /> Filter Rule Details
                </h3>
                {settingsForm.rules && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Max Repeated Char Length</label>
                      <input
                        type="number"
                        value={settingsForm.rules.repeated_chars?.maxConsecutive || 4}
                        onChange={(e) => handleConfigChange('rules.repeated_chars.maxConsecutive', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Max Allowed Link URLs</label>
                      <input
                        type="number"
                        value={settingsForm.rules.urls?.maxCount || 3}
                        onChange={(e) => handleConfigChange('rules.urls.maxCount', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Min Caps Text Length</label>
                      <input
                        type="number"
                        value={settingsForm.rules.all_caps?.minTextLength || 10}
                        onChange={(e) => handleConfigChange('rules.all_caps.minTextLength', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Caps Ratio Threshold</label>
                      <input
                        type="number"
                        step="0.05"
                        value={settingsForm.rules.all_caps?.ratioThreshold || 0.6}
                        onChange={(e) => handleConfigChange('rules.all_caps.ratioThreshold', parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Max Word Frequency</label>
                      <input
                        type="number"
                        value={settingsForm.rules.repeated_words?.maxFrequency || 4}
                        onChange={(e) => handleConfigChange('rules.repeated_words.maxFrequency', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Symbol Ratio Threshold</label>
                      <input
                        type="number"
                        step="0.05"
                        value={settingsForm.rules.special_chars?.ratioThreshold || 0.2}
                        onChange={(e) => handleConfigChange('rules.special_chars.ratioThreshold', parseFloat(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                  </div>
                )}
                {settingsForm.rules?.suspicious_patterns && (
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <label className="text-slate-400 block">Detect Content Toggles</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.rules.suspicious_patterns.detectPhone || false}
                          onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectPhone', e.target.checked)}
                          className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                        Phone numbers
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.rules.suspicious_patterns.detectEmail || false}
                          onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectEmail', e.target.checked)}
                          className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                        Emails
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.rules.suspicious_patterns.detectCrypto || false}
                          onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectCrypto', e.target.checked)}
                          className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                        Crypto Addresses
                      </label>
                    </div>
                  </div>
                )}
              </div>
              {/* Blocked Keywords */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-400" /> Blocked/Spam Keywords
                </h3>
                <p className="text-xs text-slate-400">
                  Submissions containing these keywords will receive a promotional score boost.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new spam keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                  <Button variant="primary" icon={Plus} onClick={handleAddKeyword} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {(settingsForm.keywords || []).map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300 rounded-lg hover:border-red-500/30 transition-colors group cursor-pointer"
                      onClick={() => handleRemoveKeyword(kw)}
                    >
                      {kw}
                      <Trash2 className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
              <Button
                variant="ghost"
                onClick={() => fetchSpamSettings().then(cfg => setSettingsForm(cfg))}
                className="hover:bg-slate-900"
              >
                Reset Changes
              </Button>
              <Button variant="primary" icon={CheckCircle} onClick={handleSaveSettings}>
                Save Spam Settings
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Action feedback modal */}
      <Modal
        isOpen={adminNoteModal.open}
        onClose={() => { setAdminNoteModal({ open: false, itemId: null, action: null }); setAdminNote('') }}
        title={
          adminNoteModal.action === 'approve' ? 'Approve Content' : 
          adminNoteModal.action === 'restore' ? 'Restore False Positive' : 
          'Reject Content'
        }
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Moderator Feedback Note (optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                adminNoteModal.action === 'approve' || adminNoteModal.action === 'restore' 
                  ? 'Approved for publication.' 
                  : 'Rejection reason...'
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => { setAdminNoteModal({ open: false, itemId: null, action: null }); setAdminNote('') }}
            >
              Cancel
            </Button>
            <Button
              variant={adminNoteModal.action === 'reject' ? 'danger' : 'primary'}
              onClick={handleNoteSubmit}
            >
              {adminNoteModal.action === 'reject' ? 'Reject' : 'Approve'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Reputation Adjustment Modal */}
      <Modal
        isOpen={reputationModal.open}
        onClose={() => setReputationModal({ open: false, userId: null, username: '', points: '' })}
        title={`Adjust Reputation: ${reputationModal.username}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Adjustment Amount
            </label>
            <input
              type="number"
              value={reputationModal.points}
              onChange={(e) => setReputationModal(prev => ({ ...prev, points: e.target.value }))}
              placeholder="e.g. 10 or -5"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 text-xs"
            />
            <p className="text-xs text-slate-400 mt-1.5 leading-normal">
              Enter a positive number to award reputation points, or a negative number to deduct.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setReputationModal({ open: false, userId: null, username: '', points: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdjustReputation}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
      {/* Badge Management Modal */}
      <Modal
        isOpen={badgeModal.open}
        onClose={() => setBadgeModal({ open: false, userId: null, username: '', userBadges: [] })}
        title={`Manage Badges: ${badgeModal.username}`}
        size="md"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {availableBadges.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-sm">No badges available.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {availableBadges.map((badge) => {
                const isEarned = badgeModal.userBadges.some(ub => ub.badge_id === badge.id)
                const Icon = badgeIcons[badge.icon] || Award
                const tierColor = badgeTierColors[badge.badge_type] || badgeTierColors.bronze
                
                return (
                  <div key={badge.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${tierColor} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{badge.badge_name}</p>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tierColor}`}>
                            {badge.badge_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{badge.description}</p>
                      </div>
                    </div>
                    <div>
                      {isEarned ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleToggleBadge(badge.id, true)}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <button
                          onClick={() => handleToggleBadge(badge.id, false)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95"
                        >
                          Award
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  )
}
