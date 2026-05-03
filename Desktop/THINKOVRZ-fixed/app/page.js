'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldAlert, Lock, Sparkles, Flame, Gem, Crown, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { FadeWords, FadeUp, FadeChars } from '@/components/animated-text'
import { ZoomParallax } from '@/components/zoom-parallax'
import { MotionFooter } from '@/components/motion-footer'

const parallaxImages = [
  { src: 'https://images.unsplash.com/photo-1655246741674-5646da9c03c5?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80', alt: 'Strategic decision' },
  { src: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80', alt: 'Chess strategy' },
  { src: 'https://images.unsplash.com/photo-1579724984996-c2d12999e8f6?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80', alt: 'Compass' },
  { src: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80', alt: 'Chess king' },
  { src: 'https://images.unsplash.com/photo-1571236207041-5fb70cec466e?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80', alt: 'Decision point' },
  { src: 'https://images.unsplash.com/photo-1598944999410-e93772fc48a5?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80', alt: 'Old compass' },
  { src: 'https://images.unsplash.com/photo-1709197759595-09d8b1eb10e7?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80', alt: 'Time' },
]

const filters = [
  { num: '01', icon: '💰', title: 'Capital Reality', desc: 'Any recommendation exceeding your liquid capital is eliminated. We do the math on what you actually have — not what you wish you had.', color: 'var(--gold)' },
  { num: '02', icon: '⏱', title: 'Time Honesty', desc: 'Your blueprint respects the hours you can actually protect. No 80-hour hero fantasies. Real schedules, real output.', color: 'var(--ember)' },
  { num: '03', icon: '⚡', title: 'Skill Leverage', desc: 'We build from your genuine strength — or one adjacent step. No blind pivots into domains where you start at zero.', color: 'var(--emerald)' },
  { num: '04', icon: '🌍', title: 'Market Fit', desc: 'Berlin is not Lagos is not Manila. Every move is adjusted for your geography, currency, and local market dynamics.', color: 'var(--teal)' },
  { num: '05', icon: '🎯', title: 'Fear Alignment', desc: 'Whether you fear poverty, obscurity, or regret — the directive addresses the specific failure mode that keeps you awake.', color: 'var(--violet)' },
]

const tickerItems = [
  { txt: 'Dropshipping without capital for ad spend', rejected: true },
  { txt: 'Every blueprint tested against unit economics' },
  { txt: 'YouTube on 4 hours/week with zero budget', rejected: true },
  { txt: 'Tier-specific PDFs — each one collectible' },
  { txt: '“I’ll become a crypto trader in 30 days”', rejected: true },
  { txt: 'The Thinkovr Engine reviews every blueprint by hand' },
  { txt: 'Build an app with no cofounder, no capital', rejected: true },
  { txt: 'One directive. Backed by reasoning. Yours to execute.' },
  { txt: '“Network my way to a six-figure salary”', rejected: true },
  { txt: 'Honest advice for serious people' },
]

const tiers = [
  { name: 'Spark', sigil: '⬡', icon: Sparkles, price: 47, per: 'per directive', id: 'spark', accent: 'from-yellow-500/20 to-amber-600/10', border: 'border-[#c9a84c]/40', features: ['Two-page Dictatum PDF (gold edition)', 'The Move + full logical derivation', '7-Day execution sheet with daily KPIs', 'One primary KPI + autopsy trigger', '48-hour turnaround', 'Collectible entry-tier design'], cta: 'Get The Move — $47' },
  { name: 'Ignite', sigil: '⬡⬡', icon: Flame, price: 197, per: 'per sprint', featured: true, id: 'ignite', accent: 'from-orange-600/30 to-amber-700/20', border: 'border-[#b87333]', features: ['Four-page Sprint Blueprint PDF (copper edition)', '30-day expanded execution plan', 'Top-3 risk register with mitigations', 'Resource allocation breakdown', 'Clear pivot triggers', '24-hour priority turnaround', 'One revision cycle'], cta: 'Begin Ignite — $197' },
  { name: 'Blaze', sigil: '⬡⬡⬡', icon: Gem, price: 497, per: '4-week sprint', id: 'blaze', accent: 'from-red-700/30 to-orange-800/20', border: 'border-[#a8321f]/60', features: ['Six-page Blaze Dossier PDF (burgundy edition)', '4-week sprint breakdown with milestones', 'Metrics dashboard specification', 'Full 5-item risk register', 'Weekly review protocol + psychology section', 'Go/no-go decision framework', 'Post-sprint autopsy template'], cta: 'Enter Blaze — $497' },
  { name: 'Blueprint', sigil: '⬡⬡⬡⬡', icon: Crown, price: 750, per: 'single delivery', id: 'blueprint_only', accent: 'from-blue-800/30 to-indigo-900/20', border: 'border-[#2e5a87]/60', features: ['Ten-page signature Blueprint PDF', '90-day execution plan', 'Market + competitive landscape analysis', '6-month financial projections', 'Full 7–10 item risk register', 'Legal / regulatory notes', 'Scale path + honest escape plan'], cta: 'Commission Blueprint — $750' },
]

const rejections = [
  { wk: 'WK 21 / 2026', idea: '“Start a dropshipping store selling trending products”', reason: 'Capital insufficient for ad spend required to reach margin threshold. The math of CAC and LTV was the issue — not the product.' },
  { wk: 'WK 21 / 2026', idea: '“Launch a YouTube channel to build passive income”', reason: 'User committed 4 hours/week. Minimum viable consistency for channel growth: 20+. This is not a channel problem, it’s an arithmetic problem.' },
  { wk: 'WK 20 / 2026', idea: '“Build an app to solve X” (no technical co-founder, no capital for dev)', reason: 'The idea is not the constraint. The infrastructure is. This was a capability gap, not a strategy gap.' },
  { wk: 'WK 20 / 2026', idea: '“Become a life coach and charge $500/hr immediately”', reason: 'No demonstrated track record submitted. Credibility cannot be purchased. This was a pricing question masquerading as a business plan.' },
]

const App = () => {
  const [scrolled, setScrolled] = useState(false)
  const [slotsLeft] = useState(7)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Card tilt on mousemove
  const handleCardMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`)
    e.currentTarget.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f0e8d4] overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? 'bg-[#0a0a0b]/92 backdrop-blur-md border-b border-[rgba(201,168,76,0.18)]' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
          <Link href="/" className="font-display tracking-[0.3em] text-[13px] text-[#c9a84c] flex items-center gap-2"><span className="text-[#e5c968]">⬡</span> THINKOVR</Link>
          <div className="hidden md:flex items-center gap-8 font-mono text-[11px] tracking-[0.18em] uppercase text-[#f0e8d4]/70">
            <a href="#manifesto" className="hover:text-[#c9a84c] transition">Manifesto</a>
            <a href="#engine" className="hover:text-[#c9a84c] transition">The Engine</a>
            <a href="#tiers" className="hover:text-[#c9a84c] transition">Tiers</a>
            <a href="#anti-portfolio" className="hover:text-[#c9a84c] transition">Anti-Portfolio</a>
          </div>
          <Link href="/auth" className="btn btn-primary !py-2 !px-4 !text-[10px]">Enter Thinkovr</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[100vh] flex items-center justify-center px-6 pt-20">
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="relative max-w-[1200px] w-full text-center z-10">
          <div className="inline-flex items-center gap-3 border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.05)] backdrop-blur-sm px-5 py-2 font-mono text-[10px] tracking-[0.3em] uppercase text-[#c9a84c] mb-10">
            <span className="live-dot" />
            <span>The Thinkovr Engine — Est. 2026 — 10 Slots This Week</span>
          </div>
          <h1 className="font-display font-light text-[13vw] md:text-[6.8rem] leading-[0.92] tracking-tight mb-10">
            <div className="line-outline hero-line" style={{ animationDelay: '0.2s' }}>We Don't Give</div>
            <div className="hero-line" style={{ animationDelay: '0.45s' }}>You <em className="line-gold">Options.</em></div>
            <div className="line-outline hero-line" style={{ animationDelay: '0.7s' }}>We Give You</div>
            <div className="hero-line" style={{ animationDelay: '0.95s' }}>The <em className="line-gold">Move.</em></div>
          </h1>
          <p className="font-serif text-xl md:text-2xl text-[#f0e8d4]/80 max-w-2xl mx-auto mb-12 leading-relaxed italic hero-line" style={{ animationDelay: '1.3s' }}>
            One directive. Logically derived. Honest about risk. The Thinkovr Engine processes your real parameters and delivers the single move that actually fits your life.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/auth" className="btn btn-primary text-[11px] md:!text-[12px]">
              Submit Your Parameters <ArrowRight size={14} />
            </Link>
            <a href="#tiers" className="btn btn-ghost">See Blueprint Tiers</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-4 justify-center font-mono text-[10px] tracking-[0.18em] uppercase text-[#f0e8d4]/40">
            <span>• Human-reviewed every time</span>
            <span>• Collectible PDF blueprints</span>
            <span>• 48hr turnaround</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#f0e8d4]/40">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#c9a84c]/70 to-transparent" />
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker border-y border-[rgba(201,168,76,0.18)] bg-gradient-to-r from-[#0a0a0b] via-[#0f0f10] to-[#0a0a0b] py-4">
        <div className="ticker-track flex gap-12 whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((it, i) => (
            <span key={i} className="font-mono text-[11px] tracking-[0.15em] uppercase flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full ${it.rejected ? 'bg-[#c0392b] shadow-[0_0_10px_#c0392b]' : 'bg-[#c9a84c] shadow-[0_0_10px_#c9a84c]'}`} />
              <span className={it.rejected ? 'text-[#c0392b]/85' : 'text-[#f0e8d4]/70'}>{it.txt}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ZOOM PARALLAX — The Parameters We Respect */}
      <ZoomParallax images={parallaxImages} />

      {/* MANIFESTO */}
      <section id="manifesto" className="py-32 px-6 relative">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-20 items-start">
          <div className="reveal">
            <div className="section-label">01 — Manifesto</div>
            <h2 className="font-display font-light text-5xl md:text-6xl leading-[1.05] mb-10">
              Serious advice<br/>for <em className="line-gold">serious people.</em>
            </h2>
            <div className="space-y-6 font-serif text-lg leading-relaxed text-[#f0e8d4]/80">
              <p>You don’t need another brainstorm. You don’t need fifty options. You need one direction that fits the capital you have, the hours you can protect, and the skill you’ve actually built.</p>
              <p>Thinkovr treats your decision seriously because it is serious. We don’t play with your time, your money, or your last reserves of hope.</p>
              <p>The Thinkovr Engine processes your real parameters and produces a single blueprint — reviewed by a human, delivered as a collectible PDF, backed by reasoning you can audit.</p>
            </div>
          </div>
          <ul className="space-y-4 reveal">
            {[
              { ok: false, h: 'A Coaching Service', p: 'We don’t sell motivation. We deliver strategy grounded in your numbers.' },
              { ok: false, h: 'A Consulting Firm', p: 'No 40-page reports. One blueprint you can actually execute.' },
              { ok: false, h: 'An AI Chatbot', p: 'Every output is human-reviewed before it reaches you.' },
              { ok: false, h: 'A Yes-Man', p: 'If the math doesn’t work, we tell you. We’ve turned people away. We will again.' },
              { ok: true, h: 'A Decision Partner', p: 'One move. Logically derived from your exact parameters. With a clear exit plan if it fails.' },
            ].map((it, i) => (
              <li key={i} onMouseMove={handleCardMove} className={`card-dark flex gap-5 ${it.ok ? '!border-[#c9a84c] !bg-[rgba(201,168,76,0.06)] shimmer' : ''}`}>
                <span className={`font-mono text-xl flex-shrink-0 w-8 h-8 border rounded-full flex items-center justify-center ${it.ok ? 'text-[#c9a84c] border-[#c9a84c] bg-[rgba(201,168,76,0.1)]' : 'text-[#c0392b] border-[#c0392b]/40'}`}>{it.ok ? <Check size={14} /> : '✗'}</span>
                <div>
                  <h4 className={`font-display text-lg mb-1 ${it.ok ? 'text-[#c9a84c]' : 'text-[#f0e8d4]/60 line-through'}`}>{it.h}</h4>
                  <p className="font-serif text-[#f0e8d4]/75">{it.p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ENGINE */}
      <section id="engine" className="py-32 px-6 bg-gradient-to-b from-[#0a0a0b] via-[#0f0f10] to-[#0a0a0b] border-y border-[rgba(201,168,76,0.12)]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-end mb-20 reveal">
            <div>
              <div className="section-label">02 — The Thinkovr Engine</div>
              <h2 className="font-display font-light text-5xl md:text-6xl leading-[1.05]">Five Checks.<br/>One <em className="line-gold">Blueprint.</em></h2>
            </div>
            <p className="font-serif italic text-xl text-[#f0e8d4]/75 leading-relaxed">Every blueprint is processed through five honesty filters before a single word is written — then human-reviewed before it reaches your inbox.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filters.map((f, i) => (
              <div key={i} onMouseMove={handleCardMove} className="card-dark reveal group cursor-default" style={{ transitionDelay: `${i * 80}ms`, borderTopColor: f.color, borderTopWidth: '3px' }}>
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase mb-6" style={{ color: f.color }}>FILTER {f.num}</div>
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500" style={{ filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.3))' }}>{f.icon}</div>
                <h3 className="font-display text-xl mb-3 text-[#f0e8d4]">{f.title}</h3>
                <p className="font-serif text-[#f0e8d4]/70 leading-relaxed text-[15px]">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 text-center reveal">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#c9a84c] to-transparent mx-auto mb-8" />
            <div className="inline-block border border-[#c9a84c] p-10 md:p-16 bg-gradient-to-br from-[rgba(201,168,76,0.05)] to-[rgba(184,115,51,0.03)] max-w-2xl glow-gold">
              <div className="font-mono text-[11px] tracking-[0.4em] uppercase text-[#c9a84c] mb-6">→ THE BLUEPRINT</div>
              <p className="font-serif italic text-xl text-[#f0e8d4]/90 mb-8 leading-relaxed">A multi-page collectible PDF. One directive. A 7–90 day execution plan. Real risk register. Honest escape plan.</p>
              <Link href="/auth" className="btn btn-primary">Submit Your Parameters <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="section-label justify-center">03 — Blueprint Tiers</div>
            <h2 className="font-display font-light text-5xl md:text-6xl">Four <em className="line-gold">collectible</em> blueprints.</h2>
            <p className="font-serif italic text-xl text-[#f0e8d4]/75 mt-4 max-w-2xl mx-auto">Each tier delivers a distinct, hand-designed PDF blueprint. Higher tiers unlock deeper analysis, longer documents, and richer visual design.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((t, i) => (
              <div key={t.id} onMouseMove={handleCardMove} className={`card-dark flex flex-col reveal relative group ${t.border} ${t.featured ? 'lg:scale-[1.03] !border-2 glow-gold' : ''}`} style={{ transitionDelay: `${i * 80}ms`, background: `linear-gradient(165deg, var(--slate), var(--bg-2))` }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${t.accent} opacity-50 pointer-events-none`} />
                {t.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#e5c968] to-[#b87333] text-[#0a0a0b] font-mono text-[10px] tracking-[0.25em] px-4 py-1 uppercase font-bold">Most Chosen</div>}
                <div className="relative flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#c9a84c]">{t.sigil} {t.name}</div>
                    <t.icon size={20} className="text-[#c9a84c] group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="font-display text-5xl mb-1 text-[#f0e8d4]">${t.price}</div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/50 mb-8">{t.per}</div>
                  <ul className="space-y-3 font-serif text-[#f0e8d4]/85 mb-8 flex-1 text-[15px]">
                    {t.features.map((f, j) => <li key={j} className="flex gap-2"><Check size={14} className="text-[#c9a84c] mt-1 flex-shrink-0" />{f}</li>)}
                  </ul>
                  <Link href="/auth" className={`btn ${t.featured ? 'btn-primary' : 'btn-ghost'} justify-center`}>{t.cta}</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/40">
            Payment via EFT to our Capitec account — details shown after you commit to a tier.
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="border-y border-[rgba(201,168,76,0.12)] bg-gradient-to-b from-[#0f0f10] to-[#0a0a0b] py-16 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[{ v: '347', l: 'Blueprints Delivered' }, { v: '1,240', l: 'Bad Ideas Rejected' }, { v: '$47', l: 'Entry Tier' }, { v: '10', l: 'Weekly Slots' }].map((s, i) => (
            <div key={i} className="reveal group" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="font-display text-5xl md:text-6xl text-[#c9a84c] mb-3 group-hover:scale-110 transition-transform inline-block" style={{ textShadow: '0 0 40px rgba(201,168,76,0.3)' }}>{s.v}</div>
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#f0e8d4]/60">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ANTI-PORTFOLIO */}
      <section id="anti-portfolio" className="py-32 px-6 bg-gradient-to-b from-[#0a0a0b] via-[#0f0f10] to-[#0a0a0b]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-end mb-12">
            <div className="reveal">
              <div className="section-label">04 — Anti-Portfolio</div>
              <h2 className="font-display font-light text-5xl leading-[1.05]">Ideas The Engine<br/><em className="line-gold">rejected</em> this week.</h2>
            </div>
            <div className="reveal">
              <p className="font-serif text-lg text-[#f0e8d4]/80 leading-relaxed">Real submissions. The Engine doesn’t soften its verdicts — but it always explains the reasoning. If your idea appears here, you deserved to know before you lost two years on it.</p>
              <div className="flex items-center gap-3 mt-5 font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c]"><span className="live-dot" /> Live feed — updated weekly</div>
            </div>
          </div>
          <div className="space-y-3 reveal">
            {rejections.map((r, i) => (
              <div key={i} className="grid grid-cols-[100px_1fr_auto] gap-6 items-start p-5 border border-[rgba(240,232,212,0.08)] hover:border-[rgba(201,168,76,0.35)] hover:bg-[rgba(201,168,76,0.02)] transition">
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c]/70">{r.wk}</div>
                <div>
                  <div className="font-serif text-lg mb-1 italic text-[#f0e8d4]/95">{r.idea}</div>
                  <div className="font-mono text-[11px] text-[#f0e8d4]/55 tracking-wider leading-relaxed">{r.reason}</div>
                </div>
                <span className="badge badge-rejected">Rejected</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 text-center relative">
        <div className="hero-orb hero-orb-1" />
        <div className="max-w-3xl mx-auto reveal relative z-10">
          <div className="section-label justify-center">05 — Begin</div>
          <h2 className="font-display font-light text-5xl md:text-7xl leading-[1] mb-8">End the<br/><em className="line-gold">over-analysis.</em></h2>
          <p className="font-serif text-xl text-[#f0e8d4]/80 mb-10 leading-relaxed">Submit your real parameters. Receive one grounded, actionable blueprint. Execute it — or abandon it on the date specified.</p>
          <Link href="/auth" className="btn btn-primary text-base !px-12 !py-5">Enter Thinkovr <ArrowRight size={14} /></Link>
        </div>
      </section>

      <MotionFooter supportEmail="zmanschoeman@gmail.com" />
    </div>
  )
}

export default App
