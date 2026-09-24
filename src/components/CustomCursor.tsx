import { useEffect, useRef, useState } from 'react'

// Only for a real mouse: phones and tablets have no cursor to replace.
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const INTERACTIVE = 'a, button, [role="button"], label, select, summary, [tabindex]:not([tabindex="-1"])'
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="file"]), textarea, [contenteditable="true"]'

/**
 * A round cursor: a small dot that sits exactly on the pointer and a ring that
 * follows it with a little lag. The ring grows over anything clickable and
 * tightens while the button is held. Over text boxes the normal I-beam comes
 * back so typing and selecting still feel right.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = window.matchMedia(FINE_POINTER)
    const update = () => setEnabled(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    root.classList.add('has-custom-cursor')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const target = { x: -100, y: -100 }
    const current = { x: -100, y: -100 }
    let frame = 0
    let visible = false

    const setState = (name: string, on: boolean) => {
      dot.current?.classList.toggle(name, on)
      ring.current?.classList.toggle(name, on)
    }
    const place = (el: HTMLDivElement | null, x: number, y: number) => {
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }

    // The ring eases toward the pointer; the loop stops once it has caught up.
    const tick = () => {
      const ease = reduced ? 1 : 0.2
      current.x += (target.x - current.x) * ease
      current.y += (target.y - current.y) * ease
      place(ring.current, current.x, current.y)
      if (Math.abs(target.x - current.x) > 0.1 || Math.abs(target.y - current.y) > 0.1) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        current.x = target.x
        current.y = target.y
        setState('is-visible', true)
      }
      place(dot.current, target.x, target.y)
      if (!frame) frame = requestAnimationFrame(tick)

      const el = e.target instanceof Element ? e.target : null
      const typing = !!el?.closest(TEXT_ENTRY)
      setState('is-text', typing)
      setState('is-hover', !typing && !!el?.closest(INTERACTIVE))
    }
    const onDown = () => setState('is-down', true)
    const onUp = () => setState('is-down', false)
    // Leaving the window (or entering an embedded iframe) hides it
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) { visible = false; setState('is-visible', false) }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('mouseout', onOut)
    return () => {
      cancelAnimationFrame(frame)
      root.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseout', onOut)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={ring} aria-hidden className="custom-cursor-ring" />
      <div ref={dot} aria-hidden className="custom-cursor-dot" />
    </>
  )
}
