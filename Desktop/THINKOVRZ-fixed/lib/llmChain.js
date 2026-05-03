// LLM Fallback Chain: Groq (primary) -> Gemini (fallback) -> OpenRouter (last resort)
// Each provider has its own free tier. Failing over maximizes uptime on free plans.

const Groq = require('groq-sdk')
const { GoogleGenerativeAI } = require('@google/generative-ai')

function pickGeminiKey() {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  if (!keys.length) return null
  // round-robin via time bucket to spread load across keys
  const idx = Math.floor(Date.now() / 60000) % keys.length
  return keys[idx]
}

async function callGroq({ system, user, maxTokens, temperature = 0.55, keys = {} }) {
  const key = keys.groq_api_key || process.env.GROQ_API_KEY
  if (!key) throw new Error('no_groq_key')
  const groq = new Groq({ apiKey: key })
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature,
    max_tokens: maxTokens || 3000,
  })
  const content = completion.choices[0]?.message?.content || ''
  if (!content) throw new Error('groq_empty_response')
  return { provider: 'groq', model, content }
}

async function callGemini({ system, user, maxTokens, temperature = 0.55, keys = {} }) {
  const candidates = [keys.gemini_api_key, keys.gemini_api_key_2, keys.gemini_api_key_3, process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  if (!candidates.length) throw new Error('no_gemini_key')
  const key = candidates[Math.floor(Date.now() / 60000) % candidates.length]
  const genai = new GoogleGenerativeAI(key)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  const model = genai.getGenerativeModel({ model: modelName, systemInstruction: system, generationConfig: { maxOutputTokens: maxTokens || 3000, temperature } })
  const result = await model.generateContent(user)
  const content = result.response?.text?.() || ''
  if (!content) throw new Error('gemini_empty_response')
  return { provider: 'gemini', model: modelName, content }
}

async function callOpenRouter({ system, user, maxTokens, temperature = 0.55, keys = {} }) {
  const key = keys.openrouter_api_key || process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('no_openrouter_key')
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://thinkovr.app', 'X-Title': 'Thinkovr' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature, max_tokens: maxTokens || 3000 }),
  })
  if (!res.ok) throw new Error(`openrouter_http_${res.status}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('openrouter_empty_response')
  return { provider: 'openrouter', model, content }
}

// Main entry: try Groq, then Gemini, then OpenRouter
async function generateWithFallback({ system, user, maxTokens, temperature, keys = {} }) {
  const attempts = []
  const providers = [
    ['groq', callGroq],
    ['gemini', callGemini],
    ['openrouter', callOpenRouter],
  ]
  for (const [name, fn] of providers) {
    try {
      const result = await fn({ system, user, maxTokens, temperature, keys })
      result.attempts = attempts
      return result
    } catch (e) {
      const msg = String(e.message || e)
      attempts.push({ provider: name, error: msg })
      console.warn(`[LLMChain] ${name} failed:`, msg)
      continue
    }
  }
  const err = new Error('all_providers_failed')
  err.attempts = attempts
  throw err
}

// Reasoning agent (Tree of Thoughts + ReAct lite) — for premium Blueprint tier only
// Expands blueprint generation into: 1) explore branches, 2) critique, 3) synthesize final output.
async function generateWithReasoning({ system, user, maxTokens, temperature, keys = {} }) {
  // Step 1: Explore — ask for 3 candidate moves with tradeoffs
  const explorePrompt = `Before producing the final blueprint, list 3 distinct candidate moves for this user. For each, note the single biggest risk and the single biggest upside. Be blunt. 120 words max per candidate. Output ONLY the 3 candidates, numbered.`
  const exploreResult = await generateWithFallback({
    system: 'You are a strategic advisor generating decision branches. Be concise, concrete, grounded in the user\u2019s real parameters.',
    user: user + '\n\n' + explorePrompt,
    maxTokens: 1200,
    temperature: 0.75,
    keys,
  })

  // Step 2: Synthesize — pass exploration back into main prompt
  const synthUser = `${user}\n\n[EXPLORATION PHASE \u2014 candidates considered by the reasoning agent]\n${exploreResult.content}\n\n[SYNTHESIS PHASE]\nNow, using the exploration above and selecting the strongest candidate (or a synthesis of them), produce the final blueprint in the required tier-specific format.`
  const finalResult = await generateWithFallback({ system, user: synthUser, maxTokens, temperature, keys })
  finalResult.reasoning_trace = exploreResult.content
  finalResult.provider_chain = `${exploreResult.provider}\u2192${finalResult.provider}`
  return finalResult
}

module.exports = { generateWithFallback, generateWithReasoning }
