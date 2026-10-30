import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <p className="footer__big">Juegos pequeños para ratos largos.</p>
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
        <p className="footer__copy">© {new Date().getFullYear()} SteamLite</p>
      </div>
    </footer>
  )
}
