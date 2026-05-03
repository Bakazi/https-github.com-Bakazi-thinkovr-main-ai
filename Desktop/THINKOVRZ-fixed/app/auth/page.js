'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Loader2 } from 'lucide-react'

const AuthPage = () => {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('thinkovr_token')) {
      router.push('/dashboard')
    }
  }, [router])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Authentication failed')
        setLoading(false)
        return
      }
      localStorage.setItem('thinkovr_token', data.token)
      localStorage.setItem('thinkovr_user', JSON.stringify(data.user))
      toast.success(mode === 'login' ? 'Protocol engaged.' : 'Account forged.')
      if (data.user.admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      toast.error('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="hero-grid" />
      <div className="hero-orb hero-orb-1" />
      <div className="absolute top-6 left-6">
        <Link href="/" className="font-display tracking-[0.3em] text-[12px] text-[#c9a84c]">⬡ THINKOVR</Link>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="section-label justify-center">{mode === 'login' ? 'Re-Enter' : 'Open The Gate'}</div>
          <h1 className="font-display font-light text-4xl md:text-5xl leading-tight">
            {mode === 'login' ? <>Welcome back to the<br/><em className="line-gold">Protocol.</em></> : <>Commit to the<br/><em className="line-gold">Engine.</em></>}
          </h1>
        </div>
        <form onSubmit={submit} className="card-dark space-y-5">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="operator@domain.com" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••" />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary w-full justify-center">
            {loading ? <Loader2 className="animate-spin" size={14} /> : <><span>{mode === 'login' ? 'Engage Protocol' : 'Forge Account'}</span><ArrowRight size={14} /></>}
          </button>
          <div className="text-center pt-2">
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#e8e0d0]/50 hover:text-[#c9a84c] transition">
              {mode === 'login' ? 'No account? — Open the gate' : 'Already committed? — Re-enter'}
            </button>
          </div>
        </form>
        <p className="text-center font-mono text-[9px] tracking-[0.2em] uppercase text-[#e8e0d0]/30 mt-6">
          ⚼ By entering, you commit to execute for 30 days
        </p>
      </div>
    </div>
  )
}

export default AuthPage
