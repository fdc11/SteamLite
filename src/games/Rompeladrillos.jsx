import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, INK_2, Overlay, PAPER, roundRect, setupCanvas, startLoop } from './shared'

const W = 440
const H = 600
const PW = 84
const PH = 12
const PY = H - 44
const R = 7
const COLS = 8
const ROWS = 6
const GAP = 6
const BW = (W - 32 - GAP * (COLS - 1)) / COLS
const BH = 18
const TOP = 78
const ROW_COLORS = ['#FF5D5D', '#FF9248', '#FFD23F', '#7BD389', '#5CC8FF', '#A78BFA']

function makeBricks(level) {
  const bricks = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      // Desde el nivel 2 la fila superior aguanta dos golpes; desde el 3, también la segunda.
      const hp = (level >= 2 && r === 0) || (level >= 3 && r === 1) ? 2 : 1
      bricks.push({ x: 16 + c * (BW + GAP), y: TOP + r * (BH + GAP), hp, max: hp, color: ROW_COLORS[r] })
    }
  return bricks
}

function newState() {
  return { px: W / 2 - PW / 2, ball: { x: W / 2, y: PY - R, vx: 0, vy: 0, stuck: true }, speed: 360, bricks: makeBricks(1), level: 1, lives: 3, score: 0, flash: 0, sparks: [] }
}

export default function Rompeladrillos({ color, onFinish, onStart }) {
  const canvasRef = useRef(null)
  const state = useRef(newState())
  const keys = useRef({ left: false, right: false })
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

  const launch = () => {
    const b = state.current.ball
    if (phaseRef.current !== 'playing' || !b.stuck) return
    const ang = (Math.random() * 0.6 - 0.3)
    b.vx = Math.sin(ang) * state.current.speed
    b.vy = -Math.cos(ang) * state.current.speed
    b.stuck = false
  }

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, W, H)

    const resetBall = (s) => {
      s.ball = { x: s.px + PW / 2, y: PY - R, vx: 0, vy: 0, stuck: true }
    }

    const update = (dt) => {
      const s = state.current
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      s.px = Math.max(0, Math.min(W - PW, s.px + dir * 520 * dt))
      const b = s.ball
      if (b.stuck) {
        b.x = s.px + PW / 2
        b.y = PY - R
        return
      }
      const steps = Math.ceil((s.speed * dt) / 3)
      for (let i = 0; i < steps; i++) {
        b.x += (b.vx * dt) / steps
        b.y += (b.vy * dt) / steps
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) }
        if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) }
        if (b.y < R + 44) { b.y = R + 44; b.vy = Math.abs(b.vy) }

        // Paleta: el punto de impacto decide el ángulo de salida.
        if (b.vy > 0 && b.y + R >= PY && b.y + R <= PY + PH + 6 && b.x > s.px - R && b.x < s.px + PW + R) {
          const hit = (b.x - (s.px + PW / 2)) / (PW / 2)
          const ang = Math.max(-1, Math.min(1, hit)) * (Math.PI / 3)
          b.vx = Math.sin(ang) * s.speed
          b.vy = -Math.cos(ang) * s.speed
          b.y = PY - R
        }

        for (const br of s.bricks) {
          if (br.hp <= 0) continue
          const cx = Math.max(br.x, Math.min(b.x, br.x + BW))
          const cy = Math.max(br.y, Math.min(b.y, br.y + BH))
          if ((b.x - cx) ** 2 + (b.y - cy) ** 2 > R * R) continue
          const ox = Math.min(b.x + R - br.x, br.x + BW - (b.x - R))
          const oy = Math.min(b.y + R - br.y, br.y + BH - (b.y - R))
          if (ox < oy) b.vx = -b.vx
          else b.vy = -b.vy
          br.hp--
          if (br.hp <= 0) {
            s.score += 10 * s.level
            for (let k = 0; k < 6; k++) s.sparks.push({ x: br.x + BW / 2, y: br.y + BH / 2, vx: (Math.random() - 0.5) * 240, vy: (Math.random() - 0.5) * 240, life: 0.45, color: br.color })
          } else s.score += 5
          break
        }
      }

      s.sparks.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt })
      s.sparks = s.sparks.filter((p) => p.life > 0)
      s.flash = Math.max(0, s.flash - dt * 2)

      if (b.y - R > H) {
        s.lives--
        s.flash = 1
        if (s.lives <= 0) {
          phaseRef.current = 'over'
          const record = onFinish(s.score)
          setResult({ score: s.score, record, won: false })
          setPhase('over')
          return
        }
        resetBall(s)
      }

      if (s.bricks.every((br) => br.hp <= 0)) {
        s.level++
        s.speed *= 1.1
        s.score += 100
        s.bricks = makeBricks(s.level)
        resetBall(s)
      }
    }

    const draw = (t) => {
      const s = state.current
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)
      if (s.flash) {
        ctx.fillStyle = `rgba(255,93,93,${s.flash * 0.25})`
        ctx.fillRect(0, 0, W, H)
      }
      // barra superior
      ctx.fillStyle = INK_2
      ctx.fillRect(0, 0, W, 44)
      ctx.font = `800 18px ${FONT}`
      ctx.fillStyle = PAPER
      ctx.fillText(String(s.score), 16, 28)
      ctx.textAlign = 'center'
      ctx.fillStyle = color
      ctx.fillText(`Nivel ${s.level}`, W / 2, 28)
      ctx.textAlign = 'left'
      for (let i = 0; i < s.lives; i++) {
        ctx.fillStyle = PAPER
        ctx.beginPath()
        ctx.arc(W - 20 - i * 20, 22, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const br of s.bricks) {
        if (br.hp <= 0) continue
        ctx.fillStyle = br.color
        ctx.globalAlpha = br.hp < br.max ? 0.55 : 1
        roundRect(ctx, br.x, br.y, BW, BH, 4)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(255,255,255,.35)'
        ctx.fillRect(br.x + 4, br.y + 3, BW - 8, 3)
        if (br.max === 2) {
          ctx.strokeStyle = INK
          ctx.lineWidth = 2
          ctx.strokeRect(br.x + 3, br.y + 3, BW - 6, BH - 6)
        }
      }

      for (const p of s.sparks) {
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, 4, 4)
      }

      ctx.fillStyle = color
      roundRect(ctx, s.px, PY, PW, PH, 6)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,.4)'
      ctx.fillRect(s.px + 8, PY + 2, PW - 16, 3)

      const b = s.ball
      ctx.fillStyle = PAPER
      ctx.beginPath()
      ctx.arc(b.x, b.y + (b.stuck && phaseRef.current === 'playing' ? Math.sin(t / 150) * 1.5 : 0), R, 0, Math.PI * 2)
      ctx.fill()

      if (phaseRef.current === 'playing' && b.stuck) {
        ctx.fillStyle = 'rgba(243,238,255,.7)'
        ctx.font = `600 14px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText('Clic o Espacio para lanzar', W / 2, PY - 40)
        ctx.textAlign = 'left'
      }
    }

    const stop = startLoop((dt, t) => {
      if (phaseRef.current === 'playing') update(dt)
      draw(t)
    })

    const onKey = (down) => (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') keys.current.left = down
      if (k === 'arrowright' || k === 'd') keys.current.right = down
      if (down && (k === ' ' || k === 'enter')) {
        if (phaseRef.current === 'playing') launch()
        else start()
      }
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

  const movePaddle = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    state.current.px = Math.max(0, Math.min(W - PW, x - PW / 2))
  }

  return (
    <div className="game game--tall">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerMove={movePaddle}
        onPointerDown={(e) => {
          movePaddle(e)
          launch()
        }}
        aria-label="Rompeladrillos. Mueve la paleta con el mouse o las flechas."
      />
      {phase === 'ready' && (
        <Overlay title="Rompeladrillos" action="Jugar" onAction={start}>
          Mueve la paleta con el mouse, el dedo o las flechas. Rompe todos los ladrillos sin dejar caer la pelota.
        </Overlay>
      )}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : 'Sin vidas'} action="Jugar otra vez" onAction={start}>
          Hiciste <strong>{result.score}</strong> puntos.
        </Overlay>
      )}
    </div>
  )
}
