import { useEffect, useRef, useState } from 'react'
import { Overlay } from './shared'

// Ocho símbolos dibujados con SVG, cada uno con su color.
const SYMBOLS = [
  { id: 'guisante', color: '#7BD389', d: <><circle cx="50" cy="52" r="30" /><circle cx="40" cy="48" r="4" fill="#F3EEFF" /><circle cx="60" cy="48" r="4" fill="#F3EEFF" /><path d="M40 62q10 9 20 0" stroke="#F3EEFF" strokeWidth="5" fill="none" strokeLinecap="round" /></> },
  { id: 'estrella', color: '#FFD23F', d: <path d="M50 14l10 24 26 2-20 17 7 26-23-14-23 14 7-26-20-17 26-2z" /> },
  { id: 'corazon', color: '#FF6FA8', d: <path d="M50 84S16 62 16 38c0-12 9-20 19-20 7 0 12 4 15 9 3-5 8-9 15-9 10 0 19 8 19 20 0 24-34 46-34 46z" /> },
  { id: 'rayo', color: '#5CC8FF', d: <path d="M56 12L24 56h22l-6 32 34-46H52z" /> },
  { id: 'luna', color: '#A78BFA', d: <path d="M64 16a36 36 0 1 0 20 52A30 30 0 0 1 64 16z" /> },
  { id: 'diamante', color: '#4FE3D7', d: <path d="M50 12l30 38-30 38-30-38z" /> },
  { id: 'llama', color: '#F2E3C6', d: <><rect x="54" y="20" width="12" height="40" rx="6" /><ellipse cx="66" cy="22" rx="12" ry="8" /><ellipse cx="44" cy="62" rx="26" ry="16" /><rect x="26" y="70" width="7" height="18" rx="3" /><rect x="54" y="70" width="7" height="18" rx="3" /><circle cx="69" cy="20" r="2.5" fill="#F3EEFF" /></> },
  { id: 'cohete', color: '#FF5D5D', d: <><path d="M50 10c14 10 18 30 14 50H36c-4-20 0-40 14-50z" /><circle cx="50" cy="36" r="7" fill="#F3EEFF" /><path d="M36 54l-12 16 14-4zM64 54l12 16-14-4z" /><path d="M42 62l8 18 8-18z" fill="#FF9248" /></> },
]

function deal() {
  const cards = [...SYMBOLS, ...SYMBOLS].map((s, i) => ({ key: i, sym: s, open: false, done: false }))
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export default function Memoria({ onFinish, onStart, best }) {
  const [cards, setCards] = useState(deal)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [status, setStatus] = useState('ready') // ready | playing | won
  const [record, setRecord] = useState(false)
  const picked = useRef([])
  const busy = useRef(false)
  const started = useRef(0)

  useEffect(() => {
    if (status !== 'playing') return
    const t = setInterval(() => setTime(Math.floor((Date.now() - started.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [status])

  const reset = () => {
    setCards(deal())
    setMoves(0)
    setTime(0)
    setStatus('ready')
    setRecord(false)
    picked.current = []
    busy.current = false
  }

  const flip = (i) => {
    if (busy.current || status === 'won') return
    const card = cards[i]
    if (card.open || card.done) return
    if (status === 'ready') {
      setStatus('playing')
      started.current = Date.now()
      onStart?.()
    }
    const next = cards.map((c, k) => (k === i ? { ...c, open: true } : c))
    picked.current.push(i)
    setCards(next)
    if (picked.current.length < 2) return

    const [a, b] = picked.current
    picked.current = []
    const m = moves + 1
    setMoves(m)
    if (next[a].sym.id === next[b].sym.id) {
      const solved = next.map((c, k) => (k === a || k === b ? { ...c, done: true } : c))
      setCards(solved)
      if (solved.every((c) => c.done)) {
        setStatus('won')
        setTime(Math.floor((Date.now() - started.current) / 1000))
        setRecord(onFinish(m))
      }
    } else {
      busy.current = true
      setTimeout(() => {
        setCards((cs) => cs.map((c, k) => (k === a || k === b ? { ...c, open: false } : c)))
        busy.current = false
      }, 750)
    }
  }

  return (
    <div className="memo">
      <div className="memo__bar">
        <div className="g2048__score"><span>Movimientos</span><b>{moves}</b></div>
        <div className="g2048__score"><span>Tiempo</span><b>{time} s</b></div>
        <div className="g2048__score"><span>Récord</span><b>{best ?? 'sin marca'}</b></div>
        <button className="btn btn--ghost btn--sm" onClick={reset}>Repartir</button>
      </div>
      <div className="memo__wrap">
        <div className="memo__grid">
          {cards.map((c, i) => (
            <button
              key={c.key}
              className={`mcard ${c.open || c.done ? 'is-open' : ''} ${c.done ? 'is-done' : ''}`}
              onClick={() => flip(i)}
              aria-label={c.open || c.done ? c.sym.id : 'Carta boca abajo'}
              style={{ '--c': c.sym.color }}
            >
              <span className="mcard__inner">
                <span className="mcard__back" aria-hidden="true" />
                <span className="mcard__front" aria-hidden="true">
                  <svg viewBox="0 0 100 100" fill="#1A1636">{c.sym.d}</svg>
                </span>
              </span>
            </button>
          ))}
        </div>
        {status === 'won' && (
          <Overlay title={record ? '¡Nuevo récord!' : '¡Todas las parejas!'} action="Jugar otra vez" onAction={reset}>
            Lo lograste en <strong>{moves} movimientos</strong> y {time} segundos.
          </Overlay>
        )}
      </div>
    </div>
  )
}
