import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Send, Paperclip, X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCategories } from '@/hooks/useCategories'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useToast } from '@/components/ui/Toast'
import { spamApi } from '@/lib/spamApi'
import { analyzeContentSpam } from '@/lib/spamDetector'

export default function QuestionForm({ onSubmit, loading: submitLoading }) {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  const { categories, fetchCategories } = useCategories()
  const { uploadFile, uploading, ALLOWED_EXTENSIONS } = useFileUpload()
  const { showToast } = useToast()
  const [file, setFile] = useState(null)
  const [tagsInput, setTagsInput] = useState('')
  
  const [spamRules, setSpamRules] = useState(null)
  const [spamSettings, setSpamSettings] = useState(null)
  const [qualityReport, setQualityReport] = useState(null)
  
  const titleVal = watch('title') || ''
  const descriptionVal = watch('description') || ''

  useEffect(() => {
    fetchCategories()
    
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
  }, [fetchCategories])

  useEffect(() => {
    if (!spamRules || !spamSettings) return

    const delayDebounce = setTimeout(() => {
      const combinedText = `${titleVal}\n\n${descriptionVal}`
      if (combinedText.trim().length < 3) {
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

      const report = analyzeContentSpam(combinedText, {
        rules: rulesMap,
        thresholds,
      })

      setQualityReport(report)
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [titleVal, descriptionVal, spamRules, spamSettings])

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

  const handleFormSubmit = async (data) => {
    try {
      let attachmentUrl = null
      if (file) {
        attachmentUrl = await uploadFile(file)
      }

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      await onSubmit({
        title: data.title,
        description: data.description,
        category: data.category,
        tags,
        attachment_url: attachmentUrl,
      })

      reset()
      setFile(null)
      setTagsInput('')
    } catch (err) {
      showToast(err.message || 'Failed to post question', 'error')
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Question Title *
        </label>
        <input
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 10, message: 'Title must be at least 10 characters' },
          })}
          placeholder="What's your question? Be specific..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
        />
        {errors.title && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Description *
        </label>
        <textarea
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 20, message: 'Description must be at least 20 characters' },
          })}
          placeholder="Provide more details about your question..."
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 resize-none"
        />
        {errors.description && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Category *
          </label>
          <select
            {...register('category', { required: 'Please select a category' })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tags
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, javascript, node (comma-separated)"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
          />
          {tagsInput && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagsInput.split(',').map((tag, i) => tag.trim() && (
                <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Attachment
        </label>
        {file ? (
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400 flex-1 truncate">{file.name}</span>
            <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-300">
            <Paperclip className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Drop file or click to upload (PDF, PNG, JPG, ZIP · Max 10MB)
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.zip"
              onChange={handleFileChange}
            />
          </label>
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
              <h4 className="text-sm font-extrabold text-slate-750 dark:text-slate-250 uppercase tracking-wider">
                Live Quality Assessment
              </h4>
              <p className="text-xs text-slate-400">Heuristic spam scan analyzing your input in real-time.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
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

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          icon={Send}
          loading={submitLoading || uploading}
        >
          Post Question
        </Button>
      </div>
    </motion.form>
  )
}
