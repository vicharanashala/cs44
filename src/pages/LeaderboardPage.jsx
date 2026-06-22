import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Award, HelpCircle, MessageCircle, Calendar, Clock, 
  ArrowUp, ArrowDown, ChevronRight, User, Shield, Sparkles,
  Crown
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState('all') // 'all', 'monthly', 'weekly'
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        timeframe: timeframe
      })

      if (error) throw error
      setLeaderboard(data || [])
    } catch (err) {
      console.error('Error fetching leaderboard:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // Slice podium winners (Top 3)
  const podiumUsers = leaderboard.slice(0, 3)
  // Rearrange for Podium layout: [Second, First, Third]
  const podiumLayout = []
  if (podiumUsers[1]) podiumLayout.push({ ...podiumUsers[1], position: 2 })
  if (podiumUsers[0]) podiumLayout.push({ ...podiumUsers[0], position: 1 })
  if (podiumUsers[2]) podiumLayout.push({ ...podiumUsers[2], position: 3 })

  // Remaining users (4th onwards)
  const listUsers = leaderboard.slice(3)

  // Current user stats in leaderboard
  const currentUserEntry = leaderboard.find(x => x.user_id === user?.id)

  const timeframeLabels = {
    all: 'All-Time Ranks',
    monthly: 'Monthly Contributors',
    weekly: 'Weekly Rising Stars'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500 animate-bounce" style={{ animationDuration: '3.5s' }} />
            Community Leaderboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Rankings of members driving institutional knowledge sharing.
          </p>
        </div>

        {/* Timeframe Filters */}
        <div className="bg-slate-100/85 dark:bg-slate-900/60 p-1 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center gap-0.5 shadow-inner self-start sm:self-center">
          {[
            { id: 'all', label: 'All-Time' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'weekly', label: 'Weekly' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                timeframe === tab.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-750/30'
                  : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && leaderboard.length === 0 ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-650 mx-auto" />
          <p className="text-slate-505 mt-4 text-sm font-semibold">Gathering ranking data...</p>
        </div>
      ) : (
        <>
          {/* Highlight Panel for Current Logged-in User */}
          {user && currentUserEntry && (
            <Card className="p-4 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] border-indigo-500/20 dark:border-purple-550/15 shadow-[0_0_15px_rgba(99,102,241,0.02)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-lg">
                    #{currentUserEntry.rank}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-850 dark:text-zinc-150">
                      Your Global Placement
                    </p>
                    <p className="text-xs text-slate-450 mt-0.5">
                      You are in the top tier of institutional contributors!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-150">{currentUserEntry.reputation_points}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reputation</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-150">{currentUserEntry.total_badges}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Badges</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-150">{currentUserEntry.answers_posted}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verified Answers</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 3. Top 3 Podium Winners (Desktop layout) */}
          {podiumUsers.length > 0 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 items-end relative min-h-[300px]">
              
              {/* Podium blocks placement */}
              {podiumLayout.map((p) => {
                const isFirst = p.position === 1
                const isSecond = p.position === 2
                
                // Styling details
                const ringColor = isFirst 
                  ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]' 
                  : isSecond 
                  ? 'border-2 border-slate-300 shadow-[0_0_12px_rgba(148,163,184,0.2)]'
                  : 'border border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.15)]'
                
                const heightClass = isFirst ? 'h-48' : isSecond ? 'h-36' : 'h-28'
                
                const blockBg = isFirst 
                  ? 'bg-gradient-to-t from-amber-500/15 to-amber-500/5 border-amber-500/20' 
                  : isSecond 
                  ? 'bg-gradient-to-t from-slate-450/15 to-slate-450/5 border-slate-400/25'
                  : 'bg-gradient-to-t from-amber-800/15 to-amber-800/5 border-amber-850/20'

                const isCurrentUser = user && p.user_id === user.id

                return (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: p.position * 0.1 }}
                    className="flex flex-col items-center justify-end h-full"
                  >
                    {/* User profile details */}
                    <div className="text-center mb-4 flex flex-col items-center">
                      <div className="relative mb-2">
                        {isFirst && (
                          <Crown className="w-6 h-6 text-amber-400 absolute -top-5.5 left-1/2 -translate-x-1/2 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.4)] animate-pulse" />
                        )}
                        <Avatar src={p.avatar} name={p.name} size={isFirst ? 'md' : 'sm'} className={ringColor} />
                      </div>
                      <p className={`text-xs font-black truncate max-w-[100px] ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {p.name || 'Anonymous'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {p.reputation_points} rep
                      </p>
                    </div>

                    {/* Standing Column block */}
                    <div className={`w-full ${heightClass} ${blockBg} border border-b-0 rounded-t-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden`}>
                      <span className="text-4xl font-black text-slate-400/20 dark:text-white/10 select-none">
                        {p.position}
                      </span>
                      <div className="absolute bottom-3 flex gap-1 items-center">
                        <Award className="w-3.5 h-3.5 text-slate-450 dark:text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {p.total_badges} Badges
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* 4. Complete Rankings List Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {timeframeLabels[timeframe]}
              </h3>
              <span className="text-xs text-slate-405 font-bold">
                Showing {leaderboard.length} users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200/40 dark:border-slate-800 text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5 text-center w-16">Rank</th>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5 text-right w-28">Reputation</th>
                    <th className="py-3 px-5 text-center w-24">Badges</th>
                    <th className="py-3 px-5 text-center w-24">Questions</th>
                    <th className="py-3 px-5 text-center w-24">Answers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 text-sm font-semibold">
                        No ranking logs recorded.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((u) => {
                      const isCurrentUser = user && u.user_id === user.id
                      const rankMovement = u.rank_movement || 0

                      return (
                        <tr 
                          key={u.user_id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-colors ${
                            isCurrentUser ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.005]' : ''
                          }`}
                        >
                          {/* Rank column */}
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Rank movement */}
                              {timeframe === 'all' && rankMovement !== 0 && (
                                <span className={`flex items-center text-[9px] font-black ${
                                  rankMovement > 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                  {rankMovement > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                                  {Math.abs(rankMovement)}
                                </span>
                              )}
                              <span className={`text-sm font-bold ${
                                u.rank === 1 ? 'text-amber-500 font-extrabold' :
                                u.rank === 2 ? 'text-slate-500 dark:text-slate-400' :
                                u.rank === 3 ? 'text-amber-700' :
                                'text-slate-600 dark:text-zinc-400'
                              }`}>
                                {u.rank}
                              </span>
                            </div>
                          </td>

                          {/* Username & Avatar */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <Avatar src={u.avatar} name={u.name} size="sm" />
                              <div>
                                <p className={`text-sm font-bold truncate max-w-[150px] ${
                                  isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-850 dark:text-zinc-200'
                                }`}>
                                  {u.name || 'Anonymous'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Reputation */}
                          <td className="py-3.5 px-5 text-right text-sm font-black text-indigo-600 dark:text-indigo-450">
                            {u.reputation_points}
                          </td>

                          {/* Badges */}
                          <td className="py-3.5 px-5 text-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold border border-slate-200/50 dark:border-slate-750/30">
                              <Award className="w-3 h-3 text-slate-450 dark:text-slate-400" />
                              {u.total_badges}
                            </span>
                          </td>

                          {/* Questions */}
                          <td className="py-3.5 px-5 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            {u.questions_asked}
                          </td>

                          {/* Answers */}
                          <td className="py-3.5 px-5 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            {u.answers_posted}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  )
}
