import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Command, Mic, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useTypeahead from '@/hooks/useTypeahead'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { searchVoiceAnswer } from '@/lib/searchVoiceAnswer'

export default function SearchBar({ onSearch, variant = 'navbar' }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const navigate = useNavigate()
  const debounceRef = useRef(null)
  const isVoiceInput = useRef(false)
  const voiceSearchTimeoutRef = useRef(null)

  const { setQuery: setTaQuery, results, loadingServer } = useTypeahead()

  const { supported: sttSupported, listening, start: startListening, stop: stopListening } = useSpeechToText({
    onResult: (text) => {
      isVoiceInput.current = true
      setQuery(text)
      setTaQuery(text)

      // Auto-trigger voice search after user pauses speaking (1 second)
      if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
      voiceSearchTimeoutRef.current = setTimeout(() => {
        if (isVoiceInput.current && text.trim()) {
          runVoiceSearch(text.trim())
        }
      }, 1000)
    },
  })

  const { supported: ttsSupported, speakingId, speak, stop: stopSpeaking } = useTextToSpeech()

  const isSpeaking = speakingId === 'voice-search'

  const runVoiceSearch = async (searchQuery) => {
    stopListening()
    isVoiceInput.current = false

    const result = await searchVoiceAnswer(searchQuery)

    if (result?.answer) {
      speak(result.answer, 'voice-search')
    } else {
      speak("Sorry, I couldn't find an answer. Try asking something else.", 'voice-search')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setFocused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
    }
  }, [])

  const handleChange = (e) => {
    const value = e.target.value
    isVoiceInput.current = false
    if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
    stopSpeaking()

    setQuery(value)
    setTaQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch?.(value)
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
    stopListening()
    stopSpeaking()

    const trimmed = query.trim()
    if (!trimmed) return

    if (isVoiceInput.current) {
      runVoiceSearch(trimmed)
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const clearQuery = () => {
    isVoiceInput.current = false
    if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
    stopSpeaking()
    stopListening()

    setQuery('')
    setTaQuery('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  const toggleDictation = () => {
    if (!sttSupported) return

    if (isSpeaking) {
      stopSpeaking()
      return
    }

    if (listening) {
      stopListening()
      if (voiceSearchTimeoutRef.current) clearTimeout(voiceSearchTimeoutRef.current)
      return
    }

    stopSpeaking()
    isVoiceInput.current = true
    setQuery('')
    setTaQuery('')
    inputRef.current?.focus()
    startListening()
  }

  const isNavbar = variant === 'navbar'

  return (
    <form onSubmit={handleSubmit} className={isNavbar ? 'relative' : 'relative w-full max-w-2xl mx-auto'}>
      <motion.div
        animate={{
          width: isNavbar && focused ? '320px' : isNavbar ? '260px' : '100%',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative"
      >
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${isNavbar ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Keep delay so typeahead click can register
            setTimeout(() => setFocused(false), 180)
          }}
          placeholder={isNavbar ? 'Search...' : 'Search questions, topics, tags...'}
          className={`
            w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-white placeholder-slate-400
            focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800
            outline-none transition-all duration-300
            ${isNavbar
              ? 'pl-9 pr-20 py-2 text-sm rounded-full'
              : 'pl-12 pr-20 py-4 text-base rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50'
            }
          `}
        />
        
        {/* Status indicator popups */}
        {listening && (
          <div className="absolute -top-7 right-0 text-[10px] font-bold text-red-500 animate-pulse bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 whitespace-nowrap z-50">
            🎙 Listening...
          </div>
        )}
        {isSpeaking && (
          <div className="absolute -top-7 right-0 text-[10px] font-bold text-indigo-500 animate-pulse bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 whitespace-nowrap z-50">
            🔊 Speaking...
          </div>
        )}

        {/* Suggestions dropdown */}
        {focused && (results.length > 0 || loadingServer) && (
          <ul
            id="typeahead-list"
            role="listbox"
            className="absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-auto"
          >
            {results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => {
                  navigate(`/question/${r.id}`)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${i === activeIndex ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
              >
                <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{r.answer_count ? `${r.answer_count} answers` : ''}</div>
              </li>
            ))}
            {loadingServer && (
              <li className="px-4 py-3 text-sm text-slate-500">Searching online…</li>
            )}
          </ul>
        )}

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className={`text-slate-400 ${isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleDictation}
            disabled={!sttSupported}
            className={`p-0.5 rounded transition-colors ${
              sttSupported
                ? listening
                  ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                  : isSpeaking
                  ? 'bg-indigo-500/15 text-indigo-500 hover:bg-indigo-500/25 animate-pulse'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            aria-label={listening ? 'Stop voice typing' : 'Start voice typing'}
            title={sttSupported ? (listening ? 'Stop voice typing' : 'Start voice typing') : 'Voice typing not supported'}
          >
            {listening ? (
              <Square className={`${isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            ) : isSpeaking ? (
              <Square className={`${isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-indigo-600`} />
            ) : (
              <Mic className={`${isNavbar ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            )}
          </button>

          {isNavbar && !query && (
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] text-slate-400 font-mono">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </motion.div>
    </form>
  )
}
