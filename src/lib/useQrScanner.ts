import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/** Plain-language reasons the camera didn't start, for the people holding the phone. */
function describeCameraError(error: unknown): string {
  const name = (error as { name?: string })?.name ?? ''
  const message = String((error as { message?: string })?.message ?? error ?? '')
  if (name === 'NotAllowedError' || /permission|denied|not allowed/i.test(message)) {
    return 'Camera permission was blocked. Allow camera access for this site in your browser settings, then try again.'
  }
  if (name === 'NotFoundError' || /no camera|not found|Requested device not found/i.test(message)) {
    return 'No camera was found on this device.'
  }
  if (name === 'NotReadableError' || /could not start|in use|NotReadable/i.test(message)) {
    return 'The camera is being used by another app. Close it and try again.'
  }
  return message || 'Could not start the camera.'
}

/** Why scanning can't work in this browser at all, or null if it can. */
export function cameraUnavailableReason(): string | null {
  if (typeof window === 'undefined') return null
  if (!window.isSecureContext) {
    return 'Phones only allow the camera on secure (https://) pages. Open the deployed site, not a http:// or local network address.'
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser cannot use the camera. Try Chrome or Safari.'
  }
  return null
}

/**
 * Runs an html5-qrcode camera scanner in the element with `elementId` while
 * `active` is true. The element must be rendered whenever `active` is.
 *
 * - The scan box is sized from the camera view, so it fits narrow phone screens
 *   (a fixed box larger than the view makes the library refuse to start).
 * - Stopping waits for a start that is still in progress, so toggling quickly
 *   doesn't leave the camera on or throw "already under transition".
 * - `onDecode` is read through a ref: a new callback each render doesn't
 *   restart the camera.
 */
export function useQrScanner(elementId: string, active: boolean, onDecode: (text: string) => void) {
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  useEffect(() => {
    if (!active) return
    setError(null)
    const blocked = cameraUnavailableReason()
    if (blocked) { setError(blocked); return }
    if (!document.getElementById(elementId)) return

    const scanner = new Html5Qrcode(elementId, false)
    let cancelled = false
    setStarting(true)

    const started = scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        // 70% of the shorter side of the camera view, never below the library's 50px minimum
        qrbox: (width, height) => {
          const size = Math.max(50, Math.floor(Math.min(width, height) * 0.7))
          return { width: size, height: size }
        },
        aspectRatio: 1,
      },
      (text) => { if (!cancelled) onDecodeRef.current(text) },
      () => {},
    ).then(
      () => true,
      (e) => { if (!cancelled) setError(describeCameraError(e)); return false },
    ).finally(() => { if (!cancelled) setStarting(false) })

    return () => {
      cancelled = true
      setStarting(false)
      // Only stop a camera that actually started, and only once it has.
      started.then((ok) => { if (ok) return scanner.stop().then(() => scanner.clear()) }).catch(() => {})
    }
  }, [active, elementId])

  return { error, starting }
}
