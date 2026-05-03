'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import { useRef } from 'react'

export function ZoomParallax({ images }) {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  })

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4])
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5])
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6])
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8])
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9])

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9]

  const opacityCaption = useTransform(scrollYProgress, [0, 0.35], [1, 0])

  return (
    <div ref={container} className="relative h-[260vh] bg-[#0a0a0b]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {images.map(({ src, alt }, index) => {
          const scale = scales[index % scales.length]
          return (
            <motion.div
              key={index}
              style={{ scale }}
              className={`absolute top-0 flex h-full w-full items-center justify-center ${index === 1 ? '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]' : ''} ${index === 2 ? '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]' : ''} ${index === 3 ? '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]' : ''} ${index === 4 ? '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]' : ''} ${index === 5 ? '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]' : ''} ${index === 6 ? '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]' : ''} `}
            >
              <div className="relative h-[25vh] w-[25vw] overflow-hidden ring-1 ring-[#c9a84c]/30" style={{ boxShadow: '0 20px 50px -20px rgba(0,0,0,0.8)' }}>
                <img
                  src={src}
                  alt={alt || `Parallax image ${index + 1}`}
                  className="h-full w-full object-cover"
                  style={{ filter: 'brightness(0.55) contrast(1.15) saturate(0.8)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/60 via-transparent to-[#0a0a0b]/20 pointer-events-none" />
              </div>
            </motion.div>
          )
        })}

        {/* Caption overlay (fades as user scrolls deeper) */}
        <motion.div style={{ opacity: opacityCaption }} className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-4xl px-6">
            <div className="font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-[#c9a84c] mb-4">⬡ The Parameters We Respect</div>
            <h2 className="font-display font-light text-4xl md:text-6xl leading-[1.05] text-[#f0e8d4]">
              Capital. Time. Skill.<br />
              <em className="italic font-serif bg-gradient-to-r from-[#e5c968] via-[#c9a84c] to-[#b87333] bg-clip-text text-transparent">Geography. Fear.</em>
            </h2>
            <p className="font-serif italic text-lg md:text-xl text-[#f0e8d4]/70 mt-6">Your five real constraints. Our single deliverable.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ZoomParallax
