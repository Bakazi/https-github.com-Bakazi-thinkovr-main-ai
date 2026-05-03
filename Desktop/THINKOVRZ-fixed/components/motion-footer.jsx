'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Mail, Instagram, Twitter, Linkedin, ArrowUpRight, Sparkles } from 'lucide-react'

export function MotionFooter({ supportEmail = 'zmanschoeman@gmail.com' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.15, once: true })

  const letters = 'THINKOVR'.split('')

  return (
    <footer ref={ref} className="relative bg-gradient-to-b from-[#0a0a0b] to-[#050506] border-t border-[rgba(201,168,76,0.25)] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.15), transparent 60%)', filter: 'blur(60px)' }}
      />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-10">
        {/* Giant brand name — animates in letter by letter */}
        <div className="mb-16 md:mb-24">
          <div className="font-display font-light text-[18vw] md:text-[13rem] leading-[0.85] tracking-tight flex flex-wrap">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 80, rotateX: -40 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 1, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
                style={{
                  background: i % 2 === 0 ? 'linear-gradient(180deg, #f0e8d4 0%, #c9a84c 70%, #8a7535 100%)' : 'transparent',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: i % 2 === 0 ? 'transparent' : 'transparent',
                  WebkitTextStroke: i % 2 === 1 ? '1.2px #c9a84c' : 'none',
                  color: 'transparent',
                }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={inView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="h-px origin-left bg-gradient-to-r from-[#c9a84c] via-[#b87333] to-transparent mt-6"
          />
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-16">
          <div className="md:col-span-5">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.4 }}
              className="font-serif italic text-xl md:text-2xl leading-[1.4] text-[#f0e8d4]/85"
            >
              We don't give you options.<br />We give you the <span className="text-[#c9a84c]">move.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.55 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href="/auth" className="btn btn-primary !py-3 !px-6 !text-[11px]">
                <Sparkles size={13} /> Enter Thinkovr
              </Link>
              <a href={`mailto:${supportEmail}`} className="btn btn-ghost !py-3 !px-6 !text-[11px]">
                <Mail size={12} /> Contact
              </a>
            </motion.div>
          </div>

          <div className="md:col-span-3">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#c9a84c] mb-5">Navigate</div>
            <ul className="space-y-3 font-serif text-[17px] text-[#f0e8d4]/80">
              {[['Manifesto', '/#manifesto'], ['The Engine', '/#engine'], ['Blueprint Tiers', '/#tiers'], ['Anti-Portfolio', '/#anti-portfolio'], ['Enter Protocol', '/auth']].map(([l, h], i) => (
                <motion.li key={l}
                  initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.06 }}
                >
                  <Link href={h} className="group inline-flex items-center gap-2 transition hover:text-[#c9a84c]">
                    {l}
                    <ArrowUpRight size={13} className="opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#c9a84c] mb-5">Support</div>
            <motion.a
              href={`mailto:${supportEmail}`}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="inline-flex items-center gap-3 font-serif text-xl text-[#f0e8d4]/90 hover:text-[#c9a84c] transition break-all"
            >
              <Mail size={18} className="text-[#c9a84c] flex-shrink-0" /> {supportEmail}
            </motion.a>
            <p className="font-serif text-[15px] text-[#f0e8d4]/55 mt-4 leading-relaxed">
              Serious questions only. Response typically within 24 hours.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Instagram, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
              ].map((s, i) => (
                <motion.a key={i} href={s.href}
                  initial={{ opacity: 0, scale: 0.6 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.85 + i * 0.06 }}
                  className="w-10 h-10 border border-[rgba(201,168,76,0.3)] flex items-center justify-center hover:bg-[#c9a84c] hover:text-[#0a0a0b] hover:border-[#c9a84c] transition"
                >
                  <s.icon size={14} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom band */}
        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.1 }}
          className="border-t border-[rgba(201,168,76,0.18)] pt-6 flex flex-col md:flex-row gap-3 justify-between items-center font-mono text-[10px] tracking-[0.2em] uppercase text-[#f0e8d4]/50"
        >
          <div>⬡ The Thinkovr Engine — Est. 2026</div>
          <div className="flex items-center gap-6">
            <span className="hidden md:inline">© 2026 — One Move, Zero Fluff</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4a9c4a] shadow-[0_0_8px_#4a9c4a]" /> Engine Online</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default MotionFooter
