import { useEffect, useState } from 'react'

// Caché a nivel de módulo: el catálogo se descarga una sola vez por sesión.
let cache = null

export function useGames() {
  const [games, setGames] = useState(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetch('/data/games.json')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`)
        return res.json()
      })
      .then((data) => {
        cache = data
        if (!cancelled) setGames(data)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return { games, loading, error }
}

export function useGame(id) {
  const { games, loading, error } = useGames()
  return { game: games.find((g) => g.id === id), loading, error }
}
