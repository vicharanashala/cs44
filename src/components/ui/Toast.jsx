/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

const toastConfig = {
  success: {
    shadow: 'shadow-emerald-500/5 dark:shadow-[0_0_30px_rgba(16,185,129,0.12)] border-emerald-500/20 dark:border-emerald-500/25',
    barColor: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500 to-emerald-400 dark:via-emerald-450 dark:to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    glowColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  error: {
    shadow: 'shadow-red-500/5 dark:shadow-[0_0_30px_rgba(239,68,68,0.12)] border-red-500/20 dark:border-red-500/25',
    barColor: 'bg-gradient-to-r from-red-500/10 via-red-500 to-red-400 dark:via-red-450 dark:to-red-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    glowColor: 'bg-red-500/10 dark:bg-red-500/15',
  },
  info: {
    shadow: 'shadow-indigo-500/5 dark:shadow-[0_0_30px_rgba(99,102,241,0.12)] border-indigo-500/20 dark:border-indigo-500/25',
    barColor: 'bg-gradient-to-r from-indigo-500/10 via-indigo-500 to-indigo-400 dark:via-indigo-450 dark:to-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    glowColor: 'bg-indigo-500/10 dark:bg-indigo-500/15',
  },
  warning: {
    shadow: 'shadow-amber-500/5 dark:shadow-[0_0_30px_rgba(245,158,11,0.12)] border-amber-500/20 dark:border-amber-500/25',
    barColor: 'bg-gradient-to-r from-amber-500/10 via-amber-500 to-amber-400 dark:via-amber-450 dark:to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    glowColor: 'bg-amber-500/10 dark:bg-amber-500/15',
  },
};

const toastVariants = {
  initial: {
    opacity: 0,
    x: 120,
    scale: 0.9,
    y: 8,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 22,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    x: 60,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

function AnimatedToastIcon({ type }) {
  if (type === 'success') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke="url(#successGradient)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <motion.path
          d="M9 12l2 2 4-4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-emerald-550 dark:text-emerald-400"
        />
        <defs>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke="url(#errorGradient)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <motion.path
          d="M15 9l-6 6M9 9l6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-red-550 dark:text-red-400"
        />
        <defs>
          <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <motion.path
          d="M12 3l8 14H4L12 3z"
          stroke="url(#warningGradient)"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <motion.path
          d="M12 9v4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-amber-550 dark:text-amber-400"
        />
        <motion.circle
          cx="12"
          cy="16"
          r="1"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
          className="text-amber-550 dark:text-amber-400"
        />
        <defs>
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  // Default is 'info'
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="url(#infoGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.path
        d="M12 16v-4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-indigo-550 dark:text-indigo-400"
      />
      <motion.circle
        cx="12"
        cy="8"
        r="1"
        fill="currentColor"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
        className="text-indigo-550 dark:text-indigo-400"
      />
      <defs>
        <linearGradient id="infoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ToastItem({ id, message, type, onClose }) {
  const config = toastConfig[type] || toastConfig.info;

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -2, scale: 1.01 }}
      className={`relative overflow-hidden flex items-center gap-3.5 w-80 p-4 rounded-2xl bg-white/90 dark:bg-[#090915]/90 border border-slate-200/80 ${config.shadow} shadow-lg backdrop-blur-2xl transition-all duration-300`}
    >
      {/* Dynamic glowing laser countdown progress line */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[3px] ${config.barColor}`}
      />

      {/* Decorative ambient radial glow behind the icon */}
      <div className={`absolute -left-4 -top-4 w-12 h-12 rounded-full blur-xl pointer-events-none ${config.glowColor}`} />

      {/* Animated icon wrapper */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center p-1 rounded-lg">
        <AnimatedToastIcon type={type} />
      </div>

      {/* Message Text */}
      <p className="relative z-10 text-xs font-bold flex-1 text-slate-800 dark:text-zinc-200 leading-normal tracking-tight">
        {message}
      </p>
      
      {/* Dismiss Button */}
      <button
        onClick={() => onClose(id)}
        className="relative z-10 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-all duration-200 flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X size={14} className="stroke-[2.5]" />
      </button>
    </motion.div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = ++counterRef.current;

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem
                id={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={removeToast}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
export { ToastProvider, useToast };
