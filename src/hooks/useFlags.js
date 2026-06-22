import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './useAuth'

export function useFlags() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()

  // 1. Flag a Question
  const flagQuestion = useCallback(async (questionId, reason, description) => {
    if (!user) throw new Error('Must be logged in to report content')
    setLoading(true)
    setError(null)
    try {
      // Check duplicate report
      const { data: existing, error: checkError } = await supabase
        .from('flags')
        .select('id')
        .eq('reported_by', user.id)
        .eq('question_id', questionId)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing) {
        throw new Error('You have already reported this content')
      }

      const { data, error: insertError } = await supabase
        .from('flags')
        .insert({
          content_type: 'question',
          question_id: questionId,
          reported_by: user.id,
          reason,
          description,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // 2. Flag an Answer
  const flagAnswer = useCallback(async (answerId, reason, description) => {
    if (!user) throw new Error('Must be logged in to report content')
    setLoading(true)
    setError(null)
    try {
      // Check duplicate report
      const { data: existing, error: checkError } = await supabase
        .from('flags')
        .select('id')
        .eq('reported_by', user.id)
        .eq('answer_id', answerId)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing) {
        throw new Error('You have already reported this content')
      }

      // Fetch the answer to get its question_id (for relationship if needed)
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .select('question_id')
        .eq('id', answerId)
        .single()

      if (answerError) throw answerError

      const { data, error: insertError } = await supabase
        .from('flags')
        .insert({
          content_type: 'answer',
          question_id: answerData.question_id,
          answer_id: answerId,
          reported_by: user.id,
          reason,
          description,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // 3. Check if user has already flagged a content
  const hasUserFlagged = useCallback(async (contentType, contentId) => {
    if (!user) return false
    try {
      let query = supabase.from('flags').select('id').eq('reported_by', user.id)
      
      if (contentType === 'question') {
        query = query.eq('question_id', contentId).is('answer_id', null)
      } else {
        query = query.eq('answer_id', contentId)
      }

      const { data, error: checkError } = await query.maybeSingle()
      if (checkError) throw checkError
      return !!data
    } catch (err) {
      console.error('Error checking flag status:', err)
      return false
    }
  }, [user])

  // 4. Admin: Fetch all flags with filters and pagination
  const fetchFlags = useCallback(async ({ status, reason, page = 1, limit = 20 } = {}) => {
    if (!isAdmin) return []
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('flags')
        .select(`
          *,
          reporter:reported_by (id, name, email),
          reviewer:reviewed_by (id, name),
          question:question_id (id, title, description),
          answer:answer_id (id, content)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (reason && reason !== 'all') {
        query = query.eq('reason', reason)
      }

      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)

      const { data, error: fetchError, count } = await query
      if (fetchError) throw fetchError

      return { data: data || [], total: count || 0 }
    } catch (err) {
      setError(err.message)
      return { data: [], total: 0 }
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // 5. Admin: Resolve a flag
  const resolveFlag = useCallback(async (flagId, adminNotes) => {
    if (!isAdmin) throw new Error('Admin only')
    setLoading(true)
    try {
      const { data, error: updateError } = await supabase
        .from('flags')
        .update({
          status: 'resolved',
          admin_notes: adminNotes,
          reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', flagId)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user])

  // 6. Admin: Dismiss a flag
  const dismissFlag = useCallback(async (flagId, adminNotes) => {
    if (!isAdmin) throw new Error('Admin only')
    setLoading(true)
    try {
      const { data, error: updateError } = await supabase
        .from('flags')
        .update({
          status: 'dismissed',
          admin_notes: adminNotes,
          reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', flagId)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user])

  // 7. Admin: Delete reported content
  const deleteContent = useCallback(async (contentType, contentId) => {
    if (!isAdmin) throw new Error('Admin only')
    setLoading(true)
    try {
      let deleteError
      if (contentType === 'question') {
        const { error: err } = await supabase
          .from('questions')
          .delete()
          .eq('id', contentId)
        deleteError = err
      } else {
        const { error: err } = await supabase
          .from('answers')
          .delete()
          .eq('id', contentId)
        deleteError = err
      }

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  return {
    loading,
    error,
    flagQuestion,
    flagAnswer,
    hasUserFlagged,
    fetchFlags,
    resolveFlag,
    dismissFlag,
    deleteContent
  }
}
