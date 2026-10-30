import { useEffect, useRef } from 'react'

const COLORS = ['#FFD23F', '#FF6FA8', '#5CC8FF', '#7BD389', '#A78BFA', '#FF9248', '#4FE3D7']

/** Lluvia de confeti en canvas. Se dispara cada vez que cambia `fire`. */
export default function Confetti({ fire }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!fire) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const bits = Array.from({ length: 160 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      return {
        x: side > 0 ? W * 0.1 : W * 0.9,
        y: H * 0.75,
        vx: -side * (200 + Math.random() * 500) * -1,
        vy: -(500 + Math.random() * 700),
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 12,
        color: COLORS[i % COLORS.length],
        round: Math.random() < 0.3,
      }
    })
    let raf
    let last = performance.now()
    const start = last
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, W, H)
      for (const b of bits) {
        b.vy += 1100 * dt
        b.vx *= 0.99
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.rot += b.vr * dt
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.rot)
        ctx.fillStyle = b.color
        if (b.round) {
          ctx.beginPath()
          ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.rot)))
        ctx.restore()
      }
      if (now - start < 3200) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [fire])

  return <canvas ref={ref} className="confetti" aria-hidden="true" />
}
