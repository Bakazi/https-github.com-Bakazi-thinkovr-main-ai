import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Resend } from 'resend'
import { getDb } from '@/lib/mongodb'
import { hashPassword, verifyPassword, signToken, getUserFromRequest, isAdminEmail } from '@/lib/auth'
import { systemPromptFor, tierDisplayName } from '@/lib/groqPrompts'
import { generateBlueprintPDF } from '@/lib/pdfGenerator'
import { generateWithFallback, generateWithReasoning } from '@/lib/llmChain'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const groq = { apiKey: process.env.GROQ_API_KEY } // kept for backward compat, unused
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

async function getSetting(db, key, defaultValue = null) {
  const doc = await db.collection('settings').findOne({ key })
  return doc?.value ?? defaultValue
}

async function setSetting(db, key, value) {
  await db.collection('settings').updateOne({ key }, { $set: { key, value } }, { upsert: true })
}

function corsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }))
}

function json(data, status = 200) {
  return corsHeaders(NextResponse.json(data, { status }))
}

const PRODUCTS = [
  { id: 'spark', name: 'Spark', tier: 'spark', price: 47, per: 'per directive', features: [
    'One-page Dictatum PDF (2 pages)',
    'The Move + logical derivation',
    '7-Day execution sheet',
    'One KPI + autopsy trigger',
    '48hr turnaround',
    'Entry-tier collectible design',
  ], cta: 'Get The Move \u2014 $47' },
  { id: 'ignite', name: 'Ignite', tier: 'ignite', price: 197, per: 'per sprint', featured: true, features: [
    'Sprint Blueprint PDF (4 pages, copper edition)',
    '30-day expanded plan',
    'Risk register (top 3)',
    'Resource allocation breakdown',
    'Pivot triggers',
    'Priority 24hr turnaround',
    'One revision cycle',
  ], cta: 'Begin Ignite \u2014 $197' },
  { id: 'blaze', name: 'Blaze', tier: 'blaze', price: 497, per: '4-week sprint', features: [
    'Blaze Dossier PDF (6 pages, burgundy edition)',
    '4-week sprint breakdown',
    'Metrics dashboard spec',
    'Full risk register (5)',
    'Weekly review protocol',
    'Psychological protocol',
    'Go/no-go decision framework',
  ], cta: 'Enter Blaze \u2014 $497' },
  { id: 'blueprint_only', name: 'Blueprint', tier: 'blueprint_only', price: 750, per: 'single delivery', features: [
    'Thinkovr Blueprint PDF (10 pages, signature edition)',
    '90-day execution plan',
    'Market + competitive analysis',
    '6-month financial projections',
    'Full risk register (7\u201310)',
    'Legal / regulatory notes',
    'Scale path + escape plan',
  ], cta: 'Commission Blueprint \u2014 $750' },
]

const tierRank = { free: 0, spark: 1, ignite: 2, blaze: 3, blueprint_only: 4 }
function canSubmit(user) {
  return (tierRank[user.tier] || 0) >= 1
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = '/' + path.join('/')
  const method = request.method

  try {
    const db = await getDb()

    // ───────────── HEALTH ─────────────
    if (route === '/' && method === 'GET') return json({ message: 'Thinkovr API online', ts: new Date() })

    // ───────────── AUTH ─────────────
    if (route === '/auth/signup' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body || {}
      if (!email || !password) return json({ error: 'email and password required' }, 400)
      if (password.length < 6) return json({ error: 'password min 6 chars' }, 400)
      const existing = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existing) return json({ error: 'email already registered' }, 400)
      const user = { id: uuidv4(), email: email.toLowerCase(), password_hash: hashPassword(password), tier: 'free', created_at: new Date() }
      await db.collection('users').insertOne(user)
      const admin = isAdminEmail(user.email)
      const token = signToken({ id: user.id, email: user.email, tier: user.tier, admin })
      return json({ token, user: { id: user.id, email: user.email, tier: user.tier, admin } })
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body || {}
      if (!email || !password) return json({ error: 'email and password required' }, 400)
      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (!user || !verifyPassword(password, user.password_hash)) return json({ error: 'invalid credentials' }, 401)
      const admin = isAdminEmail(user.email)
      const token = signToken({ id: user.id, email: user.email, tier: user.tier, admin })
      return json({ token, user: { id: user.id, email: user.email, tier: user.tier, admin } })
    }

    if (route === '/auth/me' && method === 'GET') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const user = await db.collection('users').findOne({ id: u.id })
      if (!user) return json({ error: 'user not found' }, 404)
      return json({ user: { id: user.id, email: user.email, tier: user.tier, admin: isAdminEmail(user.email) } })
    }

    // ───────────── PUBLIC SETTINGS (free mode flag) ─────────────
    if (route === '/settings/public' && method === 'GET') {
      const freeMode = await getSetting(db, 'free_mode', false)
      return json({ free_mode: !!freeMode })
    }

    // ───────────── PRODUCTS ─────────────
    if (route === '/products' && method === 'GET') return json({ products: PRODUCTS })

    // ───────────── PUBLIC BANKING (for users to pay via EFT) ─────────────
    if (route === '/banking' && method === 'GET') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const doc = await db.collection('settings').findOne({ key: 'banking' }, { projection: { _id: 0 } })
      return json({ banking: doc?.value || null })
    }

    // ───────────── ORDER REQUEST (user commits to paying for a tier) ─────────────
    if (route === '/orders' && method === 'POST') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const body = await request.json()
      const product = PRODUCTS.find(p => p.id === body?.product_id)
      if (!product) return json({ error: 'invalid product' }, 400)
      const order = {
        id: uuidv4(),
        user_id: u.id,
        user_email: u.email,
        product_id: product.id,
        tier: product.tier,
        amount: product.price,
        currency: 'USD',
        status: 'awaiting_payment',
        reference: `THK-${Date.now().toString(36).toUpperCase()}`,
        created_at: new Date(),
      }
      await db.collection('orders').insertOne(order)
      return json({ order: { ...order, _id: undefined } })
    }

    if (route === '/orders' && method === 'GET') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const rows = await db.collection('orders').find({ user_id: u.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray()
      return json({ orders: rows })
    }

    // ───────────── WISH SUBMIT (tier-aware LLM chain) ─────────────
    if (route === '/wish' && method === 'POST') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const dbUser = await db.collection('users').findOne({ id: u.id })
      if (!dbUser) return json({ error: 'user not found' }, 404)

      const freeMode = await getSetting(db, 'free_mode', false)

      // Free mode lets any user access any tier without paying
      // Normal mode: free users get 1 sample Spark wish, paid users get their tier
      const body = await request.json()
      const prompt = (body?.prompt || '').trim()
      const context = body?.context || {}
      const requestedTier = (body?.tier || '').toLowerCase()
      if (!prompt) return json({ error: 'prompt required' }, 400)

      let tier
      if (freeMode) {
        // Admin has enabled free mode — everyone picks any tier
        tier = ['spark', 'ignite', 'blaze', 'blueprint_only'].includes(requestedTier) ? requestedTier : (dbUser.tier === 'free' ? 'spark' : dbUser.tier)
      } else {
        if (dbUser.tier === 'free') {
          const count = await db.collection('wishes').countDocuments({ user_id: dbUser.id })
          if (count >= 1) return json({ error: 'Free preview exhausted. Upgrade your tier to submit more.' }, 403)
          tier = 'spark'
        } else {
          tier = dbUser.tier
        }
      }

      const contextLines = []
      if (context.capital) contextLines.push(`LIQUID CAPITAL: ${context.capital}`)
      if (context.hours) contextLines.push(`WEEKLY DEFENDABLE HOURS: ${context.hours}`)
      if (context.skill) contextLines.push(`STRONGEST SKILL: ${context.skill}`)
      if (context.location) contextLines.push(`LOCATION / MARKET: ${context.location}`)
      if (context.fear) contextLines.push(`DEEPEST FEAR: ${context.fear}`)
      if (context.runway_days) contextLines.push(`EXACT RUNWAY (DAYS): ${context.runway_days}`)

      const userMessage = `USER PARAMETERS:\n${contextLines.join('\n') || '(none provided)'}\n\nTHE USER'S WISH / OBJECTIVE:\n${prompt}\n\nProduce the tier-appropriate blueprint now. Start with the mandatory preamble (Assumptions / Why Wrong / Least Viable Attempt), then the tier sections.`

      const sys = systemPromptFor(tier)
      const maxTokens = tier === 'blueprint_only' ? 8000 : (tier === 'blaze' ? 5000 : (tier === 'ignite' ? 3500 : 2500))

      // Blueprint tier uses reasoning agent when enabled
      const useReasoning = (tier === 'blueprint_only') && process.env.ENABLE_REASONING_AGENT === 'true'

      // Load admin-managed keys from settings (override env if set)
      const adminKeys = await getSetting(db, 'api_keys', {})

      let llmResult
      try {
        llmResult = useReasoning
          ? await generateWithReasoning({ system: sys, user: userMessage, maxTokens, temperature: 0.55, keys: adminKeys })
          : await generateWithFallback({ system: sys, user: userMessage, maxTokens, temperature: 0.55, keys: adminKeys })
      } catch (e) {
        console.error('LLM chain error:', e, e.attempts)
        return json({ error: 'Engine processing failed (all providers exhausted). Try again.' }, 500)
      }

      const wish = {
        id: uuidv4(),
        user_id: dbUser.id,
        user_email: dbUser.email,
        user_prompt: prompt,
        context,
        tier,
        groq_output: llmResult.content,
        groq_model: llmResult.model,
        llm_provider: llmResult.provider,
        llm_provider_chain: llmResult.provider_chain,
        reasoning_trace: llmResult.reasoning_trace,
        free_mode: !!freeMode,
        status: 'pending',
        created_at: new Date(),
      }
      await db.collection('wishes').insertOne(wish)

      return json({ success: true, message: 'Your request is in the forge. The Thinkovr Engine will deliver your blueprint shortly.' })
    }

    if (route === '/wish' && method === 'GET') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const rows = await db.collection('wishes').find({ user_id: u.id }, { projection: { _id: 0, groq_output: 0 } }).sort({ created_at: -1 }).toArray()
      return json({ wishes: rows })
    }

    // ───────────── USER PDF DOWNLOAD (only if delivered) ─────────────
    if (route.match(/^\/wish\/[^/]+\/pdf$/) && method === 'GET') {
      const u = getUserFromRequest(request)
      if (!u) return json({ error: 'unauthorized' }, 401)
      const wishId = route.split('/')[2]
      const wish = await db.collection('wishes').findOne({ id: wishId, user_id: u.id })
      if (!wish) return json({ error: 'not found' }, 404)
      if (wish.status !== 'delivered') return json({ error: 'blueprint not yet delivered' }, 403)
      const user = await db.collection('users').findOne({ id: wish.user_id })
      const buf = await generateBlueprintPDF({ wish, user, tier: wish.tier })
      const res = new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="thinkovr-${wish.tier}-${wishId.slice(0, 8)}.pdf"` } })
      return corsHeaders(res)
    }

    // ───────────── ADMIN ROUTES ─────────────
    if (route.startsWith('/admin')) {
      const u = getUserFromRequest(request)
      if (!u || !u.admin) return json({ error: 'forbidden' }, 403)

      if (route === '/admin/wishes' && method === 'GET') {
        const status = new URL(request.url).searchParams.get('status')
        const q = status ? { status } : {}
        const rows = await db.collection('wishes').find(q, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(500).toArray()
        return json({ wishes: rows })
      }

      if (route.startsWith('/admin/wishes/') && method === 'PUT') {
        const wishId = route.replace('/admin/wishes/', '').split('/')[0]
        const body = await request.json()
        const update = { updated_at: new Date() }
        if (typeof body.groq_output === 'string') update.groq_output = body.groq_output
        if (typeof body.admin_notes === 'string') update.admin_notes = body.admin_notes
        if (typeof body.status === 'string') update.status = body.status
        await db.collection('wishes').updateOne({ id: wishId }, { $set: update })
        return json({ success: true })
      }

      if (route.match(/^\/admin\/wishes\/[^/]+\/pdf$/) && method === 'GET') {
        const wishId = route.split('/')[3]
        const wish = await db.collection('wishes').findOne({ id: wishId })
        if (!wish) return json({ error: 'not found' }, 404)
        const user = await db.collection('users').findOne({ id: wish.user_id })
        const buf = await generateBlueprintPDF({ wish, user, tier: wish.tier })
        const res = new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="thinkovr-${wish.tier}-${wishId.slice(0, 8)}.pdf"` } })
        return corsHeaders(res)
      }

      if (route.match(/^\/admin\/wishes\/[^/]+\/dispatch$/) && method === 'POST') {
        const wishId = route.split('/')[3]
        const wish = await db.collection('wishes').findOne({ id: wishId })
        if (!wish) return json({ error: 'not found' }, 404)
        const user = await db.collection('users').findOne({ id: wish.user_id })
        if (!user) return json({ error: 'user not found' }, 404)

        const pdfBuf = await generateBlueprintPDF({ wish, user, tier: wish.tier })
        const tierName = tierDisplayName(wish.tier)
        const subject = `Thinkovr \u2014 Your ${tierName} Blueprint Has Been Issued`
        const html = `<div style="font-family:Georgia,serif;background:#0a0a0b;color:#e8e0d0;padding:40px;max-width:680px;margin:0 auto;border:1px solid #c9a84c">
          <div style="font-family:Cinzel,serif;letter-spacing:0.3em;color:#c9a84c;font-size:12px;text-transform:uppercase">\u2B21 Thinkovr \u2014 The Thinkovr Engine</div>
          <h1 style="font-family:Cinzel,serif;color:#e8e0d0;border-bottom:1px solid #c9a84c;padding-bottom:16px">Your ${tierName} Blueprint</h1>
          <p style="line-height:1.7;color:#e8e0d0">Your blueprint has been processed, reviewed, and issued. The full document is attached as a PDF.</p>
          <p style="line-height:1.7;color:#e8e0d0">A short excerpt:</p>
          <div style="white-space:pre-wrap;line-height:1.7;font-size:14px;color:#e8e0d0;background:rgba(201,168,76,0.05);padding:16px;border-left:2px solid #c9a84c">${(wish.groq_output || '').slice(0, 900).replace(/</g, '&lt;')}\u2026</div>
          <hr style="border:none;border-top:1px solid #c9a84c;margin:32px 0" />
          <p style="font-family:monospace;font-size:11px;letter-spacing:0.15em;color:#8a7535;text-transform:uppercase">This directive is yours alone. Execute or abandon \u2014 on the date specified.</p>
        </div>`

        let emailResult = { mocked: true }
        const adminKeysForEmail = await getSetting(db, 'api_keys', {})
        const resendKey = adminKeysForEmail.resend_api_key || process.env.RESEND_API_KEY
        const emailFrom = adminKeysForEmail.email_from || process.env.EMAIL_FROM || 'Thinkovr <onboarding@resend.dev>'
        if (resendKey) {
          try {
            const resend = new Resend(resendKey)
            const r = await resend.emails.send({
              from: emailFrom,
              to: user.email,
              subject,
              html,
              attachments: [{ filename: `thinkovr-${wish.tier}-blueprint.pdf`, content: pdfBuf.toString('base64') }],
            })
            emailResult = r
          } catch (e) { console.error('Resend error:', e); emailResult = { error: String(e.message || e) } }
        } else {
          console.log('[MOCK EMAIL]', user.email, subject, `PDF size: ${pdfBuf.length} bytes`)
        }

        await db.collection('wishes').updateOne({ id: wishId }, { $set: { status: 'delivered', dispatched_at: new Date(), email_result: emailResult } })
        return json({ success: true, mocked: !resendKey, emailResult })
      }

      // ───────────── ADMIN: API KEYS ─────────────
      if (route === '/admin/keys' && method === 'GET') {
        const stored = await getSetting(db, 'api_keys', {})
        // Return masked values + whether each is set (db override OR env)
        const fields = ['groq_api_key', 'gemini_api_key', 'gemini_api_key_2', 'gemini_api_key_3', 'openrouter_api_key', 'resend_api_key', 'email_from']
        const envMap = {
          groq_api_key: 'GROQ_API_KEY', gemini_api_key: 'GEMINI_API_KEY', gemini_api_key_2: 'GEMINI_API_KEY_2',
          gemini_api_key_3: 'GEMINI_API_KEY_3', openrouter_api_key: 'OPENROUTER_API_KEY',
          resend_api_key: 'RESEND_API_KEY', email_from: 'EMAIL_FROM',
        }
        const keys = {}
        for (const f of fields) {
          const dbVal = stored[f] || ''
          const envVal = process.env[envMap[f]] || ''
          const active = dbVal || envVal
          keys[f] = {
            value: dbVal, // raw stored value (may be empty)
            env_set: !!envVal,
            db_set: !!dbVal,
            masked: active ? (active.length > 12 ? active.slice(0, 6) + '•••' + active.slice(-4) : '•••') : '',
            source: dbVal ? 'database' : (envVal ? 'env' : 'none'),
          }
        }
        return json({ keys })
      }
      if (route === '/admin/keys' && method === 'PUT') {
        const body = await request.json()
        const allowed = ['groq_api_key', 'gemini_api_key', 'gemini_api_key_2', 'gemini_api_key_3', 'openrouter_api_key', 'resend_api_key', 'email_from']
        const stored = await getSetting(db, 'api_keys', {})
        for (const f of allowed) {
          if (typeof body[f] === 'string') {
            stored[f] = body[f].trim()
          }
        }
        await setSetting(db, 'api_keys', stored)
        return json({ success: true })
      }

      if (route === '/admin/stats' && method === 'GET') {
        const [users, wishes, pending, delivered, orders] = await Promise.all([
          db.collection('users').countDocuments({}),
          db.collection('wishes').countDocuments({}),
          db.collection('wishes').countDocuments({ status: 'pending' }),
          db.collection('wishes').countDocuments({ status: 'delivered' }),
          db.collection('orders').countDocuments({}),
        ])
        return json({ users, wishes, pending, delivered, orders })
      }

      // ───────────── ADMIN: SETTINGS ─────────────
      if (route === '/admin/settings' && method === 'GET') {
        const freeMode = await getSetting(db, 'free_mode', false)
        return json({ free_mode: !!freeMode, reasoning_agent_env: process.env.ENABLE_REASONING_AGENT === 'true', resend_configured: !!process.env.RESEND_API_KEY, email_from: process.env.EMAIL_FROM, admin_emails: (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean) })
      }
      if (route === '/admin/settings' && method === 'PUT') {
        const body = await request.json()
        if (typeof body.free_mode === 'boolean') await setSetting(db, 'free_mode', body.free_mode)
        const freeMode = await getSetting(db, 'free_mode', false)
        return json({ success: true, free_mode: !!freeMode })
      }

      if (route === '/admin/banking' && method === 'GET') {
        const doc = await db.collection('settings').findOne({ key: 'banking' }, { projection: { _id: 0 } })
        return json({ banking: doc?.value || null })
      }
      if (route === '/admin/banking' && method === 'PUT') {
        const body = await request.json()
        const value = {
          bank: body.bank || 'Capitec',
          account_name: body.account_name || '',
          account_number: body.account_number || '',
          branch_code: body.branch_code || '',
          swift: body.swift || '',
          reference_note: body.reference_note || 'Include your order reference',
          updated_at: new Date(),
        }
        await db.collection('settings').updateOne({ key: 'banking' }, { $set: { key: 'banking', value } }, { upsert: true })
        return json({ success: true, banking: value })
      }

      if (route === '/admin/orders' && method === 'GET') {
        const rows = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(500).toArray()
        return json({ orders: rows })
      }
      if (route.match(/^\/admin\/orders\/[^/]+\/confirm$/) && method === 'POST') {
        const oid = route.split('/')[3]
        const order = await db.collection('orders').findOne({ id: oid })
        if (!order) return json({ error: 'not found' }, 404)
        await db.collection('orders').updateOne({ id: oid }, { $set: { status: 'paid', paid_at: new Date() } })
        await db.collection('users').updateOne({ id: order.user_id }, { $set: { tier: order.tier } })
        return json({ success: true })
      }
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (e) {
    console.error('API error:', e)
    return json({ error: 'internal_error', detail: String(e.message || e) }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
