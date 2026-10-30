import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_KEYS, INK, INK_2, Overlay, roundRect, setupCanvas, startLoop } from './shared'

const COLS = 10
const ROWS = 20
const C = 28
const W = COLS * C
const H = ROWS * C

const PIECES = {
  I: { m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], c: '#5CC8FF' },
  O: { m: [[1, 1], [1, 1]], c: '#FFD23F' },
  T: { m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], c: '#A78BFA' },
  S: { m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], c: '#7BD389' },
  Z: { m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], c: '#FF5D5D' },
  J: { m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], c: '#4FE3D7' },
  L: { m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], c: '#FF9248' },
}
const LINE_POINTS = [0, 100, 300, 500, 800]

const rotate = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse())

// "Bolsa de 7": salen las 7 piezas en orden aleatorio antes de repetir.
function bag() {
  const b = Object.keys(PIECES)
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function collide(board, m, px, py) {
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue
      const bx = px + x
      const by = py + y
      if (bx < 0 || bx >= COLS || by >= ROWS) return true
      if (by >= 0 && board[by][bx]) return true
    }
  return false
}

function newState() {
  const queue = [...bag(), ...bag()]
  return { board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)), queue, piece: null, score: 0, lines: 0, level: 1, acc: 0, flash: [] }
}

function spawn(s) {
  if (s.queue.length < 7) s.queue.push(...bag())
  const k = s.queue.shift()
  const m = PIECES[k].m.map((r) => [...r])
  s.piece = { k, m, x: Math.floor((COLS - m[0].length) / 2), y: k === 'I' ? -1 : 0 }
  return !collide(s.board, s.piece.m, s.piece.x, s.piece.y)
}

export default function Bloques({ onFinish, onStart }) {
  const canvasRef = useRef(null)
  const nextRef = useRef(null)
  const state = useRef(newState())
  const [phase, setPhase] = useState('ready')
  const phaseRef = useRef(phase)
  const [hud, setHud] = useState({ score: 0, lines: 0, level: 1, next: 'T' })
  const [result, setResult] = useState({ score: 0, record: false })
  phaseRef.current = phase

  const sync = () => {
    const s = state.current
    setHud({ score: s.score, lines: s.lines, level: s.level, next: s.queue[0] })
  }

  const start = () => {
    state.current = newState()
    spawn(state.current)
    phaseRef.current = 'playing'
    setPhase('playing')
    sync()
    onStart?.()
  }

  const gameOver = () => {
    const s = state.current
    phaseRef.current = 'over'
    const record = onFinish(s.score)
    setResult({ score: s.score, record })
    setPhase('over')
  }

  const lock = () => {
    const s = state.current
    const { m, x, y, k } = s.piece
    m.forEach((row, ry) => row.forEach((v, rx) => {
      if (v && y + ry >= 0) s.board[y + ry][x + rx] = PIECES[k].c
    }))
    if (m.some((row, ry) => row.some((v) => v && y + ry < 0))) return gameOver()
    const full = []
    s.board.forEach((row, i) => row.every(Boolean) && full.push(i))
    if (full.length) {
      s.board = s.board.filter((_, i) => !full.includes(i))
      while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(null))
      s.lines += full.length
      s.score += LINE_POINTS[full.length] * s.level
      s.level = 1 + Math.floor(s.lines / 10)
      s.flash = full.map((i) => ({ i, t: 0.25 }))
    }
    if (!spawn(s)) return gameOver()
    sync()
  }

  const act = useCallback((a) => {
    if (phaseRef.current !== 'playing') return
    const s = state.current
    const p = s.piece
    if (a === 'left' || a === 'right') {
      const dx = a === 'left' ? -1 : 1
      if (!collide(s.board, p.m, p.x + dx, p.y)) p.x += dx
    } else if (a === 'rotate') {
      const r = rotate(p.m)
      // Si choca al girar, prueba a correrla un poco (wall kick simple).
      for (const off of [0, -1, 1, -2, 2]) {
        if (!collide(s.board, r, p.x + off, p.y)) {
          p.m = r
          p.x += off
          break
        }
      }
    } else if (a === 'down') {
      if (!collide(s.board, p.m, p.x, p.y + 1)) {
        p.y++
        s.score += 1
        s.acc = 0
        sync()
      } else lock()
    } else if (a === 'drop') {
      let n = 0
      while (!collide(s.board, p.m, p.x, p.y + 1)) {
        p.y++
        n++
      }
      s.score += n * 2
      lock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, W, H)
    const nctx = setupCanvas(nextRef.current, 96, 96)

    const cell = (c, x, y, color, ghost) => {
      const px = x * C
      const py = y * C
      if (ghost) {
        c.strokeStyle = color
        c.globalAlpha = 0.5
        c.lineWidth = 2
        roundRect(c, px + 3, py + 3, C - 6, C - 6, 4)
        c.stroke()
        c.globalAlpha = 1
        return
      }
      c.fillStyle = color
      roundRect(c, px + 1.5, py + 1.5, C - 3, C - 3, 5)
      c.fill()
      c.fillStyle = 'rgba(255,255,255,.35)'
      c.fillRect(px + 6, py + 5, C - 12, 3)
      c.fillStyle = 'rgba(26,22,54,.18)'
      c.fillRect(px + 4, py + C - 7, C - 8, 3)
    }

    const draw = () => {
      const s = state.current
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(61,54,112,.45)'
      ctx.lineWidth = 1
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath()
        ctx.moveTo(x * C, 0)
        ctx.lineTo(x * C, H)
        ctx.stroke()
      }
      for (let y = 1; y < ROWS; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * C)
        ctx.lineTo(W, y * C)
        ctx.stroke()
      }
      s.board.forEach((row, y) => row.forEach((c, x) => c && cell(ctx, x, y, c)))
      if (s.piece && phaseRef.current !== 'ready') {
        const p = s.piece
        let gy = p.y
        while (!collide(s.board, p.m, p.x, gy + 1)) gy++
        p.m.forEach((row, ry) => row.forEach((v, rx) => v && gy + ry >= 0 && cell(ctx, p.x + rx, gy + ry, PIECES[p.k].c, true)))
        p.m.forEach((row, ry) => row.forEach((v, rx) => v && p.y + ry >= 0 && cell(ctx, p.x + rx, p.y + ry, PIECES[p.k].c)))
      }
      for (const f of s.flash) {
        ctx.fillStyle = `rgba(243,238,255,${f.t * 3})`
        ctx.fillRect(0, f.i * C, W, C)
      }

      // Siguiente pieza
      nctx.fillStyle = INK_2
      nctx.fillRect(0, 0, 96, 96)
      const k = s.queue[0]
      if (k) {
        const m = PIECES[k].m
        const size = 20
        const filled = m.filter((r) => r.some(Boolean))
        const w = m[0].length * size
        const h = filled.length * size
        const ox = (96 - w) / 2
        const oy = (96 - h) / 2
        filled.forEach((row, y) => row.forEach((v, x) => {
          if (!v) return
          nctx.fillStyle = PIECES[k].c
          roundRect(nctx, ox + x * size + 1, oy + y * size + 1, size - 2, size - 2, 4)
          nctx.fill()
        }))
      }
    }

    const stop = startLoop((dt) => {
      const s = state.current
      if (phaseRef.current === 'playing') {
        s.acc += dt
        const interval = Math.max(0.07, 0.8 - (s.level - 1) * 0.07)
        if (s.acc >= interval) {
          s.acc = 0
          if (!collide(s.board, s.piece.m, s.piece.x, s.piece.y + 1)) s.piece.y++
          else lock()
        }
      }
      s.flash.forEach((f) => (f.t -= dt))
      s.flash = s.flash.filter((f) => f.t > 0)
      draw()
    })

    const map = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'rotate', w: 'rotate', x: 'rotate', arrowdown: 'down', s: 'down', ' ': 'drop' }
    const onKey = (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      const k = e.key.toLowerCase()
      if (phaseRef.current !== 'playing') {
        if (k === 'enter' || k === ' ') start()
        return
      }
      if (map[k]) act(map[k])
      if (k === 'p') setPhase('paused')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const btn = (a, label, aria) => (
    <button className="pad__btn" aria-label={aria} onPointerDown={(e) => { e.preventDefault(); act(a) }}>
      {label}
    </button>
  )

  return (
    <div className="blocks">
      <div className="blocks__main">
        <div className="game blocks__board">
          <canvas ref={canvasRef} className="game__canvas" style={{ aspectRatio: `${W} / ${H}` }} aria-label="Tablero de Bloques" />
          {phase === 'ready' && (
            <Overlay title="Bloques" action="Empezar" onAction={start}>
              ← → mueve, ↑ gira, ↓ baja y Espacio la deja caer. Completa líneas para borrarlas.
            </Overlay>
          )}
          {phase === 'paused' && <Overlay title="Pausa" action="Continuar" onAction={() => setPhase('playing')} />}
          {phase === 'over' && (
            <Overlay title={result.record ? '¡Nuevo récord!' : 'Llegaste arriba'} action="Jugar otra vez" onAction={start}>
              Hiciste <strong>{result.score}</strong> puntos.
            </Overlay>
          )}
        </div>
        <aside className="blocks__side">
          <div className="blocks__stat blocks__next">
            <span>Siguiente</span>
            <canvas ref={nextRef} style={{ width: 96, height: 96 }} aria-hidden="true" />
          </div>
          <div className="blocks__stat"><span>Puntos</span><b>{hud.score}</b></div>
          <div className="blocks__stat"><span>Líneas</span><b>{hud.lines}</b></div>
          <div className="blocks__stat"><span>Nivel</span><b>{hud.level}</b></div>
          {phase === 'playing' && <button className="btn btn--ghost btn--sm" onClick={() => setPhase('paused')}>Pausa</button>}
        </aside>
      </div>
      <div className="pad" aria-label="Controles táctiles">
        {btn('left', '←', 'Mover a la izquierda')}
        {btn('rotate', '↻', 'Girar')}
        {btn('right', '→', 'Mover a la derecha')}
        {btn('down', '↓', 'Bajar')}
        {btn('drop', '⤓', 'Dejar caer')}
      </div>
    </div>
  )
}
