import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './useAuth'
import { detectSpam } from '@/lib/spamDetector'
export function useQuestions() {
  const [questions, setQuestions] = useState([])
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()
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
      const filtered = (data || []).filter(q => {
        if (!q.verification_status || q.verification_status === 'verified') return true
        if (isAdmin) return true
        if (user && q.user_id === user.id) return true
        return false
      })
      const enriched = filtered.map(q => ({
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
      // Increment views
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
      // Run spam check
      let localConfig = null
      try {
        const saved = localStorage.getItem('spam_config')
        if (saved) localConfig = JSON.parse(saved)
      } catch (e) {}
      const spamResult = detectSpam(`${title} ${description}`.trim(), localConfig)
      const vStatus = spamResult.status === 'Spam' ? 'spam' : (spamResult.status === 'Needs Review' ? 'pending' : 'verified')
      const { data, error: insertError } = await supabase
        .from('questions')
        .insert({
          title,
          description,
          category,
          tags: tags || [],
          attachment_url,
          user_id: user.id,
          verification_status: vStatus,
        })
        .select()
        .single()
      if (insertError) throw insertError
      // Route to moderation if flagged
      if (vStatus === 'pending' || vStatus === 'spam') {
        try {
          const { error: modError } = await supabase
            .from('moderation_queue')
            .insert({
              content_type: 'question',
              question_id: data.id,
              title,
              content: description,
              spam_score: spamResult.score,
              triggered_rules: JSON.stringify(spamResult.triggeredRules),
              user_id: user.id,
              moderation_status: vStatus,
            })
          if (modError) throw modError
          await supabase
            .from('spam_audit_logs')
            .insert({
              action: 'flag',
              content_type: 'question',
              content_id: data.id,
              performed_by: user.id,
              details: JSON.stringify({ score: spamResult.score, status: vStatus, rules: spamResult.reasons }),
            })
        } catch (e) {
          console.warn('DB moderation write failed. Using localStorage fallback.', e)
          
          const fallbackModQueue = JSON.parse(localStorage.getItem('fallback_moderation_queue') || '[]')
          fallbackModQueue.push({
            id: Math.random().toString(36).substr(2, 9),
            content_type: 'question',
            question_id: data.id,
            title,
            content: description,
            spam_score: spamResult.score,
            triggered_rules: spamResult.triggeredRules,
            user_id: user.id,
            user_name: user.name || 'User',
            user_email: user.email,
            moderation_status: vStatus,
            created_at: new Date().toISOString(),
          })
          localStorage.setItem('fallback_moderation_queue', JSON.stringify(fallbackModQueue))
          const logs = JSON.parse(localStorage.getItem('fallback_spam_audit_logs') || '[]')
          logs.push({
            id: Math.random().toString(36).substr(2, 9),
            action: 'flag',
            content_type: 'question',
            content_id: data.id,
            performed_by: user.id,
            details: { score: spamResult.score, status: vStatus, rules: spamResult.reasons },
            created_at: new Date().toISOString(),
          })
          localStorage.setItem('fallback_spam_audit_logs', JSON.stringify(logs))
        }
      }
      return { data, isSpam: spamResult.status !== 'Safe', spamReasons: spamResult.reasons, status: vStatus }
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
