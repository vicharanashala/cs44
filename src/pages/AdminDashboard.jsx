import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Inbox,
  Settings, BarChart2, FileText, Ban, Plus, Trash2, Eye, Info, Check,
  AlertOctagon, HelpCircle, ArrowUpRight, Search, ShieldAlert, UserMinus, ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { spamApi } from '@/lib/spamApi'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

const tabs = [
  { id: 'queue', label: 'Moderation Queue', icon: Inbox },
  { id: 'rules', label: 'Rule Management', icon: Settings },
  { id: 'analytics', label: 'Analytics Console', icon: BarChart2 },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
]

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('queue')
  const [loading, setLoading] = useState(true)
  
  const [metrics, setMetrics] = useState({
    totalScanned: 0,
    safeContent: 0,
    suspiciousContent: 0,
    spamBlocked: 0,
    criticalSpam: 0,
    moderatorActions: 0,
    accuracyRate: 98.6
  })
  const [queue, setQueue] = useState([])
  const [rules, setRules] = useState([])
  const [keywords, setKeywords] = useState([])
  const [blacklist, setBlacklist] = useState([])
  const [whitelist, setWhitelist] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [settings, setSettings] = useState({ threshold_needs_review: 30, threshold_spam: 60, threshold_critical: 100 })

  const [queueFilter, setQueueFilter] = useState({ status: 'pending', search: '', riskLevel: 'all' })
  const [ruleManagerTab, setRuleManagerTab] = useState('keywords')
  const [newItemText, setNewItemText] = useState('')
  const [selectedQueueItem, setSelectedQueueItem] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        fetchedMetrics,
        fetchedQueue,
        fetchedRules,
        fetchedKeywords,
        fetchedBlacklist,
        fetchedWhitelist,
        fetchedAuditLogs,
        fetchedAnalytics,
        fetchedSettings
      ] = await Promise.all([
        spamApi.getModerationMetrics(),
        spamApi.getModerationQueue(),
        spamApi.getRules(),
        spamApi.getKeywords(),
        spamApi.getBlacklist(),
        spamApi.getWhitelist(),
        spamApi.getAuditLogs(),
        spamApi.getAnalyticsData(),
        spamApi.getSettings()
      ])

      setMetrics(fetchedMetrics)
      setQueue(fetchedQueue)
      setRules(fetchedRules)
      setKeywords(fetchedKeywords)
      setBlacklist(fetchedBlacklist)
      setWhitelist(fetchedWhitelist)
      setAuditLogs(fetchedAuditLogs)
      setAnalyticsData(fetchedAnalytics)
      setSettings(fetchedSettings)
    } catch (err) {
      console.error('Error loading admin dashboard data:', err)
      showToast('Error loading moderation data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (isAdmin) {
      loadAllData()
    }
  }, [isAdmin, loadAllData])

  const handleRefresh = () => {
    loadAllData()
    showToast('Data refreshed successfully', 'success')
  }

  const handleQueueAction = async (itemId, action, note = '') => {
    try {
      const modId = user?.id || 'simulated_moderator'
      if (action === 'approve') {
        await spamApi.approveQueueItem(itemId, modId, note)
        showToast('Submission approved and published', 'success')
      } else if (action === 'reject') {
        await spamApi.rejectQueueItem(itemId, modId, note)
        showToast('Submission rejected', 'info')
      } else if (action === 'escalate') {
        await spamApi.escalateQueueItem(itemId, modId, note)
        showToast('Escalated to upper administrator', 'info')
      } else if (action === 'ban') {
        const item = queue.find(q => q.id === itemId)
        if (item && item.user_id) {
          await spamApi.banUser(item.user_id, modId, note || 'Spam campaign violation')
          await spamApi.rejectQueueItem(itemId, modId, 'Account suspended due to spamming')
          showToast('User restricted and content rejected', 'error')
        } else {
          showToast('No user linked to ban', 'warning')
        }
      }
      setSelectedQueueItem(null)
      setAdminNote('')
      loadAllData()
    } catch (err) {
      showToast(`Failed to perform action: ${err.message}`, 'error')
    }
  }

  const handleRuleToggle = async (ruleId, currentVal) => {
    try {
      await spamApi.updateRule(ruleId, { is_enabled: !currentVal })
      showToast('Rule status updated', 'success')
      loadAllData()
    } catch (err) {
      showToast('Failed to update rule status', 'error')
    }
  }

  const handleRuleWeightChange = async (ruleId, newWeight) => {
    const weight = parseInt(newWeight, 10)
    if (isNaN(weight) || weight < 0 || weight > 100) return
    try {
      await spamApi.updateRule(ruleId, { weight })
      showToast('Rule weight updated', 'success')
      loadAllData()
    } catch (err) {
      showToast('Failed to update weight', 'error')
    }
  }

  const handleAddListItem = async () => {
    if (!newItemText.trim()) return
    try {
      const uId = user?.id || 'admin'
      if (ruleManagerTab === 'keywords') {
        await spamApi.addKeyword(newItemText, uId)
        showToast('Promotional keyword added', 'success')
      } else if (ruleManagerTab === 'blacklist') {
        await spamApi.addBlacklist(newItemText, uId)
        showToast('Domain added to blacklist', 'success')
      } else if (ruleManagerTab === 'whitelist') {
        await spamApi.addWhitelist(newItemText, uId)
        showToast('Domain added to whitelist', 'success')
      }
      setNewItemText('')
      loadAllData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteListItem = async (id) => {
    try {
      if (ruleManagerTab === 'keywords') {
        await spamApi.deleteKeyword(id)
        showToast('Keyword removed', 'info')
      } else if (ruleManagerTab === 'blacklist') {
        await spamApi.deleteBlacklist(id)
        showToast('Blacklist domain removed', 'info')
      } else if (ruleManagerTab === 'whitelist') {
        await spamApi.deleteWhitelist(id)
        showToast('Whitelist domain removed', 'info')
      }
      loadAllData()
    } catch (err) {
      showToast('Failed to delete item', 'error')
    }
  }

  const handleThresholdChange = async (key, val) => {
    const intVal = parseInt(val, 10)
    if (isNaN(intVal) || intVal < 0 || intVal > 100) return
    try {
      const updated = await spamApi.updateSettings({ [key]: intVal })
      setSettings(updated)
      showToast('Thresholds updated successfully', 'success')
      loadAllData()
    } catch (err) {
      showToast('Failed to update threshold', 'error')
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="p-4 bg-red-50 dark:bg-red-955/20 rounded-full text-red-500 mb-4 animate-bounce">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          You must be logged in as an administrator to view the spam detection & moderation console.
        </p>
      </div>
    )
  }

  const filteredQueue = queue.filter(item => {
    const statusMatch = queueFilter.status === 'all' || item.status === queueFilter.status
    const riskMatch = queueFilter.riskLevel === 'all' || item.risk_level === queueFilter.riskLevel
    const searchMatch = !queueFilter.search.trim() || 
      item.content_body.toLowerCase().includes(queueFilter.search.toLowerCase()) ||
      (item.users?.name || '').toLowerCase().includes(queueFilter.search.toLowerCase())
    return statusMatch && riskMatch && searchMatch
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12 text-slate-800 dark:text-slate-100"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center gap-1.5 border border-indigo-200/50">
              <Shield className="w-3.5 h-3.5" /> Security Hardened
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Moderation Console</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automated spam filter adjustments, explainable scoring metrics, and audit tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={loading}>
            Refresh Console
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Analyzed', val: metrics.totalScanned, icon: Shield, col: 'indigo' },
          { label: 'Spam Blocked', val: metrics.spamBlocked + metrics.criticalSpam, icon: AlertOctagon, col: 'red' },
          { label: 'Pending Moderation', val: queue.filter(q => q.status === 'pending').length, icon: Clock, col: 'amber' },
          { label: 'Filter Accuracy', val: `${metrics.accuracyRate}%`, icon: CheckCircle, col: 'emerald' },
        ].map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{c.label}</span>
                <span className="text-2xl font-bold tracking-tight">{c.val}</span>
              </div>
              <div className={`p-3 rounded-xl bg-${c.col}-500/10 text-${c.col}-500`}>
                <Icon className="w-6 h-6" />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 max-w-2xl">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-[45vh]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'queue' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3 bg-white/40 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search flagged content..."
                        value={queueFilter.search}
                        onChange={(e) => setQueueFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={queueFilter.status}
                        onChange={(e) => setQueueFilter(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-sm outline-none cursor-pointer"
                      >
                        <option value="pending">Pending Queue</option>
                        <option value="approved">Approved Logs</option>
                        <option value="rejected">Rejected Logs</option>
                        <option value="all">All States</option>
                      </select>
                      <select
                        value={queueFilter.riskLevel}
                        onChange={(e) => setQueueFilter(prev => ({ ...prev, riskLevel: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-sm outline-none cursor-pointer"
                      >
                        <option value="all">All Risks</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
                    {filteredQueue.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-400/80" />
                        <h3 className="font-semibold text-lg">Queue Empty</h3>
                        <p className="text-sm">No items matching the selected filters were found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-850 text-xs font-semibold uppercase text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                              <th className="px-6 py-4">Submission Details</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Score / Risk</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-sm">
                            {filteredQueue.map(item => {
                              const score = item.spam_score
                              const isCritical = item.risk_level === 'CRITICAL'
                              const isHigh = item.risk_level === 'HIGH'
                              const riskColor = isCritical ? 'red' : isHigh ? 'orange' : 'amber'

                              return (
                                <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                                  <td className="px-6 py-4 max-w-xs sm:max-w-md">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500">
                                        {item.users?.name?.[0] || '?'}
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="font-semibold">{item.users?.name || 'Anonymous User'}</div>
                                        <div className="text-xs text-slate-400 truncate">{item.content_body}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="capitalize px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-805 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                                      {item.content_type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-${riskColor}-500/10 text-${riskColor}-500 border border-${riskColor}-500/20`}>
                                        {item.risk_level}
                                      </span>
                                      <span className="font-semibold text-slate-500">{score}/100</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`capitalize text-xs font-semibold ${
                                      item.status === 'approved' ? 'text-emerald-500' :
                                      item.status === 'rejected' ? 'text-red-500' :
                                      item.status === 'escalated' ? 'text-purple-500' :
                                      'text-amber-500'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => setSelectedQueueItem(item)}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-3 py-1.5 rounded-lg hover:bg-indigo-500/5 transition"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Review
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Heuristic Scanners</h2>
                      <p className="text-xs text-slate-400">Configure weighting and activation states for the 15 scanning engines.</p>
                    </div>

                    <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                      {rules.map(rule => (
                        <div key={rule.id} className="pt-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input 
                              type="checkbox"
                              checked={rule.is_enabled}
                              onChange={() => handleRuleToggle(rule.id, rule.is_enabled)}
                              className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className={`font-semibold block ${rule.is_enabled ? '' : 'text-slate-400 line-through'}`}>
                                {rule.name}
                              </span>
                              <span className="text-[10px] text-slate-400">ID: {rule.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">Weight:</span>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={rule.weight}
                              onChange={(e) => handleRuleWeightChange(rule.id, e.target.value)}
                              disabled={!rule.is_enabled}
                              className="w-14 px-2 py-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none text-sm font-semibold focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex-1 flex flex-col">
                      <div className="flex border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 gap-2">
                        {[
                          { id: 'keywords', label: 'Keywords' },
                          { id: 'blacklist', label: 'Blacklist' },
                          { id: 'whitelist', label: 'Whitelist' },
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => { setRuleManagerTab(sub.id); setNewItemText('') }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              ruleManagerTab === sub.id
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 mb-4">
                        <input 
                          type="text" 
                          placeholder={
                            ruleManagerTab === 'keywords' ? 'Add promo keyword...' :
                            ruleManagerTab === 'blacklist' ? 'Add blacklist domain (e.g. spam.com)...' :
                            'Add whitelist domain...'
                          }
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleAddListItem}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center transition"
                        >
                          <Plus className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-900/20 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                        {(() => {
                          const items = ruleManagerTab === 'keywords' ? keywords :
                                        ruleManagerTab === 'blacklist' ? blacklist : whitelist
                          if (items.length === 0) {
                            return <div className="text-center py-6 text-xs text-slate-400">No entries listed.</div>
                          }
                          return items.map(item => (
                            <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {ruleManagerTab === 'keywords' ? item.keyword : item.domain}
                              </span>
                              <button 
                                onClick={() => handleDeleteListItem(item.id)}
                                className="text-red-500 hover:bg-red-500/10 p-1 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-base font-bold tracking-tight">Scoring Thresholds</h3>
                        <p className="text-xs text-slate-400">Set the sensitivity thresholds for content categorization.</p>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Needs Review Threshold
                          </label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={settings.threshold_needs_review}
                            onChange={(e) => handleThresholdChange('threshold_needs_review', e.target.value)}
                            className="w-16 px-2 py-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none text-sm font-semibold focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Spam Blocked Threshold
                          </label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={settings.threshold_spam}
                            onChange={(e) => handleThresholdChange('threshold_spam', e.target.value)}
                            className="w-16 px-2 py-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none text-sm font-semibold focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Critical Spam Threshold
                          </label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={settings.threshold_critical}
                            onChange={(e) => handleThresholdChange('threshold_critical', e.target.value)}
                            className="w-16 px-2 py-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 outline-none text-sm font-semibold focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'analytics' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
                      <div>
                        <h2 className="text-lg font-bold">Spam Activity Trends</h2>
                        <p className="text-xs text-slate-400">Visual logs of daily safe, suspicious, and blocked content over past 7 days.</p>
                      </div>

                      <div className="w-full h-64 relative pt-4">
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                          <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />

                          {(() => {
                            const data = analyticsData.dailyVolume
                            const maxVal = Math.max(...data.map(d => d.safe + d.spam + d.suspicious), 10)
                            
                            const getCoords = (type) => {
                              return data.map((d, i) => {
                                const x = (i / 6) * 500
                                const y = 200 - ((d[type] / maxVal) * 160 + 20)
                                return `${x},${y}`
                              }).join(' ')
                            }

                            return (
                              <>
                                <polyline fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2.5" points={getCoords('safe')} />
                                <polyline fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="2.5" points={getCoords('spam')} />
                                <polyline fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="2.5" points={getCoords('suspicious')} />
                              </>
                            )
                          })()}
                        </svg>
                        <div className="flex justify-center gap-6 mt-3 text-xs">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Safe</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Suspicious</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Spam Blocked</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
                      <div>
                        <h2 className="text-lg font-bold">Top Triggered Scanners</h2>
                        <p className="text-xs text-slate-400">Heuristics triggered most frequently during filtering.</p>
                      </div>

                      <div className="space-y-4 pt-2">
                        {analyticsData.detectionBreakdown.length === 0 ? (
                          <div className="text-center py-12 text-sm text-slate-400">No rule triggers logged yet.</div>
                        ) : (
                          analyticsData.detectionBreakdown.map((rule, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span>{rule.name}</span>
                                <span className="text-slate-400">{rule.count} scans</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((rule.count / Math.max(...analyticsData.detectionBreakdown.map(r => r.count), 1)) * 100, 100)}%` }}
                                  className="h-full bg-indigo-500 rounded-full"
                                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <div className="mb-4">
                      <h2 className="text-lg font-bold">Top User Risk Profiles</h2>
                      <p className="text-xs text-slate-400">Flagged contributors ranked by spam-to-submission ratio.</p>
                    </div>

                    {analyticsData.userRiskScores.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-500">No user risk scores registered yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
                              <th className="py-2">User</th>
                              <th className="py-2">Spam Ratio</th>
                              <th className="py-2">Risk Score</th>
                              <th className="py-2 text-right">Risk Assessment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {analyticsData.userRiskScores.map((u, i) => (
                              <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                                <td className="py-3">
                                  <div className="font-semibold text-slate-700 dark:text-slate-200">{u.name}</div>
                                  <div className="text-xs text-slate-400">{u.email}</div>
                                </td>
                                <td className="py-3 font-semibold text-slate-500">{u.spamRatio}</td>
                                <td className="py-3 font-bold">{u.riskScore}%</td>
                                <td className="py-3 text-right">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    u.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    u.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  }`}>
                                    {u.riskLevel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
                  {auditLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <h3 className="font-semibold text-lg">No Logs Found</h3>
                      <p className="text-sm">Audit trail logs will display here as actions are performed.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                            <th className="px-6 py-4">Executor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                          {auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all">
                              <td className="px-6 py-4">
                                <span className="font-semibold">{log.users?.name || 'Administrator'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-slate-100 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate font-mono text-xs text-slate-500">
                                {JSON.stringify(log.details)}
                              </td>
                              <td className="px-6 py-4 text-right text-xs text-slate-400">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Modal
        isOpen={!!selectedQueueItem}
        onClose={() => { setSelectedQueueItem(null); setAdminNote('') }}
        title="Spam Investigation Center"
        size="lg"
      >
        {selectedQueueItem && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Flagged Submission</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  By {selectedQueueItem.users?.name || 'Anonymous User'} · {new Date(selectedQueueItem.created_at).toLocaleString()}
                </span>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded bg-${
                selectedQueueItem.risk_level === 'CRITICAL' ? 'red' : 'amber'
              }-500/10 text-${selectedQueueItem.risk_level === 'CRITICAL' ? 'red' : 'amber'}-500 border border-${
                selectedQueueItem.risk_level === 'CRITICAL' ? 'red' : 'amber'
              }-500/20`}>
                {selectedQueueItem.risk_level} Risk
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {selectedQueueItem.content_body}
                </div>

                {selectedQueueItem.status === 'pending' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Moderator Resolution Note</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Explain action decision for user notification..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-indigo-50/30 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/50 flex flex-col space-y-4 justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-500 mb-2">Explainable Diagnosis</h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-indigo-500/20">
                      <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {selectedQueueItem.spam_score}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold block uppercase">Spam Score</span>
                      <span className={`text-sm font-extrabold capitalize ${
                        selectedQueueItem.spam_score >= 60 ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {selectedQueueItem.spam_score >= 100 ? 'Critical Spam' : selectedQueueItem.spam_score >= 60 ? 'Spam' : 'Suspicious'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Scanners Triggered</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedQueueItem.spam_scans?.explanation?.detectors?.map((det, i) => (
                        <div key={i} className="text-xs bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600 dark:text-slate-300">{det.name}</span>
                            <span className="text-red-500">+{det.score} pts</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{det.explanation}</p>
                          {det.trigger && (
                            <div className="text-[10px] bg-slate-50 dark:bg-slate-850 p-1 rounded font-mono text-slate-500 overflow-x-auto">
                              Match: {det.trigger}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-100/30 text-xs">
                  <span className="font-bold text-indigo-500 block mb-1">System Recommendation</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    {selectedQueueItem.spam_scans?.explanation?.recommendations?.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="ghost" onClick={() => { setSelectedQueueItem(null); setAdminNote('') }}>
                Close
              </Button>
              {selectedQueueItem.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleQueueAction(selectedQueueItem.id, 'escalate', adminNote)}
                    className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 font-semibold text-sm rounded-xl transition"
                  >
                    Escalate
                  </button>
                  <button 
                    onClick={() => handleQueueAction(selectedQueueItem.id, 'reject', adminNote)}
                    className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 font-semibold text-sm rounded-xl transition"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleQueueAction(selectedQueueItem.id, 'ban', adminNote)}
                    className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15 font-semibold text-sm rounded-xl flex items-center gap-1.5 transition"
                  >
                    <UserMinus className="w-4.5 h-4.5" /> Suspend Author
                  </button>
                  <button 
                    onClick={() => handleQueueAction(selectedQueueItem.id, 'approve', adminNote)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-md transition"
                  >
                    <Check className="w-4.5 h-4.5" /> Approve & Publish
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
