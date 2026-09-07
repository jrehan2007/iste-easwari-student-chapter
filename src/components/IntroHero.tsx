import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IsteMark } from './Logo'

/**
 * Branded entry sequence.
 *
 * The seal rises fullscreen, the light sweeps across it left to right, then it
 * drifts slowly into the right of the hero while the ISTE full form reveals on
 * the left. Skips on any scroll, click or key press.
 */
export default function IntroHero() {
  const reduce = useReducedMotion()
  const [settled, setSettled] = useState(Boolean(reduce))

  useEffect(() => {
    if (reduce) return
    const skip = () => setSettled(true)
    const timer = window.setTimeout(skip, 5000)
    window.addEventListener('scroll', skip, { once: true })
    window.addEventListener('click', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', skip)
      window.removeEventListener('click', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [reduce])

  return (
    <section className="relative isolate overflow-hidden bg-[#050B1A]">
      {/* Deep navy field with light pooling behind the seal */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_28%,#1B3A6B_0%,#0C1B36_45%,#050B1A_100%)]" />
        <div className="absolute right-[8%] top-[10%] h-[38rem] w-[38rem] rounded-full bg-turkish/20 blur-[120px]" />
        <div className="absolute -left-24 bottom-[-8rem] h-[26rem] w-[26rem] rounded-full bg-turkish-dark/25 blur-[110px]" />
        {[...Array(16)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 96}%`, top: `${(i * 53) % 88}%`,
              width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2, opacity: 0.22,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.08, 0.45, 0.08] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Fullscreen opening */}
      {!settled && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B1A]"
          animate={{ opacity: [1, 1, 1, 0] }}
          transition={{ duration: 5, times: [0, 0.6, 0.85, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,#1B3A6B_0%,#050B1A_100%)]" />
          <motion.div
            initial={{ scale: 0.25, opacity: 0, rotate: -30 }}
            animate={{ scale: [0.25, 1.04, 1, 0.96], opacity: [0, 1, 1, 1], rotate: [-30, 3, 0, 0] }}
            transition={{ duration: 4.6, times: [0, 0.3, 0.45, 1], ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <IsteMark shine className="h-60 w-60 sm:h-80 sm:w-80" />
          </motion.div>
        </motion.div>
      )}

      <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={settled ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="tracking-wide text-turkish-light">Easwari Engineering College · Ramapuram</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
            Indian Society for<br />Technical Education
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
            The student chapter that turns classroom engineering into built things — hackathons,
            workshops, industry sessions and a community that keeps going after the certificate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events" className="btn-primary">See upcoming events</Link>
            <Link to="/membership"
              className="btn border border-white/40 text-white hover:border-turkish hover:text-turkish-light">
              Get membership
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ scale: 1.5, opacity: 0, rotate: -16, y: -40 }}
          animate={settled ? { scale: 1, opacity: 1, rotate: 0, y: 0 }
                           : { scale: 1.5, opacity: 0, rotate: -16, y: -40 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <div className="absolute -inset-8 rounded-full border border-white/15" />
            <div className="absolute -inset-16 rounded-full border border-white/[0.07]" />
            <IsteMark shine delay={1.5} className="relative h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80" />
          </div>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-night" />
    </section>
  )
}
