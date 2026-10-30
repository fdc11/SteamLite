// Utilidades comunes a los minijuegos.

export const INK = '#1A1636'
export const INK_2 = '#241F48'
export const PAPER = '#F3EEFF'
export const FONT = "\"Bricolage Grotesque Variable\", system-ui, sans-serif"

/** Prepara un canvas con resolución lógica fija y nítido en pantallas retina. */
export function setupCanvas(canvas, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

/** Bucle con requestAnimationFrame. Devuelve una función para detenerlo. */
export function startLoop(step) {
  let raf
  let last = performance.now()
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30) // evita saltos al cambiar de pestaña
    last = now
    step(dt, now)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Capa encima del juego para inicio, pausa y fin de partida. */
export function Overlay({ title, children, action, onAction, secondary }) {
  return (
    <div className="overlay">
      <div className="overlay__card">
        {title && <p className="overlay__title">{title}</p>}
        {children && <div className="overlay__text">{children}</div>}
        {action && (
          <button className="btn btn--solid btn--lg" onClick={onAction} autoFocus>
            {action}
          </button>
        )}
        {secondary}
      </div>
    </div>
  )
}

/** Evita que flechas y espacio hagan scroll mientras se juega. */
export const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'])
