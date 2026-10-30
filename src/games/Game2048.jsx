import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_KEYS, Overlay } from './shared'

const SIZE = 4
const ANIM = 110
let nextId = 1

function spawn(tiles) {
  const taken = new Set(tiles.filter((t) => !t.dead).map((t) => t.r * SIZE + t.c))
  const free = []
  for (let k = 0; k < SIZE * SIZE; k++) if (!taken.has(k)) free.push(k)
  if (!free.length) return tiles
  const k = free[Math.floor(Math.random() * free.length)]
  return [...tiles, { id: nextId++, v: Math.random() < 0.9 ? 2 : 4, r: Math.floor(k / SIZE), c: k % SIZE, isNew: true }]
}

function fresh() {
  return spawn(spawn([]))
}

function canMove(tiles) {
  if (tiles.length < SIZE * SIZE) return true
  const g = {}
  tiles.forEach((t) => (g[t.r * SIZE + t.c] = t.v))
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = g[r * SIZE + c]
      if (c < SIZE - 1 && g[r * SIZE + c + 1] === v) return true
      if (r < SIZE - 1 && g[(r + 1) * SIZE + c] === v) return true
    }
  return false
}

/** Desliza las fichas. Devuelve { tiles, gained, moved }. */
function slide(tiles, dir) {
  const next = tiles.map((t) => ({ ...t, merged: false, isNew: false }))
  const at = (r, c) => next.find((t) => t.r === r && t.c === c && !t.dead)
  let gained = 0
  let moved = false
  for (let line = 0; line < SIZE; line++) {
    const cells = []
    for (let k = 0; k < SIZE; k++) {
      const pos = dir === 'left' || dir === 'up' ? k : SIZE - 1 - k
      const [r, c] = dir === 'left' || dir === 'right' ? [line, pos] : [pos, line]
      const t = at(r, c)
      if (t) cells.push(t)
    }
    let pos = 0
    let last = null
    for (const t of cells) {
      const p = dir === 'left' || dir === 'up' ? pos : SIZE - 1 - pos
      if (last && last.v === t.v) {
        t.r = last.r
        t.c = last.c
        t.dead = true
        last.v *= 2
        last.merged = true
        gained += last.v
        moved = true
        last = null
        continue
      }
      const [r, c] = dir === 'left' || dir === 'right' ? [line, p] : [p, line]
      if (t.r !== r || t.c !== c) moved = true
      t.r = r
      t.c = c
      last = t
      pos++
    }
  }
  return { tiles: next, gained, moved }
}

export default function Game2048({ onFinish, onStart, best }) {
  const [tiles, setTiles] = useState(fresh)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // playing | won | over
  const [record, setRecord] = useState(false)
  const tilesRef = useRef(tiles)
  const scoreRef = useRef(0)
  const busy = useRef(false)
  const wonOnce = useRef(false)
  const statusRef = useRef(status)
  statusRef.current = status

  const commit = (t) => {
    tilesRef.current = t
    setTiles(t)
  }

  const newGame = useCallback(() => {
    if (scoreRef.current > 0 && statusRef.current === 'playing') onFinish(scoreRef.current)
    scoreRef.current = 0
    wonOnce.current = false
    setScore(0)
    setRecord(false)
    setStatus('playing')
    commit(fresh())
    onStart?.()
  }, [onFinish, onStart])

  const move = useCallback(
    (dir) => {
      if (busy.current || statusRef.current !== 'playing') return
      const { tiles: moved, gained, moved: changed } = slide(tilesRef.current, dir)
      if (!changed) return
      busy.current = true
      commit(moved)
      scoreRef.current += gained
      setScore(scoreRef.current)
      setTimeout(() => {
        const settled = spawn(moved.filter((t) => !t.dead))
        commit(settled)
        busy.current = false
        if (!wonOnce.current && settled.some((t) => t.v >= 2048)) {
          wonOnce.current = true
          setStatus('won')
        } else if (!canMove(settled)) {
          setRecord(onFinish(scoreRef.current))
          setStatus('over')
        }
      }, ANIM)
    },
    [onFinish],
  )

  useEffect(() => {
    const map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }
    const onKey = (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      const d = map[e.key.toLowerCase()]
      if (d) move(d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  const touch = useRef(null)
  const onPointerDown = (e) => (touch.current = { x: e.clientX, y: e.clientY })
  const onPointerUp = (e) => {
    if (!touch.current) return
    const dx = e.clientX - touch.current.x
    const dy = e.clientY - touch.current.y
    touch.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  return (
    <div className="g2048">
      <div className="g2048__bar">
        <div className="g2048__score"><span>Puntos</span><b>{score}</b></div>
        <div className="g2048__score"><span>Récord</span><b>{Math.max(best ?? 0, record ? score : 0)}</b></div>
        <button className="btn btn--ghost btn--sm" onClick={newGame}>Nueva partida</button>
      </div>

      <div className="g2048__board" onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-label="Tablero de 2048. Usa las flechas para deslizar.">
        {Array.from({ length: SIZE * SIZE }, (_, k) => (
          <div key={k} className="g2048__cell" style={{ '--r': Math.floor(k / SIZE), '--c': k % SIZE }} />
        ))}
        {tiles.map((t) => (
          <div
            key={t.id}
            className={`tile ${t.isNew ? 'is-new' : ''} ${t.merged ? 'is-merged' : ''} ${t.dead ? 'is-dead' : ''}`}
            data-v={t.v > 2048 ? 'big' : t.v}
            style={{ '--r': t.r, '--c': t.c }}
          >
            <span>{t.v}</span>
          </div>
        ))}

        {status === 'won' && (
          <Overlay title="¡Llegaste a 2048!" action="Seguir jugando" onAction={() => setStatus('playing')}>
            Llevas <strong>{score}</strong> puntos. Puedes seguir para subir el récord.
          </Overlay>
        )}
        {status === 'over' && (
          <Overlay title={record ? '¡Nuevo récord!' : 'Sin movimientos'} action="Nueva partida" onAction={newGame}>
            Terminaste con <strong>{score}</strong> puntos.
          </Overlay>
        )}
      </div>
    </div>
  )
}
