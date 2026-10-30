import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { KEYS, readJSON, writeJSON } from '../utils/storage'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => readJSON(KEYS.cart, []))
  // Biblioteca: [{ id, acquiredAt }]
  const [library, setLibrary] = useState(() => readJSON(KEYS.library, []))
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  useEffect(() => writeJSON(KEYS.cart, cart), [cart])
  useEffect(() => writeJSON(KEYS.library, library), [library])

  // Sincroniza si el usuario tiene la tienda abierta en otra pestaña.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEYS.cart) setCart(readJSON(KEYS.cart, []))
      if (e.key === KEYS.library) setLibrary(readJSON(KEYS.library, []))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current)
    setToast({ message, key: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const owns = useCallback((id) => library.some((g) => g.id === id), [library])
  const inCart = useCallback((id) => cart.includes(id), [cart])

  const addToCart = useCallback(
    (game) => {
      if (owns(game.id) || cart.includes(game.id)) return
      setCart((c) => [...c, game.id])
      notify(`${game.title} se añadió al carrito`)
    },
    [cart, owns, notify],
  )

  const removeFromCart = useCallback((id) => setCart((c) => c.filter((x) => x !== id)), [])
  const clearCart = useCallback(() => setCart([]), [])

  const addToLibrary = useCallback((ids) => {
    const now = new Date().toISOString()
    setLibrary((lib) => {
      const fresh = ids.filter((id) => !lib.some((g) => g.id === id))
      return [...lib, ...fresh.map((id) => ({ id, acquiredAt: now }))]
    })
  }, [])

  /** Simula la compra: mueve los juegos del carrito a la biblioteca. */
  const checkout = useCallback(() => {
    const ids = [...cart]
    addToLibrary(ids)
    setCart([])
    return ids
  }, [cart, addToLibrary])

  const claimFree = useCallback(
    (game) => {
      addToLibrary([game.id])
      setCart((c) => c.filter((x) => x !== game.id))
      notify(`${game.title} ya está en tu biblioteca`)
    },
    [addToLibrary, notify],
  )

  const value = useMemo(
    () => ({ cart, library, toast, owns, inCart, addToCart, removeFromCart, clearCart, checkout, claimFree }),
    [cart, library, toast, owns, inCart, addToCart, removeFromCart, clearCart, checkout, claimFree],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
