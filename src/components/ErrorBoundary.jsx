import { Component } from 'react'

/** Si una vista falla, muestra un aviso en lugar de dejar la pantalla vacía. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[SteamLite]', error, info.componentStack)
  }

  componentDidUpdate(prev) {
    // Al cambiar de ruta se intenta de nuevo.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="wrap state">
        <p className="state__title">Algo falló al abrir esta pantalla.</p>
        <p>{String(this.state.error.message || this.state.error)}</p>
        <div className="row-actions">
          <button className="btn btn--solid btn--md" onClick={() => window.location.reload()}>Recargar</button>
          <a href="/" className="link-underline">Volver a la tienda</a>
        </div>
      </div>
    )
  }
}
