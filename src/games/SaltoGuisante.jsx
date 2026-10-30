import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, INK_2, Overlay, PAPER, roundRect, setupCanvas, startLoop } from './shared'

const W = 400
const H = 640
const GRAVITY = 1500
const JUMP = -720
const SPRING = -1180
const SPEED = 330
const R = 17 // radio del guisante
const PW = 72 // ancho de ladrillo
const PH = 16

const COLORS = { normal: '#F3EEFF', move: '#5CC8FF', fragile: '#FF9248' }

function newWorld() {
  const platforms = [{ x: W / 2 - PW / 2, y: H - 60, type: 'normal', dir: 0 }]
  const world = { platforms, topY: H - 60, player: { x: W / 2, y: H - 60 - R, vx: 0, vy: JUMP, squash: 0, face: 1 }, camY: 0, startY: H - 60, maxH: 0, particles: [] }
  while (world.topY > -H) addPlatform(world)
  return world
}

function addPlatform(world) {
  const h = world.maxH
  const diff = Math.min(1, h / 600) // 0 → 1 a medida que subes
  const gap = 58 + Math.random() * (40 + diff * 50)
  const y = world.topY - gap
  const r = Math.random()
  let type = 'normal'
  if (r < 0.12 + diff * 0.2) type = 'move'
  else if (r < 0.2 + diff * 0.3) type = 'fragile'
  // Nunca dos ladrillos frágiles seguidos: siempre debe haber camino.
  const prev = world.platforms[world.platforms.length - 1]
  if (type === 'fragile' && prev.type === 'fragile') type = 'normal'
  const spring = type === 'normal' && Math.random() < 0.06
  world.platforms.push({ x: Math.random() * (W - PW), y, type, dir: Math.random() < 0.5 ? -1 : 1, spring, speed: 60 + diff * 90 })
  world.topY = y
}

export default function SaltoGuisante({ onFinish, onStart }) {
  const canvasRef = useRef(null)
  const world = useRef(newWorld())
  const input = useRef({ left: false, right: false, pointer: 0 })
  const [phase, setPhase] = useState('ready') // ready | playing | over
  const phaseRef = useRef(phase)
  const [result, setResult] = useState({ score: 0, record: false })

  phaseRef.current = phase

  const start = () => {
    world.current = newWorld()
    setPhase('playing')
    onStart?.()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas, W, H)
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H * 3, r: Math.random() * 1.6 + 0.4 }))

    const update = (dt) => {
      const w = world.current
      const p = w.player
      const dir = (input.current.left || input.current.pointer < 0 ? -1 : 0) + (input.current.right || input.current.pointer > 0 ? 1 : 0)
      p.vx += (dir * SPEED - p.vx) * Math.min(1, dt * 12)
      if (dir) p.face = dir
      p.x += p.vx * dt
      if (p.x < -R) p.x = W + R
      if (p.x > W + R) p.x = -R

      const prevBottom = p.y + R
      p.vy += GRAVITY * dt
      p.y += p.vy * dt
      p.squash = Math.max(0, p.squash - dt * 4)

      for (const pl of w.platforms) {
        if (pl.type === 'move') {
          pl.x += pl.dir * pl.speed * dt
          if (pl.x < 0 || pl.x > W - PW) pl.dir *= -1
        }
        if (pl.broken) {
          pl.y += 420 * dt
          continue
        }
        const bottom = p.y + R
        if (p.vy > 0 && prevBottom <= pl.y + 2 && bottom >= pl.y && p.x > pl.x - R * 0.6 && p.x < pl.x + PW + R * 0.6) {
          p.y = pl.y - R
          p.vy = pl.spring ? SPRING : JUMP
          p.squash = 1
          if (pl.type === 'fragile') {
            pl.broken = true
            for (let i = 0; i < 8; i++) w.particles.push({ x: pl.x + Math.random() * PW, y: pl.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 200, life: 0.7 })
          }
        }
      }

      // Cámara: solo sube.
      const target = p.y - H * 0.42
      if (target < w.camY) w.camY = target
      w.maxH = Math.max(w.maxH, Math.round((w.startY - (p.y + R)) / 12))

      while (w.topY > w.camY - 80) addPlatform(w)
      w.platforms = w.platforms.filter((pl) => pl.y < w.camY + H + 60)

      w.particles.forEach((pt) => {
        pt.vy += GRAVITY * 0.5 * dt
        pt.x += pt.vx * dt
        pt.y += pt.vy * dt
        pt.life -= dt
      })
      w.particles = w.particles.filter((pt) => pt.life > 0)

      if (p.y - R > w.camY + H) {
        phaseRef.current = 'over'
        const record = onFinish(w.maxH)
        setResult({ score: w.maxH, record })
        setPhase('over')
      }
    }

    const draw = (t) => {
      const w = world.current
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)

      // Estrellas con parallax
      ctx.fillStyle = PAPER
      for (const s of stars) {
        const y = (((s.y - w.camY * 0.25) % (H * 3)) + H * 3) % (H * 3)
        if (y < H) {
          ctx.globalAlpha = 0.25 + s.r * 0.2
          ctx.fillRect(s.x, y, s.r, s.r)
        }
      }
      ctx.globalAlpha = 1

      // Marcas de altura cada 50 m
      ctx.font = `600 11px ${FONT}`
      ctx.fillStyle = 'rgba(243,238,255,.28)'
      ctx.strokeStyle = 'rgba(243,238,255,.12)'
      for (let m = 50; ; m += 50) {
        const y = w.startY - m * 12 - w.camY
        if (y < -20) break
        if (y > H) continue
        ctx.beginPath()
        ctx.setLineDash([4, 6])
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillText(`${m} m`, 8, y - 6)
      }

      // Ladrillos
      for (const pl of w.platforms) {
        const y = pl.y - w.camY
        ctx.save()
        if (pl.broken) {
          ctx.globalAlpha = 0.5
          ctx.translate(pl.x + PW / 2, y + PH / 2)
          ctx.rotate(0.25)
          ctx.translate(-(pl.x + PW / 2), -(y + PH / 2))
        }
        ctx.fillStyle = COLORS[pl.type]
        roundRect(ctx, pl.x, y, PW, PH, 3)
        ctx.fill()
        ctx.strokeStyle = INK
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pl.x, y + PH / 2)
        ctx.lineTo(pl.x + PW, y + PH / 2)
        ctx.moveTo(pl.x + PW * 0.33, y)
        ctx.lineTo(pl.x + PW * 0.33, y + PH / 2)
        ctx.moveTo(pl.x + PW * 0.66, y + PH / 2)
        ctx.lineTo(pl.x + PW * 0.66, y + PH)
        if (pl.type === 'fragile') {
          ctx.moveTo(pl.x + PW * 0.5, y)
          ctx.lineTo(pl.x + PW * 0.56, y + PH * 0.5)
          ctx.lineTo(pl.x + PW * 0.47, y + PH)
        }
        ctx.stroke()
        if (pl.spring) {
          ctx.fillStyle = '#FF6FA8'
          roundRect(ctx, pl.x + PW / 2 - 9, y - 10, 18, 10, 2)
          ctx.fill()
          ctx.strokeStyle = INK
          ctx.beginPath()
          ctx.moveTo(pl.x + PW / 2 - 7, y - 5)
          ctx.lineTo(pl.x + PW / 2 + 7, y - 5)
          ctx.stroke()
        }
        ctx.restore()
      }

      ctx.fillStyle = '#FF9248'
      for (const pt of w.particles) ctx.fillRect(pt.x, pt.y - w.camY, 5, 5)

      // Guisante
      const p = w.player
      const py = p.y - w.camY
      const idle = phaseRef.current === 'ready' ? Math.sin(t / 220) * 4 : 0
      const sq = p.squash * 0.25
      ctx.save()
      ctx.translate(p.x, py + idle)
      ctx.scale(1 + sq, 1 - sq)
      ctx.fillStyle = '#4FAE5F'
      ctx.beginPath()
      ctx.ellipse(0, 3, R, R * 0.95, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#8FE09B'
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#D8F7DC'
      ctx.beginPath()
      ctx.arc(-6, -7, 3.5, 0, Math.PI * 2)
      ctx.fill()
      const look = p.face * 2.5
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(-5 + look, -1, 2.6, 0, Math.PI * 2)
      ctx.arc(5 + look, -1, 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = INK
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      if (p.vy > 300) ctx.arc(look, 7, 3, 0, Math.PI * 2)
      else ctx.arc(look, 4, 5, 0.2 * Math.PI, 0.8 * Math.PI)
      ctx.stroke()
      ctx.restore()

      // Marcador
      if (phaseRef.current !== 'ready') {
        ctx.fillStyle = INK_2
        roundRect(ctx, W - 108, 12, 96, 40, 10)
        ctx.fill()
        ctx.fillStyle = PAPER
        ctx.font = `800 22px ${FONT}`
        ctx.textAlign = 'right'
        ctx.fillText(`${w.maxH} m`, W - 22, 40)
        ctx.textAlign = 'left'
      }
    }

    const stop = startLoop((dt, t) => {
      if (phaseRef.current === 'playing') update(dt)
      draw(t)
    })

    const onKey = (down) => (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') input.current.left = down
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') input.current.right = down
      if (down && (e.key === ' ' || e.key === 'Enter') && phaseRef.current !== 'playing') start()
    }
    const kd = onKey(true)
    const ku = onKey(false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      stop()
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    input.current.pointer = e.clientX - rect.left < rect.width / 2 ? -1 : 1
  }

  return (
    <div className="game game--tall">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={pointer}
        onPointerMove={(e) => e.buttons && pointer(e)}
        onPointerUp={() => (input.current.pointer = 0)}
        onPointerLeave={() => (input.current.pointer = 0)}
        onPointerCancel={() => (input.current.pointer = 0)}
        aria-label="Salto Guisante. Usa las flechas izquierda y derecha."
      />
      {phase === 'ready' && (
        <Overlay title="Salto Guisante" action="Empezar" onAction={start}>
          Muévete con ← → o tocando los lados. Los ladrillos naranjas se rompen, los rosados te lanzan alto.
        </Overlay>
      )}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : 'Te caíste'} action="Saltar otra vez" onAction={start}>
          Llegaste a <strong>{result.score} m</strong>.
        </Overlay>
      )}
    </div>
  )
}
