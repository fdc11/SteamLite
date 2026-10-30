import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, INK_2, Overlay, PAPER, roundRect, setupCanvas, startLoop } from './shared'

const W = 640
const H = 320
const GROUND = H - 52
const GRAVITY = 2700
const JUMP = -920
const SHORT_HOP = -380
const LW = 44 // ancho de la llama (caja de choque)
const LH = 54

const TYPES = [
  { kind: 'cactus', w: 20, h: 40 },
  { kind: 'cactus', w: 26, h: 58 },
  { kind: 'double', w: 52, h: 44 },
  { kind: 'rock', w: 36, h: 22 },
]

function newState() {
  return { x: 90, y: GROUND - LH, vy: 0, onGround: true, holding: false, speed: 330, dist: 0, obstacles: [], next: 500, legs: 0, dust: [] }
}

export default function CorreLlama({ color, onFinish, onStart }) {
  const canvasRef = useRef(null)
  const state = useRef(newState())
  const [phase, setPhase] = useState('ready')
  const phaseRef = useRef(phase)
  const [result, setResult] = useState({ score: 0, record: false })
  phaseRef.current = phase

  const start = () => {
    state.current = newState()
    phaseRef.current = 'playing'
    setPhase('playing')
    onStart?.()
  }

  const press = () => {
    if (phaseRef.current === 'ready') start()
    if (phaseRef.current !== 'playing') return
    const s = state.current
    s.holding = true
    if (s.onGround) {
      s.vy = JUMP
      s.onGround = false
    }
  }
  const release = () => {
    const s = state.current
    s.holding = false
    if (s.vy < SHORT_HOP) s.vy = SHORT_HOP // salto corto si sueltas antes
  }

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, W, H)
    const stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * (GROUND - 120), r: Math.random() * 1.5 + 0.5 }))
    const ridge = (seed, amp, base) =>
      Array.from({ length: 9 }, (_, i) => ({ x: i * 110, h: base + Math.sin(i * seed) * amp + ((i * 37) % 23) }))
    const far = ridge(1.7, 40, 120)
    const near = ridge(2.3, 25, 70)

    const update = (dt) => {
      const s = state.current
      s.speed = Math.min(800, s.speed + 9 * dt)
      s.dist += s.speed * dt
      s.legs += s.speed * dt * 0.05

      s.vy += GRAVITY * dt
      s.y += s.vy * dt
      if (s.y >= GROUND - LH) {
        if (!s.onGround) for (let i = 0; i < 5; i++) s.dust.push({ x: s.x + 10, y: GROUND, vx: -Math.random() * 120, vy: -Math.random() * 80, life: 0.4 })
        s.y = GROUND - LH
        s.vy = 0
        s.onGround = true
      }

      s.next -= s.speed * dt
      if (s.next <= 0) {
        const t = TYPES[Math.floor(Math.random() * TYPES.length)]
        s.obstacles.push({ ...t, x: W + 20 })
        s.next = s.speed * (0.75 + Math.random() * 0.9) + 140
      }
      for (const o of s.obstacles) o.x -= s.speed * dt
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20)

      s.dust.forEach((d) => {
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.life -= dt
      })
      s.dust = s.dust.filter((d) => d.life > 0)

      // Choque con caja reducida (más justo para quien juega)
      const lx = s.x + 8
      const ly = s.y + 10
      const lw = LW - 14
      const lh = LH - 12
      for (const o of s.obstacles) {
        const oy = GROUND - o.h
        if (lx < o.x + o.w - 4 && lx + lw > o.x + 4 && ly + lh > oy + 4) {
          phaseRef.current = 'over'
          const score = Math.floor(s.dist / 30)
          const record = onFinish(score)
          setResult({ score, record })
          setPhase('over')
          return
        }
      }
    }

    const drawRidge = (pts, offset, fill, snow) => {
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.moveTo(0, GROUND)
      const total = 990
      for (let k = -1; k < pts.length + 1; k++) {
        const p = pts[((k % pts.length) + pts.length) % pts.length]
        const x = k * 110 - (offset % total)
        ctx.lineTo(x, GROUND - p.h)
        ctx.lineTo(x + 55, GROUND - p.h * 0.55)
      }
      ctx.lineTo(W, GROUND)
      ctx.fill()
      if (snow) {
        ctx.fillStyle = 'rgba(243,238,255,.75)'
        for (let k = -1; k < pts.length + 1; k++) {
          const p = pts[((k % pts.length) + pts.length) % pts.length]
          const x = k * 110 - (offset % total)
          ctx.beginPath()
          ctx.moveTo(x, GROUND - p.h)
          ctx.lineTo(x - 14, GROUND - p.h + 18)
          ctx.lineTo(x + 12, GROUND - p.h + 16)
          ctx.fill()
        }
      }
    }

    const drawLlama = (s, t) => {
      const x = s.x
      const y = s.y + (phaseRef.current === 'ready' ? Math.sin(t / 250) * 2 : 0)
      ctx.save()
      ctx.translate(x, y)
      const run = s.onGround && phaseRef.current === 'playing'
      const a = run ? Math.sin(s.legs) * 7 : 0
      ctx.strokeStyle = INK
      ctx.lineWidth = 2
      // patas
      ctx.fillStyle = '#D9C49F'
      ;[[8, a], [16, -a], [28, -a], [36, a]].forEach(([lx, off]) => {
        roundRect(ctx, lx + off * 0.3, 34, 6, 20 - Math.abs(off) * 0.3, 2)
        ctx.fill()
      })
      // cuerpo lanudo
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(22, 30, 24, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // cuello y cabeza
      roundRect(ctx, 34, 2, 11, 30, 5)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(46, 4, 11, 7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // orejas
      ctx.beginPath()
      ctx.moveTo(36, -2)
      ctx.lineTo(38, -12)
      ctx.lineTo(42, -2)
      ctx.fill()
      ctx.stroke()
      // ojo y manta de colores
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(48, 2, 2, 0, Math.PI * 2)
      ctx.fill()
      const stripes = ['#FF6FA8', '#FFD23F', '#5CC8FF']
      stripes.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.fillRect(12 + i * 6, 18, 6, 12)
      })
      // pompón de la oreja
      ctx.fillStyle = '#FF6FA8'
      ctx.beginPath()
      ctx.arc(38, -12, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawObstacle = (o) => {
      const y = GROUND - o.h
      if (o.kind === 'rock') {
        ctx.fillStyle = '#A9A2D6'
        ctx.beginPath()
        ctx.ellipse(o.x + o.w / 2, GROUND - o.h / 2 + 2, o.w / 2, o.h / 2 + 2, 0, Math.PI, 0)
        ctx.lineTo(o.x + o.w, GROUND)
        ctx.lineTo(o.x, GROUND)
        ctx.fill()
        return
      }
      const one = (cx, w, h) => {
        ctx.fillStyle = '#7BD389'
        roundRect(ctx, cx, GROUND - h, w, h, w / 2.2)
        ctx.fill()
        roundRect(ctx, cx - 8, GROUND - h * 0.65, 8, 6, 3)
        ctx.fill()
        roundRect(ctx, cx - 8, GROUND - h * 0.85, 6, h * 0.25, 3)
        ctx.fill()
        roundRect(ctx, cx + w, GROUND - h * 0.5, 8, 6, 3)
        ctx.fill()
        roundRect(ctx, cx + w + 2, GROUND - h * 0.72, 6, h * 0.24, 3)
        ctx.fill()
        ctx.strokeStyle = 'rgba(26,22,54,.35)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx + w / 2, GROUND - h + 6)
        ctx.lineTo(cx + w / 2, GROUND - 2)
        ctx.stroke()
      }
      if (o.kind === 'double') {
        one(o.x + 6, 16, o.h)
        one(o.x + 32, 14, o.h - 10)
      } else one(o.x + 4, o.w - 8, o.h)
      void y
    }

    const draw = (t) => {
      const s = state.current
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = PAPER
      for (const st of stars) {
        ctx.globalAlpha = 0.3 + st.r * 0.25
        ctx.fillRect((st.x - s.dist * 0.02 + W) % W, st.y, st.r, st.r)
      }
      ctx.globalAlpha = 1
      // luna
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(W - 90, 70, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(W - 80, 62, 22, 0, Math.PI * 2)
      ctx.fill()

      drawRidge(far, s.dist * 0.15, INK_2, true)
      drawRidge(near, s.dist * 0.4, '#2E2860', false)

      // suelo
      ctx.fillStyle = '#2A2452'
      ctx.fillRect(0, GROUND, W, H - GROUND)
      ctx.fillStyle = color
      ctx.fillRect(0, GROUND, W, 3)
      ctx.fillStyle = 'rgba(243,238,255,.18)'
      for (let k = 0; k < 24; k++) {
        const x = ((k * 53 - s.dist) % W + W) % W
        ctx.fillRect(x, GROUND + 14 + (k % 3) * 9, 10 + (k % 4) * 4, 2)
      }

      for (const o of s.obstacles) drawObstacle(o)
      ctx.fillStyle = 'rgba(242,227,198,.6)'
      for (const d of s.dust) ctx.fillRect(d.x, d.y, 4, 4)
      drawLlama(s, t)

      if (phaseRef.current !== 'ready') {
        ctx.fillStyle = PAPER
        ctx.font = `800 22px ${FONT}`
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.floor(s.dist / 30)} m`, W - 18, 34)
        ctx.textAlign = 'left'
      }
    }

    const stop = startLoop((dt, t) => {
      if (phaseRef.current === 'playing') update(dt)
      draw(t)
    })

    const kd = (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        if (phaseRef.current === 'over') return
        press()
      }
      if (e.key === 'Enter' && phaseRef.current !== 'playing') start()
    }
    const ku = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') release()
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      stop()
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game game--wide">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={(e) => {
          e.preventDefault()
          if (phaseRef.current !== 'over') press()
        }}
        onPointerUp={release}
        onPointerLeave={release}
        aria-label="Corre Llama. Presiona espacio o toca para saltar."
      />
      {phase === 'ready' && (
        <Overlay title="Corre Llama" action="Correr" onAction={start}>
          Salta con Espacio o tocando la pantalla. Mantén presionado para saltar más alto.
        </Overlay>
      )}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : '¡Tropezó!'} action="Correr otra vez" onAction={start}>
          La llama recorrió <strong>{result.score} m</strong>.
        </Overlay>
      )}
    </div>
  )
}
