import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  radius: number
  speed: number
  phase: number
  color: string
}

const palette = ['#00A9CE', '#7FDCEF', '#C9A227', '#E8CE72']

export default function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const canvasElement = canvas
    const contextElement = context

    let animationFrame = 0
    let width = 0
    let height = 0
    let particles: Particle[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const bounds = canvasElement.getBoundingClientRect()
      const density = window.innerWidth < 640 ? 18 : 34
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = bounds.width
      height = bounds.height
      canvasElement.width = Math.round(width * pixelRatio)
      canvasElement.height = Math.round(height * pixelRatio)
      contextElement.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      particles = Array.from({ length: density }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: index % 5 === 0 ? 2.2 : 1.2 + Math.random() * 0.8,
        speed: 0.08 + Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2,
        color: palette[index % palette.length],
      }))
    }

    function draw(time: number) {
      contextElement.clearRect(0, 0, width, height)
      const connectionDistance = Math.min(170, width * 0.24)

      particles.forEach((particle) => {
        if (!reduced) {
          particle.y -= particle.speed
          particle.x += Math.sin(time * 0.00025 + particle.phase) * 0.035
          if (particle.y < -12) particle.y = height + 12
          if (particle.x < -12) particle.x = width + 12
          if (particle.x > width + 12) particle.x = -12
        }
      })

      for (let first = 0; first < particles.length; first += 1) {
        const particle = particles[first]
        const pulse = 0.35 + Math.sin(time * 0.001 + particle.phase) * 0.2
        contextElement.beginPath()
        contextElement.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        contextElement.fillStyle = `${particle.color}${Math.round(Math.max(0.12, pulse) * 255).toString(16).padStart(2, '0')}`
        contextElement.fill()

        for (let second = first + 1; second < particles.length; second += 1) {
          const neighbor = particles[second]
          const distance = Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y)
          if (distance > connectionDistance) continue
          const strength = (1 - distance / connectionDistance) * 0.16
          contextElement.beginPath()
          contextElement.moveTo(particle.x, particle.y)
          contextElement.lineTo(neighbor.x, neighbor.y)
          contextElement.strokeStyle = `rgba(127, 220, 239, ${strength})`
          contextElement.lineWidth = 0.7
          contextElement.stroke()
        }
      }

      if (!reduced) animationFrame = window.requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvasElement)
    resize()
    draw(0)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80" />
}
