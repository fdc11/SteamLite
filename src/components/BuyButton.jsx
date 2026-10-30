import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/format'

/**
 * Botón de acción principal de un juego. Cambia según el estado:
 * en biblioteca → Jugar · en carrito → Ir al carrito · gratis → Obtener · de pago → Añadir.
 */
export default function BuyButton({ game, size = 'md' }) {
  const { owns, inCart, addToCart, claimFree } = useStore()
  const cls = `btn btn--${size}`

  if (owns(game.id)) {
    return (
      <Link to={`/play/${game.id}`} className={`${cls} btn--play`}>
        Jugar ahora
      </Link>
    )
  }
  if (inCart(game.id)) {
    return (
      <Link to="/cart" className={`${cls} btn--ghost`}>
        En el carrito
      </Link>
    )
  }
  if (game.price === 0) {
    return (
      <button className={`${cls} btn--solid`} onClick={() => claimFree(game)}>
        Obtener gratis
      </button>
    )
  }
  return (
    <button className={`${cls} btn--solid`} onClick={() => addToCart(game)}>
      Añadir al carrito <span className="btn__price">{formatPrice(game.price)}</span>
    </button>
  )
}

export function OwnershipBadge({ game }) {
  const { owns, inCart } = useStore()
  if (owns(game.id)) return <span className="badge badge--owned">En tu biblioteca</span>
  if (inCart(game.id)) return <span className="badge">En el carrito</span>
  return null
}
