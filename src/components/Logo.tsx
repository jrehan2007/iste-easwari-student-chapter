import { useState, type CSSProperties, type MouseEvent } from 'react'
import { motion } from 'framer-motion'

/**
 * The ISTE seal with its light treatment.
 *
 * A specular band sweeps left-to-right across the face of the seal, clipped to
 * the circle. It runs slowly, then rests — one pass roughly every ten seconds —
 * so it reads as a considered highlight rather than a blinking effect.
 * A soft halo breathes underneath it in the same rhythm.
 */
export function IsteMark({
  className = 'h-11 w-11',
  shine = false,
  delay = 0,
}: { className?: string; shine?: boolean; delay?: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, light: 50 })

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (event.currentTarget.ownerDocument.defaultView?.matchMedia('(pointer: coarse)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    setTilt({ x: y * -8, y: x * 8, light: 50 + x * 60 })
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0, light: 50 })
  }

  const logo = <img src="/iste-logo.png" alt="ISTE" className="relative h-full w-full rounded-full object-cover" />

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        perspective: 1000,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d',
      } as CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
    >
      {!shine && logo}

      {shine && <>
      {/* Halo, breathing with the sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-[12%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,162,39,.42) 0%, rgba(0,169,206,.18) 45%, transparent 72%)' }}
        animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.95, 1.06, 0.95] }}
        transition={{ duration: 10, delay, repeat: Infinity, ease: 'easeInOut' }}
      />

      {logo}

      {/* Specular sweep, left to right, clipped to the circle */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-[-70%] w-[45%]"
          style={{
            background:
              'linear-gradient(100deg, transparent 0%, rgba(255,255,255,.35) 30%, rgba(255,255,255,.92) 50%, rgba(255,255,255,.35) 70%, transparent 100%)',
            filter: 'blur(7px)',
            mixBlendMode: 'screen',
            rotate: '14deg',
          }}
          initial={{ x: '-190%' }}
          animate={{ x: ['-190%', '-190%', '300%', '300%'] }}
          transition={{
            duration: 10,
            delay,
            times: [0, 0.12, 0.42, 1],   // sweep takes ~3s, then rests ~6s
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>

      {/* Rim catch — the edge picks up the light a beat after the sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: 'inset 0 0 22px 2px rgba(255,255,255,.5)' }}
        animate={{ opacity: [0, 0, 0.9, 0, 0] }}
        transition={{ duration: 10, delay, times: [0, 0.18, 0.3, 0.5, 1], repeat: Infinity, ease: 'easeInOut' }}
      />
      </>}

      {/* Pointer-driven reflection remains inert for touch and stylus input. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        animate={{ opacity: tilt.x || tilt.y ? 0.28 : 0, x: `${tilt.light - 50}%` }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,.85) 50%, transparent 70%)',
          filter: 'blur(5px)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}

/** The college wordmark is dark maroon artwork, so it gets a white plate on dark backgrounds. */
export function EaswariMark({ className = 'h-11', plate = false }: { className?: string; plate?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-sm ${plate ? 'bg-white px-2 py-1' : 'bg-white px-2 py-1'}`}>
      <img src="/easwari-logo.webp" alt="Easwari Engineering College" className={`${className} w-auto`} />
    </span>
  )
}
