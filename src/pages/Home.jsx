import { useMemo, useState } from 'react'
import { useGames } from '../hooks/useGames'
import HeroCarousel from '../components/HeroCarousel'
import FilterBar from '../components/FilterBar'
import GameCard from '../components/GameCard'
import { Loading, ErrorBox } from '../components/States'

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const GENRE_COPY = {
  Plataformas: 'Saltar, caer, volver a saltar. Reflejos y algo de suerte.',
  Arcade: 'Partidas de un minuto que se convierten en una hora.',
  Lógica: 'Sin prisa. Piensa antes de mover.',
}

const sorters = {
  relevance: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  name: (a, b) => a.title.localeCompare(b.title, 'es'),
  rating: (a, b) => b.rating - a.rating,
}

export default function Home() {
  const { games, loading, error } = useGames()
  const [genre, setGenre] = useState('Todos')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('relevance')

  const genres = useMemo(() => [...new Set(games.map((g) => g.genre))], [games])
  const featured = useMemo(() => games.filter((g) => g.featured), [games])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return games
      .filter((g) => genre === 'Todos' || g.genre === genre)
      .filter((g) => !q || normalize([g.title, g.genre, g.tagline, ...g.tags].join(' ')).includes(q))
      .sort(sorters[sort])
  }, [games, genre, query, sort])

  // Agrupa por categoría para la vista de catálogo.
  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((g) => map.set(g.genre, [...(map.get(g.genre) ?? []), g]))
    return [...map.entries()]
  }, [filtered])

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />

  return (
    <>
      <HeroCarousel games={featured} />

      <section className="wrap store" aria-labelledby="store-title">
        <div className="store__head">
          <h2 id="store-title" className="display-2">La tienda</h2>
          <p className="store__lead">
            Cinco juegos que caben en un descanso y duran semanas. Compra una vez y quedan en tu biblioteca para siempre (o hasta que borres el navegador).
          </p>
        </div>

        <FilterBar
          genres={genres}
          genre={genre}
          onGenre={setGenre}
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          count={filtered.length}
        />

        {groups.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Nada coincide con “{query}”.</p>
            <p>Prueba con otra palabra o quita el filtro de género.</p>
            <button className="btn btn--ghost btn--md" onClick={() => { setQuery(''); setGenre('Todos') }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          groups.map(([name, list]) => (
            <section key={name} className="shelf" aria-label={name}>
              <div className="shelf__side" style={{ '--g': list[0].color }}>
                <h3 className="shelf__title">
                  {name} <span>{list.length}</span>
                </h3>
                {GENRE_COPY[name] && <p className="shelf__desc">{GENRE_COPY[name]}</p>}
              </div>
              <div className="grid">
                {list.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </>
  )
}
