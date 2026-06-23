import { detectSpam, DEFAULT_SPAM_CONFIG } from './spamDetector.js'
function runTests() {
  console.log('🤖 Running Spam Detector heuristic tests...\n')
  let passCount = 0
  let failCount = 0
  const assertTest = (name, assertion) => {
    try {
      assertion()
      console.log(`  ✓ PASSED: ${name}`)
      passCount++
    } catch (e) {
      console.error(`  ✗ FAILED: ${name}`)
      console.error(`    Error: ${e.message}`)
      failCount++
    }
  }
  // 1. Safe Content Test
  assertTest('Safe Content Test', () => {
    const text = 'How do I resolve merge conflicts in Git using VS Code? I am encountering conflicts in package-lock.json.'
    const result = detectSpam(text)
    if (result.status !== 'Safe') throw new Error(`Expected 'Safe', got '${result.status}'`)
    if (result.score >= DEFAULT_SPAM_CONFIG.thresholds.review) throw new Error(`Score too high: ${result.score}`)
  })
  // 2. Repeated Characters Heuristic Test
  assertTest('Repeated Characters Heuristic Test', () => {
    const text = 'Wow, that is so cool looooooooool!!!!!!!!!!'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'repeated_chars')
    if (!hasRule) throw new Error(`Expected repeated_chars rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 3. Excessive Links Heuristic Test
  assertTest('Excessive Links Heuristic Test', () => {
    const text = 'Find resources here http://example.com/1 and more info at http://example.com/2 and also http://example.com/3'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'urls')
    if (!hasRule) throw new Error(`Expected urls rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 4. Promotional Keywords Test
  assertTest('Promotional Keywords Test', () => {
    const text = 'Earn free money by clicking here today! Best discount and click here buy now!'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'keywords')
    if (!hasRule) throw new Error(`Expected keywords rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 5. Excessive ALL CAPS Test
  assertTest('Excessive ALL CAPS Test', () => {
    const text = 'THIS IS AN URGENT ISSUE PLEASE HELP ME RIGHT NOW MY SERVER IS CRASHING'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'all_caps')
    if (!hasRule) throw new Error(`Expected all_caps rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 6. Repeated Words/Phrases Test
  assertTest('Repeated Words & Phrases Test', () => {
    const text = 'free free free free free money get rich now'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'repeated_words')
    if (!hasRule) throw new Error(`Expected repeated_words rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 7. Symbol Density Test
  assertTest('Symbol Density Test', () => {
    const text = 'Get your answers $$$$$ @@@@@ ##### %%%%%'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'special_chars')
    if (!hasRule) throw new Error(`Expected special_chars rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 8. Suspicious Phone/Crypto/Link Patterns Test
  assertTest('Suspicious Phone/Crypto/Link Patterns Test', () => {
    const text = 'Join our chat on wa.me/12345678 or donate to bitcoin 13y7h3Yh8shsDns8sDnsnssHsd7shf'
    const result = detectSpam(text)
    const hasRule = result.triggeredRules.some(r => r.rule === 'suspicious_patterns')
    if (!hasRule) throw new Error(`Expected suspicious_patterns rule to trigger. Triggered: ${JSON.stringify(result.triggeredRules)}`)
  })
  // 9. Classification Thresholds Test
  assertTest('Classification Thresholds Test', () => {
    // Custom config with lower thresholds to test state routing
    const customConfig = {
      thresholds: {
        review: 0.20,
        spam: 0.50
      },
      weights: {
        all_caps: 0.30,
        keywords: 0.60
      }
    }
    // Text that only triggers all_caps (score contribution: 0.30)
    const reviewText = 'THIS TEXT IS ENTIRELY UPPERCASE AND OF SIGNIFICANT LENGTH'
    const reviewResult = detectSpam(reviewText, customConfig)
    if (reviewResult.status !== 'Needs Review') {
      throw new Error(`Expected 'Needs Review' status for score ${reviewResult.score}, got '${reviewResult.status}'`)
    }
    // Text that triggers all_caps and keywords (score contribution: 0.30 + 0.60 = 0.90)
    const spamText = 'THIS IS AN URGENT MSG TO BUY NOW AND CLICK HERE'
    const spamResult = detectSpam(spamText, customConfig)
    if (spamResult.status !== 'Spam') {
      throw new Error(`Expected 'Spam' status for score ${spamResult.score}, got '${spamResult.status}'`)
    }
  })
  console.log(`\n🏁 Test Run Summary:`)
  console.log(`  Passed: ${passCount}`)
  console.log(`  Failed: ${failCount}`)
  if (failCount > 0) {
    process.exit(1)
  } else {
    console.log('\n🌟 All spam detector heuristic checks pass successfully!')
  }
}
runTests()
