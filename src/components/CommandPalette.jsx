import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGames } from '../hooks/useGames'
import { useStore } from '../context/StoreContext'
import { Poster } from './GameArt'
import { formatPrice } from '../utils/format'

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const PAGES = [
  { id: 'p-home', label: 'Ir a la tienda', to: '/', hint: 'Página' },
  { id: 'p-lib', label: 'Ir a mi biblioteca', to: '/library', hint: 'Página' },
  { id: 'p-cart', label: 'Ir al carrito', to: '/cart', hint: 'Página' },
]

/** Buscador rápido: se abre con "/" o Ctrl+K desde cualquier pantalla. */
export default function CommandPalette({ open, onClose }) {
  const { games } = useGames()
  const { owns } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const n = normalize(q.trim())
    const gs = games
      .filter((g) => !n || normalize([g.title, g.genre, ...g.tags].join(' ')).includes(n))
      .map((g) => ({ id: g.id, label: g.title, to: owns(g.id) ? `/play/${g.id}` : `/game/${g.id}`, hint: owns(g.id) ? 'Jugar' : formatPrice(g.price), game: g }))
    const ps = PAGES.filter((p) => !n || normalize(p.label).includes(n))
    return [...gs, ...ps]
  }, [q, games, owns])

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [q])

  if (!open) return null

  const go = (r) => {
    if (!r) return
    onClose()
    navigate(r.to)
  }

  const onKey = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    }
    if (e.key === 'Enter') go(results[active])
  }

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Buscador rápido" onMouseDown={onClose}>
      <div className="palette__box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette__input">
          <span className="pixel palette__prompt" aria-hidden="true">&gt;_</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Busca un juego o una página"
            aria-label="Buscar"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
          />
          <kbd className="pixel">esc</kbd>
        </div>
        <ul id="palette-list" className="palette__list" role="listbox">
          {results.length === 0 && <li className="palette__empty">Nada con “{q}”. Prueba con “arcade” o “gratis”.</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`pal-${r.id}`}
              role="option"
              aria-selected={i === active}
              className={`palette__item ${i === active ? 'is-active' : ''}`}
              style={r.game ? { '--g': r.game.color } : undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              {r.game ? (
                <span className="palette__thumb"><Poster game={r.game} /></span>
              ) : (
                <span className="palette__thumb palette__thumb--page" aria-hidden="true">↗</span>
              )}
              <span className="palette__label">{r.label}</span>
              <span className="palette__hint">{r.hint}</span>
            </li>
          ))}
        </ul>
        <p className="palette__foot pixel">↑↓ mover · enter abrir</p>
      </div>
    </div>
  )
}
