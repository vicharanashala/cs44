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
import { detectSpam } from '@/lib/spamDetector'
import SpamFeedback from '@/components/ui/SpamFeedback'
export default function AnswerForm({ questionId, onSubmitted }) {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  const { submitAnswer, loading } = useAnswers()
  const { uploadFile, uploading, ALLOWED_EXTENSIONS } = useFileUpload()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [file, setFile] = useState(null)
  const [spamResult, setSpamResult] = useState(null)
  const content = watch('content') || ''
  useEffect(() => {
    if (!content) {
      setSpamResult(null)
      return
    }
    let localConfig = null
    try {
      const saved = localStorage.getItem('spam_config')
      if (saved) localConfig = JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    const result = detectSpam(content, localConfig)
    setSpamResult(result)
  }, [content])
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
      if (result.status === 'verified') {
        showToast('Answer submitted successfully!', 'success')
      } else {
        showToast('Your answer was flagged for review due to spam detection.', 'warning')
      }
      reset()
      setFile(null)
      onSubmitted?.()
    } catch (err) {
      showToast(err.message || 'Failed to submit answer', 'error')
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
        {spamResult && spamResult.score > 0 && (
          <SpamFeedback spamResult={spamResult} />
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
                  <X className="w-3 h-3 text-slate-400" />
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
