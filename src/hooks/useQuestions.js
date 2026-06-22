import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './useAuth'
import { spamApi } from '@/lib/spamApi'

export function useQuestions() {
  const [questions, setQuestions] = useState([])
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchQuestions = useCallback(async ({ category, sort = 'newest', page = 1, limit = 20 } = {}) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (id, name, email, avatar),
          answers:answers (id, verification_status)
        `)
        .eq('status', 'active')

      if (category && category !== 'All') {
        query = query.eq('category', category)
      }

      switch (sort) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'upvoted':
          query = query.order('upvotes', { ascending: false })
          break
        case 'viewed':
          query = query.order('views', { ascending: false })
          break
        case 'trending':
          query = query.order('views', { ascending: false }).order('upvotes', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      const enriched = (data || []).map(q => ({
        ...q,
        verified_answer_count: (q.answers || []).filter(a => a.verification_status === 'verified').length,
        answer_count: (q.answers || []).length,
      }))

      setQuestions(enriched)
      return enriched
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchQuestionById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await supabase.rpc('increment_question_views', { q_id: id })

      const { data, error: fetchError } = await supabase
        .from('questions')
        .select(`
          *,
          users:user_id (id, name, email, avatar)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setQuestion(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createQuestion = useCallback(async ({ title, description, category, tags, attachment_url }) => {
    if (!user) throw new Error('Must be logged in')
    setLoading(true)
    try {
      // Analyze content for spam
      const combinedText = `${title}\n\n${description}`
      const scanResult = await spamApi.analyzeContent(combinedText, 'question', user.id, {
        title,
        description,
        category,
        tags,
        attachmentUrl: attachment_url
      })
      console.log('SPAM SCAN RESULT FOR QUESTION:', scanResult)

      if (scanResult.classification === 'CRITICAL SPAM') {
        throw new Error('SUBMISSION_BLOCKED_CRITICAL_SPAM')
      }

      if (scanResult.classification === 'SPAM' || scanResult.classification === 'SUSPICIOUS') {
        return { isHeldForModeration: true, scanResult }
      }

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert({
          title,
          description,
          category,
          tags: tags || [],
          attachment_url,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return { ...data, isHeldForModeration: false, scanResult }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateQuestion = useCallback(async (id, updates) => {
    setLoading(true)
    try {
      const { data, error: updateError } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
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
  }, [])

  const deleteQuestion = useCallback(async (id) => {
    setLoading(true)
    try {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setQuestions(prev => prev.filter(q => q.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserQuestions = useCallback(async (userId) => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select(`
          *,
          users:user_id (id, name, email, avatar),
          answers:answers (id, verification_status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return (data || []).map(q => ({
        ...q,
        verified_answer_count: (q.answers || []).filter(a => a.verification_status === 'verified').length,
        answer_count: (q.answers || []).length,
      }))
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    questions,
    question,
    loading,
    error,
    fetchQuestions,
    fetchQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchUserQuestions,
  }
}
