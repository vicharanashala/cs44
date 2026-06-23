import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Inbox, BarChart2, Settings, Search, Sliders, Database, Trash2, Plus, ArrowUpRight, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'

import MetricsCards from '@/components/admin/MetricsCards'
import ModerationTable from '@/components/admin/ModerationTable'
import BulkActions from '@/components/admin/BulkActions'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useAdmin } from '@/hooks/useAdmin'
import { useToast } from '@/components/ui/Toast'
const mainTabs = [
  { id: 'queue', label: 'Moderation Queue', icon: Inbox },
  { id: 'analytics', label: 'Spam Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Rules & Settings', icon: Settings },
]
import { badgeIcons } from '@/components/ui/badgeIcons'

const filterTabs = [
  { id: 'all', label: 'All Items', icon: Inbox },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'verified', label: 'Approved', icon: CheckCircle },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'spam', label: 'Spam Flagged', icon: AlertTriangle },
]
export default function AdminDashboard() {
  const {
    metrics,
    moderationItems,
    auditLogs,
    spamSettings,
    analytics,
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
    bulkDelete,
  } = useAdmin()
  const { showToast } = useToast()
  
  // Navigation & Filtering
  const [activeMainTab, setActiveMainTab] = useState('queue')

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

const badgeTierColors = {
  bronze: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  silver: 'bg-slate-400/10 text-slate-600 dark:text-slate-400 border-slate-400/20',
  gold: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 border-yellow-500/20',
  diamond: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  special: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
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
    allAnswers, 
    allQuestions, 
    loading, 
    fetchMetrics, 
    fetchAllAnswers, 
    fetchAllQuestions, 
    bulkVerify, 
    bulkDelete, 
    bulkMarkSpam, 
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
  const { verifyAnswer, rejectAnswer, markSpam, deleteAnswer } = useAnswers()
  const { showToast } = useToast()
  
  const [activeSection, setActiveSection] = useState('answers') // 'answers', 'questions', or 'gamification'
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Moderation notes state
  const [adminNoteModal, setAdminNoteModal] = useState({ open: false, itemId: null, action: null })
  const [adminNote, setAdminNote] = useState('')
  // Settings State Form
  const [settingsForm, setSettingsForm] = useState(null)
  const [newKeyword, setNewKeyword] = useState('')
  // Initial Data Fetch
  const handleRefresh = useCallback(() => {
    fetchMetrics()
    if (activeMainTab === 'queue') {
      fetchModerationQueue(activeFilter)
      setSelectedIds([])
    } else if (activeMainTab === 'analytics') {
      fetchSpamAnalytics()
    } else if (activeMainTab === 'settings') {
      fetchSpamSettings().then(cfg => {
        setSettingsForm(cfg)
      })
    }
  }, [activeMainTab, activeFilter, fetchMetrics, fetchModerationQueue, fetchSpamAnalytics, fetchSpamSettings])
  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])
  // Actions
  const handleVerify = useCallback((itemId) => {
    const item = moderationItems.find(x => x.id === itemId)
    const isFalsePositive = item?.moderation_status === 'spam' || item?.moderation_status === 'rejected'
    setAdminNoteModal({ open: true, itemId, action: isFalsePositive ? 'restore' : 'approve' })
  }, [moderationItems])
  const handleReject = useCallback((itemId) => {
    setAdminNoteModal({ open: true, itemId, action: 'reject' })

  // Gamification States
  const [users, setUsers] = useState([])
  const [availableBadges, setAvailableBadges] = useState([])
  const [reputationLogs, setReputationLogs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [loadingGamification, setLoadingGamification] = useState(false)
  const [reputationModal, setReputationModal] = useState({ open: false, userId: null, username: '', points: '' })
  const [badgeModal, setBadgeModal] = useState({ open: false, userId: null, username: '', userBadges: [] })
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')

  const loadGamificationData = useCallback(async () => {
    setLoadingGamification(true)
    try {
      const [usersList, badgesList, logsList, stats] = await Promise.all([
        fetchUsers(),
        fetchAvailableBadges(),
        fetchReputationLogs(),
        fetchGamificationAnalytics()
      ])
      setUsers(usersList)
      setAvailableBadges(badgesList)
      setReputationLogs(logsList)
      setAnalytics(stats)
    } catch (err) {
      console.error('Error loading gamification data:', err)
      showToast('Failed to load gamification data', 'error')
    } finally {
      setLoadingGamification(false)
    }
  }, [fetchUsers, fetchAvailableBadges, fetchReputationLogs, fetchGamificationAnalytics, showToast])

  useEffect(() => {
    fetchMetrics()
    fetchAllAnswers(activeFilter)
  }, [fetchMetrics, fetchAllAnswers, activeFilter])

  const handleRefresh = useCallback(() => {
    fetchMetrics()
    if (activeSection === 'answers') {
      fetchAllAnswers(activeFilter)
      setSelectedIds([])
    } else if (activeSection === 'questions') {
      fetchAllQuestions()
      setSelectedQuestionIds([])
    } else if (activeSection === 'gamification') {
      loadGamificationData()
    }
  }, [fetchMetrics, activeSection, fetchAllAnswers, activeFilter, fetchAllQuestions, loadGamificationData])

  const handleVerify = useCallback((answerId) => {
    setAdminNoteModal({ open: true, answerId, action: 'verify' })
  }, [])

  const handleReject = useCallback((answerId) => {
    setAdminNoteModal({ open: true, answerId, action: 'reject' })
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
      console.error(err)
      showToast(`Failed to ${adminNoteModal.action}`, 'error')
    }
  )

  const handleSpam = async (answerId) => {
    try {
      await markSpam(answerId)
      showToast('Marked as spam', 'info')
      handleRefresh()
    } catch (err) {
      console.error(err)
      showToast('Failed to mark spam', 'error')
    }
  }

  const handleDelete = async (answerId) => {
    try {
      await deleteAnswer(answerId)
      showToast('Answer deleted', 'info')
      handleRefresh()
    } catch (err) {
      console.error(err)
      showToast('Failed to delete', 'error')
    }
  }

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
      setUsers(updatedUsers)
      const currentUser = updatedUsers.find(u => u.id === badgeModal.userId)
      if (currentUser) {
        setBadgeModal(prev => ({
          ...prev,
          userBadges: currentUser.user_badges || []
        }))
      }
      // Update analytics
      const stats = await fetchGamificationAnalytics()
      setAnalytics(stats)
    } catch (err) {
      console.error(err)
      showToast('Failed to modify user badges', 'error')
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
  const handleBulkVerify = async () => {
    try {
      for (const id of selectedIds) {
        await approveModerationItem(id, 'Bulk approved')
      }
      showToast(`${selectedIds.length} items approved and published!`, 'success')
      setSelectedIds([])
      handleRefresh()
    } catch (err) {
      showToast('Bulk approve failed', 'error')
      console.error(err)
      showToast('Bulk verify failed', 'error')
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
      showToast('Bulk delete failed', 'error')
    }
  }
  // Filter queue items locally for searching
  const getFilteredItems = () => {
    return moderationItems.filter(item => {
      const matchesSearch = 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.users?.name && item.users.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
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
      const updatedKeywords = [...settingsForm.keywords, newKeyword.trim().toLowerCase()]
      setSettingsForm(prev => ({ ...prev, keywords: updatedKeywords }))
      setNewKeyword('')
    }
  }
  const handleRemoveKeyword = (keyword) => {
    if (settingsForm) {
      const updatedKeywords = settingsForm.keywords.filter(k => k !== keyword)
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

  const filteredQuestions = allQuestions.filter(q => {
    const searchLower = questionSearch.toLowerCase()
    const titleMatch = q.title?.toLowerCase().includes(searchLower)
    const descMatch = q.description?.toLowerCase().includes(searchLower)
    const authorMatch = q.users?.name?.toLowerCase().includes(searchLower)
    const categoryMatch = q.category?.toLowerCase().includes(searchLower)
    return titleMatch || descMatch || authorMatch || categoryMatch
  })

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
            <p className="text-sm text-slate-400">Heuristic spam settings, content queue, and audit trends</p>
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
      <div className="flex gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-900 max-w-lg">
        {mainTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeMainTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
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
                  if (tab.id === 'all') count = moderationItems.length
                  else if (tab.id === 'verified') count = moderationItems.filter(x => x.moderation_status === 'verified').length
                  else if (tab.id === 'rejected') count = moderationItems.filter(x => x.moderation_status === 'rejected').length
                  else if (tab.id === 'spam') count = moderationItems.filter(x => x.moderation_status === 'spam').length
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-900 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
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
        {activeMainTab === 'analytics' && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: Graphs */}
            <div className="lg:col-span-8 space-y-8">
              {/* Scan trends */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" /> Moderation Scan Velocity (Last 7 Days)
                </h3>
                
                {/* Visual Custom Chart */}
                <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-800/80 px-2 gap-4">
                  {analytics.scansByDay.map((day, i) => {
                    const ratio = Math.min(100, (day.count / 20) * 100)
                    const spamRatio = (day.spam / (day.count || 1)) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex justify-center gap-1.5 h-full items-end max-w-[40px]">
                          {/* Checked Column */}
                          <div
                            className="w-4 bg-slate-800 rounded-t group-hover:bg-slate-700 transition-all duration-300 relative"
                            style={{ height: `${Math.max(8, ratio)}%` }}
                          >
                            {/* Hover info tooltip */}
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                              Scans: {day.count}
                            </span>
                          </div>
                          {/* Spam Column */}
                          <div
                            className="w-4 bg-red-500/80 rounded-t group-hover:bg-red-500 transition-all duration-300 relative"
                            style={{ height: `${Math.max(4, (day.spam / 20) * 100)}%` }}
                          >
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                              Spam: {day.spam}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 mt-1">
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
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Flagged Spam
                  </div>
                </div>
              </div>
              {/* Audit Logs list */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> Moderation Activity Audit Log
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => {
                      let actionText = 'performed action'
                      let actionClass = 'bg-slate-900 text-slate-400 border-slate-800'
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
              {/* Trigger frequencies */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-6">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Rule Trigger Frequencies
                </h3>
                <div className="space-y-4">
                  {analytics.rulesTriggered.map((rule, idx) => {
                    const totalTriggers = analytics.rulesTriggered.reduce((acc, r) => acc + r.value, 0)
                    const pct = Math.round((rule.value / (totalTriggers || 1)) * 100)
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-300 capitalize">{rule.name}</span>
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
              {/* Accuracy Card */}
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
                  {/* Review Threshold */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Needs Review Threshold</span>
                      <span className="text-indigo-400">{Math.round(settingsForm.thresholds.review * 100)}% spam rating</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={settingsForm.thresholds.review}
                      onChange={(e) => handleConfigChange('thresholds.review', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  {/* Spam Threshold */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Absolute Spam Threshold</span>
                      <span className="text-red-400">{Math.round(settingsForm.thresholds.spam * 100)}% spam rating</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={settingsForm.thresholds.spam}
                      onChange={(e) => handleConfigChange('thresholds.spam', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>
              </div>
              {/* Rules weights */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Heuristic Signal Weights
                </h3>
                <p className="text-xs text-slate-400">
                  Assign impact weights for individual heuristics. High weights make a signal more likely to trigger review or blocks.
                </p>
                <div className="space-y-4 pt-2">
                  {Object.keys(settingsForm.weights).map((key) => {
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
            {/* Specific Rule Configurations & Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Detailed Rule Tweak */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" /> Filter Rule Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Repeated chars max consec */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Max Repeated Char Length</label>
                    <input
                      type="number"
                      value={settingsForm.rules.repeated_chars.maxConsecutive}
                      onChange={(e) => handleConfigChange('rules.repeated_chars.maxConsecutive', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* Urls maxCount */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Max Allowed Link URLs</label>
                    <input
                      type="number"
                      value={settingsForm.rules.urls.maxCount}
                      onChange={(e) => handleConfigChange('rules.urls.maxCount', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* All Caps minTextLength */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Min Caps Text Length</label>
                    <input
                      type="number"
                      value={settingsForm.rules.all_caps.minTextLength}
                      onChange={(e) => handleConfigChange('rules.all_caps.minTextLength', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* All Caps ratioThreshold */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Caps Ratio Threshold</label>
                    <input
                      type="number"
                      step="0.05"
                      value={settingsForm.rules.all_caps.ratioThreshold}
                      onChange={(e) => handleConfigChange('rules.all_caps.ratioThreshold', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* Repeated words maxFrequency */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Max Word Frequency</label>
                    <input
                      type="number"
                      value={settingsForm.rules.repeated_words.maxFrequency}
                      onChange={(e) => handleConfigChange('rules.repeated_words.maxFrequency', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {/* Special characters ratioThreshold */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Symbol Ratio Threshold</label>
                    <input
                      type="number"
                      step="0.05"
                      value={settingsForm.rules.special_chars.ratioThreshold}
                      onChange={(e) => handleConfigChange('rules.special_chars.ratioThreshold', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2 text-xs font-semibold">
                  <label className="text-slate-400 block">Detect Content Toggles</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.rules.suspicious_patterns.detectPhone}
                        onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectPhone', e.target.checked)}
                        className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                      />
                      Phone numbers
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.rules.suspicious_patterns.detectEmail}
                        onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectEmail', e.target.checked)}
                        className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                      />
                      Emails
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.rules.suspicious_patterns.detectCrypto}
                        onChange={(e) => handleConfigChange('rules.suspicious_patterns.detectCrypto', e.target.checked)}
                        className="rounded text-indigo-500 w-4 h-4 bg-slate-900 border-slate-800 cursor-pointer"
                      />
                      Crypto Addresses
                    </label>
                  </div>
                </div>
              </div>
              {/* Keywords management */}
              <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-400" /> Blocked/Spam Keywords
                </h3>
                <p className="text-xs text-slate-400">
                  Submissions containing these keywords will receive a promotional score boost.
                </p>
                {/* Add keyword form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new spam keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 bg-slate-900 border border-slate-800/80 px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Button variant="primary" icon={Plus} onClick={handleAddKeyword} size="sm">
                    Add
                  </Button>
                </div>
                {/* Keywords list */}
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {settingsForm.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg hover:border-red-500/30 transition-colors group cursor-pointer"
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
      {/* Action note Modal */}

      {/* Section Switcher Tab (Answers vs Questions vs Gamification) */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setActiveSection('answers'); setSelectedIds([]) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeSection === 'answers'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Answers Moderation
        </button>
        <button
          onClick={() => { setActiveSection('questions'); setSelectedQuestionIds([]) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeSection === 'questions'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Questions Management
        </button>
        <button
          onClick={() => { setActiveSection('gamification'); setSelectedIds([]); setSelectedQuestionIds([]) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeSection === 'gamification'
              ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Gamification Management
        </button>
      </div>

      {activeSection === 'answers' ? (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
            {filterTabs.map((tab) => {
              const Icon = tab.icon
              const count = tab.id === 'all' ? allAnswers.length :
                tab.id === 'pending' ? metrics.pendingReviews :
                tab.id === 'verified' ? metrics.verifiedAnswers :
                tab.id === 'rejected' ? metrics.flaggedContent :
                metrics.spamRemoved

              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveFilter(tab.id); setSelectedIds([]) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeFilter === tab.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedIds.length}
            onBulkVerify={handleBulkVerify}
            onBulkDelete={handleBulkDelete}
            onBulkSpam={handleBulkSpam}
          />

          {/* Moderation Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <ModerationTable
              answers={allAnswers}
              loading={loading}
              onVerify={handleVerify}
              onReject={handleReject}
              onSpam={handleSpam}
              onDelete={handleDelete}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
            />
          </div>
        </>
      ) : activeSection === 'questions' ? (
        <>
          {/* Question Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions by title, description, or category..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-250/20">
              Total Questions: {filteredQuestions.length}
            </div>
          </div>

          {/* Question Bulk Actions */}
          {selectedQuestionIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 mb-4 bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 rounded-2xl shadow-sm"
            >
              <span className="text-sm font-semibold text-red-650 dark:text-red-400">
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

          {/* Questions Moderation Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 w-12">
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asked By</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stats</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && allQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                        <p className="text-sm">Loading questions...</p>
                      </td>
                    </tr>
                  ) : filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-450" />
                        <p className="text-lg font-medium">No questions found</p>
                        <p className="text-sm mt-1">Try resetting search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q, index) => (
                      <motion.tr
                        key={q.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4">
                          <Link
                            to={`/question/${q.id}`}
                            className="text-sm font-semibold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors line-clamp-1 max-w-[280px]"
                          >
                            {q.title}
                          </Link>
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-[280px] mt-0.5">{q.description}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar src={q.users?.avatar} name={q.users?.name || 'User'} size="sm" />
                            <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[110px]">
                              {q.users?.name || 'Anonymous'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />{q.answer_count || 0} answers</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{q.views || 0} views</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400 whitespace-nowrap">
                          {timeAgo(q.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Gamification Management Tab */}
          {/* Leaderboard Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-900/20">
                  <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {analytics?.totalReputationPoints?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Reputation Points</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-900/20">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {analytics?.totalEarnedBadges?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-slate-505 dark:text-slate-400 mt-1">Total Earned Badges</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-900/20">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              {analytics?.topContributor ? (
                <div className="flex items-center gap-3">
                  <Avatar src={analytics.topContributor.avatar} name={analytics.topContributor.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-850 dark:text-zinc-150 truncate max-w-[140px]">
                      {analytics.topContributor.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {analytics.topContributor.reputation_points} reputation
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No contributors yet</p>
              )}
              <p className="text-sm text-slate-505 dark:text-slate-400 mt-1">Top Contributor</p>
            </motion.div>
          </div>

          {/* Gamification Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Users List */}
            <div className="lg:col-span-7 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
                  />
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Showing {users.filter(u => {
                    const searchLower = userSearch.toLowerCase()
                    return u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower)
                  }).length} users
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Reputation</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Badges</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingGamification && users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-400">
                          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                          <p className="text-sm">Loading users...</p>
                        </td>
                      </tr>
                    ) : users.filter(u => {
                      const searchLower = userSearch.toLowerCase()
                      return u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower)
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-400">
                          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p className="text-lg font-medium">No users found</p>
                        </td>
                      </tr>
                    ) : (
                      users.filter(u => {
                        const searchLower = userSearch.toLowerCase()
                        return u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower)
                      }).map((u) => {
                        const rep = u.reputation_points || 0
                        let repBadgeLabel = 'New Member'
                        let repBadgeColor = 'text-slate-455'
                        if (rep >= 2000) {
                          repBadgeLabel = 'Elite Expert'
                          repBadgeColor = 'text-purple-500 dark:text-purple-400 font-bold'
                        } else if (rep >= 1000) {
                          repBadgeLabel = 'Community Champion'
                          repBadgeColor = 'text-indigo-500 dark:text-indigo-400 font-bold'
                        } else if (rep >= 500) {
                          repBadgeLabel = 'Expert Contributor'
                          repBadgeColor = 'text-yellow-650 dark:text-yellow-450 font-bold'
                        } else if (rep >= 100) {
                          repBadgeLabel = 'Knowledge Sharer'
                          repBadgeColor = 'text-slate-600 dark:text-slate-350 font-bold'
                        } else if (rep >= 10) {
                          repBadgeLabel = 'Beginner Contributor'
                          repBadgeColor = 'text-amber-600 dark:text-amber-500 font-bold'
                        }

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar src={u.avatar} name={u.name || 'User'} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[150px]">{u.name || 'Anonymous'}</p>
                                  <p className="text-xs text-slate-400 truncate max-w-[150px]">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{rep}</p>
                              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${repBadgeColor}`}>{repBadgeLabel}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {u.user_badges && u.user_badges.length > 0 ? (
                                  u.user_badges.slice(0, 4).map((ub) => {
                                    const b = ub.badges
                                    if (!b) return null
                                    const Icon = badgeIcons[b.icon] || Award
                                    const tierColor = badgeTierColors[b.badge_type] || badgeTierColors.bronze
                                    return (
                                      <div
                                        key={ub.id}
                                        className={`p-1 rounded-lg border ${tierColor}`}
                                        title={`${b.badge_name}: ${b.description}`}
                                      >
                                        <Icon className="w-3.5 h-3.5" />
                                      </div>
                                    )
                                  })
                                ) : (
                                  <span className="text-xs text-slate-405">None</span>
                                )}
                                {u.user_badges && u.user_badges.length > 4 && (
                                  <span className="text-[10px] text-slate-405 font-bold self-center">
                                    +{u.user_badges.length - 4}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setReputationModal({ open: true, userId: u.id, username: u.name, points: '' })}
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                                  title="Adjust Reputation"
                                >
                                  <Coins className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setBadgeModal({ open: true, userId: u.id, username: u.name, userBadges: u.user_badges || [] })}
                                  className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                                  title="Manage Badges"
                                >
                                  <Award className="w-4 h-4" />
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

            {/* Right Column: Reputation History Logs */}
            <div className="lg:col-span-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-850 dark:text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Reputation Log Feed
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Most recent community transaction logs</p>
              </div>

              <div className="overflow-y-auto max-h-[500px]">
                {loadingGamification && reputationLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
                    <p className="text-xs">Loading logs...</p>
                  </div>
                ) : reputationLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No reputation logs recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reputationLogs.map((log) => {
                      const isPositive = log.points_awarded >= 0
                      return (
                        <div key={log.id} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/25 transition-colors flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={log.users?.avatar} name={log.users?.name || 'User'} size="xs" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-850 dark:text-zinc-150 truncate max-w-[130px]">
                                {log.users?.name || 'Anonymous'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatActionType(log.action_type)}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[130px]" title={log.reference_id}>
                                Ref: {log.reference_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`font-black shrink-0 px-2 py-0.5 rounded text-[10px] border ${
                              isPositive 
                                ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/15' 
                                : 'text-rose-500 bg-rose-500/10 border-rose-500/15'
                            }`}>
                              {isPositive ? `+${log.points_awarded}` : log.points_awarded}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Admin Note Modal */}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none"
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

      {/* Reputation Points Adjustment Modal */}
      <Modal
        isOpen={reputationModal.open}
        onClose={() => setReputationModal({ open: false, userId: null, username: '', points: '' })}
        title={`Adjust Reputation: ${reputationModal.username}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Adjustment Amount
            </label>
            <input
              type="number"
              value={reputationModal.points}
              onChange={(e) => setReputationModal(prev => ({ ...prev, points: e.target.value }))}
              placeholder="e.g. 10 or -5"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-450 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
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
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{badge.badge_name}</p>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tierColor}`}>
                            {badge.badge_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-450 mt-0.5 leading-relaxed">{badge.description}</p>
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
