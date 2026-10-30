import { Suspense, lazy, useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { useStore } from '../context/StoreContext'
import BuyButton from '../components/BuyButton'
import { Poster } from '../components/GameArt'
import { Loading, ErrorBox, NotFoundBox } from '../components/States'
import { getBest, saveBest } from '../utils/storage'

// Cada juego se descarga solo cuando se abre (code splitting).
const ENGINES = {
  'salto-guisante': lazy(() => import('../games/SaltoGuisante')),
  'entre-tubos': lazy(() => import('../games/EntreTubos')),
  buscaminas: lazy(() => import('../games/Buscaminas')),
  serpiente: lazy(() => import('../games/Serpiente')),
  2048: lazy(() => import('../games/Game2048')),
}

export default function Play() {
  const { id } = useParams()
  const { game, loading, error } = useGame(id)
  const { owns } = useStore()
  const [best, setBest] = useState(() => getBest(id))
  const [record, setRecord] = useState(false)

  const onFinish = useCallback(
    (score) => {
      const isNew = saveBest(id, score, game?.lowerIsBetter)
      setRecord(isNew)
      if (isNew) setBest(score)
      return isNew
    },
    [id, game],
  )

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  if (!game || !ENGINES[game.id]) return <NotFoundBox />

  if (!owns(game.id)) {
    return (
      <div className="wrap page locked" style={{ '--g': game.color }}>
        <div className="locked__art"><Poster game={game} /></div>
        <div>
          <h1 className="display-1">Todavía no tienes {game.title}.</h1>
          <p className="lead">Añádelo a tu biblioteca para jugarlo aquí mismo.</p>
          <div className="row-actions">
            <BuyButton game={game} size="lg" />
            <Link to={`/game/${game.id}`} className="link-underline">Ver la ficha</Link>
          </div>
        </div>
      </div>
    )
  }

  const Engine = ENGINES[game.id]

  return (
    <div className="play" style={{ '--g': game.color }}>
      <div className="wrap play__bar">
        <Link to="/library" className="back">Biblioteca</Link>
        <h1 className="play__title">{game.title}</h1>
        <p className="play__best">
          {game.scoreLabel}: <strong>{best != null ? `${best}${game.scoreUnit ? ' ' + game.scoreUnit : ''}` : 'sin récord'}</strong>
          {record && <span className="play__new">Récord nuevo</span>}
        </p>
      </div>

      <div className="wrap play__stage">
        <Suspense fallback={<div className="stage-loading">Cargando juego…</div>}>
          <Engine color={game.color} best={best} onFinish={onFinish} onStart={() => setRecord(false)} />
        </Suspense>
      </div>

      <div className="wrap play__help">
        <h2>Cómo se juega</h2>
        <ul>
          {game.controls.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
    </div>
  )
}
