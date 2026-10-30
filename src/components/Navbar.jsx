import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function Navbar() {
  const { cart, library } = useStore()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="nav">
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <div className="nav__inner wrap">
        <Link to="/" className="logo" onClick={close} aria-label="SteamLite, inicio">
          <span className="logo__mark" aria-hidden="true" />
          steamlite
        </Link>

        <button className="nav__toggle" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
          {open ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="menu" className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Principal">
          <NavLink to="/" end onClick={close}>Tienda</NavLink>
          <NavLink to="/library" onClick={close}>
            Biblioteca <span className="count">{library.length}</span>
          </NavLink>
          <NavLink to="/cart" onClick={close} className="nav__cart">
            Carrito <span className={`count ${cart.length ? 'count--on' : ''}`}>{cart.length}</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
