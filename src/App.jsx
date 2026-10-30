import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import Cart from './pages/Cart'
import Library from './pages/Library'
import Play from './pages/Play'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import InsertCoin from './components/InsertCoin'
import { useGames } from './hooks/useGames'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Llaves obligatorias: en Chrome reciente scrollTo devuelve una Promise
    // y React la confundiría con la función de limpieza.
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const { loading } = useGames()
  return (
    <>
      <InsertCoin ready={!loading} />
      <ScrollToTop />
      <Navbar />
      <main id="contenido">
        <ErrorBoundary resetKey={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/library" element={<Library />} />
          <Route path="/play/:id" element={<Play />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toast />
    </>
  )
}
