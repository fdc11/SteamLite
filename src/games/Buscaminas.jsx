import { useCallback, useEffect, useRef, useState } from 'react'
import { Overlay } from './shared'
import { getBest, saveBest } from '../utils/storage'

const LEVELS = {
  facil: { label: 'Fácil', rows: 9, cols: 9, mines: 10 },
  medio: { label: 'Medio', rows: 12, cols: 12, mines: 24 },
  dificil: { label: 'Difícil', rows: 16, cols: 16, mines: 40 },
}

const emptyBoard = (rows, cols) =>
  Array.from({ length: rows * cols }, (_, i) => ({ i, mine: false, open: false, flag: false, n: 0 }))

const neighbors = (i, rows, cols) => {
  const r = Math.floor(i / cols)
  const c = i % cols
  const out = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc)
    }
  return out
}

/** Coloca minas evitando la primera casilla y sus vecinas: el primer clic siempre abre zona. */
function plantMines(board, first, { rows, cols, mines }) {
  const safe = new Set([first, ...neighbors(first, rows, cols)])
  const pool = board.map((c) => c.i).filter((i) => !safe.has(i))
  for (let k = pool.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[pool[k], pool[j]] = [pool[j], pool[k]]
  }
  const next = board.map((c) => ({ ...c }))
  pool.slice(0, mines).forEach((i) => (next[i].mine = true))
  next.forEach((c) => (c.n = neighbors(c.i, rows, cols).filter((j) => next[j].mine).length))
  return next
}

function flood(board, start, rows, cols) {
  const next = board.map((c) => ({ ...c }))
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()
    const cell = next[i]
    if (cell.open || cell.flag) continue
    cell.open = true
    if (cell.n === 0 && !cell.mine) neighbors(i, rows, cols).forEach((j) => !next[j].open && stack.push(j))
  }
  return next
}

export default function Buscaminas({ onFinish, onEnd, onStart }) {
  const [level, setLevel] = useState('facil')
  const cfg = LEVELS[level]
  const [board, setBoard] = useState(() => emptyBoard(cfg.rows, cfg.cols))
  const [status, setStatus] = useState('ready') // ready | playing | won | lost
  const [time, setTime] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const [boom, setBoom] = useState(null)
  const [record, setRecord] = useState(false)
  const [bests, setBests] = useState(() => Object.fromEntries(Object.keys(LEVELS).map((k) => [k, getBest(`buscaminas:${k}`)])))
  const startedAt = useRef(0)
  const press = useRef({ timer: null, fired: false })

  const reset = useCallback(
    (lv = level) => {
      const c = LEVELS[lv]
      setBoard(emptyBoard(c.rows, c.cols))
      setStatus('ready')
      setTime(0)
      setBoom(null)
      setRecord(false)
    },
    [level],
  )

  useEffect(() => {
    if (status !== 'playing') return
    const t = setInterval(() => setTime(Math.floor((Date.now() - startedAt.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [status])

  const finishWin = (b) => {
    const secs = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
    setTime(secs)
    setStatus('won')
    const isNew = saveBest(`buscaminas:${level}`, secs, true)
    if (isNew) setBests((bs) => ({ ...bs, [level]: secs }))
    // El récord general de la biblioteca es el del nivel Fácil.
    let general = false
    if (level === 'facil') general = onFinish(secs)
    else onEnd?.()
    setRecord(isNew || general)
    setBoard(b.map((c) => (c.mine ? { ...c, flag: true } : c)))
  }

  const checkWin = (b) => b.every((c) => c.mine || c.open)

  const reveal = (i) => {
    if (status === 'won' || status === 'lost') return
    let b = board
    if (status === 'ready') {
      b = plantMines(board, i, cfg)
      startedAt.current = Date.now()
      setStatus('playing')
      onStart?.()
    }
    const cell = b[i]
    if (cell.flag) return

    // "Acorde": clic en un número ya abierto con sus banderas completas abre el resto.
    if (cell.open) {
      if (!cell.n) return
      const ns = neighbors(i, cfg.rows, cfg.cols)
      if (ns.filter((j) => b[j].flag).length !== cell.n) return
      let next = b
      for (const j of ns) {
        if (next[j].flag || next[j].open) continue
        if (next[j].mine) return lose(next, j)
        next = flood(next, j, cfg.rows, cfg.cols)
      }
      setBoard(next)
      if (checkWin(next)) finishWin(next)
      return
    }

    if (cell.mine) return lose(b, i)
    const next = flood(b, i, cfg.rows, cfg.cols)
    setBoard(next)
    if (checkWin(next)) finishWin(next)
  }

  const lose = (b, i) => {
    onEnd?.()
    setBoom(i)
    setStatus('lost')
    setBoard(b.map((c) => (c.mine ? { ...c, open: true } : c)))
  }

  const toggleFlag = (i) => {
    if (status !== 'playing' && status !== 'ready') return
    if (board[i].open) return
    setBoard((b) => b.map((c) => (c.i === i ? { ...c, flag: !c.flag } : c)))
  }

  const onCellDown = (i, e) => {
    if (e.pointerType !== 'touch') return
    press.current.fired = false
    press.current.timer = setTimeout(() => {
      press.current.fired = true
      toggleFlag(i)
      navigator.vibrate?.(15)
    }, 380)
  }
  const cancelPress = () => clearTimeout(press.current.timer)

  const onCellClick = (i) => {
    cancelPress()
    if (press.current.fired) {
      press.current.fired = false
      return
    }
    if (flagMode && !board[i].open) toggleFlag(i)
    else reveal(i)
  }

  const flags = board.filter((c) => c.flag).length

  return (
    <div className="mines" style={{ '--cols': cfg.cols }}>
      <div className="mines__bar">
        <div className="seg" role="group" aria-label="Dificultad">
          {Object.entries(LEVELS).map(([k, v]) => (
            <button
              key={k}
              aria-pressed={level === k}
              onClick={() => {
                setLevel(k)
                reset(k)
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="mines__stats">
          <span title="Minas restantes"><b>{cfg.mines - flags}</b> minas</span>
          <span title="Tiempo"><b>{time}</b> s</span>
          <span className="mines__best">Récord {bests[level] != null ? `${bests[level]} s` : 'sin marca'}</span>
        </div>
      </div>

      <div className="mines__wrap">
        <div
          className={`mines__grid ${status === 'lost' ? 'is-lost' : ''}`}
          role="grid"
          aria-label={`Tablero de ${cfg.rows} por ${cfg.cols}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.map((c) => (
            <button
              key={c.i}
              role="gridcell"
              className={`cell ${c.open ? 'is-open' : ''} ${c.flag ? 'is-flag' : ''} ${c.mine && c.open ? 'is-mine' : ''} ${boom === c.i ? 'is-boom' : ''}`}
              data-n={c.open && !c.mine ? c.n : undefined}
              onClick={() => onCellClick(c.i)}
              onContextMenu={(e) => {
                e.preventDefault()
                toggleFlag(c.i)
              }}
              onPointerDown={(e) => onCellDown(c.i, e)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              aria-label={c.open ? (c.mine ? 'Mina' : c.n ? `${c.n} minas cerca` : 'Vacía') : c.flag ? 'Bandera' : 'Sin descubrir'}
            >
              {c.open && !c.mine && c.n > 0 ? c.n : ''}
            </button>
          ))}
        </div>

        {status === 'won' && (
          <Overlay title={record ? '¡Nuevo récord!' : 'Tablero limpio'} action="Jugar otra vez" onAction={() => reset()}>
            Lo resolviste en <strong>{time} s</strong> en nivel {cfg.label.toLowerCase()}.
          </Overlay>
        )}
        {status === 'lost' && (
          <div className="mines__lost" role="status">
            <span>Pisaste una mina.</span>
            <button className="btn btn--solid btn--sm" onClick={() => reset()} autoFocus>Intentar de nuevo</button>
          </div>
        )}
      </div>

      <div className="mines__tools">
        <button className={`btn btn--sm ${flagMode ? 'btn--solid' : 'btn--ghost'}`} aria-pressed={flagMode} onClick={() => setFlagMode((f) => !f)}>
          {flagMode ? 'Modo bandera activado' : 'Activar modo bandera'}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => reset()}>Nueva partida</button>
      </div>
    </div>
  )
}
