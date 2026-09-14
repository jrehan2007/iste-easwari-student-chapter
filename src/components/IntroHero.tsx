import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Volume2, VolumeX, SkipForward } from 'lucide-react'
import { IsteMark } from './Logo'

/**
 * Branded entry sequence.
 *
 * The intro film plays fullscreen, then cross-fades into the hero — the film
 * ends on the seal centred, so the hero's seal picks up almost exactly where
 * the last frame leaves it.
 *
 * Sound: browsers refuse to autoplay audio, so the film starts muted with an
 * unmute control. Once someone unmutes, the choice is remembered for the
 * session and later plays start with sound.
 *
 * Plays once per browser session. Skips on click, key press or the skip button,
 * and is bypassed under prefers-reduced-motion.
 */
export default function IntroHero() {
  const reduce = useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)

  const seen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('iste_intro') === '1'
  const [playing, setPlaying] = useState(!seen && !reduce)
  const [muted, setMuted] = useState(
    typeof sessionStorage === 'undefined' || sessionStorage.getItem('iste_sound') !== 'on'
  )

  function finish() {
    setPlaying(false)
    try { sessionStorage.setItem('iste_intro', '1') } catch { /* private mode */ }
  }

  function toggleSound() {
    const next = !muted
    setMuted(next)
    try { sessionStorage.setItem('iste_sound', next ? 'off' : 'on') } catch { /* private mode */ }
    if (video.current) {
      video.current.muted = next
      // Unmuting counts as the gesture browsers require, so this play() is allowed.
      if (!next) video.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    if (!playing) return
    const skip = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ') finish() }
    window.addEventListener('keydown', skip)
    // Safety net: if the file stalls, don't strand the visitor on a black screen.
    const bail = window.setTimeout(finish, 12000)
    return () => { window.removeEventListener('keydown', skip); window.clearTimeout(bail) }
  }, [playing])

  return (
    <section className="hero-shell relative isolate overflow-hidden">
      <AnimatePresence>
        {playing && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
          >
            <video
              ref={video}
              src="/intro.mp4"
              poster="/intro-poster.jpg"
              autoPlay
              muted={muted}
              playsInline
              preload="auto"
              onEnded={finish}
              onError={finish}
              onClick={finish}
              className="h-full w-full object-contain"
            />

            <div className="absolute bottom-6 right-6 flex gap-2">
              <button onClick={toggleSound}
                aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                className="rounded-full border border-white/30 bg-black/40 p-3 text-white backdrop-blur transition hover:border-white/70">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={finish}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 py-3 text-sm text-white backdrop-blur transition hover:border-white/70">
                <SkipForward size={16} /> Skip
              </button>
            </div>

            {muted && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="pointer-events-none absolute bottom-24 right-6 text-xs tracking-wide text-white/60">
                Tap the speaker for sound
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep navy field, matching the film's background so the handoff is seamless */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-gradient absolute inset-0" />
        <div className="hero-blue-accent absolute right-[8%] top-[10%] h-[38rem] w-[38rem] rounded-full blur-[120px]" />
        <div className="hero-gold-accent absolute -left-24 bottom-[-8rem] h-[26rem] w-[26rem] rounded-full blur-[110px]" />
        {[...Array(16)].map((_, i) => (
          <motion.span key={i} className="absolute rounded-full bg-ink/15 dark:bg-white"
            style={{
              left: `${(i * 37) % 96}%`, top: `${(i * 53) % 88}%`,
              width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2, opacity: 0.22,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.08, 0.45, 0.08] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }} />
        ))}
      </div>

      <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={!playing ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 1.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="tracking-wide text-turkish-dark dark:text-turkish-light">Easwari Engineering College · Ramapuram</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-ink dark:text-white sm:text-5xl md:text-6xl">
            Indian Society for<br />Technical Education
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70 dark:text-white/70">
            The student chapter that turns classroom engineering into built things — hackathons,
            workshops, industry sessions and a community that keeps going after the certificate.
          </p>
          <p className="mt-4 text-sm tracking-[0.18em] text-gold-deep dark:text-gold-light">
            INNOVATION · TECHNICAL EXCELLENCE · ENDLESS POSSIBILITIES
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events" className="btn-primary">See upcoming events</Link>
            <Link to="/membership"
              className="btn border border-ink/30 text-ink hover:border-turkish hover:text-turkish-dark dark:border-white/40 dark:text-white dark:hover:text-turkish-light">
              Get membership
            </Link>
          </div>
        </motion.div>

        {/* The seal lands roughly where the film left it, then settles */}
        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ scale: 1.35, opacity: 0, y: -30 }}
          animate={!playing ? { scale: 1, opacity: 1, y: 0 } : { scale: 1.35, opacity: 0, y: -30 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <div className="absolute -inset-8 rounded-full border border-ink/15 dark:border-white/15" />
            <div className="absolute -inset-16 rounded-full border border-ink/[0.07] dark:border-white/[0.07]" />
            <IsteMark shine delay={1.2} className="relative h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80" />
          </div>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#F5F7F8] dark:to-night" />
    </section>
  )
}
