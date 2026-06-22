import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Sparkles,
  Menu,
  X,
  LogIn,
  UserPlus,
  Plus,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Trophy,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from '@/components/ui/ThemeToggle'
import SearchBar from '@/components/search/SearchBar'
import NotificationBell from '@/components/notifications/NotificationBell'
import Avatar from '@/components/ui/Avatar'

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm shadow-zinc-100/20 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Logo & Navigation links */}
            <div className="flex items-center gap-6 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <MessageCircle className="w-6 h-6 text-zinc-900 dark:text-zinc-50 group-hover:scale-105 transition-transform" />
                  <Sparkles className="w-3 h-3 text-indigo-500 absolute -top-1.5 -right-1.5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  AnswerHub
                </span>
              </Link>
              
              <Link
                to="/leaderboard"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-300"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                Leaderboard
              </Link>
            </div>

            {/* Center — Search (hidden on mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <SearchBar variant="navbar" onSearch={(q) => q && navigate(`/search?q=${encodeURIComponent(q)}`)} />
            </div>

            {/* Right — Actions */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />

              {user ? (
                <>
                  <NotificationBell />

                  <Link
                    to="/ask"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    Ask Question
                  </Link>

                  {/* Profile Dropdown */}
                  <div ref={profileRef} className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                    >
                      <Avatar src={user.avatar} name={user.name || user.email || 'U'} size="sm" />
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-950/95 border border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl py-1 z-50"
                        >
                          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {user.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                          </div>

                          <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/55 transition-colors"
                          >
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                          
                          <Link
                            to="/leaderboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/55 transition-colors"
                          >
                            <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
                          </Link>

                          {isAdmin && (
                            <>
                              <Link
                                to="/admin"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/55 transition-colors"
                              >
                                <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                              </Link>
                              <Link
                                to="/admin/moderation"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/55 transition-colors"
                              >
                                <ShieldAlert className="w-4 h-4 text-red-500" /> Moderation Queue
                              </Link>
                            </>
                          )}
                          <div className="border-t border-slate-100 dark:border-zinc-800/80 mt-1">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full"
                            >
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4" /> Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <SearchBar variant="page" onSearch={(q) => { navigate(`/search?q=${encodeURIComponent(q)}`); setMobileOpen(false) }} />

                {user ? (
                  <>
                    <Link to="/ask" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
                      <Plus className="w-4 h-4" /> Ask Question
                    </Link>

                    <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-1">
                      <div className="flex items-center gap-3 px-4 mb-3">
                        <Avatar src={user.avatar} name={user.name || 'User'} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name || 'User'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl">
                        <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
                      </Link>
                      {isAdmin && (
                        <>
                          <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl">
                            <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                          </Link>
                          <Link to="/admin/moderation" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> Moderation Queue
                          </Link>
                        </>
                      )}
                      <button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl w-full">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
                    </Link>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <LogIn className="w-4 h-4" /> Log In
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600">
                      <UserPlus className="w-4 h-4" /> Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
