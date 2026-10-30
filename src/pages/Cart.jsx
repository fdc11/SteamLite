import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useGames } from '../hooks/useGames'
import { Poster } from '../components/GameArt'
import CheckoutForm from '../components/CheckoutForm'
import { Loading } from '../components/States'
import { formatPrice } from '../utils/format'

const IGV = 0.18

export default function Cart() {
  const { cart, removeFromCart, checkout } = useStore()
  const { games, loading } = useGames()
  const [receipt, setReceipt] = useState(null)

  if (loading) return <Loading />

  const items = cart.map((id) => games.find((g) => g.id === id)).filter(Boolean)
  const total = items.reduce((s, g) => s + g.price, 0)
  const base = total / (1 + IGV)
  const tax = total - base

  if (receipt) {
    return (
      <div className="wrap page success">
        <p className="success__mark" aria-hidden="true">✓</p>
        <h1 className="display-1">Listo, ya son tuyos.</h1>
        <p className="lead">
          Pagaste {receipt.total} con la tarjeta terminada en {receipt.last4}. Enviamos el recibo (de mentira) a {receipt.email}.
        </p>
        <ul className="success__list">
          {receipt.games.map((g) => (
            <li key={g.id} style={{ '--g': g.color }}>
              <span className="success__dot" />
              {g.title}
              <Link to={`/play/${g.id}`} className="link-underline">Jugar</Link>
            </li>
          ))}
        </ul>
        <div className="row-actions">
          <Link to="/library" className="btn btn--solid btn--lg">Ir a mi biblioteca</Link>
          <Link to="/" className="link-underline">Seguir comprando</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="wrap page">
        <h1 className="display-1">Tu carrito está vacío.</h1>
        <p className="lead">Elige algo en la tienda. Buscaminas es gratis, por si quieres empezar sin gastar.</p>
        <Link to="/" className="btn btn--solid btn--lg">Ir a la tienda</Link>
      </div>
    )
  }

  return (
    <div className="wrap page cart">
      <h1 className="display-1">Carrito</h1>
      <div className="cart__grid">
        <section aria-label="Juegos en el carrito">
          <ul className="cart__list">
            {items.map((g) => (
              <li key={g.id} className="line" style={{ '--g': g.color }}>
                <Link to={`/game/${g.id}`} className="line__art" tabIndex={-1} aria-hidden="true">
                  <Poster game={g} />
                </Link>
                <div className="line__info">
                  <Link to={`/game/${g.id}`} className="line__title">{g.title}</Link>
                  <span className="line__genre">{g.genre}</span>
                </div>
                <span className="line__price">{formatPrice(g.price)}</span>
                <button className="line__remove" onClick={() => removeFromCart(g.id)} aria-label={`Quitar ${g.title} del carrito`}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <dl className="totals">
            <div><dt>Subtotal (sin IGV)</dt><dd>{formatPrice(base)}</dd></div>
            <div><dt>IGV 18%</dt><dd>{formatPrice(tax)}</dd></div>
            <div className="totals__total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
        </section>

        <CheckoutForm
          total={formatPrice(total)}
          onPaid={({ email, last4 }) => {
            const bought = items
            checkout()
            setReceipt({ email, last4, total: formatPrice(total), games: bought })
            window.scrollTo({ top: 0, behavior: 'smooth' })?.catch?.(() => {})
          }}
        />
      </div>
    </div>
  )
}
