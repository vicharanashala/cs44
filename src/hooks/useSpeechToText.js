import { useEffect, useRef, useState } from 'react'

export function useSpeechToText({ onResult, lang = 'en-US' } = {}) {
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      
      console.log('useSpeechToText transcript:', transcript)
      if (transcript) {
        onResultRef.current?.(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError(event.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [lang])

  const start = () => {
    if (!recognitionRef.current || listening) return
    setError(null)
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setError(err?.message || 'start-failed')
      setListening(false)
    }
  }

  const stop = () => {
    if (!recognitionRef.current || !listening) return
    recognitionRef.current.stop()
    setListening(false)
  }

  return {
    supported,
    listening,
    error,
    start,
    stop,
  }
}
