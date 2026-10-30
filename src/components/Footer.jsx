import { Link } from 'react-router-dom'
import Marquee from './Marquee'
import { Mascot } from './Logo'

const STRIP = [
  { label: 'Sigue jugando', color: '#FF6FA8' },
  { label: '11 juegos', color: '#5CC8FF' },
  { label: 'Prueba antes de comprar', color: '#7BD389' },
  { label: 'Hecho en Perú', color: '#FF6FA8' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <Marquee items={STRIP} tone="ink" speed={30} />
      <div className="wrap footer__inner">
        <div className="footer__top">
          <p className="footer__big">Juegos pequeños para ratos largos.</p>
          <Mascot size={120} className="footer__mascot" />
        </div>
        <div className="footer__cols">
          <nav aria-label="Pie de página">
            <Link to="/">Tienda</Link>
            <Link to="/library">Biblioteca</Link>
            <Link to="/cart">Carrito</Link>
          </nav>
          <p className="footer__note">
            SteamLite es un proyecto académico. Los pagos son simulados: ninguna tarjeta se cobra ni se envía a ningún servidor.
          </p>
        </div>
        <p className="footer__copy">
          <span className="pixel">© {new Date().getFullYear()} SteamLite</span>
          <span>Presiona <kbd className="pixel">/</kbd> para buscar desde cualquier pantalla</span>
        </p>
      </div>
    </footer>
  )
}
