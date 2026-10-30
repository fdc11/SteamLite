import { Link } from 'react-router-dom'
import { Poster } from './GameArt'
import { OwnershipBadge } from './BuyButton'
import { formatPrice } from '../utils/format'
import { useStore } from '../context/StoreContext'

export default function GameCard({ game }) {
  const { owns } = useStore()
  return (
    <article className="card" style={{ '--g': game.color }}>
      <Link to={`/game/${game.id}`} className="card__link">
        <div className="card__art">
          <Poster game={game} />
        </div>
        <div className="card__body">
          <h3 className="card__title">{game.title}</h3>
          <p className="card__tagline">{game.tagline}</p>
          <div className="card__meta">
            <span>{game.genre}</span>
            {owns(game.id) ? <OwnershipBadge game={game} /> : <span className="card__price">{formatPrice(game.price)}</span>}
          </div>
        </div>
      </Link>
    </article>
  )
}
