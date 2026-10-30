import { useEffect, useState } from 'react'
import { Mascot } from './Logo'

const KEY = 'steamlite:booted'

function alreadyBooted() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

/** Pantalla de carga estilo arcade. Solo aparece la primera vez en cada sesión. */
export default function InsertCoin({ ready }) {
  const [show, setShow] = useState(() => !alreadyBooted())
  const [pct, setPct] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now()
    const min = reduce ? 200 : 1300
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - started) / min)
      // Llega hasta 92% sola; el último tramo espera a que el catálogo esté listo.
      const target = ready ? 100 : 92
      setPct((p) => Math.max(p, Math.round(Math.min(target, t * 100))))
      if (t < 1 || !ready) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [show, ready])

  useEffect(() => {
    if (pct < 100 || leaving) return
    const t = setTimeout(() => setLeaving(true), 280)
    return () => clearTimeout(t)
  }, [pct, leaving])

  useEffect(() => {
    if (!leaving) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* sin almacenamiento */
    }
    const t = setTimeout(() => setShow(false), 700)
    return () => clearTimeout(t)
  }, [leaving])

  if (!show) return null

  return (
    <div className={`coin ${leaving ? 'is-leaving' : ''}`} role="status" aria-label={`Cargando SteamLite, ${pct}%`} onClick={() => pct >= 92 && setLeaving(true)}>
      <div className="coin__stripes" aria-hidden="true">
        {['#FFD23F', '#FF6FA8', '#5CC8FF', '#7BD389', '#A78BFA'].map((c, i) => (
          <span key={c} style={{ background: c, '--i': i }} />
        ))}
      </div>
      <div className="coin__center">
        <Mascot size={96} follow={false} className="coin__mascot" />
        <p className="coin__title pixel">Insert coin</p>
        <div className="coin__bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
        <p className="coin__pct pixel">{String(pct).padStart(3, '0')}%</p>
      </div>
    </div>
  )
}
