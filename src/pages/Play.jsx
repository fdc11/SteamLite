import { Suspense, lazy, useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { useStore } from '../context/StoreContext'
import BuyButton from '../components/BuyButton'
import { Poster } from '../components/GameArt'
import { Loading, ErrorBox, NotFoundBox } from '../components/States'
import { TRIAL_GAMES, getBest, saveBest, spendTrial, trialsUsed } from '../utils/storage'

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
  // key={id}: al pasar de un juego a otro se reinicia todo el estado.
  return <PlayScreen key={id} id={id} />
}

function PlayScreen({ id }) {
  const { game, loading, error } = useGame(id)
  const { owns } = useStore()
  const [best, setBest] = useState(() => getBest(id))
  const [record, setRecord] = useState(false)
  const [left, setLeft] = useState(() => TRIAL_GAMES - trialsUsed(id))
  const owned = owns(id)
  // Si llegó sin partidas de prueba, se muestra la pantalla de compra.
  const [arrivedExhausted] = useState(() => trialsUsed(id) >= TRIAL_GAMES)

  // Cada partida terminada sin tener el juego gasta una partida de prueba.
  const spendOne = useCallback(() => {
    if (!owned) setLeft(spendTrial(id))
  }, [owned, id])

  const onFinish = useCallback(
    (score) => {
      spendOne()
      const isNew = saveBest(id, score, game?.lowerIsBetter)
      setRecord(isNew)
      if (isNew) setBest(score)
      return isNew
    },
    [id, game, spendOne],
  )

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  if (!game || !ENGINES[game.id]) return <NotFoundBox />

  const Engine = ENGINES[game.id]
  const trial = !owned
  const trialOver = trial && left <= 0

    if (trial && arrivedExhausted) return <TrialEnded game={game} />

  return (
    <div className="play" style={{ '--g': game.color }}>
      <div className="wrap play__bar">
        <Link to={owned ? '/library' : `/game/${game.id}`} className="back">{owned ? 'Biblioteca' : 'Ficha del juego'}</Link>
        <h1 className="play__title">{game.title}</h1>
        <p className="play__best">
          {game.scoreLabel}: <strong>{best != null ? `${best}${game.scoreUnit ? ' ' + game.scoreUnit : ''}` : 'sin récord'}</strong>
          {record && <span className="play__new">Récord nuevo</span>}
        </p>
      </div>

      {trial && (
        <div className="wrap">
          <div className="trial" role="status">
            <p>
              <strong>Versión de prueba.</strong>{' '}
              {left > 0
                ? `Te ${left === 1 ? 'queda 1 partida' : `quedan ${left} partidas`} de ${TRIAL_GAMES}.`
                : 'Terminaste tus partidas de prueba.'}
            </p>
            <BuyButton game={game} size="sm" />
          </div>
        </div>
      )}

      <div className="wrap play__stage">
        <div className="stage">
          <Suspense fallback={<div className="stage-loading">Cargando juego…</div>}>
            <Engine color={game.color} best={best} onFinish={onFinish} onEnd={spendOne} onStart={() => setRecord(false)} />
          </Suspense>
          {trialOver && (
            <div className="trial-over">
              <div className="trial-over__card">
                <p className="overlay__title">Fin de la prueba</p>
                <p>Ya jugaste tus {TRIAL_GAMES} partidas gratis de {game.title}. Cómpralo para seguir jugando sin límite; tu récord se mantiene.</p>
                <BuyButton game={game} size="lg" />
                <Link to="/" className="link-underline">Volver a la tienda</Link>
              </div>
            </div>
          )}
        </div>
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

function TrialEnded({ game }) {
  return (
    <div className="wrap page locked" style={{ '--g': game.color }}>
      <div className="locked__art"><Poster game={game} /></div>
      <div>
        <h1 className="display-1">Se acabó la prueba de {game.title}.</h1>
        <p className="lead">Ya usaste tus {TRIAL_GAMES} partidas gratis. Cómpralo y queda en tu biblioteca para jugar cuando quieras.</p>
        <div className="row-actions">
          <BuyButton game={game} size="lg" />
          <Link to={`/game/${game.id}`} className="link-underline">Ver la ficha</Link>
        </div>
      </div>
    </div>
  )
}
