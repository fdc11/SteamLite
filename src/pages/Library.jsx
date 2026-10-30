import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useGames } from '../hooks/useGames'
import { Poster } from '../components/GameArt'
import { Loading } from '../components/States'
import { getBest } from '../utils/storage'
import { formatDate } from '../utils/format'

export default function Library() {
  const { library } = useStore()
  const { games, loading } = useGames()
  const [order, setOrder] = useState('recent')

  const owned = useMemo(() => {
    const list = library
      .map((entry) => ({ ...games.find((g) => g.id === entry.id), acquiredAt: entry.acquiredAt }))
      .filter((g) => g.title)
    return order === 'recent'
      ? list.sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt))
      : list.sort((a, b) => a.title.localeCompare(b.title, 'es'))
  }, [library, games, order])

  if (loading) return <Loading />

  if (owned.length === 0) {
    return (
      <div className="wrap page">
        <h1 className="display-1">Tu biblioteca está vacía.</h1>
        <p className="lead">Los juegos que compres aparecen aquí, listos para jugar. Empieza con Buscaminas, que es gratis.</p>
        <div className="row-actions">
          <Link to="/game/buscaminas" className="btn btn--solid btn--lg">Obtener Buscaminas</Link>
          <Link to="/" className="link-underline">Ver la tienda</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap page library">
      <div className="library__head">
        <h1 className="display-1">Biblioteca</h1>
        <div className="seg" role="group" aria-label="Ordenar biblioteca">
          <button aria-pressed={order === 'recent'} onClick={() => setOrder('recent')}>Recientes</button>
          <button aria-pressed={order === 'az'} onClick={() => setOrder('az')}>A–Z</button>
        </div>
      </div>
      <p className="lead">{owned.length === 1 ? 'Tienes 1 juego.' : `Tienes ${owned.length} juegos.`}</p>

      <ul className="shelf-list">
        {owned.map((g) => {
          const best = getBest(g.id)
          return (
            <li key={g.id} className="owned" style={{ '--g': g.color }}>
              <Link to={`/play/${g.id}`} className="owned__art" aria-label={`Jugar ${g.title}`}>
                <Poster game={g} />
              </Link>
              <div className="owned__info">
                <h2 className="owned__title">{g.title}</h2>
                <p className="owned__meta">Desde el {formatDate(g.acquiredAt)}</p>
                <p className="owned__best">
                  {best != null ? <>{g.scoreLabel}: <strong>{best}{g.scoreUnit ? ` ${g.scoreUnit}` : ''}</strong></> : 'Aún sin récord'}
                </p>
              </div>
              <div className="owned__actions">
                <Link to={`/play/${g.id}`} className="btn btn--play btn--md">Jugar</Link>
                <Link to={`/game/${g.id}`} className="link-underline">Ficha</Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
