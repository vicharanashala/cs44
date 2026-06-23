import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Award,
  Search,
  Eye,
  MessageCircle,
  Crown,
} from 'lucide-react';
import { supabase } from '@/config/supabase';

const faqItems = [
  { id: 1, title: 'Internship Rules', description: 'Guidelines for internship registration & credits', icon: '🎯' },
  { id: 2, title: 'Placement Guidelines', description: 'Campus placement eligibility & process', icon: '💼' },
  { id: 3, title: 'Exam Policies', description: 'Examination rules, grading & re-evaluation', icon: '📝' },
  { id: 4, title: 'Hostel Rules', description: 'Hostel regulations, timings & facilities', icon: '🏠' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

function SidebarSection({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-zinc-950/25 border border-zinc-200/50 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_0_40px_-15px_rgba(168,85,247,0.1)] relative overflow-hidden backdrop-blur-xl group/section transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-purple-500/20 hover:shadow-md dark:hover:shadow-[0_0_40px_-12px_rgba(168,85,247,0.2)]">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover/section:bg-purple-500/10 transition-colors duration-500" />
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-white/5 pb-3">
        <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <h3 className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SidebarLocalSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded-lg w-full" />
      ))}
    </div>
  );
}

export default function Sidebar() {
  const [topContributors, setTopContributors] = useState([]);
  const [trendingQuestions, setTrendingQuestions] = useState([]);
  const [mostSearched, setMostSearched] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSidebarData = useCallback(async () => {
    try {
      setLoading(true);

      // Top contributors - users with most verified answers
      const { data: contributors } = await supabase
        .from('answers')
        .select('user_id, users:user_id (name, avatar)')
        .eq('verification_status', 'verified')
        .limit(100);

      if (contributors) {
        const countMap = {};
        contributors.forEach(({ user_id, users }) => {
          if (!countMap[user_id]) {
            countMap[user_id] = {
              user_id,
              full_name: users?.name || 'Anonymous',
              avatar_url: users?.avatar,
              count: 0,
            };
          }
          countMap[user_id].count++;
        });
        const sorted = Object.values(countMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopContributors(sorted);
      }

      // Trending questions by views
      const { data: trending } = await supabase
        .from('questions')
        .select('id, title, views')
        .order('views', { ascending: false })
        .limit(5);

      if (trending) setTrendingQuestions(trending);

      // Most searched terms
      const { data: searched } = await supabase
        .from('search_analytics')
        .select('search_term')
        .limit(200);

      if (searched) {
        const termMap = {};
        searched.forEach(({ search_term }) => {
          const term = search_term?.toLowerCase().trim();
          if (term) {
            termMap[term] = (termMap[term] || 0) + 1;
          }
        });
        const sorted = Object.entries(termMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([term, count]) => ({ term, count }));
        setMostSearched(sorted);
      }
    } catch (err) {
      console.error('Sidebar data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSidebarData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSidebarData]);

  return (
    <aside className="hidden lg:block w-80 shrink-0 select-none">
      <div className="sticky top-24 space-y-5">
        {/* FAQ Quick Summary */}
        <SidebarSection title="FAQ Quick Summary" icon={BookOpen}>
          {loading ? (
            <SidebarLocalSkeleton />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
              {faqItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <Link
                    to={`/faq/${item.id}`}
                    className="flex items-start gap-3.5 p-3 rounded-xl bg-zinc-50/40 dark:bg-white/[0.01] hover:bg-zinc-100/80 dark:hover:bg-purple-500/[0.03] border border-zinc-100 dark:border-transparent hover:border-zinc-200 dark:hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/[0.02] dark:hover:shadow-purple-500/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:translate-x-0.5 group cursor-pointer"
                  >
                    <span className="text-base mt-0.5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-115 transition-transform duration-300">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </SidebarSection>

        {/* Top Contributors */}
        <SidebarSection title="Top Contributors" icon={Award}>
          {loading ? (
            <SidebarLocalSkeleton />
          ) : topContributors.length === 0 ? (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">No contributors yet.</p>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5">
              {topContributors.map((contributor, idx) => {
                const rankRing =
                  idx === 0
                    ? 'border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : idx === 1
                    ? 'border-2 border-zinc-300 shadow-[0_0_8px_rgba(212,212,216,0.3)]'
                    : idx === 2
                    ? 'border-2 border-amber-700 shadow-[0_0_6px_rgba(180,83,9,0.2)]'
                    : 'border border-zinc-200 dark:border-zinc-700';

                return (
                  <motion.div
                    key={contributor.user_id}
                    variants={itemVariants}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50/80 dark:hover:bg-purple-500/[0.02] border border-transparent hover:border-zinc-200/50 dark:hover:border-purple-500/10 transition-all duration-300 cursor-pointer group/contrib hover:translate-x-1.5"
                  >
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-zinc-700 dark:text-white text-xs font-extrabold overflow-hidden bg-zinc-100 dark:bg-zinc-950 ${rankRing} group-hover/contrib:scale-110 transition-transform duration-300`}>
                        {contributor.avatar_url ? (
                          <img src={contributor.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          contributor.full_name[0]?.toUpperCase()
                        )}
                      </div>
                      {idx === 0 && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-2 -right-1 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] animate-bounce" style={{ animationDuration: '3s' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate group-hover/contrib:text-purple-600 dark:group-hover/contrib:text-purple-400 transition-colors">{contributor.full_name}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/15 px-2.5 py-0.5 rounded-md shadow-sm group-hover/contrib:scale-105 transition-all duration-300">
                      <MessageCircle className="w-3 h-3 group-hover/contrib:scale-110 transition-transform" />
                      {contributor.count}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </SidebarSection>

        {/* Trending Questions */}
        <SidebarSection title="Trending Questions" icon={TrendingUp}>
          {loading ? (
            <SidebarLocalSkeleton />
          ) : trendingQuestions.length === 0 ? (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">No trending questions yet.</p>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1.5">
              {trendingQuestions.map((q) => (
                <motion.div key={q.id} variants={itemVariants}>
                  <Link
                    to={`/question/${q.id}`}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50/40 dark:bg-white/[0.01] hover:bg-zinc-100/80 dark:hover:bg-purple-500/[0.03] border border-zinc-100 dark:border-transparent hover:border-zinc-200 dark:hover:border-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:translate-x-0.5 group cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-relaxed">
                        {q.title}
                      </p>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1.5 uppercase tracking-wide">
                        <Eye className="w-3 h-3 text-zinc-400 dark:text-zinc-650" />
                        {q.views || 0} views
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </SidebarSection>

        {/* Most Searched */}
        <SidebarSection title="Most Searched" icon={Search}>
          {loading ? (
            <SidebarLocalSkeleton />
          ) : mostSearched.length === 0 ? (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">No search data yet.</p>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-wrap gap-1.5 pt-1">
              {mostSearched.map((item) => (
                <motion.div key={item.term} variants={itemVariants}>
                  <Link
                    to={`/search?q=${encodeURIComponent(item.term)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 hover:border-purple-300 dark:hover:border-purple-500/25 transition-all duration-300 shadow-inner hover:-translate-y-0.5 hover:scale-105 cursor-pointer"
                  >
                    {item.term}
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600 group-hover:text-purple-500 transition-colors">({item.count})</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </SidebarSection>
      </div>
    </aside>
  );
}
