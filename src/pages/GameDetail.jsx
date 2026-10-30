import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGame, useGames } from '../hooks/useGames'
import { Poster, Shot } from '../components/GameArt'
import BuyButton, { OwnershipBadge } from '../components/BuyButton'
import GameCard from '../components/GameCard'
import Stars from '../components/Stars'
import { Loading, ErrorBox, NotFoundBox } from '../components/States'
import { formatPrice } from '../utils/format'
import { getBest } from '../utils/storage'

const TABS = ['Descripción', 'Controles', 'Reseñas']

export default function GameDetail() {
  const { id } = useParams()
  const { game, loading, error } = useGame(id)
  const { games } = useGames()
  const [tab, setTab] = useState(TABS[0])
  const [shot, setShot] = useState(null)

  useEffect(() => setTab(TABS[0]), [id])

  useEffect(() => {
    if (shot == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShot(null)
      if (e.key === 'ArrowRight') setShot((s) => (s % 3) + 1)
      if (e.key === 'ArrowLeft') setShot((s) => ((s + 1) % 3) + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shot])

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  if (!game) return <NotFoundBox />

  const best = getBest(game.id)
  const others = games.filter((g) => g.id !== game.id).slice(0, 3)

  return (
    <div className="detail" style={{ '--g': game.color }}>
      <section className="detail__band">
        <div className="wrap detail__grid">
          <div className="detail__poster">
            <Poster game={game} animate />
          </div>
          <div className="detail__info">
            <Link to="/" className="back">Tienda</Link>
            <h1 className="detail__title">{game.title}</h1>
            <p className="detail__tagline">{game.tagline}</p>

            <dl className="facts">
              <div><dt>Género</dt><dd>{game.genre}</dd></div>
              <div><dt>Estudio</dt><dd>{game.developer}</dd></div>
              <div><dt>Valoración</dt><dd><Stars value={game.rating} /> {game.rating.toFixed(1)}</dd></div>
              {best != null && (
                <div><dt>Tu récord</dt><dd>{best}{game.scoreUnit ? ` ${game.scoreUnit}` : ''}</dd></div>
              )}
            </dl>

            <div className="detail__buy">
              <p className="detail__price">{formatPrice(game.price)}</p>
              <BuyButton game={game} size="lg" />
              <OwnershipBadge game={game} />
            </div>
          </div>
        </div>
      </section>

      <section className="wrap shots" aria-label="Capturas">
        {[1, 2, 3].map((n) => (
          <button key={n} className="shot" onClick={() => setShot(n)} aria-label={`Ampliar captura ${n}`}>
            <Shot game={game} n={n} />
          </button>
        ))}
      </section>

      <section className="wrap tabs-wrap">
        <div className="tabs" role="tablist" aria-label="Información del juego">
          {TABS.map((t) => (
            <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="tabpanel" className="tab" onClick={() => setTab(t)}>
              {t}
              {t === 'Reseñas' && <span className="tab__n">{game.reviews.length}</span>}
            </button>
          ))}
        </div>
        <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="tabpanel">
          {tab === 'Descripción' && <p className="prose">{game.description}</p>}
          {tab === 'Controles' && (
            <ul className="controls">
              {game.controls.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          {tab === 'Reseñas' && (
            <ul className="reviews">
              {game.reviews.map((r) => (
                <li key={r.user} className="review">
                  <div className="review__head">
                    <span className="review__avatar" aria-hidden="true">{r.user[0].toUpperCase()}</span>
                    <strong>{r.user}</strong>
                    <Stars value={r.score} />
                  </div>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="wrap more">
        <h2 className="display-3">También te puede gustar</h2>
        <div className="grid">
          {others.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      </section>

      {shot != null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Captura ${shot} de ${game.title}`} onClick={() => setShot(null)}>
          <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <Shot game={game} n={shot} />
            <div className="lightbox__bar">
              <span>Captura {shot} de 3</span>
              <div>
                <button className="btn btn--ghost btn--sm" onClick={() => setShot(((shot + 1) % 3) + 1)}>Anterior</button>
                <button className="btn btn--ghost btn--sm" onClick={() => setShot((shot % 3) + 1)}>Siguiente</button>
                <button className="btn btn--solid btn--sm" onClick={() => setShot(null)} autoFocus>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
