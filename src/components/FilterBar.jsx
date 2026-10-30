export const SORTS = {
  relevance: 'Destacados primero',
  priceAsc: 'Precio: menor a mayor',
  priceDesc: 'Precio: mayor a menor',
  name: 'Nombre (A–Z)',
  rating: 'Mejor valorados',
}

export default function FilterBar({ genres, genre, onGenre, query, onQuery, sort, onSort, count }) {
  return (
    <div className="filters">
      <label className="search">
        <span className="sr-only">Buscar juegos</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar: minas, retro, salto…"
          autoComplete="off"
        />
      </label>

      <div className="filters__row">
        <div className="chips" role="group" aria-label="Filtrar por género">
          {['Todos', ...genres].map((g) => (
            <button key={g} className="chip" aria-pressed={genre === g} onClick={() => onGenre(g)}>
              {g}
            </button>
          ))}
        </div>
        <label className="sort">
          <span className="sr-only">Ordenar</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="filters__count" aria-live="polite">
        {count === 1 ? '1 juego' : `${count} juegos`}
      </p>
    </div>
  )
}
