import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, INK_2, Overlay, PAPER, roundRect, setupCanvas, startLoop } from './shared'

const N = 20 // celdas por lado
const C = 20 // tamaño de celda
const S = N * C
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

function placeFruit(snake) {
  const free = []
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y })
  return free[Math.floor(Math.random() * free.length)]
}

function newState() {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]
  return { snake, prev: snake.map((s) => ({ ...s })), dir: 'right', queue: [], fruit: placeFruit(snake), score: 0, acc: 0, step: 0.13, pop: 0 }
}

export default function Serpiente({ color, onFinish, onStart }) {
  const canvasRef = useRef(null)
  const state = useRef(newState())
  const [phase, setPhase] = useState('ready') // ready | playing | paused | over
  const phaseRef = useRef(phase)
  const [result, setResult] = useState({ score: 0, record: false })
  phaseRef.current = phase

  const start = () => {
    state.current = newState()
    phaseRef.current = 'playing'
    setPhase('playing')
    onStart?.()
  }

  const turn = (d) => {
    if (phaseRef.current === 'ready') start()
    const s = state.current
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir
    if (d !== last && d !== OPPOSITE[last] && s.queue.length < 3) s.queue.push(d)
  }

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, S, S)

    const tick = () => {
      const s = state.current
      if (s.queue.length) s.dir = s.queue.shift()
      const [dx, dy] = DIRS[s.dir]
      const head = { x: s.snake[0].x + dx, y: s.snake[0].y + dy }
      const eats = head.x === s.fruit.x && head.y === s.fruit.y
      const body = eats ? s.snake : s.snake.slice(0, -1)
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || body.some((b) => b.x === head.x && b.y === head.y)) {
        phaseRef.current = 'over'
        const record = onFinish(s.score)
        setResult({ score: s.score, record })
        setPhase('over')
        return
      }
      s.prev = s.snake.map((p) => ({ ...p }))
      s.snake = [head, ...body]
      if (eats) {
        s.prev.push({ ...s.prev[s.prev.length - 1] })
        s.score++
        s.step = Math.max(0.065, s.step - 0.003)
        s.fruit = placeFruit(s.snake)
        s.pop = 1
      }
    }

    const draw = (t) => {
      const s = state.current
      const k = phaseRef.current === 'playing' ? Math.min(1, s.acc / s.step) : 1
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, S, S)
      for (let x = 0; x < N; x++)
        for (let y = 0; y < N; y++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = INK_2
            ctx.fillRect(x * C, y * C, C, C)
          }
        }

      // Fruta con pulso
      const pulse = 1 + Math.sin(t / 200) * 0.06
      ctx.fillStyle = '#FFD23F'
      ctx.beginPath()
      ctx.arc(s.fruit.x * C + C / 2, s.fruit.y * C + C / 2 + 1, C * 0.36 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#7BD389'
      ctx.fillRect(s.fruit.x * C + C / 2 - 1, s.fruit.y * C + 2, 3, 5)

      // Serpiente interpolada entre pasos para que se vea fluida
      const pts = s.snake.map((p, i) => {
        const q = s.prev[i] ?? p
        return { x: (q.x + (p.x - q.x) * k) * C + C / 2, y: (q.y + (p.y - q.y) * k) * C + C / 2 }
      })
      ctx.strokeStyle = color
      ctx.lineWidth = C * 0.78
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y)
      ctx.stroke()

      const h = pts[0]
      const [dx, dy] = DIRS[s.dir]
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(h.x, h.y, C * 0.5 + s.pop * 3, 0, Math.PI * 2)
      ctx.fill()
      s.pop = Math.max(0, s.pop - 0.08)
      ctx.fillStyle = INK
      const ex = -dy * 4.5
      const ey = dx * 4.5
      ctx.beginPath()
      ctx.arc(h.x + dx * 3 + ex, h.y + dy * 3 + ey, 2.3, 0, Math.PI * 2)
      ctx.arc(h.x + dx * 3 - ex, h.y + dy * 3 - ey, 2.3, 0, Math.PI * 2)
      ctx.fill()

      if (phaseRef.current !== 'ready') {
        ctx.fillStyle = 'rgba(26,22,54,.8)'
        roundRect(ctx, 10, 10, 70, 32, 8)
        ctx.fill()
        ctx.fillStyle = PAPER
        ctx.font = `800 18px ${FONT}`
        ctx.fillText(String(s.score), 22, 32)
      }
    }

    const stop = startLoop((dt, t) => {
      const s = state.current
      if (phaseRef.current === 'playing') {
        s.acc += dt
        while (s.acc >= s.step && phaseRef.current === 'playing') {
          s.acc -= s.step
          tick()
        }
      }
      draw(t)
    })

    const map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }
    const onKey = (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      const k = e.key.toLowerCase()
      if (map[k] && phaseRef.current !== 'over' && phaseRef.current !== 'paused') turn(map[k])
      if (k === 'p' || (k === ' ' && phaseRef.current !== 'ready')) {
        if (phaseRef.current === 'playing') setPhase('paused')
        else if (phaseRef.current === 'paused') setPhase('playing')
      }
      if ((k === 'enter' || k === ' ') && (phaseRef.current === 'ready' || phaseRef.current === 'over')) start()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Deslizar en pantallas táctiles
  const touch = useRef(null)
  const onPointerDown = (e) => (touch.current = { x: e.clientX, y: e.clientY })
  const onPointerUp = (e) => {
    if (!touch.current) return
    const dx = e.clientX - touch.current.x
    const dy = e.clientY - touch.current.y
    touch.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    if (phaseRef.current === 'paused' || phaseRef.current === 'over') return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  return (
    <div className="game game--square">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: '1 / 1' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        aria-label="Serpiente. Usa las flechas para girar."
      />
      {phase === 'ready' && (
        <Overlay title="Serpiente" action="Empezar" onAction={start}>
          Usa las flechas o desliza el dedo. Cada fruta te hace más larga y más rápida.
        </Overlay>
      )}
      {phase === 'paused' && <Overlay title="Pausa" action="Continuar" onAction={() => setPhase('playing')} />}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : 'Se acabó'} action="Jugar otra vez" onAction={start}>
          Comiste <strong>{result.score}</strong> {result.score === 1 ? 'fruta' : 'frutas'}.
        </Overlay>
      )}
      {phase === 'playing' && (
        <button className="game__corner btn btn--ghost btn--sm" onClick={() => setPhase('paused')}>Pausa</button>
      )}
    </div>
  )
}
