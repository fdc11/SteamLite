import { Link } from 'react-router-dom'

export function Loading() {
  return (
    <div className="wrap state" aria-busy="true">
      <span className="loader" aria-hidden="true" />
      <p>Cargando catálogo…</p>
    </div>
  )
}

export function ErrorBox({ message }) {
  return (
    <div className="wrap state">
      <p className="state__title">No pudimos cargar la tienda.</p>
      <p>{message}. Recarga la página para intentarlo de nuevo.</p>
    </div>
  )
}

export function NotFoundBox({ title = 'Este juego no existe.', text = 'Puede que el enlace esté mal escrito.' }) {
  return (
    <div className="wrap state">
      <p className="state__title">{title}</p>
      <p>{text}</p>
      <Link to="/" className="btn btn--solid btn--md">Volver a la tienda</Link>
    </div>
  )
}
