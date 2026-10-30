export default function Stars({ value, max = 5 }) {
  const full = Math.round(value)
  return (
    <span className="stars" aria-label={`${value} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden="true" className={i < full ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}
