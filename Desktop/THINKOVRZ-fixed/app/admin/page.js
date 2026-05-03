'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, LogOut, Send, RefreshCw, X, Edit3, Download, Check, Building2, Save, Zap, AlertTriangle, Key, ExternalLink, Eye, EyeOff } from 'lucide-react'

const AdminPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, wishes: 0, pending: 0, delivered: 0, orders: 0 })
  const [wishes, setWishes] = useState([])
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [editedOutput, setEditedOutput] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('wishes')

  const [banking, setBanking] = useState({ bank: 'Capitec', account_name: '', account_number: '', branch_code: '470010', swift: '', reference_note: 'Include your order reference' })
  const [savingBanking, setSavingBanking] = useState(false)
  const [settings, setSettings] = useState({ free_mode: false, reasoning_agent_env: false, resend_configured: false, email_from: '', admin_emails: [] })
  const [apiKeys, setApiKeys] = useState({ groq_api_key: '', gemini_api_key: '', gemini_api_key_2: '', gemini_api_key_3: '', openrouter_api_key: '', resend_api_key: '', email_from: '' })
  const [apiKeysMeta, setApiKeysMeta] = useState({})
  const [savingKeys, setSavingKeys] = useState(false)
  const [showKey, setShowKey] = useState({})

  const authHeaders = () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('thinkovr_token') : null
    return { 'Content-Type': 'application/json', Authorization: t ? `Bearer ${t}` : '' }
  }

  const loadAll = async () => {
    try {
      const me = await fetch('/api/auth/me', { headers: authHeaders() })
      if (!me.ok) throw new Error('unauth')
      const mData = await me.json()
      if (!mData.user.admin) { router.push('/dashboard'); return }
      setUser(mData.user)
      const [s, w, o, b, st, k] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/admin/wishes${filter ? `?status=${filter}` : ''}`, { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin/orders', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin/banking', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin/settings', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin/keys', { headers: authHeaders() }).then(r => r.json()),
      ])
      setStats(s)
      setWishes(w.wishes || [])
      setOrders(o.orders || [])
      if (b.banking) setBanking(b.banking)
      setSettings(st)
      if (k.keys) {
        setApiKeysMeta(k.keys)
        const flat = {}
        Object.entries(k.keys).forEach(([key, info]) => { flat[key] = info.value || '' })
        setApiKeys(flat)
      }
    } catch { localStorage.clear(); router.push('/auth') } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [filter])

  const openWish = (w) => { setSelected(w); setEditedOutput(w.groq_output || '') }

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/admin/wishes/${selected.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ groq_output: editedOutput }) })
    setSaving(false)
    if (res.ok) { toast.success('Blueprint updated.'); loadAll() } else { toast.error('Update failed') }
  }

  const dispatch = async () => {
    if (!selected) return
    setDispatching(true)
    await fetch(`/api/admin/wishes/${selected.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ groq_output: editedOutput }) })
    const res = await fetch(`/api/admin/wishes/${selected.id}/dispatch`, { method: 'POST', headers: authHeaders() })
    const data = await res.json()
    setDispatching(false)
    if (res.ok) { toast.success(data.mocked ? 'Dispatched (email MOCKED — add RESEND_API_KEY)' : 'Dispatched with PDF.'); setSelected(null); loadAll() }
    else { toast.error('Dispatch failed') }
  }

  const downloadAdminPdf = async (wishId) => {
    const res = await fetch(`/api/admin/wishes/${wishId}/pdf`, { headers: authHeaders() })
    if (!res.ok) { toast.error('PDF generation failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `thinkovr-${wishId.slice(0,8)}.pdf`
    a.click(); URL.revokeObjectURL(url)
  }

  const confirmOrder = async (oid) => {
    const res = await fetch(`/api/admin/orders/${oid}/confirm`, { method: 'POST', headers: authHeaders() })
    if (res.ok) { toast.success('Payment confirmed. User tier unlocked.'); loadAll() }
    else toast.error('Failed')
  }

  const saveBanking = async () => {
    setSavingBanking(true)
    const res = await fetch('/api/admin/banking', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(banking) })
    setSavingBanking(false)
    if (res.ok) toast.success('Banking details saved — visible to users during payment.')
    else toast.error('Save failed')
  }

  const toggleFreeMode = async () => {
    const next = !settings.free_mode
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ free_mode: next }) })
    if (res.ok) {
      setSettings({ ...settings, free_mode: next })
      toast.success(next ? 'Free mode ON — all tiers open for free to every user.' : 'Free mode OFF — normal paid flow restored.')
    } else toast.error('Toggle failed')
  }

  const saveApiKeys = async () => {
    setSavingKeys(true)
    const res = await fetch('/api/admin/keys', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(apiKeys) })
    setSavingKeys(false)
    if (res.ok) { toast.success('API keys saved. They override any env values.'); loadAll() }
    else toast.error('Save failed')
  }


  const logout = () => { localStorage.clear(); router.push('/') }

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center"><Loader2 className="animate-spin text-[#c9a84c]" /></div>

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-[rgba(201,168,76,0.18)] bg-[#0f0f10]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display tracking-[0.3em] text-[12px] text-[#c9a84c]"><span className="text-[#e5c968]">⬡</span> THINKOVR</Link>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#c0392b] flex items-center gap-2"><span className="live-dot" /> Admin Command Center</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadAll} className="btn btn-ghost !py-2 !px-3 !text-[10px]"><RefreshCw size={12} /> Refresh</button>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/60">{user?.email}</span>
            <button onClick={logout} className="btn btn-ghost !py-2 !px-3 !text-[10px]"><LogOut size={12} /> Sign Out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total Users', value: stats.users, sub: 'registered', color: '#c9a84c' },
            { label: 'Orders', value: stats.orders, sub: 'all time', color: '#3498db' },
            { label: 'Total Wishes', value: stats.wishes, sub: 'all submissions', color: '#8e44ad' },
            { label: 'Pending', value: stats.pending, sub: 'awaiting dispatch', color: '#c0392b' },
            { label: 'Delivered', value: stats.delivered, sub: 'sent to clients', color: '#2a9d5f' },
          ].map(k => (
            <div key={k.label} className="kpi" style={{ '--kpi-color': k.color }}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b border-[rgba(201,168,76,0.15)]">
          {[['wishes', 'Wishes'], ['orders', 'Orders & Payments'], ['banking', 'Banking'], ['settings', 'Engine'], ['keys', 'API Keys']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-5 py-3 font-mono text-[10px] tracking-[0.22em] uppercase border-b-2 transition ${tab === k ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-transparent text-[#f0e8d4]/50 hover:text-[#f0e8d4]'}`}>{l}</button>
          ))}
        </div>

        {tab === 'wishes' && <>
          <div className="flex items-center justify-between mb-4">
            <div className="section-label !mb-0">Wishes &amp; Blueprints</div>
            <div className="flex gap-2">
              {[['', 'All'], ['pending', 'Pending'], ['delivered', 'Delivered']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} className={`px-3 py-2 font-mono text-[10px] tracking-[0.18em] uppercase border transition ${filter === v ? 'border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0b]' : 'border-[rgba(240,232,212,0.15)] text-[#f0e8d4]/60 hover:border-[#c9a84c]/50'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="border border-[rgba(201,168,76,0.18)] bg-[#0f0f10] overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-[rgba(201,168,76,0.18)]">{['Time','User','Tier','Prompt','Status','Actions'].map(h => <th key={h} className="text-left px-5 py-4 font-mono text-[10px] tracking-[0.22em] uppercase text-[#c9a84c]">{h}</th>)}</tr></thead>
              <tbody>
                {wishes.length === 0 && <tr><td colSpan={6} className="text-center py-16 font-mono text-[11px] tracking-[0.2em] uppercase text-[#f0e8d4]/40">No wishes in this queue.</td></tr>}
                {wishes.map(w => (
                  <tr key={w.id} className="border-b border-[rgba(201,168,76,0.08)] hover:bg-[rgba(201,168,76,0.03)] transition">
                    <td className="px-5 py-4 font-mono text-[11px] text-[#f0e8d4]/60">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#f0e8d4]/85">{w.user_email}</td>
                    <td className="px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-[#c9a84c]">{w.tier}</td>
                    <td className="px-5 py-4 font-serif italic text-[#f0e8d4]/90 max-w-md truncate">“{(w.user_prompt || '').slice(0, 100)}…”</td>
                    <td className="px-5 py-4"><span className={`badge ${w.status === 'delivered' ? 'badge-delivered' : 'badge-pending'}`}>{w.status}</span></td>
                    <td className="px-5 py-4 space-x-2">
                      <button onClick={() => openWish(w)} className="btn btn-ghost !py-1.5 !px-3 !text-[10px]"><Edit3 size={10} /> Review</button>
                      <button onClick={() => downloadAdminPdf(w.id)} className="btn btn-ghost !py-1.5 !px-3 !text-[10px]"><Download size={10} /> PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {tab === 'orders' && <>
          <div className="section-label">Orders &amp; Payment Confirmation</div>
          <div className="border border-[rgba(201,168,76,0.18)] bg-[#0f0f10] overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-[rgba(201,168,76,0.18)]">{['Created','User','Tier','Amount','Reference','Status','Actions'].map(h => <th key={h} className="text-left px-5 py-4 font-mono text-[10px] tracking-[0.22em] uppercase text-[#c9a84c]">{h}</th>)}</tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={7} className="text-center py-16 font-mono text-[11px] tracking-[0.2em] uppercase text-[#f0e8d4]/40">No orders yet.</td></tr>}
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-[rgba(201,168,76,0.08)] hover:bg-[rgba(201,168,76,0.03)] transition">
                    <td className="px-5 py-4 font-mono text-[11px] text-[#f0e8d4]/60">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#f0e8d4]/85">{o.user_email}</td>
                    <td className="px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-[#c9a84c]">{o.tier}</td>
                    <td className="px-5 py-4 font-display text-[16px]">${o.amount}</td>
                    <td className="px-5 py-4 font-mono text-[10px] text-[#f0e8d4]/70">{o.reference}</td>
                    <td className="px-5 py-4"><span className={`badge ${o.status === 'paid' ? 'badge-paid' : 'badge-awaiting'}`}>{o.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-4">
                      {o.status === 'awaiting_payment' && <button onClick={() => confirmOrder(o.id)} className="btn btn-primary !py-1.5 !px-3 !text-[10px]"><Check size={10} /> Confirm Paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {tab === 'banking' && <div className="max-w-2xl">
          <div className="section-label">Capitec Banking Details</div>
          <h2 className="font-display font-light text-4xl mb-4">Payment <em className="line-gold">instructions.</em></h2>
          <p className="font-serif text-lg text-[#f0e8d4]/75 mb-8">These details are shown to users when they commit to a tier. Keep them accurate.</p>
          <div className="card-dark space-y-4">
            {[
              ['bank', 'Bank', 'Capitec'],
              ['account_name', 'Account Name', 'Your business name'],
              ['account_number', 'Account Number', 'e.g. 1234567890'],
              ['branch_code', 'Branch Code', '470010'],
              ['swift', 'SWIFT (international, optional)', 'CABLZAJJ'],
              ['reference_note', 'Reference Instructions', 'Use your order reference'],
            ].map(([k, l, ph]) => (
              <div key={k}>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">{l}</label>
                <input value={banking[k] || ''} onChange={e => setBanking({ ...banking, [k]: e.target.value })} className="input" placeholder={ph} />
              </div>
            ))}
            <button onClick={saveBanking} disabled={savingBanking} className="btn btn-primary w-full justify-center mt-4">
              {savingBanking ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Save Banking Details</>}
            </button>
          </div>
        </div>}

        {tab === 'settings' && <div className="max-w-3xl space-y-6">
          <div className="section-label">Engine Settings</div>
          <h2 className="font-display font-light text-4xl mb-4">Global <em className="line-gold">switches.</em></h2>

          <div className="card-dark !p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-[#c9a84c]" /><span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#c9a84c]">Free Mode</span></div>
                <h3 className="font-display text-2xl mb-2">Open all tiers for free</h3>
                <p className="font-serif text-[#f0e8d4]/75 text-[15px] leading-relaxed">When ON, every registered user can request any tier (Spark / Ignite / Blaze / Blueprint) without payment. Useful for launch, demos, or promotional windows. When OFF, normal paid flow resumes.</p>
              </div>
              <button onClick={toggleFreeMode} className={`relative w-16 h-8 rounded-full transition flex-shrink-0 mt-1 ${settings.free_mode ? 'bg-[#c9a84c]' : 'bg-[#3a3a3a]'}`}>
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.free_mode ? 'left-9' : 'left-1'}`}></span>
              </button>
            </div>
            {settings.free_mode && (
              <div className="mt-4 p-3 border border-[#c9a84c]/30 bg-[#c9a84c]/5 font-mono text-[11px] tracking-wider text-[#c9a84c] flex items-center gap-2">
                <AlertTriangle size={12} /> FREE MODE ACTIVE — All users currently have unrestricted tier access.
              </div>
            )}
          </div>

          <div className="card-dark !p-6">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#c9a84c] mb-4">System Status</div>
            <div className="space-y-3 font-mono text-[12px]">
              <div className="flex justify-between py-2 border-b border-[rgba(201,168,76,0.1)]"><span className="text-[#f0e8d4]/60">Admins configured</span><span className="text-[#f0e8d4]">{(settings.admin_emails || []).join(', ') || '—'}</span></div>
              <div className="flex justify-between py-2 border-b border-[rgba(201,168,76,0.1)]"><span className="text-[#f0e8d4]/60">Resend email</span><span className={settings.resend_configured ? 'text-[#4a9c4a]' : 'text-[#c0392b]'}>{settings.resend_configured ? '● REAL SENDING' : '○ MOCKED'}</span></div>
              <div className="flex justify-between py-2 border-b border-[rgba(201,168,76,0.1)]"><span className="text-[#f0e8d4]/60">From address</span><span className="text-[#f0e8d4]">{settings.email_from || '—'}</span></div>
              <div className="flex justify-between py-2 border-b border-[rgba(201,168,76,0.1)]"><span className="text-[#f0e8d4]/60">LLM fallback chain</span><span className="text-[#f0e8d4]">Groq → Gemini → OpenRouter</span></div>
              <div className="flex justify-between py-2"><span className="text-[#f0e8d4]/60">Reasoning agent (Blueprint tier)</span><span className={settings.reasoning_agent_env ? 'text-[#4a9c4a]' : 'text-[#f0e8d4]/50'}>{settings.reasoning_agent_env ? '● ENABLED' : '○ DISABLED'}</span></div>
            </div>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#f0e8d4]/40 mt-4">These are env-level toggles. To change, update /app/.env and restart.</p>
          </div>
        </div>}

        {tab === 'keys' && <div className="max-w-3xl space-y-6">
          <div className="section-label">API Keys Vault</div>
          <h2 className="font-display font-light text-4xl mb-2">Engine <em className="line-gold">credentials.</em></h2>
          <p className="font-serif text-lg text-[#f0e8d4]/75 mb-6">Keys saved here are used at runtime and override any values in the .env file. Leave blank to fall back to env defaults.</p>

          {[
            { key: 'groq_api_key', label: 'Groq API Key', link: 'https://console.groq.com/keys', note: 'Primary LLM provider — 14,400 req/day free tier.' },
            { key: 'gemini_api_key', label: 'Google Gemini Key (slot 1)', link: 'https://aistudio.google.com/app/apikey', note: 'Fallback #1. Use for reasoning-heavy tiers.' },
            { key: 'gemini_api_key_2', label: 'Google Gemini Key (slot 2)', link: 'https://aistudio.google.com/app/apikey', note: 'Round-robin load balancing.' },
            { key: 'gemini_api_key_3', label: 'Google Gemini Key (slot 3)', link: 'https://aistudio.google.com/app/apikey', note: 'Round-robin load balancing.' },
            { key: 'openrouter_api_key', label: 'OpenRouter Key', link: 'https://openrouter.ai/keys', note: 'Last-resort fallback. Free llama-3.3-70b available.' },
            { key: 'resend_api_key', label: 'Resend API Key', link: 'https://resend.com/api-keys', note: 'Email dispatch. Verify a domain at resend.com/domains for real delivery.' },
            { key: 'email_from', label: 'Email From Address', link: 'https://resend.com/domains', note: 'e.g. Thinkovr <dictatum@yourdomain.com>. Must use a verified Resend domain.', plain: true },
          ].map((f) => {
            const meta = apiKeysMeta[f.key] || {}
            return (
              <div key={f.key} className="card-dark !p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Key size={13} className="text-[#c9a84c]" />
                      <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#c9a84c]">{f.label}</span>
                    </div>
                    <p className="font-serif text-[14px] text-[#f0e8d4]/70">{f.note}</p>
                  </div>
                  <a href={f.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-1.5 !px-3 !text-[10px] self-start">
                    <ExternalLink size={10} /> Get Key
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type={(showKey[f.key] || f.plain) ? 'text' : 'password'}
                    value={apiKeys[f.key] || ''}
                    onChange={e => setApiKeys({ ...apiKeys, [f.key]: e.target.value })}
                    className="input font-mono !text-[13px]"
                    placeholder={meta.masked || (f.plain ? 'Thinkovr <onboarding@resend.dev>' : 'Paste key here…')}
                  />
                  {!f.plain && (
                    <button type="button" onClick={() => setShowKey({ ...showKey, [f.key]: !showKey[f.key] })} className="btn btn-ghost !px-3">
                      {showKey[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 font-mono text-[9px] tracking-[0.18em] uppercase">
                  <span className={`px-2 py-0.5 border ${meta.source === 'database' ? 'border-[#4a9c4a] text-[#4a9c4a]' : meta.source === 'env' ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-[#c0392b]/60 text-[#c0392b]'}`}>
                    Active source: {meta.source || 'none'}
                  </span>
                  {meta.env_set && <span className="text-[#f0e8d4]/40">env: set</span>}
                  {meta.db_set && <span className="text-[#f0e8d4]/40">db: set</span>}
                </div>
              </div>
            )
          })}

          <button onClick={saveApiKeys} disabled={savingKeys} className="btn btn-primary w-full justify-center !py-4">
            {savingKeys ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Save All API Keys</>}
          </button>

          <div className="p-4 border border-[#c9a84c]/30 bg-[#c9a84c]/5 font-serif text-[14px] text-[#f0e8d4]/80">
            <strong className="text-[#c9a84c]">How resolution works:</strong> At runtime, Thinkovr checks the DB-stored key first. If empty, it falls back to the .env value. For Groq specifically — the chain tries Groq → Gemini (rotating 3 keys) → OpenRouter. If all fail, the wish submission fails loudly.
          </div>
        </div>}



      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-[#0f0f10] border border-[#c9a84c] max-w-4xl w-full my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0f0f10] border-b border-[rgba(201,168,76,0.2)] p-5 flex items-center justify-between z-10">
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]">Blueprint Review — {selected.user_email} <span className="ml-3 px-2 py-0.5 border border-[#c9a84c]/40">{selected.tier}</span></div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/50 mt-1">{new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[rgba(201,168,76,0.1)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#c9a84c] mb-2">User's Wish</div>
                <div className="p-4 border border-[rgba(240,232,212,0.1)] bg-[rgba(0,0,0,0.3)] font-serif italic text-[#f0e8d4]/90 whitespace-pre-wrap">{selected.user_prompt}</div>
              </div>
              {selected.context && Object.keys(selected.context).length > 0 && (
                <div>
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#c9a84c] mb-2">Parameters</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
                    {Object.entries(selected.context).map(([k, v]) => v && (
                      <div key={k} className="p-2 border border-[rgba(240,232,212,0.08)]">
                        <div className="text-[#f0e8d4]/40 uppercase tracking-wider text-[9px]">{k}</div>
                        <div className="text-[#f0e8d4]/95 mt-1">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#c9a84c]">Engine Output (editable markdown)</div>
                  <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#f0e8d4]/40">{selected.groq_model}</div>
                </div>
                <textarea value={editedOutput} onChange={e => setEditedOutput(e.target.value)} rows={22} className="input font-mono text-[12px] !leading-relaxed whitespace-pre-wrap" />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={saveEdit} disabled={saving} className="btn btn-ghost">{saving ? <Loader2 className="animate-spin" size={12} /> : <Edit3 size={12} />} Save Edits</button>
                <button onClick={() => downloadAdminPdf(selected.id)} className="btn btn-ghost"><Download size={12} /> Preview PDF</button>
                <button onClick={dispatch} disabled={dispatching || selected.status === 'delivered'} className="btn btn-primary">
                  {dispatching ? <><Loader2 className="animate-spin" size={14} /> Dispatching</> : <><Send size={14} /> Dispatch to Client (Email + PDF)</>}
                </button>
                {selected.status === 'delivered' && <span className="badge badge-delivered self-center">Already Delivered</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
