import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Send, Paperclip, X, AlertCircle, Clock, LogIn } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAnswers } from '@/hooks/useAnswers'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Link } from 'react-router-dom'
import { spamApi } from '@/lib/spamApi'
import { analyzeContentSpam } from '@/lib/spamDetector'

export default function AnswerForm({ questionId, onSubmitted }) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm()
  const { submitAnswer, loading } = useAnswers()
  const { uploadFile, uploading, ALLOWED_EXTENSIONS } = useFileUpload()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [file, setFile] = useState(null)
  
  const [spamRules, setSpamRules] = useState(null)
  const [spamSettings, setSpamSettings] = useState(null)
  const [qualityReport, setQualityReport] = useState(null)
  
  const contentVal = watch('content') || ''

  useEffect(() => {
    async function loadSpamRules() {
      try {
        const rules = await spamApi.getRules()
        const settings = await spamApi.getSettings()
        setSpamRules(rules)
        setSpamSettings(settings)
      } catch (e) {
        console.error('Failed to load rules for real-time validation:', e)
      }
    }
    loadSpamRules()
  }, [])

  useEffect(() => {
    if (!spamRules || !spamSettings) return

    const delayDebounce = setTimeout(() => {
      if (contentVal.trim().length < 3) {
        setQualityReport(null)
        return
      }

      const rulesMap = {}
      spamRules.forEach(r => {
        rulesMap[r.id] = { 
          name: r.name, 
          weight: r.weight, 
          isEnabled: r.is_enabled !== undefined ? r.is_enabled : true 
        }
      })

      const thresholds = {
        needsReview: spamSettings.threshold_needs_review,
        spam: spamSettings.threshold_spam,
        critical: spamSettings.threshold_critical
      }

      const report = analyzeContentSpam(contentVal, {
        rules: rulesMap,
        thresholds,
      })

      setQualityReport(report)
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [contentVal, spamRules, spamSettings])

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
      >
        <LogIn className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 mb-3">
          Sign in to share your answer
        </p>
        <Link to="/login">
          <Button variant="primary" size="sm">
            Sign In
          </Button>
        </Link>
      </motion.div>
    )
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        showToast(`File type .${ext} not allowed`, 'error')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('File too large. Maximum 10MB', 'error')
        return
      }
      setFile(selectedFile)
    }
  }

  const onSubmit = async (data) => {
    try {
      let attachmentUrl = null
      if (file) {
        attachmentUrl = await uploadFile(file)
      }

      const result = await submitAnswer(questionId, data.content, attachmentUrl)

      if (result.isSpam) {
        showToast('Your answer was flagged for review due to spam detection.', 'warning')
      } else {
        showToast('Answer submitted! It will be visible after admin verification.', 'success')
      }

      reset()
      setFile(null)
      onSubmitted?.()
    } catch (err) {
      if (err.message === 'SUBMISSION_BLOCKED_CRITICAL_SPAM') {
        showToast('Submission blocked: Content identified as critical spam.', 'error')
      } else {
        showToast(err.message || 'Failed to submit answer', 'error')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
        Your Answer
      </h3>

      <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <Clock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-600 dark:text-indigo-400">
          Your answer will be reviewed by an admin before becoming publicly visible.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <textarea
            {...register('content', {
              required: 'Answer content is required',
              minLength: { value: 20, message: 'Answer must be at least 20 characters' },
            })}
            placeholder="Write your answer here... Be detailed and helpful."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none"
          />
          {errors.content && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.content.message}
            </p>
          )}
        </div>

      {qualityReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-white/60 dark:bg-slate-855/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-755 dark:text-slate-255 uppercase tracking-wider">
                Live Quality Assessment
              </h4>
              <p className="text-xs text-slate-400">Heuristic spam scan analyzing your input in real-time.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              qualityReport.classification === 'SAFE' 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : qualityReport.classification === 'SUSPICIOUS' 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {qualityReport.classification === 'SAFE' ? 'Safe to Post' : qualityReport.classification === 'SUSPICIOUS' ? 'Needs Admin Review' : 'Spam Blocked'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Spam Score</span>
                <span>{qualityReport.spamScore} / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    qualityReport.spamScore >= 60 ? 'bg-red-500' : qualityReport.spamScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(qualityReport.spamScore, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {qualityReport.detectors && qualityReport.detectors.length > 0 && (
             <div className="space-y-2">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Triggered Signals</span>
               <div className="flex flex-wrap gap-2">
                 {qualityReport.detectors.map((det, i) => (
                   <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-900/60 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-200/30">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                     {det.name} (+{det.score})
                   </span>
                 ))}
               </div>
             </div>
          )}

          {qualityReport.classification !== 'SAFE' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
              <strong>Note:</strong> Your content triggers spam flags. {qualityReport.classification === 'SUSPICIOUS' ? 'It will require administrator approval before going public.' : 'Posting will be blocked to maintain platform safety.'}
            </p>
          )}
        </motion.div>
      )}

        <div className="flex items-center justify-between">
          <div>
            {file ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                Attach file
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.zip"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={Send}
            loading={loading || uploading}
            size="sm"
          >
            Submit Answer
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
