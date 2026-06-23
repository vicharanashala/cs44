import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectLanguage, getSupportedLanguages, translateText } from '@/lib/translationService'

const translationCache = new Map()
const pendingRequests = new Map()

export function useTranslation({ contentId, content, autoTargetLanguage = 'en', autoTranslate = false }) {
  const originalText = useMemo(() => String(content || ''), [content])
  const originalLanguage = useMemo(() => detectLanguage(originalText), [originalText])
  const [displayText, setDisplayText] = useState(originalText)
  const [currentLanguage, setCurrentLanguage] = useState(originalLanguage)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const supportedLanguages = getSupportedLanguages()

  const resetTranslation = useCallback(() => {
    setDisplayText(originalText)
    setCurrentLanguage(originalLanguage)
    setStatus('idle')
    setError(null)
  }, [originalLanguage, originalText])

  const translate = useCallback(
    async (targetLanguage) => {
      if (!originalText) {
        return
      }

      if (targetLanguage === originalLanguage) {
        resetTranslation()
        return
      }

      const key = `${contentId}:${targetLanguage}`
      const cached = translationCache.get(key)
      if (cached) {
        setDisplayText(cached)
        setCurrentLanguage(targetLanguage)
        setStatus('success')
        setError(null)
        return
      }

      if (pendingRequests.has(key)) {
        try {
          const existing = await pendingRequests.get(key)
          setDisplayText(existing)
          setCurrentLanguage(targetLanguage)
          setStatus('success')
          setError(null)
        } catch (err) {
          setStatus('error')
          setError(err?.message || 'Translation failed')
        }
        return
      }

      setStatus('loading')
      setError(null)

      const request = translateText(originalText, targetLanguage)
      pendingRequests.set(key, request)

      try {
        const translated = await request
        translationCache.set(key, translated)
        setDisplayText(translated)
        setCurrentLanguage(targetLanguage)
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err?.message || 'Unable to translate. Please try again.')
      } finally {
        pendingRequests.delete(key)
      }
    },
    [contentId, originalLanguage, originalText, resetTranslation]
  )

  const [prevOriginalText, setPrevOriginalText] = useState(originalText)
  const [prevOriginalLanguage, setPrevOriginalLanguage] = useState(originalLanguage)

  if (originalText !== prevOriginalText || originalLanguage !== prevOriginalLanguage) {
    setPrevOriginalText(originalText)
    setPrevOriginalLanguage(originalLanguage)
    setDisplayText(originalText)
    setCurrentLanguage(originalLanguage)
    setStatus('idle')
    setError(null)
  }

  useEffect(() => {
    if (!autoTranslate || !autoTargetLanguage || autoTargetLanguage === originalLanguage) {
      return
    }

    const timer = setTimeout(() => {
      translate(autoTargetLanguage)
    }, 0)
    return () => clearTimeout(timer)
  }, [autoTargetLanguage, autoTranslate, originalLanguage, translate])

  return {
    originalText,
    displayText,
    originalLanguage,
    currentLanguage,
    supportedLanguages,
    status,
    error,
    isTranslated: currentLanguage !== originalLanguage,
    translate,
    resetTranslation,
  }
}
