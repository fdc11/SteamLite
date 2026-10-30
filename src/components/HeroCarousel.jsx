import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Poster } from './GameArt'
import BuyButton, { TryLink } from './BuyButton'
import { formatPrice } from '../utils/format'

const INTERVAL = 7000

export default function HeroCarousel({ games }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const game = games[index]

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (paused || reduce || games.length < 2) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % games.length), INTERVAL)
    return () => clearTimeout(t)
  }, [index, paused, games.length])

  if (!game) return null

  return (
    <section
      className="hero"
      style={{ '--g': game.color }}
      aria-roledescription="carrusel"
      aria-label="Juegos destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="wrap hero__grid" key={game.id}>
        <div className="hero__copy">
          <p className="hero__kicker">Destacado esta semana, {game.genre.toLowerCase()}</p>
          <h1 className="hero__title">{game.title}</h1>
          <p className="hero__tagline">{game.tagline}</p>
          <div className="hero__actions">
            <BuyButton game={game} size="lg" />
            <TryLink game={game} />
            <Link to={`/game/${game.id}`} className="link-underline">Ver detalles</Link>
          </div>
        </div>
        <Link to={`/game/${game.id}`} className="hero__poster" aria-label={`Ver ${game.title}`}>
          <Poster game={game} animate />
          <span className="hero__sticker">{formatPrice(game.price)}</span>
        </Link>
      </div>

      <div className="wrap hero__tabs" role="tablist" aria-label="Elegir juego destacado" style={{ '--n': games.length }}>
        {games.map((g, i) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={i === index}
            className={`hero__tab ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            <span className="hero__tabname">{g.title}</span>
            <span className="hero__bar" aria-hidden="true">
              <span style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
