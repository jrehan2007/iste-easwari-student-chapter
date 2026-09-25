import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IsteMark } from './Logo'
import HeroNetwork from './HeroNetwork'
import Ferrofluid from './Ferrofluid'
import { useTheme } from '../context/ThemeContext'

// Module-level so each array keeps its identity: Ferrofluid rebuilds its WebGL
// scene whenever a prop changes, and an inline literal would change every render.
const FERROFLUID_COLORS_DARK = ['#0A1628', '#C9A227', '#0A1628']
const FERROFLUID_COLORS_LIGHT = ['#F5F7FA', '#1B3A6B', '#C9A227']

const MOBILE_QUERY = '(max-width: 767px)'

/**
 * The opening panel of the home page.
 *
 * It is sized to fill whatever the header leaves of the viewport (see
 * `--site-header-h` in Header), so on arrival the hero is all there is —
 * the ticker and the sections under it come in on scroll.
 *
 * The entry film that used to live here now runs on its own, ahead of the whole
 * app, in IntroGate.
 */
export default function Hero() {
  const isDark = useTheme().theme === 'dark'
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const updateViewport = () => setIsMobile(mediaQuery.matches)
    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  // The shader runs per pixel, so cap the backing resolution: 1x on phones,
  // at most 1.5x elsewhere (the same cap HeroNetwork uses).
  const ferrofluidDpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)

  return (
    <section className="hero-shell relative isolate flex items-center overflow-hidden">
      {/* Solid base under the canvas, since the fluid draws with transparency:
          navy in dark mode, white in light mode. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-white dark:bg-[#0A1628]">
        <Ferrofluid
          dpr={ferrofluidDpr}
          colors={isDark ? FERROFLUID_COLORS_DARK : FERROFLUID_COLORS_LIGHT}
          speed={0.5}
          scale={1.6}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={2.5}
          shimmer={1.5}
          glow={2}
          flowDirection="down"
          // Softer on the white light-mode background
          opacity={isDark ? 1 : 0.5}
          mouseInteraction={!isMobile}
          mouseStrength={1}
          mouseRadius={0.35}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[-5] bg-[rgba(255,255,255,0.25)] dark:bg-[rgba(10,22,40,0.55)]" />

      {/* Deep navy field, matching the film's background so the handoff is seamless */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-gradient absolute inset-0" />
        <div className="hero-blue-accent absolute right-[8%] top-[10%] h-[38rem] w-[38rem] rounded-full blur-[120px]" />
        <div className="hero-gold-accent absolute -left-24 bottom-[-8rem] h-[26rem] w-[26rem] rounded-full blur-[110px]" />
      </div>

      <HeroNetwork />

      {/* Centred with flex, not a translate class: the animation writes its own
          inline transform, which would override one set in the class list. */}
      <motion.div aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden text-center"
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
        <span className="hero-word-layer hero-iste-mark inline-block whitespace-nowrap text-[clamp(9rem,32vw,30rem)] font-bold leading-none tracking-[0.08em]">
          ISTE
        </span>
      </motion.div>

      <div className="container-page relative z-10 grid w-full items-center gap-8 py-10 sm:gap-10 sm:py-14 md:grid-cols-2 lg:gap-14 lg:py-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-medium tracking-wide text-turkish-dark dark:text-turkish-light sm:text-sm">Easwari Engineering College · Ramapuram</p>
          <h1 className="font-display mt-2.5 text-3xl font-bold leading-[1.12] text-ink dark:text-white sm:text-4xl md:text-5xl lg:text-5xl">
            Indian Society for<br />Technical Education
          </h1>
          <p className="mt-3.5 max-w-lg text-sm leading-relaxed text-ink/80 dark:text-[#E8D9A0] sm:mt-4 sm:text-base lg:text-lg">
            The student chapter that turns classroom engineering into real-world projects — hackathons,
            workshops, industry sessions and a community that continues beyond the certificate.
          </p>
          <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-gold-deep dark:text-gold-light sm:text-sm">
            INNOVATION · TECHNICAL EXCELLENCE · ENDLESS POSSIBILITIES
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <Link to="/events" className="btn-primary hero-interactive">See upcoming events</Link>
            <Link to="/membership"
              className="btn hero-interactive border border-ink/30 text-ink hover:border-turkish hover:text-turkish-dark dark:border-white/40 dark:text-white dark:hover:text-turkish-light">
              Get membership
            </Link>
          </div>
        </motion.div>

        {/* The seal lands roughly where the film left it, then settles */}
        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ scale: 1.35, opacity: 0, y: -30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-logo-interactive relative">
            <div className="absolute -inset-5 rounded-full border border-ink/15 dark:border-white/15 sm:-inset-6 lg:-inset-8" />
            <div className="absolute -inset-10 rounded-full border border-ink/[0.07] dark:border-white/[0.07] sm:-inset-12 lg:-inset-14" />
            <IsteMark shine delay={1.2} className="relative h-48 w-48 sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-80 lg:w-80 xl:h-[22rem] xl:w-[22rem]" />
            {/* Light sweep: its own circle-clipped layer, so the seal's halo stays unclipped */}
            <span aria-hidden className="hero-emblem-shine pointer-events-none absolute inset-0" />
          </div>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#F5F7F8] dark:to-night" />
    </section>
  )
}
