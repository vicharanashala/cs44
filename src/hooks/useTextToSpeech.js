import { useEffect, useRef, useState } from 'react'

export function useTextToSpeech() {
  const [supported, setSupported] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [error, setError] = useState(null)
  const utteranceRef = useRef(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true)
    } else {
      setSupported(false)
    }

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stop = () => {
    window.speechSynthesis?.cancel()
    setSpeakingId(null)
    setError(null)
  }

  const speak = (text, id = 'default', lang = 'en-US') => {
    if (!('speechSynthesis' in window) || !text) return

    stop()
    setError(null)

    // Clean up basic HTML tags or markdown if needed
    const cleanedText = text.replace(/<[^>]*>/g, '').trim()

    const utterance = new SpeechSynthesisUtterance(cleanedText)
    utterance.lang = lang
    
    utteranceRef.current = utterance
    
    utterance.onend = () => {
      setSpeakingId(null)
      utteranceRef.current = null
    }
    
    utterance.onerror = (e) => {
      // Ignore interrupted errors since they are triggered intentionally by stop()
      if (e.error !== 'interrupted') {
        console.error('Speech synthesis error:', e)
        setError('synthesis-failed')
      }
      setSpeakingId(null)
      utteranceRef.current = null
    }

    setSpeakingId(id)
    window.speechSynthesis?.speak(utterance)
  }

  return {
    supported,
    speakingId,
    error,
    speak,
    stop,
  }
}
