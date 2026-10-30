import { useCallback, useEffect, useState } from 'react'
import { Overlay } from './shared'
import { readJSON, writeJSON } from '../utils/storage'

// Palabras de 5 letras, sin tildes (la Ñ sí cuenta como letra).
const WORDS = `abeja abril acero actor aguja ahora alado album alero altar amigo ancho angel animo antes apodo arbol arena arroz asado atlas avion ayuda
bahia baile bajar balon banco banda barco barro besar bicho bolsa bombo brazo broma bruja buena burro busca
cable cabra cacao cajon calle calor campo canal canto carne carta casco causa cazar cebra cenar cerca cerdo cerro chico chile ciclo cielo cinta circo claro clase clave clima cobre coche colmo comer conde copia coral coser costa crema cruce cuero cueva culpa curva
dados danza datos deber dedos delta dicha disco doble dolor ducha dueño dulce
elote enero error espia etapa extra
falda falta fango farol fecha feliz fibra ficha fiera final firma flaco flora fondo forma freno fresa frase fruta fuego fuera fumar
gafas gallo ganar garra gasto gatos genio globo golfo golpe gorra gordo grado grano grasa grito grupo guapo gusto
hacha hielo hogar hojas hongo horno huevo humor igual
jabon jamon jarra jaula joven joyas juego jugar julio junio junto
labio lapiz largo latas leche lento letra libra libro lider limon linea lindo listo llama llano llave lleno lobos local lucha lugar lunes
madre magia mango manos manta marco mareo marzo mayor media medio mejor menta metal metro miedo mitad moler monte moral morir mosca motor mueca mujer mundo museo musgo
nadar naipe nariz negro nieto nieve niños noche norte notas novia nubes nuevo
obras ocaso odiar oeste oliva ollas orden oreja otoño oveja
padre pagar palma panal papel parar pared parte pasta patio pausa pavos pecho pedal peine pelea perla perro pesca piano picar pieza pinza pista plano plata plato playa plaza pluma pobre poder poema pollo polvo poner prado prisa prosa pulpo punto queso
radio rampa rango raton razon recto regla reina reloj resto rezar rival robot rodeo rollo ronda rueda ruido rumbo
sabio sable sacar salsa salud salto santo selva señal señor serie siglo silla sobre solar soñar sopas suave sucio suelo sueño surco
tabla talla tango tapas tarde tarea tarta techo tecla telar tenis tigre tinta tiras tocar todos tomar torre total trago trama trapo trece tribu trigo truco tumba turno
unico union vacas vagon valor vapor vasos venas verbo verde viaje video vieja virus vista viuda vivir volar vuelo yegua yogur zarpa zorro zurdo`
  .split(/\s+/)
  .filter((w) => [...w].length === 5)
  .map((w) => w.toUpperCase())

const ROWS = 6
const LEN = 5
const KEYS = ['QWERTYUIOP', 'ASDFGHJKLÑ', ['ENTER', ...'ZXCVBNM', 'BORRAR']]
const STREAK_KEY = 'steamlite:palabra-racha'

const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]

/** Colorea un intento respetando letras repetidas. */
function score(guess, answer) {
  const res = Array(LEN).fill('absent')
  const pool = {}
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === answer[i]) res[i] = 'correct'
    else pool[answer[i]] = (pool[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < LEN; i++) {
    if (res[i] === 'correct') continue
    if (pool[guess[i]] > 0) {
      res[i] = 'present'
      pool[guess[i]]--
    }
  }
  return res
}

export default function PalabraSecreta({ onFinish, onEnd, onStart }) {
  const [answer, setAnswer] = useState(pick)
  const [guesses, setGuesses] = useState([]) // [{ word, res }]
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState('playing') // playing | won | lost
  const [shake, setShake] = useState(false)
  const [msg, setMsg] = useState('')
  const [streak, setStreak] = useState(() => readJSON(STREAK_KEY, 0))
  const [record, setRecord] = useState(false)

  const keyState = {}
  const rank = { correct: 3, present: 2, absent: 1 }
  guesses.forEach(({ word, res }) => [...word].forEach((l, i) => {
    if (!keyState[l] || rank[res[i]] > rank[keyState[l]]) keyState[l] = res[i]
  }))

  const flash = (text) => {
    setMsg(text)
    setShake(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setMsg(''), 1600)
  }

  const submit = useCallback(() => {
    if ([...current].length < LEN) return flash('Faltan letras')
    if (guesses.length === 0) onStart?.()
    const res = score([...current], [...answer])
    const next = [...guesses, { word: current, res }]
    setGuesses(next)
    setCurrent('')
    if (current === answer) {
      const s = streak + 1
      setStreak(s)
      writeJSON(STREAK_KEY, s)
      setRecord(onFinish(s))
      setTimeout(() => setStatus('won'), 1500)
    } else if (next.length === ROWS) {
      setStreak(0)
      writeJSON(STREAK_KEY, 0)
      onEnd?.()
      setTimeout(() => setStatus('lost'), 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, guesses, answer, streak])

  const press = useCallback(
    (k) => {
      if (status !== 'playing') return
      if (k === 'ENTER') return submit()
      if (k === 'BORRAR') return setCurrent((c) => [...c].slice(0, -1).join(''))
      if ([...current].length < LEN && /^[A-ZÑ]$/.test(k)) setCurrent((c) => c + k)
    },
    [status, submit, current],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k === 'ENTER') press('ENTER')
      else if (k === 'BACKSPACE') press('BORRAR')
      else if (/^[A-ZÑ]$/.test(k)) press(k)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const reset = () => {
    setAnswer(pick())
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setRecord(false)
  }

  const rows = Array.from({ length: ROWS }, (_, r) => {
    if (r < guesses.length) return { letters: [...guesses[r].word], res: guesses[r].res, done: true }
    if (r === guesses.length) return { letters: [...current], res: [], active: true }
    return { letters: [], res: [] }
  })

  return (
    <div className="word">
      <div className="word__bar">
        <div className="g2048__score"><span>Racha actual</span><b>{streak}</b></div>
        <p className="word__msg" role="status">{msg}</p>
        <button className="btn btn--ghost btn--sm" onClick={reset}>Nueva palabra</button>
      </div>

      <div className="word__wrap">
        <div className="word__grid">
          {rows.map((row, r) => (
            <div key={r} className={`word__row ${row.active && shake ? 'is-shake' : ''}`}>
              {Array.from({ length: LEN }, (_, i) => (
                <span
                  key={i}
                  className={`tilebox ${row.letters[i] ? 'has-letter' : ''} ${row.done ? `is-${row.res[i]} is-revealed` : ''}`}
                  style={{ '--d': `${i * 0.12}s` }}
                >
                  {row.letters[i] ?? ''}
                </span>
              ))}
            </div>
          ))}
        </div>
        {status !== 'playing' && (
          <Overlay title={status === 'won' ? (record ? '¡Nueva mejor racha!' : '¡Adivinaste!') : 'Se acabaron los intentos'} action="Otra palabra" onAction={reset}>
            La palabra era <strong>{answer}</strong>.{status === 'won' && <> Racha: <strong>{streak}</strong>.</>}
          </Overlay>
        )}
      </div>

      <div className="kb" aria-label="Teclado">
        {KEYS.map((row, r) => (
          <div key={r} className="kb__row">
            {[...row].map((k) => (
              <button
                key={k}
                className={`kb__key ${k.length > 1 ? 'kb__key--wide' : ''} ${keyState[k] ? `is-${keyState[k]}` : ''}`}
                onClick={() => press(k)}
              >
                {k === 'BORRAR' ? '⌫' : k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
