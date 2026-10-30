import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, INK_2, Overlay, PAPER, roundRect, setupCanvas, startLoop } from './shared'

const W = 400
const H = 640
const GROUND = H - 72
const GRAVITY = 1650
const FLAP = -480
const PIPE_W = 68
const GAP = 168
const SPACING = 225
const SPEED = 165
const BR = 15 // radio del pájaro

function newState() {
  return { y: H / 2 - 40, vy: 0, rot: 0, pipes: [], score: 0, dist: 0, dead: false, x: 110 }
}

function addPipe(s, x) {
  const min = 110
  const max = GROUND - 110
  s.pipes.push({ x, gapY: min + Math.random() * (max - min), passed: false })
}

export default function EntreTubos({ color, onFinish, onStart }) {
  const canvasRef = useRef(null)
  const state = useRef(newState())
  const [phase, setPhase] = useState('ready')
  const phaseRef = useRef(phase)
  const [result, setResult] = useState({ score: 0, record: false })
  phaseRef.current = phase

  const flap = () => {
    const ph = phaseRef.current
    if (ph === 'over') return
    if (ph === 'ready') {
      state.current = newState()
      addPipe(state.current, W + 60)
      setPhase('playing')
      phaseRef.current = 'playing'
      onStart?.()
    }
    if (!state.current.dead) state.current.vy = FLAP
  }

  const restart = () => {
    state.current = newState()
    setPhase('ready')
  }

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, W, H)
    const hills = Array.from({ length: 12 }, (_, i) => ({ x: i * 70, h: 40 + Math.random() * 90, w: 60 + Math.random() * 50 }))

    const die = () => {
      const s = state.current
      if (s.dead) return
      s.dead = true
      s.vy = Math.min(s.vy, 0)
    }

    const update = (dt) => {
      const s = state.current
      s.vy += GRAVITY * dt
      s.y += s.vy * dt
      s.rot = Math.max(-0.45, Math.min(1.3, s.vy / 700))

      if (!s.dead) {
        s.dist += SPEED * dt
        for (const p of s.pipes) {
          p.x -= SPEED * dt
          if (!p.passed && p.x + PIPE_W < s.x - BR) {
            p.passed = true
            s.score++
          }
          // Colisión círculo-rectángulo con ambos tubos
          const inX = s.x + BR > p.x && s.x - BR < p.x + PIPE_W
          if (inX && (s.y - BR < p.gapY - GAP / 2 || s.y + BR > p.gapY + GAP / 2)) die()
        }
        const last = s.pipes[s.pipes.length - 1]
        if (last.x < W - SPACING) addPipe(s, last.x + SPACING)
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 20)
        if (s.y - BR < 0) {
          s.y = BR
          s.vy = 0
        }
      }

      if (s.y + BR >= GROUND) {
        s.y = GROUND - BR
        die()
        phaseRef.current = 'over'
        const record = onFinish(s.score)
        setResult({ score: s.score, record })
        setPhase('over')
      }
    }

    const draw = (t) => {
      const s = state.current
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)

      // Colinas lejanas
      ctx.fillStyle = INK_2
      for (const h of hills) {
        const x = (((h.x - s.dist * 0.2) % 840) + 840) % 840 - 70
        ctx.beginPath()
        ctx.ellipse(x, GROUND, h.w, h.h, 0, Math.PI, 0)
        ctx.fill()
      }

      // Tubos
      for (const p of s.pipes) {
        const top = p.gapY - GAP / 2
        const bottom = p.gapY + GAP / 2
        ctx.fillStyle = color
        ctx.fillRect(p.x, 0, PIPE_W, top)
        ctx.fillRect(p.x, bottom, PIPE_W, GROUND - bottom)
        roundRect(ctx, p.x - 7, top - 26, PIPE_W + 14, 26, 4)
        ctx.fill()
        roundRect(ctx, p.x - 7, bottom, PIPE_W + 14, 26, 4)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.35)'
        ctx.fillRect(p.x + 8, 0, 6, top - 26)
        ctx.fillRect(p.x + 8, bottom + 26, 6, GROUND - bottom - 26)
        ctx.strokeStyle = INK
        ctx.lineWidth = 3
        ctx.strokeRect(p.x - 7, top - 26, PIPE_W + 14, 26)
        ctx.strokeRect(p.x - 7, bottom, PIPE_W + 14, 26)
      }

      // Suelo
      ctx.fillStyle = '#2E2860'
      ctx.fillRect(0, GROUND, W, H - GROUND)
      ctx.fillStyle = color
      ctx.fillRect(0, GROUND, W, 6)
      ctx.fillStyle = 'rgba(243,238,255,.08)'
      for (let x = -((s.dist) % 32); x < W; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, GROUND + 6)
        ctx.lineTo(x + 16, GROUND + 6)
        ctx.lineTo(x + 4, H)
        ctx.lineTo(x - 12, H)
        ctx.fill()
      }

      // Pájaro
      const bob = phaseRef.current === 'ready' ? Math.sin(t / 180) * 8 : 0
      const wing = Math.sin(t / (s.vy < 0 ? 40 : 90)) * 6
      ctx.save()
      ctx.translate(s.x, s.y + bob)
      ctx.rotate(phaseRef.current === 'ready' ? 0 : s.rot)
      ctx.fillStyle = '#FF6FA8'
      ctx.beginPath()
      ctx.ellipse(0, 0, BR + 4, BR, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = PAPER
      ctx.beginPath()
      ctx.ellipse(-6, 3 + wing * 0.4, 9, 6, -0.3 + wing * 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(8, -5, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(10, -5, 2.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FF9248'
      ctx.beginPath()
      ctx.moveTo(16, 0)
      ctx.lineTo(28, 3)
      ctx.lineTo(16, 7)
      ctx.fill()
      ctx.restore()

      // Puntaje
      if (phaseRef.current !== 'ready') {
        ctx.textAlign = 'center'
        ctx.font = `800 64px ${FONT}`
        ctx.lineWidth = 8
        ctx.strokeStyle = INK
        ctx.strokeText(String(s.score), W / 2, 92)
        ctx.fillStyle = PAPER
        ctx.fillText(String(s.score), W / 2, 92)
        ctx.textAlign = 'left'
      }
    }

    const stop = startLoop((dt, t) => {
      if (phaseRef.current === 'playing') update(dt)
      draw(t)
    })

    const onKey = (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') flap()
      if (e.key === 'Enter' && phaseRef.current === 'over') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game game--tall">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={(e) => {
          e.preventDefault()
          flap()
        }}
        aria-label="Entre Tubos. Presiona espacio o toca para aletear."
      />
      {phase === 'ready' && (
        <div className="hint-pill" aria-hidden="true">Toca o presiona Espacio para volar</div>
      )}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : 'Chocaste'} action="Volver a intentar" onAction={restart}>
          Pasaste <strong>{result.score}</strong> {result.score === 1 ? 'tubo' : 'tubos'}.
        </Overlay>
      )}
    </div>
  )
}
