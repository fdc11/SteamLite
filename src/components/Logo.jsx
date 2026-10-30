import { useEffect, useRef, useState } from 'react'

/** Guisi, la mascota: un guisante que parpadea y sigue el cursor con la mirada. */
export function Mascot({ size = 40, follow = true, className = '' }) {
  const ref = useRef(null)
  const [look, setLook] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!follow) return
    const onMove = (e) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      setLook({ x: (dx / d) * Math.min(3, d / 40), y: (dy / d) * Math.min(2.5, d / 40) })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [follow])

  return (
    <svg ref={ref} className={`mascot ${className}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="44" rx="13" ry="2.5" fill="rgba(0,0,0,.25)" className="mascot__shadow" />
      <g className="mascot__body">
        <circle cx="24" cy="23" r="18" fill="#4FAE5F" />
        <circle cx="24" cy="21" r="18" fill="#8FE09B" />
        <ellipse cx="16" cy="12" rx="5" ry="3.5" fill="#D8F7DC" transform="rotate(-25 16 12)" />
        <g className="mascot__eyes" transform={`translate(${look.x} ${look.y})`}>
          <ellipse cx="18" cy="21" rx="3" ry="3.6" fill="#1A1636" />
          <ellipse cx="30" cy="21" rx="3" ry="3.6" fill="#1A1636" />
          <circle cx="19" cy="19.6" r="1.1" fill="#fff" />
          <circle cx="31" cy="19.6" r="1.1" fill="#fff" />
        </g>
        <path d="M19 28.5q5 4.5 10 0" stroke="#1A1636" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="13.5" cy="27" r="2.4" fill="#FF6FA8" opacity=".55" />
        <circle cx="34.5" cy="27" r="2.4" fill="#FF6FA8" opacity=".55" />
      </g>
    </svg>
  )
}

export default function Logo() {
  return (
    <span className="logo__inner">
      <Mascot size={38} />
      <span className="logo__word">
        steam<span className="logo__tag pixel">lite</span>
      </span>
    </span>
  )
}
