/**
 * Default promotional/spam keywords.
 */
export const DEFAULT_SPAM_KEYWORDS = [
  'buy now',
  'limited offer',
  'act now',
  'free gift',
  'earn money',
  'guaranteed profit',
  'investment opportunity',
  'click here',
  'special deal',
  'instant income',
  'work from home',
  '100% profit',
  'crypto signal',
  'join telegram',
  'exclusive offer',
  'make money fast',
  'double your investment',
]

/**
 * Default blacklisted domains.
 */
export const DEFAULT_DOMAIN_BLACKLIST = [
  'spam.site',
  'free-coins.net',
  'disposable-email.com',
  'get-rich-quick.biz',
  'earn-cash.online',
  '100percent-free.com',
]

/**
 * Default rules and their weights.
 */
export const DEFAULT_RULES = {
  repeated_chars: { name: 'Repeated Characters', weight: 15, isEnabled: true },
  excessive_urls: { name: 'Excessive URLs', weight: 25, isEnabled: true },
  promo_keywords: { name: 'Promotional Keywords', weight: 20, isEnabled: true },
  all_caps: { name: 'ALL CAPS', weight: 15, isEnabled: true },
  duplicate_content: { name: 'Duplicate Content', weight: 25, isEnabled: true },
  emoji_abuse: { name: 'Emoji Abuse', weight: 10, isEnabled: true },
  phone_numbers: { name: 'Phone Numbers', weight: 15, isEnabled: true },
  telegram_links: { name: 'Telegram Links', weight: 15, isEnabled: true },
  crypto_patterns: { name: 'Crypto Scam Patterns', weight: 25, isEnabled: true },
  referral_links: { name: 'Referral Links', weight: 15, isEnabled: true },
  low_quality: { name: 'Low Quality Content', weight: 10, isEnabled: true },
  gibberish: { name: 'Gibberish / Keyboard Spam', weight: 20, isEnabled: true },
  repeated_words: { name: 'Repeated Words', weight: 15, isEnabled: true },
  suspicious_domains: { name: 'Suspicious Domains', weight: 25, isEnabled: true },
  mass_mentions: { name: 'Mass Mentions', weight: 10, isEnabled: true },
  special_chars: { name: 'Special Characters Concentration', weight: 15, isEnabled: true },
}

/**
 * Calculate Jaccard Similarity between two texts based on word-level bigrams.
 */
function getSimilarity(text1, text2) {
  const getBigrams = (str) => {
    const s = str.toLowerCase().replace(/[^\w\s]/g, '')
    const words = s.split(/\s+/).filter(Boolean)
    const bigrams = new Set()
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]}_${words[i + 1]}`)
    }
    // Fallback to single words if text is too short for bigrams
    if (bigrams.size === 0) {
      words.forEach(w => bigrams.add(w))
    }
    return bigrams
  }

  const set1 = getBigrams(text1)
  const set2 = getBigrams(text2)
  if (set1.size === 0 && set2.size === 0) return 1.0
  if (set1.size === 0 || set2.size === 0) return 0.0

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size
}

/**
 * Calculate Shannon entropy of a string.
 */
function calculateEntropy(str) {
  if (!str) return 0
  const frequencies = {}
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    frequencies[char] = (frequencies[char] || 0) + 1
  }
  let entropy = 0
  const len = str.length
  for (const char in frequencies) {
    const p = frequencies[char] / len
    entropy -= p * Math.log2(p)
  }
  return entropy
}

/**
 * Heuristic Spam Analyzer Engine.
 */
export function analyzeContentSpam(text, options = {}) {
  const content = text || ''
  const rules = { ...DEFAULT_RULES, ...options.rules }
  const keywords = options.keywords || DEFAULT_SPAM_KEYWORDS
  const blacklist = options.blacklist || DEFAULT_DOMAIN_BLACKLIST
  const whitelist = options.whitelist || []
  const recentContent = options.recentContent || []

  const reports = []
  let totalScore = 0

  const addDetectorReport = (id, result) => {
    const rule = rules[id]
    if (!rule || !rule.isEnabled) return

    if (result.triggered) {
      const weight = rule.weight
      const score = Math.round(result.factor * weight)
      if (score > 0) {
        totalScore += score
        reports.push({
          id,
          name: rule.name,
          score,
          weight,
          severity: result.severity,
          trigger: result.triggerText,
          explanation: result.explanation,
        })
      }
    }
  }

  // --- DETECTOR 1: Repeated Character Analysis ---
  (() => {
    let maxConsecutive = 0
    let currentConsecutive = 1
    for (let i = 1; i < content.length; i++) {
      if (content[i] === content[i - 1]) {
        currentConsecutive++
      } else {
        if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive
        currentConsecutive = 1
      }
    }
    if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive

    const matches = content.match(/(.)\1{4,}/gi) || []
    const isTriggered = maxConsecutive >= 5 || matches.length > 0
    if (isTriggered) {
      const factor = Math.min((maxConsecutive - 4) / 5, 1.0)
      const severity = maxConsecutive > 8 ? 'high' : maxConsecutive > 5 ? 'medium' : 'low'
      addDetectorReport('repeated_chars', {
        triggered: true,
        factor,
        severity,
        triggerText: matches.join(', ') || `${maxConsecutive} repeating characters`,
        explanation: `Content contains stretched characters or excessive character repetitions (up to ${maxConsecutive} consecutively).`,
      })
    }
  })();

  // --- DETECTOR 2: Excessive URL Detection ---
  (() => {
    const urlRegex = /https?:\/\/[^\s]+/gi
    const urls = content.match(urlRegex) || []
    if (urls.length > 0) {
      const urlLength = urls.reduce((acc, u) => acc + u.length, 0)
      const density = urlLength / Math.max(content.length, 1)

      const isTriggered = urls.length >= 3 || density > 0.4
      if (isTriggered) {
        const factor = Math.min(urls.length / 5, 1.0)
        const severity = urls.length >= 5 ? 'high' : 'medium'
        addDetectorReport('excessive_urls', {
          triggered: true,
          factor,
          severity,
          triggerText: `${urls.length} URLs found`,
          explanation: `Excessive linking behavior detected. Found ${urls.length} links which occupy ${Math.round(density * 100)}% of content.`,
        })
      }
    }
  })();

  // --- DETECTOR 3: Promotional Keyword Detection ---
  (() => {
    const lowerContent = content.toLowerCase()
    const found = []
    keywords.forEach(keyword => {
      const kw = keyword.toLowerCase()
      const count = (lowerContent.match(new RegExp(kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi')) || []).length
      if (count > 0) {
        found.push({ keyword, count })
      }
    })

    if (found.length > 0) {
      const totalCount = found.reduce((acc, f) => acc + f.count, 0)
      const factor = Math.min(totalCount / 3, 1.0)
      const severity = totalCount >= 4 ? 'high' : totalCount >= 2 ? 'medium' : 'low'
      addDetectorReport('promo_keywords', {
        triggered: true,
        factor,
        severity,
        triggerText: found.map(f => `"${f.keyword}" (x${f.count})`).join(', '),
        explanation: `Content matches promotional/marketing keywords: ${found.map(f => f.keyword).join(', ')}.`,
      })
    }
  })();

  // --- DETECTOR 4: ALL CAPS Detection ---
  (() => {
    if (content.length >= 15) {
      const letters = content.replace(/[^a-zA-Z]/g, '')
      if (letters.length >= 10) {
        const uppercase = letters.replace(/[^A-Z]/g, '').length
        const ratio = uppercase / letters.length
        
        const words = content.split(/\s+/)
        let maxCapsWords = 0
        let currentCapsWords = 0
        words.forEach(w => {
          if (w.length >= 3 && /^[A-Z!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]+$/.test(w)) {
            currentCapsWords++
          } else {
            if (currentCapsWords > maxCapsWords) maxCapsWords = currentCapsWords
            currentCapsWords = 0
          }
        })
        if (currentCapsWords > maxCapsWords) maxCapsWords = currentCapsWords

        const isTriggered = ratio > 0.6 || maxCapsWords >= 3
        if (isTriggered) {
          const factor = Math.min((ratio - 0.5) * 2, 1.0)
          const severity = ratio > 0.85 ? 'high' : 'medium'
          addDetectorReport('all_caps', {
            triggered: true,
            factor,
            severity,
            triggerText: `${Math.round(ratio * 100)}% Caps`,
            explanation: `Excessive use of uppercase letters (${Math.round(ratio * 100)}% caps) or consecutive capitalized shouting words.`,
          })
        }
      }
    }
  })();

  // --- DETECTOR 5: Duplicate Content Detection ---
  (() => {
    if (recentContent.length > 0) {
      let maxSim = 0
      let duplicateText = ''
      for (const oldText of recentContent) {
        const sim = getSimilarity(content, oldText)
        if (sim > maxSim) {
          maxSim = sim
          duplicateText = oldText
        }
      }

      if (maxSim >= 0.75) {
        const factor = maxSim >= 0.95 ? 1.0 : (maxSim - 0.7) / 0.25
        const severity = maxSim >= 0.95 ? 'high' : 'medium'
        addDetectorReport('duplicate_content', {
          triggered: true,
          factor,
          severity,
          triggerText: `Similarity: ${Math.round(maxSim * 100)}%`,
          explanation: `Near-duplicate or copy-pasted submission matches previous content closely.`,
        })
      }
    }
  })();

  // --- DETECTOR 6: Emoji Abuse Detection ---
  (() => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu
    const emojis = content.match(emojiRegex) || []
    if (emojis.length > 0) {
      const density = emojis.length / content.length
      const consecutivePattern = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]){3,}/gu
      const consecutiveMatches = content.match(consecutivePattern) || []

      const isTriggered = emojis.length >= 6 || density > 0.1 || consecutiveMatches.length > 0
      if (isTriggered) {
        const factor = Math.min(emojis.length / 10, 1.0)
        const severity = emojis.length >= 10 ? 'high' : 'medium'
        addDetectorReport('emoji_abuse', {
          triggered: true,
          factor,
          severity,
          triggerText: `${emojis.length} emojis`,
          explanation: `Content contains excessive emojis (${emojis.length} found) or spammy consecutive emoji bursts.`,
        })
      }
    }
  })();

  // --- DETECTOR 7: Phone Number Detection ---
  (() => {
    const phoneRegex = /(\+?91|0)?[6-9]\d{9}|\+?1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{2,3}[-.\s]\d{3}[-.\s]\d{3}[-.\s]\d{4}/g
    const phoneMatches = content.match(phoneRegex) || []
    if (phoneMatches.length > 0) {
      addDetectorReport('phone_numbers', {
        triggered: true,
        factor: 1.0,
        severity: 'medium',
        triggerText: phoneMatches.join(', '),
        explanation: `Suspicious contact information (phone/WhatsApp number) shared inside the content: ${phoneMatches.join(', ')}.`,
      })
    }
  })();

  // --- DETECTOR 8: Telegram Links & Channels ---
  (() => {
    const telegramRegex = /t\.me\/[a-zA-Z0-9_]{5,}|telegram\.me\/[a-zA-Z0-9_]{5,}|@\b[a-zA-Z0-9_]{5,}\b.*(?:telegram|join|channel)/gi
    const matches = content.match(telegramRegex) || []
    if (matches.length > 0 || (content.toLowerCase().includes('telegram') && content.includes('@'))) {
      addDetectorReport('telegram_links', {
        triggered: true,
        factor: 1.0,
        severity: 'high',
        triggerText: matches.length > 0 ? matches.join(', ') : 'Telegram handle promotion',
        explanation: `Telegram group, channel, or username link promotion detected.`,
      })
    }
  })();

  // --- DETECTOR 9: Crypto Scam Pattern Detection ---
  (() => {
    const cryptoRegex = /\b(bitcoin|eth|btc|solana|wallet|crypto|giveaway|airdrop|doubler|guaranteed returns)\b/gi
    const walletAddressRegex = /0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z0-9]{39,59}/g
    const matches = content.match(cryptoRegex) || []
    const wallets = content.match(walletAddressRegex) || []

    const triggers = []
    let scoreFactor = 0
    if (wallets.length > 0) {
      triggers.push(`wallet address: ${wallets.join(', ')}`)
      scoreFactor += 0.8
    }
    
    const textLower = content.toLowerCase()
    if (textLower.includes('giveaway') || textLower.includes('send') && textLower.includes('receive') && textLower.includes('double')) {
      triggers.push('double crypto reward claim')
      scoreFactor += 0.7
    }

    if (scoreFactor > 0 || (matches.length >= 2 && textLower.includes('profit'))) {
      const factor = Math.min(scoreFactor || (matches.length / 4), 1.0)
      addDetectorReport('crypto_patterns', {
        triggered: true,
        factor,
        severity: factor > 0.7 ? 'high' : 'medium',
        triggerText: triggers.join(', ') || `Crypto keywords: ${matches.join(', ')}`,
        explanation: `Suspicious cryptocurrency patterns, wallet addresses, or fake giveaway scripts detected.`,
      })
    }
  })();

  // --- DETECTOR 10: Referral Link Detection ---
  (() => {
    const referralRegex = /[\?&](ref|invite|referral|partner|affiliate|utm_source)=\w+/gi
    const referralMatches = content.match(referralRegex) || []
    if (referralMatches.length > 0) {
      addDetectorReport('referral_links', {
        triggered: true,
        factor: 1.0,
        severity: 'medium',
        triggerText: referralMatches.join(', '),
        explanation: `Links containing referral, affiliate, or invite parameters found.`,
      })
    }
  })();

  // --- DETECTOR 11: Low Quality Content ---
  (() => {
    const words = content.toLowerCase().split(/\s+/).filter(Boolean)
    const alphabeticWords = words.filter(w => /[a-z]/i.test(w))
    const isNoLetters = words.length > 0 && alphabeticWords.length === 0

    const lowQualityWords = ['first', 'nice', 'ok', 'good', 'great', 'thanks', 'thank you', 'cool', 'wow']
    const matched = words.filter(w => lowQualityWords.includes(w))
    const ratio = matched.length / Math.max(words.length, 1)

    const uniqueWords = new Set(words)
    const diversity = uniqueWords.size / Math.max(words.length, 1)

    const isTriggered = isNoLetters || (content.length < 50 && (ratio > 0.5 || (words.length >= 5 && diversity < 0.4)))
    if (isTriggered) {
      addDetectorReport('low_quality', {
        triggered: true,
        factor: isNoLetters ? 1.0 : (ratio > 0.5 ? ratio : 0.8),
        severity: isNoLetters ? 'high' : 'low',
        triggerText: isNoLetters ? 'No valid letters' : `Low-quality ratio: ${Math.round(ratio * 100)}%`,
        explanation: isNoLetters 
          ? 'Content does not contain any valid alphabetic characters or words.'
          : 'Short, generic response containing repetitive boilerplate words with low vocabulary diversity.',
      })
    }
  })();

  // --- DETECTOR 12: Gibberish / Keyboard Spam ---
  (() => {
    if (content.length >= 10) {
      const entropy = calculateEntropy(content)
      const seqPattern = /asdf|asda|qwer|zxcv|qweq|zxcz|sdfg/gi
      const seqMatches = content.match(seqPattern) || []
      
      const words = content.split(/\s+/)
      const longWordWithoutVowels = words.some(w => w.length >= 8 && !/[aeiouyAEIOUY]/g.test(w))

      const isTriggered = seqMatches.length > 0 || longWordWithoutVowels || (content.length > 15 && (entropy < 2.0 || entropy > 5.5))
      if (isTriggered) {
        const factor = (seqMatches.length > 0 || entropy < 1.0) ? 1.0 : 0.7
        addDetectorReport('gibberish', {
          triggered: true,
          factor,
          severity: 'high',
          triggerText: seqMatches.length > 0 ? seqMatches.join(', ') : `Entropy: ${entropy.toFixed(2)}`,
          explanation: `Keyboard-spam sequences (e.g. asdasd) or unnatural character distribution (entropy: ${entropy.toFixed(2)}).`,
        })
      }
    }
  })();

  // --- DETECTOR 13: Repeated Word Detection ---
  (() => {
    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    if (words.length >= 3) {
      const counts = {}
      words.forEach(w => counts[w] = (counts[w] || 0) + 1)
      
      let maxCount = 0
      let repeatedWord = ''
      for (const w in counts) {
        if (counts[w] > maxCount) {
          maxCount = counts[w]
          repeatedWord = w
        }
      }

      const ratio = maxCount / words.length
      const consecutivePattern = /\b(\w+)\b(?:\s+\1\b){2,}/gi
      const consecutiveMatches = content.match(consecutivePattern) || []

      const isTriggered = ratio > 0.4 || consecutiveMatches.length > 0
      if (isTriggered) {
        const factor = Math.min(ratio * 1.5, 1.0)
        addDetectorReport('repeated_words', {
          triggered: true,
          factor,
          severity: ratio > 0.6 ? 'high' : 'medium',
          triggerText: `"${repeatedWord}" (x${maxCount})`,
          explanation: `Excessive repetition of the word "${repeatedWord}". Word comprises ${Math.round(ratio * 100)}% of content.`,
        })
      }
    }
  })();

  // --- DETECTOR 14: Suspicious Domain Detection ---
  (() => {
    const urlRegex = /https?:\/\/([^\/\s]+)/gi
    let match
    const domains = []
    while ((match = urlRegex.exec(content)) !== null) {
      domains.push(match[1].toLowerCase())
    }

    if (domains.length > 0) {
      const badDomains = domains.filter(d => {
        if (whitelist.some(wl => d === wl || d.endsWith('.' + wl))) return false
        return blacklist.some(bl => d === bl || d.endsWith('.' + bl))
      })

      if (badDomains.length > 0) {
        addDetectorReport('suspicious_domains', {
          triggered: true,
          factor: 1.0,
          severity: 'high',
          triggerText: badDomains.join(', '),
          explanation: `URL connects to a known blacklisted spam or malicious domain: ${badDomains.join(', ')}.`,
        })
      }
    }
  })();

  // --- DETECTOR 15: Mass Mention Detection ---
  (() => {
    const mentionRegex = /@\b[a-zA-Z0-9_]+\b/g
    const mentions = content.match(mentionRegex) || []
    if (mentions.length >= 4) {
      const factor = Math.min(mentions.length / 8, 1.0)
      addDetectorReport('mass_mentions', {
        triggered: true,
        factor,
        severity: mentions.length >= 6 ? 'high' : 'medium',
        triggerText: `${mentions.length} mentions`,
        explanation: `Mass user mention tag spam detected. Tagged ${mentions.length} users.`,
      })
    }
  })();

  // --- DETECTOR 16: Special Characters Concentration ---
  (() => {
    if (content.length >= 10) {
      const specialChars = content.replace(/[a-zA-Z0-9\s]/g, '')
      const ratio = specialChars.length / content.length
      
      const consecutiveSymbolBursts = content.match(/[^a-zA-Z0-9\s]{4,}/g) || []

      const isTriggered = ratio > 0.15 || consecutiveSymbolBursts.length > 0
      if (isTriggered) {
        const factor = Math.min(ratio * 3 || 1.0, 1.0)
        const severity = ratio > 0.3 ? 'high' : 'medium'
        addDetectorReport('special_chars', {
          triggered: true,
          factor,
          severity,
          triggerText: consecutiveSymbolBursts.length > 0 
            ? `Bursts: ${consecutiveSymbolBursts.join(', ')}` 
            : `${Math.round(ratio * 100)}% Special characters`,
          explanation: `High concentration of special characters/symbols (${Math.round(ratio * 100)}%) or consecutive symbol bursts.`,
        })
      }
    }
  })();

  // Determine Classification and Risk Levels
  const thresholds = options.thresholds || { needsReview: 30, spam: 60, critical: 100 }
  let classification = 'SAFE'
  let riskLevel = 'NONE'
  const recommendations = []

  if (totalScore >= thresholds.critical) {
    classification = 'CRITICAL SPAM'
    riskLevel = 'CRITICAL'
    recommendations.push('Block immediately', 'Escalate to administrator', 'Place temporary account restriction')
  } else if (totalScore >= thresholds.spam) {
    classification = 'SPAM'
    riskLevel = 'HIGH'
    recommendations.push('Hold publication', 'Route to moderation queue for review')
  } else if (totalScore >= thresholds.needsReview) {
    classification = 'SUSPICIOUS'
    riskLevel = 'MEDIUM'
    recommendations.push('Publish with warning banner', 'Alert moderators of potential spam')
  } else {
    classification = 'SAFE'
    riskLevel = 'LOW'
    recommendations.push('Publish immediately')
  }

  return {
    spamScore: totalScore,
    classification,
    riskLevel,
    triggers: reports.map(r => r.name),
    detectors: reports,
    recommendations,
  }
}
