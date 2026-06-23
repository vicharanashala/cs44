import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Globe, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import LanguageSelector from './LanguageSelector'
import { getSupportedLanguages } from '@/lib/translationService'

export default function TranslationButton({
  originalLanguage,
  currentLanguage,
  isTranslated,
  status,
  error,
  onTranslate,
  onReset,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const popupRef = useRef(null)
  const [portalNode, setPortalNode] = useState(null)
  const languages = getSupportedLanguages()

  useEffect(() => {
    const node = document.createElement('div')
    node.setAttribute('data-translation-dropdown-portal', 'true')
    document.body.appendChild(node)
    const timer = setTimeout(() => {
      setPortalNode(node)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.body.removeChild(node)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const dropdownWidth = 224
      let left = triggerRect.right - dropdownWidth
      const minPadding = 12
      const maxLeft = window.innerWidth - dropdownWidth - minPadding
      if (left < minPadding) {
        left = minPadding
      } else if (left > maxLeft) {
        left = maxLeft
      }

      const top = triggerRect.bottom + 8
      setPopupStyle({ top, left, width: dropdownWidth })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  const handleLanguageSelect = (language) => {
    setIsOpen(false)
    if (language.code === originalLanguage) {
      onReset()
      return
    }
    if (language.code === currentLanguage) {
      return
    }
    onTranslate(language.code)
  }

  const popup = isOpen ? (
    <div
      ref={popupRef}
      style={{ top: popupStyle.top, left: popupStyle.left, width: popupStyle.width }}
      className="fixed z-[9999] overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/70 dark:border-slate-700/90 dark:bg-slate-950/95 dark:shadow-black/25 dark:ring-slate-700/70"
    >
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-3">
          Select language
        </p>
        <LanguageSelector
          languages={languages}
          selectedLanguage={currentLanguage}
          onSelect={handleLanguageSelect}
        />
        {error && (
          <p className="text-xs text-rose-500 mt-3">{error}</p>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="relative inline-flex items-center gap-2 overflow-visible">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        icon={Globe}
        onClick={() => setIsOpen((open) => !open)}
        disabled={status === 'loading'}
        className="rounded-full p-2"
        aria-expanded={isOpen}
        aria-label="Select translation language"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {isTranslated && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Restore original content"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Original
        </button>
      )}

      {status === 'loading' && (
        <span className="text-xs text-slate-500">Translating…</span>
      )}
      {status === 'error' && (
        <span className="inline-flex items-center gap-1 text-xs text-rose-500">
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed
        </span>
      )}

      {portalNode ? createPortal(popup, portalNode) : popup}
    </div>
  )
}
