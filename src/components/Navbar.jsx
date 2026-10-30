import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import Logo from './Logo'
import CommandPalette from './CommandPalette'

const LINKS = [
  { to: '/', label: 'Tienda', end: true, color: '#FFD23F' },
  { to: '/library', label: 'Biblioteca', color: '#7BD389' },
  { to: '/cart', label: 'Carrito', color: '#FF6FA8' },
]

export default function Navbar() {
  const { cart, library } = useStore()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [pill, setPill] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const linksRef = useRef(null)

  // Indicador que se desliza bajo el enlace activo.
  useLayoutEffect(() => {
    const measure = () => {
      const el = linksRef.current?.querySelector('a.active')
      if (!el) return setPill(null)
      setPill({ left: el.offsetLeft, width: el.offsetWidth, color: el.dataset.color })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pathname, cart.length, library.length])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // "/" o Ctrl+K abren el buscador (menos cuando estás escribiendo o jugando con el teclado).
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      if ((e.key === '/' && !typing && !pathname.startsWith('/play')) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const counts = { '/library': library.length, '/cart': cart.length }

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <div className="nav__bar">
        <Link to="/" className="logo" aria-label="SteamLite, inicio">
          <Logo />
        </Link>

        <nav className="nav__links" aria-label="Principal" ref={linksRef}>
          {pill && <span className="nav__pill" style={{ transform: `translateX(${pill.left}px)`, width: pill.width, background: pill.color }} aria-hidden="true" />}
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} data-color={l.color}>
              {l.label}
              {l.to !== '/' && (
                <span key={counts[l.to]} className={`count ${counts[l.to] ? 'count--on' : ''}`}>{counts[l.to]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav__tools">
          <button className="nav__search" onClick={() => setPalette(true)} aria-label="Buscar juegos (atajo: /)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <span className="nav__search-label">Buscar</span>
            <kbd className="pixel">/</kbd>
          </button>
          <Link to="/cart" className="nav__cartbtn" aria-label={`Carrito, ${cart.length} juegos`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11h10.2L20 7H7" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></svg>
            <span key={cart.length} className={`nav__cartcount ${cart.length ? 'is-on' : ''}`}>{cart.length}</span>
          </Link>
          <button className="nav__toggle" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen((o) => !o)}>
            <span className="nav__burger" aria-hidden="true"><i /><i /></span>
            <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </div>
      </div>

      <div id="menu-movil" className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <nav aria-label="Menú">
          {LINKS.map((l, i) => (
            <NavLink key={l.to} to={l.to} end={l.end} style={{ '--c': l.color, '--i': i }} tabIndex={open ? 0 : -1}>
              <span>{l.label}</span>
              {l.to !== '/' && <span className="pixel mobile-menu__n">{counts[l.to]}</span>}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn--ghost btn--md" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); setPalette(true) }}>
          Buscar un juego
        </button>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </header>
  )
}
