import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Poster } from './GameArt'
import { OwnershipBadge } from './BuyButton'
import { formatPrice } from '../utils/format'
import { useStore } from '../context/StoreContext'

export default function GameCard({ game }) {
  const { owns } = useStore()
  const artRef = useRef(null)

  // Inclinación 3D que sigue al cursor (solo con mouse; en táctil no aplica).
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = artRef.current
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`)
    el.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
  }
  const onLeave = () => {
    const el = artRef.current
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  const owned = owns(game.id)

  return (
    <article className="card" style={{ '--g': game.color }}>
      <Link to={`/game/${game.id}`} className="card__link" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="card__stage">
          <div className="card__art" ref={artRef}>
            <Poster game={game} />
            <span className="card__glare" aria-hidden="true" />
          </div>
          {!owned && (
            <span className={`card__sticker ${game.price === 0 ? 'card__sticker--free pixel' : ''}`}>
              {formatPrice(game.price)}
            </span>
          )}
        </div>
        <div className="card__body">
          <h3 className="card__title">{game.title}</h3>
          <p className="card__tagline">{game.tagline}</p>
          <div className="card__meta">
            <span className="card__genre">{game.genre}</span>
            {owned ? <OwnershipBadge game={game} /> : <span className="card__rating">★ {game.rating.toFixed(1)}</span>}
          </div>
        </div>
      </Link>
    </article>
  )
}
