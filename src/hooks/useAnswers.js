import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './useAuth'
import { spamApi } from '@/lib/spamApi'
export function useAnswers() {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()
  const fetchAnswers = useCallback(async (questionId) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('answers')
        .select(`
          *,
          users:user_id (id, name, email, avatar)
        `)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true })
      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      // Filter based on user role
      const filtered = (data || []).filter(answer => {
        if (answer.verification_status === 'verified') return true
        if (isAdmin) return true
        if (user && answer.user_id === user.id) return true
        return false
      })
      setAnswers(filtered)
      return filtered
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin])
  const submitAnswer = useCallback(async (questionId, content, attachmentUrl) => {
    if (!user) throw new Error('Must be logged in')
    setLoading(true)
    try {
      // Run spam detection
      const scanResult = await spamApi.analyzeContent(content, 'answer', user.id)
      if (scanResult.classification === 'CRITICAL SPAM') {
        throw new Error('SUBMISSION_BLOCKED_CRITICAL_SPAM')
      }
      const isSpam = scanResult.classification === 'SPAM'
      const status = isSpam ? 'spam' : 'pending'
      const { data, error: insertError } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content,
          attachment_url: attachmentUrl || null,
          verification_status: status,
        })
        .select(`
          *,
          users:user_id (id, name, email, avatar)
        `)
        .single()
      if (insertError) throw insertError
      // Update spam scan record content_id to link it
      if (scanResult && scanResult.scanId) {
        try {
          await supabase.from('spam_scans').update({ content_id: data.id }).eq('id', scanResult.scanId)
          // also update localStorage copy if fallback
          const scans = JSON.parse(localStorage.getItem('spam_sys_scans') || '[]')
          const scanIdx = scans.findIndex(s => s.id === scanResult.scanId)
          if (scanIdx !== -1) {
            scans[scanIdx].content_id = data.id
            localStorage.setItem('spam_sys_scans', JSON.stringify(scans))
          }
        } catch (e) {
          // ignore
        }
      }
      // Notify question author (only if not spam)
      if (!isSpam) {
        const { data: questionData } = await supabase
          .from('questions')
          .select('user_id, title')
          .eq('id', questionId)
          .single()
        if (questionData && questionData.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: questionData.user_id,
            message: `New answer on your question: "${questionData.title}"`,
          })
        }
      }
      setAnswers(prev => [...prev, data])
      return { data, isSpam, spamReasons: scanResult.triggers }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])
  const verifyAnswer = useCallback(async (answerId, adminNote = '') => {
    if (!isAdmin) throw new Error('Admin only')
    try {
      const { data, error: updateError } = await supabase
        .from('answers')
        .update({ verification_status: 'verified', admin_note: adminNote })
        .eq('id', answerId)
        .select(`*, users:user_id (id, name, email, avatar)`)
        .single()
      if (updateError) throw updateError
      // Notify answer author
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        message: `Your answer has been verified! ${adminNote ? `Note: ${adminNote}` : ''}`,
      })
      setAnswers(prev => prev.map(a => a.id === answerId ? data : a))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [isAdmin])
  const rejectAnswer = useCallback(async (answerId, adminNote = '') => {
    if (!isAdmin) throw new Error('Admin only')
    try {
      const { data, error: updateError } = await supabase
        .from('answers')
        .update({ verification_status: 'rejected', admin_note: adminNote })
        .eq('id', answerId)
        .select(`*, users:user_id (id, name, email, avatar)`)
        .single()
      if (updateError) throw updateError
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        message: `Your answer was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`,
      })
      setAnswers(prev => prev.map(a => a.id === answerId ? data : a))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [isAdmin])
  const markSpam = useCallback(async (answerId) => {
    if (!isAdmin) throw new Error('Admin only')
    try {
      const { data, error: updateError } = await supabase
        .from('answers')
        .update({ verification_status: 'spam' })
        .eq('id', answerId)
        .select(`*, users:user_id (id, name, email, avatar)`)
        .single()
      if (updateError) throw updateError
      setAnswers(prev => prev.map(a => a.id === answerId ? data : a))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [isAdmin])
  const deleteAnswer = useCallback(async (answerId) => {
    try {
      const { error: deleteError } = await supabase
        .from('answers')
        .delete()
        .eq('id', answerId)
      if (deleteError) throw deleteError
      setAnswers(prev => prev.filter(a => a.id !== answerId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])
  const fetchUserAnswers = useCallback(async (userId) => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('answers')
        .select(`
          *,
          users:user_id (id, name, email, avatar),
          questions:question_id (id, title, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])
  return {
    answers,
    loading,
    error,
    fetchAnswers,
    submitAnswer,
    verifyAnswer,
    rejectAnswer,
    markSpam,
    deleteAnswer,
    fetchUserAnswers,
  }
}
