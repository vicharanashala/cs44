import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Inbox, BarChart2, Settings, Search, Sliders, Database, Trash2, Plus, ArrowUpRight, HelpCircle } from 'lucide-react'
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
    </motion.div>
  )
}
