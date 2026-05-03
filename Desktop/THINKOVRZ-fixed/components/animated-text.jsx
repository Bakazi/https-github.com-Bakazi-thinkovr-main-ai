'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Word-by-word fade-in. Each word materializes softly.
export function FadeWords({ text, className = '', delay = 0, stagger = 0.06, el: Element = 'span' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.2, once: true })
  const words = text.split(' ')
  return (
    <Element ref={ref} className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.85, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {w}
        </motion.span>
      ))}
    </Element>
  )
}

// Character-by-character for emphasis
export function FadeChars({ text, className = '', delay = 0, stagger = 0.02 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.2, once: true })
  return (
    <span ref={ref} className={className}>
      {text.split('').map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block' }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </span>
  )
}

// Generic reveal-in container
export function FadeUp({ children, delay = 0, duration = 0.9, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.15, once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
