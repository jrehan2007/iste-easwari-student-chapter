import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, SkipForward } from 'lucide-react'

/**
 * The branded entry film, played on its own.
 *
 * Nothing else is mounted while this runs — the header, the ticker and the page
 * itself only come into existence once `onDone` fires, so there is no chance of
 * the ticker or any other strip showing through the film. The gate holds the
 * screen for the length of its own fade-out before handing over.
 *
 * Sound: browsers refuse to autoplay audio, so the film starts muted with an
 * unmute control. Once someone unmutes, the choice is remembered for the
 * session and later plays start with sound.
 *
 * Plays once per browser session. Skips on click, key press or the skip button.
 */
export const INTRO_SEEN_KEY = 'iste_intro'

/** True when the film still has to play: first visit of the session, motion allowed. */
export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return true // private mode — play it, just don't remember
  }
}

const FADE_SECONDS = 0.9

export default function IntroGate({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [leaving, setLeaving] = useState(false)
  const [muted, setMuted] = useState(() => {
    try { return sessionStorage.getItem('iste_sound') !== 'on' } catch { return true }
  })

  function finish() {
    setLeaving((already) => {
      if (already) return already
      try { sessionStorage.setItem(INTRO_SEEN_KEY, '1') } catch { /* private mode */ }
      window.setTimeout(onDone, FADE_SECONDS * 1000)
      return true
    })
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
    const skip = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ') finish() }
    window.addEventListener('keydown', skip)
    // Safety net: if the file stalls, don't strand the visitor on a black screen.
    const bail = window.setTimeout(finish, 12000)
    // The film owns the viewport; nothing behind it should be scrollable.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', skip)
      window.clearTimeout(bail)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000A0B]"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: FADE_SECONDS }}
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
  )
}
