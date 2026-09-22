import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, VideoOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IsteMark } from './Logo'
import HeroNetwork from './HeroNetwork'

type HeroBackgroundPreference = 'video' | 'static'

const HERO_BACKGROUND_PREFERENCE_KEY = 'hero-bg-preference'

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
  const [backgroundPreference, setBackgroundPreference] = useState<HeroBackgroundPreference>(() => {
    if (typeof window === 'undefined') return 'video'
    try {
      return window.localStorage.getItem(HERO_BACKGROUND_PREFERENCE_KEY) === 'static' ? 'static' : 'video'
    } catch {
      return 'video'
    }
  })
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )

  const showingVideoBackground = backgroundPreference === 'video'
  const videoCanPlay = showingVideoBackground && !isMobile

  function toggleBackground() {
    const nextPreference = showingVideoBackground ? 'static' : 'video'
    setBackgroundPreference(nextPreference)
    try {
      window.localStorage.setItem(HERO_BACKGROUND_PREFERENCE_KEY, nextPreference)
    } catch {
      // Continue working if storage is unavailable.
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateViewport = () => setIsMobile(mediaQuery.matches)
    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  return (
    <section
      className="hero-shell relative isolate flex items-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: showingVideoBackground ? "url('/homepage-bg-poster.jpg')" : 'none' }}
    >
      <button
        type="button"
        onClick={toggleBackground}
        aria-label={showingVideoBackground ? 'Use static hero background' : 'Use video hero background'}
        title={showingVideoBackground ? 'Use static hero background' : 'Use video hero background'}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/30 bg-[#0A1628]/60 p-2.5 text-white backdrop-blur-sm transition hover:border-gold-light hover:text-gold-light sm:right-6 sm:top-6"
      >
        {showingVideoBackground ? <Video size={17} aria-hidden /> : <VideoOff size={17} aria-hidden />}
      </button>

      {videoCanPlay && (
        <video
          aria-hidden
          src="/homepage-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      {showingVideoBackground && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[-5] bg-[rgba(10,22,40,0.55)]" />
      )}

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

      <div className="container-page relative z-10 grid w-full items-center gap-6 py-10 sm:gap-8 sm:py-14 md:grid-cols-2 lg:py-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="tracking-wide text-turkish-dark dark:text-turkish-light">Easwari Engineering College · Ramapuram</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-ink dark:text-white sm:text-5xl md:text-6xl">
            Indian Society for<br />Technical Education
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#E8D9A0] sm:mt-5 sm:text-lg">
            The student chapter that turns classroom engineering into real-world projects — hackathons,
            workshops, industry sessions and a community that continues beyond the certificate.
          </p>
          <p className="mt-4 text-xs tracking-[0.18em] text-gold-deep dark:text-gold-light sm:text-sm">
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
            <div className="absolute -inset-6 rounded-full border border-ink/15 dark:border-white/15 sm:-inset-8" />
            <div className="absolute -inset-12 hidden rounded-full border border-ink/[0.07] dark:border-white/[0.07] sm:block sm:-inset-16" />
            <IsteMark shine delay={1.2} className="relative h-48 w-48 sm:h-72 sm:w-72 md:h-80 md:w-80 lg:h-[22rem] lg:w-[22rem] xl:h-[24rem] xl:w-[24rem]" />
            {/* Light sweep: its own circle-clipped layer, so the seal's halo stays unclipped */}
            <span aria-hidden className="hero-emblem-shine pointer-events-none absolute inset-0" />
          </div>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#F5F7F8] dark:to-night" />
    </section>
  )
}
