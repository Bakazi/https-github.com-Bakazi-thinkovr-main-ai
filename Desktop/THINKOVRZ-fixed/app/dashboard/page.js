'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, LogOut, Flame, CheckCircle2, Clock, Download, Sparkles, Gem, Crown, ArrowRight, Copy, Building2, Check } from 'lucide-react'

const tierMeta = {
  spark: { icon: Sparkles, label: 'Spark', color: '#c9a84c', desc: '2-page Dictatum — gold edition' },
  ignite: { icon: Flame, label: 'Ignite', color: '#b87333', desc: '4-page Sprint Blueprint — copper edition' },
  blaze: { icon: Gem, label: 'Blaze', color: '#a8321f', desc: '6-page Dossier — burgundy edition' },
  blueprint_only: { icon: Crown, label: 'Blueprint', color: '#2e5a87', desc: '10-page Signature Blueprint' },
  free: { icon: Sparkles, label: 'Free Preview', color: '#8a7535', desc: '1 sample Spark-tier blueprint' },
}

const Dashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [wishes, setWishes] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [banking, setBanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tab, setTab] = useState('wish')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(null)

  const [prompt, setPrompt] = useState('')
  const [ctx, setCtx] = useState({ capital: '', hours: '', skill: '', location: '', fear: '', runway_days: '' })
  const [freeMode, setFreeMode] = useState(false)
  const [selectedTier, setSelectedTier] = useState('spark')

  const authHeaders = () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('thinkovr_token') : null
    return { 'Content-Type': 'application/json', Authorization: t ? `Bearer ${t}` : '' }
  }

  const loadAll = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: authHeaders() })
      if (!res.ok) throw new Error('unauth')
      const { user } = await res.json()
      setUser(user)
      const [w, o, p, b, pub] = await Promise.all([
        fetch('/api/wish', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/orders', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/banking', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/settings/public').then(r => r.json()),
      ])
      setWishes(w.wishes || [])
      setOrders(o.orders || [])
      setProducts(p.products || [])
      setBanking(b.banking)
      setFreeMode(!!pub.free_mode)
    } catch {
      localStorage.removeItem('thinkovr_token')
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const logout = () => { localStorage.clear(); router.push('/') }

  const submit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) { toast.error('Describe your objective.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/wish', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ prompt, context: ctx, tier: freeMode ? selectedTier : undefined }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Submission failed'); setSubmitting(false); return }
      setSubmitted(true)
      toast.success('Forged. The Thinkovr Engine has accepted your parameters.')
      setPrompt('')
      setCtx({ capital: '', hours: '', skill: '', location: '', fear: '', runway_days: '' })
      loadAll()
    } catch { toast.error('Network error') } finally { setSubmitting(false) }
  }

  const commitToTier = async (product) => {
    setSelectedProduct(product)
    const res = await fetch('/api/orders', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ product_id: product.id }) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Could not create order'); return }
    setPendingOrder(data.order)
    setTab('payment')
    loadAll()
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadPdf = async (wishId) => {
    const res = await fetch(`/api/wish/${wishId}/pdf`, { headers: authHeaders() })
    if (!res.ok) { toast.error('Blueprint not yet delivered'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `thinkovr-blueprint-${wishId.slice(0,8)}.pdf`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center"><Loader2 className="animate-spin text-[#c9a84c]" /></div>

  const meta = tierMeta[user?.tier] || tierMeta.free
  const Icon = meta.icon

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-[rgba(201,168,76,0.18)] bg-[#0f0f10]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="font-display tracking-[0.3em] text-[12px] text-[#c9a84c] flex items-center gap-2"><span className="text-[#e5c968]">⬡</span> THINKOVR</Link>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 border border-[#c9a84c]/30 bg-[#c9a84c]/5 font-mono text-[10px] tracking-[0.2em] uppercase">
              <Icon size={12} style={{ color: meta.color }} /> <span style={{ color: meta.color }}>{meta.label}</span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/60 hidden md:inline">{user?.email}</span>
            {user?.admin && <Link href="/admin" className="btn btn-ghost !py-2 !px-3 !text-[10px]">Admin</Link>}
            <button onClick={logout} className="btn btn-ghost !py-2 !px-3 !text-[10px]"><LogOut size={12} /> Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Tier tabs */}
      <div className="max-w-[1400px] mx-auto px-6 pt-8">
        <div className="flex gap-2 mb-8 border-b border-[rgba(201,168,76,0.15)]">
          {[
            ['wish', 'Submit Wish'],
            ['tiers', 'Upgrade Tier'],
            ['payment', 'Payment'],
            ['history', 'My Blueprints'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-5 py-3 font-mono text-[10px] tracking-[0.22em] uppercase border-b-2 transition ${tab === k ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-transparent text-[#f0e8d4]/50 hover:text-[#f0e8d4]'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-20">
        {tab === 'wish' && (submitted ? (
          <div className="card-dark !p-16 text-center max-w-2xl mx-auto !border-[#c9a84c] bg-[rgba(201,168,76,0.04)] glow-gold">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-[#c9a84c] rounded-full mb-6 glow-gold"><Flame className="text-[#c9a84c]" size={28} /></div>
            <div className="section-label justify-center">Accepted</div>
            <h2 className="font-display font-light text-3xl mb-4">Your request is in the forge.</h2>
            <p className="font-serif text-lg text-[#f0e8d4]/80 mb-8">The Thinkovr Engine is processing your parameters. Your <span className="text-[#c9a84c]">{meta.label}</span> blueprint will be reviewed and delivered to <span className="text-[#c9a84c]">{user?.email}</span> within 48 hours.</p>
            <button onClick={() => { setSubmitted(false); setTab('history') }} className="btn btn-ghost">View My Blueprints</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-10">
            <div className="space-y-5">
              <div className="section-label">Your Wish</div>
              <h1 className="font-display font-light text-4xl md:text-5xl leading-tight -mt-4">Describe your<br/><em className="line-gold">objective.</em></h1>
              <p className="font-serif text-lg text-[#f0e8d4]/75">Be precise. The Thinkovr Engine processes your real parameters — vagueness produces vague blueprints.</p>
              {freeMode && (
                <div className="p-4 border border-[#c9a84c]/40 bg-[rgba(201,168,76,0.06)]">
                  <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#c9a84c] mb-3">⚡ Free Mode — Any Tier Open</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[['spark', 'Spark'], ['ignite', 'Ignite'], ['blaze', 'Blaze'], ['blueprint_only', 'Blueprint']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setSelectedTier(v)} className={`px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase border transition ${selectedTier === v ? 'border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0b]' : 'border-[rgba(240,232,212,0.2)] text-[#f0e8d4]/70 hover:border-[#c9a84c]/60'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">The Wish</label>
                <textarea required value={prompt} onChange={e => setPrompt(e.target.value)} rows={8} className="input resize-none font-serif" placeholder="What outcome do you want? Be specific about timeframe and end-state." />
              </div>
              <button disabled={submitting} type="submit" className="btn btn-primary w-full justify-center">
                {submitting ? <><Loader2 className="animate-spin" size={14} /> Processing through the five filters...</> : <><Flame size={14} /> Forge My {freeMode ? (tierMeta[selectedTier]?.label || 'Spark') : meta.label} Blueprint</>}
              </button>
              {user?.tier === 'free' && !freeMode && <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#f0e8d4]/50">⚼ Free tier: 1 sample Spark blueprint. Upgrade for full tier access.</p>}
            </div>
            <div className="space-y-4">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#c9a84c]">Your Real Parameters</div>
              <p className="font-serif text-[15px] text-[#f0e8d4]/70 -mt-2">Fill in what you honestly have — not what you wish you had.</p>
              {[
                { k: 'capital', l: '01 — Liquid Capital (USD or local)', ph: 'e.g. 5000 USD / R50 000' },
                { k: 'hours', l: '02 — Weekly Defendable Hours', ph: 'e.g. 12 hours/week' },
                { k: 'skill', l: '03 — Strongest Skill', ph: 'e.g. Backend engineering (10 years)' },
                { k: 'location', l: '04 — Location / Market', ph: 'e.g. Cape Town, South Africa' },
                { k: 'fear', l: '05 — Deepest Fear', ph: 'Poverty / Obscurity / Regret — which hurts most?' },
                { k: 'runway_days', l: '⬡ Exact Runway (days)', ph: 'e.g. 180' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-[#f0e8d4]/50 mb-1">{f.l}</label>
                  <input value={ctx[f.k]} onChange={e => setCtx({ ...ctx, [f.k]: e.target.value })} className="input !py-3" placeholder={f.ph} />
                </div>
              ))}
            </div>
          </form>
        ))}

        {tab === 'tiers' && (
          <div>
            <div className="section-label">Upgrade Your Tier</div>
            <h1 className="font-display font-light text-4xl md:text-5xl mb-2">Commit to a <em className="line-gold">blueprint.</em></h1>
            <p className="font-serif text-lg text-[#f0e8d4]/75 mb-10 max-w-2xl">Pick a tier. You’ll receive EFT payment instructions. Once payment is confirmed by our team, your tier unlocks and you can submit a full blueprint request.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map(p => {
                const M = tierMeta[p.tier] || tierMeta.spark
                const PIcon = M.icon
                const isCurrent = user?.tier === p.tier
                return (
                  <div key={p.id} className={`card-dark flex flex-col ${p.featured ? '!border-[#c9a84c] glow-gold' : ''} ${isCurrent ? '!border-[#4a9c4a] bg-[rgba(74,156,74,0.05)]' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: M.color }}>{M.label}</div>
                      <PIcon size={20} style={{ color: M.color }} />
                    </div>
                    <div className="font-display text-4xl mb-1">${p.price}</div>
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/50 mb-6">{p.per}</div>
                    <ul className="space-y-2 font-serif text-[14px] text-[#f0e8d4]/85 mb-6 flex-1">
                      {p.features.slice(0, 5).map((f, j) => <li key={j} className="flex gap-2"><Check size={12} className="text-[#c9a84c] mt-1 flex-shrink-0" />{f}</li>)}
                    </ul>
                    {isCurrent ? (
                      <div className="text-center font-mono text-[10px] tracking-[0.2em] uppercase text-[#4a9c4a]">✓ Your current tier</div>
                    ) : (
                      <button onClick={() => commitToTier(p)} className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'} justify-center`}>Commit — ${p.price} <ArrowRight size={12} /></button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'payment' && (
          <div className="max-w-3xl">
            <div className="section-label">Payment</div>
            <h1 className="font-display font-light text-4xl md:text-5xl mb-8">EFT to <em className="line-gold">Capitec.</em></h1>
            {(!pendingOrder && orders.filter(o => o.status === 'awaiting_payment').length === 0) ? (
              <div className="card-dark"><p className="font-serif text-[#f0e8d4]/75">No open orders. Go to <button onClick={() => setTab('tiers')} className="text-[#c9a84c] underline">Upgrade Tier</button> to commit to a blueprint.</p></div>
            ) : (
              <div className="space-y-6">
                {[...(pendingOrder ? [pendingOrder] : []), ...orders.filter(o => o.status === 'awaiting_payment' && o.id !== pendingOrder?.id)].map(o => {
                  const M = tierMeta[o.tier] || tierMeta.spark
                  return (
                    <div key={o.id} className="card-dark !p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]">{M.label} Blueprint</div>
                          <div className="font-display text-3xl mt-1">${o.amount} {o.currency}</div>
                        </div>
                        <span className="badge badge-awaiting"><Clock size={10} /> Awaiting Payment</span>
                      </div>
                      <div className="border-t border-[rgba(201,168,76,0.15)] pt-6">
                        <div className="flex items-center gap-2 mb-4"><Building2 size={16} className="text-[#c9a84c]" /><span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#c9a84c]">Capitec Bank — EFT Details</span></div>
                        {banking ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[12px]">
                            {[
                              ['Bank', banking.bank],
                              ['Account Name', banking.account_name],
                              ['Account Number', banking.account_number],
                              ['Branch Code', banking.branch_code],
                              ['SWIFT (Intl)', banking.swift || '—'],
                              ['Your Reference', o.reference],
                            ].filter(([,v]) => v).map(([k, v]) => (
                              <div key={k} className="p-3 border border-[rgba(201,168,76,0.15)] bg-[rgba(0,0,0,0.3)] flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[#f0e8d4]/50 text-[9px] tracking-[0.2em] uppercase">{k}</div>
                                  <div className="text-[#f0e8d4] mt-1 break-all">{v}</div>
                                </div>
                                <button onClick={() => copy(v)} className="text-[#c9a84c]/70 hover:text-[#c9a84c] transition flex-shrink-0"><Copy size={14} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-5 border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)] font-mono text-[11px] text-[#f0e8d4]/70">
                            Banking details have not been configured by the admin yet. Please contact us directly for EFT details.
                          </div>
                        )}
                        <div className="mt-5 p-4 border border-[#c9a84c]/30 bg-[#c9a84c]/5 font-serif text-[14px] text-[#f0e8d4]/85">
                          <strong className="text-[#c9a84c]">Important:</strong> Use reference <code className="font-mono text-[#c9a84c]">{o.reference}</code> for your EFT. Once we confirm the payment, your tier unlocks automatically and you can submit your blueprint request. Turnaround: 48 hours after tier unlock.
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className="section-label">My Blueprints</div>
            <h1 className="font-display font-light text-4xl mb-8">Your blueprint <em className="line-gold">history.</em></h1>
            {wishes.length === 0 ? (
              <div className="card-dark text-center py-16"><p className="font-serif text-[#f0e8d4]/70">No blueprints yet. Submit your first wish to begin.</p></div>
            ) : (
              <div className="space-y-3">
                {wishes.map(w => {
                  const M = tierMeta[w.tier] || tierMeta.spark
                  const WIcon = M.icon
                  return (
                    <div key={w.id} className="card-dark flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <WIcon size={14} style={{ color: M.color }} />
                          <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: M.color }}>{M.label}</span>
                          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#f0e8d4]/40">• {new Date(w.created_at).toLocaleString()}</span>
                        </div>
                        <div className="font-serif italic text-[#f0e8d4]/90">“{(w.user_prompt || '').slice(0, 220)}{w.user_prompt?.length > 220 ? '…' : ''}”</div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`badge ${w.status === 'delivered' ? 'badge-delivered' : 'badge-pending'}`}>
                          {w.status === 'delivered' ? <><CheckCircle2 size={10} /> Delivered</> : <><Clock size={10} /> In Forge</>}
                        </span>
                        {w.status === 'delivered' && (
                          <button onClick={() => downloadPdf(w.id)} className="btn btn-ghost !py-2 !px-3 !text-[10px]"><Download size={10} /> PDF</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
