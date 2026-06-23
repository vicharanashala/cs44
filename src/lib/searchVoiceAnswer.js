import { supabase } from '../config/supabase'
import { searchQuestions as fuzzySearch } from './fuzzySearch'

/**
 * Searches for a question using fuzzy match (Fuse.js) and returns the top answer.
 * @param {string} query - The search query spoken by the user.
 * @returns {Promise<{ question: string, answer: string | null } | null>} Matched question title and answer.
 */
export const searchVoiceAnswer = async (query) => {
  if (!query || !query.trim()) return null

  const cleanedQuery = query.toLowerCase().trim()

  // Fetch active questions for fuzzy search
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, title, status')
    .eq('status', 'active')

  if (error || !questions || questions.length === 0) {
    console.error('Voice search error fetching questions:', error)
    return null
  }

  // Run fuzzy search using Fuse.js
  const results = fuzzySearch(questions, cleanedQuery)
  
  // Results are sorted by score ascending (lower score means closer match)
  // Let's filter out poor matches (Fuse threshold is 0.4 by default, let's enforce <= 0.6 here)
  const bestResult = results.find(r => r.score <= 0.6)

  if (!bestResult) {
    console.log('No close match found for query:', query)
    return null
  }

  const match = bestResult.item

  // Fetch the answers for the matched question
  const { data: answers, error: ansError } = await supabase
    .from('answers')
    .select('content, verification_status, is_accepted')
    .eq('question_id', match.id)

  if (ansError) {
    console.error('Voice search error fetching answers:', ansError)
    return null
  }

  if (!answers || answers.length === 0) {
    return {
      question: match.title,
      answer: null,
    }
  }

  // Prioritize accepted answer, then verified, then first available
  const acceptedAnswer = answers.find(a => a.is_accepted)
  const verifiedAnswer = answers.find(a => a.verification_status === 'verified')
  const bestAnswer = acceptedAnswer || verifiedAnswer || answers[0]

  return {
    question: match.title,
    answer: bestAnswer.content,
  }
}
