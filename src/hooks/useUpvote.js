import { useState, useCallback } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from './useAuth'

export function useUpvote() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const toggleQuestionVote = useCallback(async (questionId, isUpvote) => {
    if (!user) throw new Error('Must be logged in')
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('toggle_question_vote', {
        q_id: questionId,
        is_upvote: isUpvote,
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('Voting error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  const toggleAnswerVote = useCallback(async (answerId, isUpvote) => {
    if (!user) throw new Error('Must be logged in')
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('toggle_answer_vote', {
        a_id: answerId,
        is_upvote: isUpvote,
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('Voting error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  const toggleQuestionUpvote = useCallback(async (questionId) => {
    return toggleQuestionVote(questionId, true)
  }, [toggleQuestionVote])

  const toggleAnswerUpvote = useCallback(async (answerId) => {
    return toggleAnswerVote(answerId, true)
  }, [toggleAnswerVote])

  const hasUpvotedQuestion = useCallback(async (questionId) => {
    if (!user) return false
    try {
      const { data, error } = await supabase
        .from('question_upvotes')
        .select('question_id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch {
      return false
    }
  }, [user])

  const hasDownvotedQuestion = useCallback(async (questionId) => {
    if (!user) return false
    try {
      const { data, error } = await supabase
        .from('question_downvotes')
        .select('question_id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch {
      return false
    }
  }, [user])

  const hasUpvotedAnswer = useCallback(async (answerId) => {
    if (!user) return false
    try {
      const { data, error } = await supabase
        .from('answer_upvotes')
        .select('answer_id')
        .eq('answer_id', answerId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch {
      return false
    }
  }, [user])

  const hasDownvotedAnswer = useCallback(async (answerId) => {
    if (!user) return false
    try {
      const { data, error } = await supabase
        .from('answer_downvotes')
        .select('answer_id')
        .eq('answer_id', answerId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch {
      return false
    }
  }, [user])

  return {
    loading,
    toggleQuestionVote,
    toggleAnswerVote,
    toggleQuestionUpvote,
    toggleAnswerUpvote,
    hasUpvotedQuestion,
    hasDownvotedQuestion,
    hasUpvotedAnswer,
    hasDownvotedAnswer,
  }
}
