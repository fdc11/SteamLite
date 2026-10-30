import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function Toast() {
  const { toast, cart } = useStore()
  return (
    <div className="toast-zone" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.key}>
          <span>{toast.message}</span>
          {cart.length > 0 && <Link to="/cart">Ver carrito ({cart.length})</Link>}
        </div>
      )}
    </div>
  )
}
