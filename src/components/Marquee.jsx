/** Cinta infinita con texto. Se repite dos veces para que el bucle no tenga corte. */
export default function Marquee({ items, tone = 'paper', reverse = false, speed = 40 }) {
  const row = (hidden) => (
    <div className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span key={i} className="marquee__item">
          {it.label}
          <svg className="marquee__star" viewBox="0 0 20 20" aria-hidden="true" style={{ fill: it.color }}>
            <path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" />
          </svg>
        </span>
      ))}
    </div>
  )
  return (
    <div className="marquee-clip">
    <div className={`marquee marquee--${tone} ${reverse ? 'marquee--reverse' : ''}`} style={{ '--speed': `${speed}s` }}>
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
    </div>
  )
}
