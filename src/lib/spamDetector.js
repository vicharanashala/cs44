/**
 * Default configuration settings for the spam detector.
 * Admins can modify these settings via the database/UI.
 */
export const DEFAULT_SPAM_CONFIG = {
  thresholds: {
    review: 0.3,
    spam: 0.7,
  },
  weights: {
    repeated_chars: 0.25,
    urls: 0.35,
    keywords: 0.40,
    all_caps: 0.20,
    repeated_words: 0.25,
    special_chars: 0.25,
    suspicious_patterns: 0.45,
  },
  rules: {
    repeated_chars: { maxConsecutive: 4 },
    urls: { maxCount: 2 },
    all_caps: { minTextLength: 10, ratioThreshold: 0.3 },
    repeated_words: { minWordLength: 3, maxFrequency: 3 },
    special_chars: { ratioThreshold: 0.15 },
    suspicious_patterns: { detectPhone: true, detectCrypto: true, detectEmail: true },
  },
  keywords: [
    'buy now',
    'click here',
    'limited offer',
    'free money',
    'discount',
    'act now',
    'subscribe now',
    'guaranteed',
    'winner',
    'congratulations',
    'earn money',
    'work from home',
    'cash bonus',
    'click below',
    'exclusive deal',
    'special promotion',
    'best price',
    'get rich',
  ],
}
/**
 * Detect spam content in text using a weighted multi-signal scoring engine.
 *
 * @param {string} text - The text content to analyze.
 * @param {Object} [customConfig] - Optional custom configuration settings.
 * @returns {{ isSpam: boolean, score: number, status: 'Safe' | 'Needs Review' | 'Spam', reasons: string[], triggeredRules: Array<{ rule: string, score: number, weight: number, contribution: number }> }}
 */
export function detectSpam(text, customConfig = null) {
  if (!text || typeof text !== 'string') {
    return {
      isSpam: false,
      score: 0,
      status: 'Safe',
      reasons: [],
      triggeredRules: [],
    }
  }
  // Merge custom config with defaults
  const config = {
    thresholds: { ...DEFAULT_SPAM_CONFIG.thresholds, ...(customConfig?.thresholds || {}) },
    weights: { ...DEFAULT_SPAM_CONFIG.weights, ...(customConfig?.weights || {}) },
    rules: {
      repeated_chars: { ...DEFAULT_SPAM_CONFIG.rules.repeated_chars, ...(customConfig?.rules?.repeated_chars || {}) },
      urls: { ...DEFAULT_SPAM_CONFIG.rules.urls, ...(customConfig?.rules?.urls || {}) },
      all_caps: { ...DEFAULT_SPAM_CONFIG.rules.all_caps, ...(customConfig?.rules?.all_caps || {}) },
      repeated_words: { ...DEFAULT_SPAM_CONFIG.rules.repeated_words, ...(customConfig?.rules?.repeated_words || {}) },
      special_chars: { ...DEFAULT_SPAM_CONFIG.rules.special_chars, ...(customConfig?.rules?.special_chars || {}) },
      suspicious_patterns: { ...DEFAULT_SPAM_CONFIG.rules.suspicious_patterns, ...(customConfig?.rules?.suspicious_patterns || {}) },
    },
    keywords: customConfig?.keywords || DEFAULT_SPAM_CONFIG.keywords,
  }
  const triggeredRules = []
  const reasons = []
  let rawScore = 0
  // Helper to add signal details
  const addSignal = (ruleKey, subscore, description) => {
    if (subscore > 0) {
      const weight = config.weights[ruleKey] || 0
      const contribution = subscore * weight
      rawScore += contribution
      triggeredRules.push({
        rule: ruleKey,
        score: Math.round(subscore * 100) / 100,
        weight,
        contribution: Math.round(contribution * 100) / 100,
      })
      reasons.push(description)
    }
  }
  // Check 1: Repeated characters (e.g., "loooooool", "!!!!!")
  const maxConsecutive = config.rules.repeated_chars.maxConsecutive
  const repeatedPattern = new RegExp(`(.)\\1{${maxConsecutive},}`, 'g')
  const repeatedMatches = text.match(repeatedPattern) || []
  if (repeatedMatches.length > 0) {
    const maxLen = Math.max(...repeatedMatches.map((m) => m.length))
    const subscore = maxLen >= 10 ? 1.0 : 0.5 + (repeatedMatches.length - 1) * 0.1
    addSignal(
      'repeated_chars',
      Math.min(subscore, 1.0),
      `Excessive repeated characters detected (longest run: ${maxLen} chars)`
    )
  }
  // Check 2: Excessive URLs (e.g. 2+ links)
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi
  const urlMatches = text.match(urlPattern) || []
  const maxUrls = config.rules.urls.maxCount
  if (urlMatches.length >= maxUrls) {
    const subscore = Math.min(1.0, urlMatches.length / (maxUrls + 1))
    addSignal('urls', subscore, `Excessive URLs detected (${urlMatches.length} links found)`)
  }
  // Check 3: Promotional/spam keywords
  const lowerText = text.toLowerCase()
  const foundKeywords = config.keywords.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  )
  if (foundKeywords.length > 0) {
    const subscore = Math.min(1.0, foundKeywords.length * 0.25)
    addSignal(
      'keywords',
      subscore,
      `Promotional keywords detected: ${foundKeywords.slice(0, 5).join(', ')}${foundKeywords.length > 5 ? '...' : ''}`
    )
  }
  // Check 4: Excessive ALL CAPS
  const minAllCapsTextLen = config.rules.all_caps.minTextLength
  if (text.length >= minAllCapsTextLen) {
    const letters = text.replace(/[^a-zA-Z]/g, '')
    if (letters.length > 0) {
      const uppercaseLetters = letters.replace(/[^A-Z]/g, '')
      const uppercaseRatio = uppercaseLetters.length / letters.length
      const threshold = config.rules.all_caps.ratioThreshold
      if (uppercaseRatio > threshold) {
        const subscore = Math.min(1.0, (uppercaseRatio - threshold) / (1.0 - threshold))
        addSignal(
          'all_caps',
          subscore,
          `Excessive uppercase letters (${Math.round(uppercaseRatio * 100)}% caps)`
        )
      }
    }
  }
  // Check 5: Repeated words or phrases
  let repeatedWordsSubscore = 0
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= config.rules.repeated_words.minWordLength)
  
  if (words.length > 0) {
    const wordCounts = {}
    let maxWordFreq = 0
    let mostFreqWord = ''
    words.forEach((w) => {
      wordCounts[w] = (wordCounts[w] || 0) + 1
      if (wordCounts[w] > maxWordFreq) {
        maxWordFreq = wordCounts[w]
        mostFreqWord = w
      }
    })
    const maxAllowedFreq = config.rules.repeated_words.maxFrequency
    if (maxWordFreq > maxAllowedFreq) {
      repeatedWordsSubscore = Math.min(1.0, (maxWordFreq - maxAllowedFreq) / 5)
      addSignal(
        'repeated_words',
        repeatedWordsSubscore,
        `Repeated word detected: "${mostFreqWord}" (${maxWordFreq} occurrences)`
      )
    }
  }
  // Check for immediate word repetitions (e.g. "free free free")
  const adjacentRepeatPattern = /\b(\w{3,})\b\s+\1\b/gi
  const adjacentMatches = text.match(adjacentRepeatPattern) || []
  if (adjacentMatches.length > 0 && repeatedWordsSubscore === 0) {
    const subscore = Math.min(1.0, 0.5 + (adjacentMatches.length - 1) * 0.1)
    addSignal('repeated_words', subscore, `Consecutive duplicate words found (e.g., "${adjacentMatches[0]}")`)
  }
  // Check 6: Special characters and symbols concentration
  if (text.length > 0) {
    // Count symbols that are not letters, numbers, spaces, or standard punctuation
    const specialCount = (text.match(/[^a-zA-Z0-9\s.,?!:;'"()\-]/g) || []).length
    const ratio = specialCount / text.length
    const threshold = config.rules.special_chars.ratioThreshold
    if (ratio > threshold) {
      const subscore = Math.min(1.0, (ratio - threshold) / (0.4 - threshold))
      addSignal(
        'special_chars',
        subscore,
        `High density of special characters/symbols (${Math.round(ratio * 100)}%)`
      )
    }
  }
  // Check 7: Suspicious content patterns
  let suspiciousSubscore = 0
  const suspiciousReasons = []
  // Check for phone numbers
  if (config.rules.suspicious_patterns.detectPhone) {
    const phonePattern = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    if (phonePattern.test(text)) {
      suspiciousSubscore += 0.4
      suspiciousReasons.push('phone numbers')
    }
  }
  // Check for emails
  if (config.rules.suspicious_patterns.detectEmail) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
    if (emailPattern.test(text)) {
      suspiciousSubscore += 0.4
      suspiciousReasons.push('email addresses')
    }
  }
  // Check for crypto addresses
  if (config.rules.suspicious_patterns.detectCrypto) {
    const cryptoPattern = /\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40})\b/g
    if (cryptoPattern.test(text)) {
      suspiciousSubscore += 0.5
      suspiciousReasons.push('cryptocurrency addresses')
    }
  }
  // Check for suspicious short links or chat links (e.g. WhatsApp, Telegram, bit.ly)
  const chatLinkPattern = /\b(?:wa\.me|t\.me|bit\.ly|tinyurl\.com|shorturl\.at)\b/i
  if (chatLinkPattern.test(text)) {
    suspiciousSubscore += 0.5
    suspiciousReasons.push('suspicious redirect links')
  }
  if (suspiciousSubscore > 0) {
    suspiciousSubscore = Math.min(1.0, suspiciousSubscore)
    addSignal(
      'suspicious_patterns',
      suspiciousSubscore,
      `Suspicious patterns found: ${suspiciousReasons.join(', ')}`
    )
  }
  // Final score calculations
  const score = Math.round(Math.min(1.0, rawScore) * 100) / 100
  // Status classification
  let status = 'Safe'
  if (score >= config.thresholds.spam) {
    status = 'Spam'
  } else if (score >= config.thresholds.review) {
    status = 'Needs Review'
  }
  return {
    isSpam: status === 'Spam',
    score,
    status,
    reasons,
    triggeredRules,
  }
}
