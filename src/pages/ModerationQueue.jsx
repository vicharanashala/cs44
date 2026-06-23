import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, RefreshCw, Clock, CheckCircle, XCircle, 
  Trash2, Eye, Inbox, Filter, MessageSquare, HelpCircle, User, Calendar, FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useFlags } from '@/hooks/useFlags';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#f43f5e', '#eab308', '#a855f7', '#10b981', '#3b82f6'];

export default function ModerationQueue() {
  const { fetchFlags, resolveFlag, dismissFlag, deleteContent, loading } = useFlags();
  const { showToast } = useToast();
  
  const [flags, setFlags] = useState([]);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [viewTab, setViewTab] = useState('queue'); // 'queue' | 'analytics'

  const loadFlags = useCallback(async () => {
    try {
      const result = await fetchFlags({ 
        status: statusFilter === 'all' ? null : statusFilter,
        reason: reasonFilter === 'all' ? null : reasonFilter
      });
      setFlags(result.data || []);
      // If selected flag is updated, update its reference in the list
      if (selectedFlag) {
        const updated = result.data.find(f => f.id === selectedFlag.id);
        setSelectedFlag(updated || null);
      }
    } catch {
      showToast('Failed to load moderation queue', 'error');
    }
  }, [fetchFlags, statusFilter, reasonFilter, selectedFlag, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFlags();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadFlags]);

  // Calculations for stats
  const stats = useMemo(() => {
    const total = flags.length;
    const pending = flags.filter(f => f.status === 'pending').length;
    const resolved = flags.filter(f => f.status === 'resolved').length;
    const dismissed = flags.filter(f => f.status === 'dismissed').length;
    return { total, pending, resolved, dismissed };
  }, [flags]);

  // Chart data calculations
  const reasonChartData = useMemo(() => {
    const counts = {
      Spam: 0,
      Offensive: 0,
      Duplicate: 0,
      Other: 0
    };

    flags.forEach(f => {
      if (f.reason === 'spam') counts.Spam++;
      else if (f.reason === 'offensive') counts.Offensive++;
      else if (f.reason === 'duplicate') counts.Duplicate++;
      else counts.Other++;
    });

    return Object.keys(counts).map(name => ({
      name,
      value: counts[name]
    })).filter(item => item.value > 0);
  }, [flags]);

  const weeklyChartData = useMemo(() => {
    // Generate last 7 days of reports
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = {};
    
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      dataMap[dayName] = 0;
    }

    flags.forEach(f => {
      const d = new Date(f.created_at);
      const dayName = days[d.getDay()];
      if (dataMap[dayName] !== undefined) {
        dataMap[dayName]++;
      }
    });

    return Object.keys(dataMap).map(name => ({
      name,
      Reports: dataMap[name]
    }));
  }, [flags]);

  // Actions
  const handleResolve = async (flagId) => {
    try {
      await resolveFlag(flagId, adminNotes);
      showToast('Flag resolved successfully', 'success');
      setAdminNotes('');
      loadFlags();
    } catch (err) {
      showToast(err.message || 'Failed to resolve flag', 'error');
    }
  };

  const handleDismiss = async (flagId) => {
    try {
      await dismissFlag(flagId, adminNotes);
      showToast('Flag dismissed', 'info');
      setAdminNotes('');
      loadFlags();
    } catch (err) {
      showToast(err.message || 'Failed to dismiss flag', 'error');
    }
  };

  const handleDeleteContent = async (flag) => {
    if (!window.confirm(`Are you sure you want to permanently delete this reported ${flag.content_type}? This action is irreversible.`)) {
      return;
    }
    try {
      const contentId = flag.content_type === 'question' ? flag.question_id : flag.answer_id;
      await deleteContent(flag.content_type, contentId);
      await resolveFlag(flag.id, adminNotes || 'Content deleted by administrator');
      showToast('Content permanently deleted', 'success');
      setAdminNotes('');
      setSelectedFlag(null);
      loadFlags();
    } catch (err) {
      showToast(err.message || 'Failed to delete content', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-700/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200/30 dark:border-red-900/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Moderation Queue</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review flagged community content and enforce guidelines.</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewTab === 'queue'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
            }`}
          >
            Review Queue
          </button>
          <button
            onClick={() => setViewTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <Button variant="ghost" onClick={loadFlags} size="sm" className="ml-1" icon={RefreshCw} />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: stats.total, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/30' },
          { label: 'Pending Reports', value: stats.pending, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30' },
          { label: 'Resolved Reports', value: stats.resolved, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30' },
          { label: 'Dismissed Reports', value: stats.dismissed, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30' },
        ].map((c) => (
          <div key={c.label} className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${c.color.split(' ')[2]}`}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c.label}</span>
            <span className={`text-2xl font-extrabold mt-2 ${c.color.split(' ')[0]}`}>{c.value}</span>
          </div>
        ))}
      </div>

      {viewTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 flex flex-col items-center">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 w-full">Reports by Reason</h3>
            {reasonChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-450 dark:text-slate-500 text-sm">No report reason data.</div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5 flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Reports per Week</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="Reports" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Filters & Queue Table */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span>Filters</span>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                {/* Reason Filter */}
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Reasons</option>
                  <option value="spam">Spam</option>
                  <option value="offensive">Offensive</option>
                  <option value="off-topic">Off-Topic</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>
            </div>

            {/* Moderation Queue Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/55 dark:border-slate-800/60">
                      <th className="px-5 py-4">Content Type</th>
                      <th className="px-5 py-4">Reason</th>
                      <th className="px-5 py-4">Reported By</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          <span>Loading flags...</span>
                        </td>
                      </tr>
                    ) : flags.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">
                          <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <span>No reports match your filters.</span>
                        </td>
                      </tr>
                    ) : (
                      flags.map((flag) => {
                        const isSelected = selectedFlag?.id === flag.id;
                        return (
                          <tr
                            key={flag.id}
                            onClick={() => setSelectedFlag(flag)}
                            className={`border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-all ${
                              isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                            }`}
                          >
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                flag.content_type === 'question' 
                                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/30'
                                  : 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200/30'
                              }`}>
                                {flag.content_type === 'question' ? <HelpCircle className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                {flag.content_type}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-455 font-bold uppercase tracking-wider">
                                {flag.reason}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                              {flag.reporter?.name || 'Anonymous'}
                            </td>
                            <td className="px-5 py-4 text-slate-450 dark:text-slate-500 text-xs">
                              {formatDate(flag.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                                flag.status === 'pending' ? 'text-amber-500' :
                                flag.status === 'resolved' ? 'text-emerald-500' : 'text-slate-400'
                              }`}>
                                {flag.status === 'pending' ? <Clock className="w-3.5 h-3.5" /> :
                                 flag.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {flag.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              {selectedFlag ? (
                <motion.div
                  key={selectedFlag.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4"
                >
                  <Card className="p-5 border-l-4 border-indigo-500">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Report Details
                    </h3>

                    <div className="space-y-4 text-sm">
                      {/* Meta Info */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> Reporter
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 font-semibold">
                          {selectedFlag.reporter?.name || 'Anonymous'}
                        </div>

                        <div className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Flagged On
                        </div>
                        <div className="text-slate-750 dark:text-slate-350">
                          {formatDate(selectedFlag.created_at)}
                        </div>

                        <div className="text-slate-400">Reason</div>
                        <div className="text-rose-600 dark:text-rose-455 font-bold uppercase tracking-wider">
                          {selectedFlag.reason}
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="space-y-2">
                        {selectedFlag.content_type === 'question' ? (
                          <>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Question:</div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                              <h4 className="font-bold text-slate-850 dark:text-slate-100 mb-1.5">{selectedFlag.question?.title}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed">{selectedFlag.question?.description}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Answer:</div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed">{selectedFlag.answer?.content}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporter Notes:</div>
                        <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl italic text-slate-650 dark:text-slate-350 border border-slate-200/30 dark:border-slate-800/40">
                          {selectedFlag.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Flag Review Action Form */}
                      {selectedFlag.status === 'pending' ? (
                        <div className="space-y-3 border-t border-slate-150 dark:border-slate-800 pt-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                              Admin Action Notes
                            </label>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Describe the action taken (e.g. Content removed, report dismissed)..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDismiss(selectedFlag.id)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Dismiss Report
                            </Button>
                            <Button 
                              variant="primary" 
                              onClick={() => handleResolve(selectedFlag.id)}
                              className="text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                            </Button>
                          </div>

                          <Button 
                            variant="danger" 
                            onClick={() => handleDeleteContent(selectedFlag)}
                            className="w-full text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Content
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 border-t border-slate-150 dark:border-slate-850 pt-3 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>This report has been {selectedFlag.status}.</span>
                          </div>
                          {selectedFlag.admin_notes && (
                            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl text-slate-600 dark:text-slate-400">
                              <span className="font-bold block mb-0.5">Admin Note:</span>
                              {selectedFlag.admin_notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* View original link */}
                      <Link
                        to={`/question/${selectedFlag.question_id || selectedFlag.question?.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-bold mt-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Original Post
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card className="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold uppercase tracking-wider">No Report Selected</p>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Select a report from the list to view detail information and perform administrative actions.</p>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
