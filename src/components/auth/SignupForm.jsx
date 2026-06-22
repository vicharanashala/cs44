import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

export default function SignupForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const { signUp, loading } = useAuth()
  const { showToast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const password = watch('password', '')

  const getPasswordStrength = (pass) => {
    if (!pass) return { strength: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    if (score <= 1) return { strength: 20, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { strength: 40, label: 'Fair', color: 'bg-orange-500' }
    if (score <= 3) return { strength: 60, label: 'Good', color: 'bg-yellow-500' }
    if (score <= 4) return { strength: 80, label: 'Strong', color: 'bg-emerald-500' }
    return { strength: 100, label: 'Very Strong', color: 'bg-emerald-600' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data) => {
    try {
      const { error } = await signUp(data.email, data.password, data.name)
      if (error) throw error
      setSuccess(true)
      showToast('Account credentials verified!', 'success')
    } catch (err) {
      showToast(err.message || 'Signup failed', 'error')
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <svg
              className="w-8 h-8 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          {/* Pulsating ambient success light */}
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
        </div>

        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-bold text-slate-900 dark:text-white mt-5"
        >
          Registration Approved
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-slate-500 dark:text-zinc-400 mt-2 text-center max-w-xs"
        >
          Coordinates registered. Check email inbox for activation link!
        </motion.p>
      </motion.div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            {...register('name', { required: 'Name is required' })}
            placeholder="John Doe"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm shadow-sm dark:shadow-none"
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Encrypted Mail
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
            type="email"
            placeholder="you@domain.com"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm shadow-sm dark:shadow-none"
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Secure Key
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm shadow-sm dark:shadow-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {password && (
          <div className="mt-2.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${passwordStrength.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength.strength}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide shrink-0">{passwordStrength.label}</span>
            </div>
          </div>
        )}
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Verify Key
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: value => value === password || 'Passwords do not match',
            })}
            type="password"
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all duration-300 text-sm shadow-sm dark:shadow-none"
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" loading={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none py-3 shadow-[0_0_20px_rgba(168,85,247,0.25)] mt-1">
        Request Coordinate Setup
      </Button>
    </motion.form>
  )
}
