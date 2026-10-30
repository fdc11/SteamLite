// Arte vectorial generado para cada juego: pósters (4:5) y capturas (16:9).
// Todo es SVG, así que no hay imágenes que subir ni derechos que pagar.

const INK = '#1A1636'
const PAPER = '#F3EEFF'

function rng(seed) {
  let a = seed * 9301 + 49297
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Pea({ x, y, r = 34, animate }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={animate ? 'pea-bounce' : undefined}>
        <ellipse cx="0" cy={r * 0.15} rx={r} ry={r * 0.95} fill="#4FAE5F" />
        <circle cx="0" cy="0" r={r} fill="#8FE09B" />
        <circle cx={-r * 0.38} cy={-r * 0.42} r={r * 0.2} fill="#D8F7DC" />
        <circle cx={-r * 0.3} cy={-r * 0.02} r={r * 0.12} fill={INK} />
        <circle cx={r * 0.3} cy={-r * 0.02} r={r * 0.12} fill={INK} />
        <path d={`M${-r * 0.3} ${r * 0.3} q${r * 0.3} ${r * 0.3} ${r * 0.6} 0`} stroke={INK} strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />
      </g>
    </g>
  )
}

function Brick({ x, y, w = 86, h = 20, fill, line, broken }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={fill} />
      <path d={`M${x} ${y + h / 2}h${w} M${x + w * 0.33} ${y}v${h / 2} M${x + w * 0.66} ${y + h / 2}v${h / 2}`} stroke={line} strokeWidth="2" />
      {broken && <path d={`M${x + w * 0.45} ${y}l6 ${h * 0.5}l-8 ${h * 0.5}`} stroke={line} strokeWidth="3" fill="none" />}
    </g>
  )
}

function SaltoScene({ w, h, bg, fg, seed, animate }) {
  const r = rng(seed)
  const rows = 6
  const bricks = Array.from({ length: rows }, (_, i) => ({
    x: 20 + r() * (w - 126),
    y: h - 46 - i * ((h - 40) / rows),
    broken: i > 1 && r() < 0.25,
  }))
  const target = bricks[2]
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={r() * w} cy={r() * h} r={1 + r() * 2.5} fill={fg} opacity="0.35" />
      ))}
      {bricks.map((b, i) => (
        <Brick key={i} x={b.x} y={b.y} fill={fg} line={bg} broken={b.broken} />
      ))}
      <path d={`M${target.x + 43} ${target.y - 4} v-${h * 0.08}`} stroke={fg} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <Pea x={target.x + 43} y={target.y - h * 0.14 - 34} r={Math.min(w, h) * 0.085} animate={animate} />
    </>
  )
}

function Bird({ x, y, s = 1, body = '#FF6FA8' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-12)`}>
      <ellipse cx="0" cy="0" rx="30" ry="24" fill={body} />
      <path d="M-10 4 q-18 -2 -22 14 q16 2 22 -14z" fill={PAPER} />
      <circle cx="12" cy="-7" r="9" fill={PAPER} />
      <circle cx="15" cy="-7" r="4" fill={INK} />
      <path d="M24 2 l18 4 l-18 6z" fill="#FF9248" />
    </g>
  )
}

function Pipe({ x, top, bottom, w, h, fill, edge }) {
  return (
    <g>
      <rect x={x} y="0" width={w} height={top} fill={fill} />
      <rect x={x - 8} y={top - 26} width={w + 16} height="26" rx="4" fill={fill} stroke={edge} strokeWidth="3" />
      <rect x={x} y={bottom} width={w} height={h - bottom} fill={fill} />
      <rect x={x - 8} y={bottom} width={w + 16} height="26" rx="4" fill={fill} stroke={edge} strokeWidth="3" />
    </g>
  )
}

function TubosScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const pw = Math.max(56, w * 0.16)
  const gap = h * 0.32
  const pipes = []
  for (let x = w * 0.48; x < w + pw; x += pw * 2.6) {
    const c = h * 0.3 + r() * h * 0.35
    pipes.push({ x, top: c - gap / 2, bottom: c + gap / 2 })
  }
  const first = pipes[0]
  const by = (first.top + first.bottom) / 2 + 10
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {pipes.map((p, i) => (
        <Pipe key={i} {...p} w={pw} h={h} fill={fg} edge={bg} />
      ))}
      <path d={`M${w * 0.04} ${by + 60} Q ${w * 0.18} ${by - 40} ${w * 0.3} ${by}`} stroke={fg} strokeWidth="3" strokeDasharray="1 10" strokeLinecap="round" fill="none" />
      <Bird x={w * 0.3} y={by} s={Math.min(w, h) / 380} body={bg === INK ? '#FF6FA8' : INK} />
    </>
  )
}

const NUM_COLORS = ['', '#2F6BFF', '#1E9E5A', '#E2364A', '#6A3BD6']

function Mine({ x, y, s, fill }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x={-s * 0.42} y={-s * 0.05} width={s * 0.84} height={s * 0.1} fill={fill} transform={`rotate(${a})`} />
      ))}
      <circle r={s * 0.28} fill={fill} />
      <circle cx={-s * 0.09} cy={-s * 0.09} r={s * 0.07} fill={PAPER} />
    </g>
  )
}

function MinasScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const s = Math.round(Math.min(w, h) / 7.5)
  const cols = Math.floor((w - 20) / s)
  const rows = Math.floor((h - 20) / s)
  const ox = (w - cols * s) / 2
  const oy = (h - rows * s) / 2
  const cx = cols / 2
  const cy = rows / 2
  const cells = []
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const d = Math.hypot(i - cx + 0.5, j - cy + 0.5)
      const open = d < Math.min(cols, rows) * 0.38 + r() * 1.2
      cells.push({ i, j, open, n: open && r() < 0.4 ? 1 + Math.floor(r() * 3) : 0, mine: !open && r() < 0.08, flag: !open && r() < 0.1 })
    }
  }
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {cells.map((c) => {
        const x = ox + c.i * s
        const y = oy + c.j * s
        return (
          <g key={`${c.i}-${c.j}`}>
            <rect x={x + 2} y={y + 2} width={s - 4} height={s - 4} rx="4" fill={c.open ? PAPER : fg} opacity={c.open ? 0.92 : 1} />
            {c.n > 0 && (
              <text x={x + s / 2} y={y + s * 0.68} textAnchor="middle" fontSize={s * 0.5} fontWeight="800" fontFamily="Bricolage Grotesque Variable, sans-serif" fill={NUM_COLORS[c.n]}>
                {c.n}
              </text>
            )}
            {c.mine && <Mine x={x + s / 2} y={y + s / 2} s={s * 0.8} fill={bg === INK ? INK : PAPER} />}
            {c.flag && !c.mine && (
              <g>
                <rect x={x + s * 0.42} y={y + s * 0.22} width={s * 0.07} height={s * 0.56} fill={bg === INK ? INK : PAPER} />
                <path d={`M${x + s * 0.49} ${y + s * 0.22} l${s * 0.28} ${s * 0.14} l-${s * 0.28} ${s * 0.14}z`} fill="#E2364A" />
              </g>
            )}
          </g>
        )
      })}
    </>
  )
}

function SerpienteScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const s = Math.round(Math.min(w, h) / 10)
  const cols = Math.floor(w / s)
  const rows = Math.floor(h / s)
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  let p = [Math.floor(cols * 0.25), Math.floor(rows * 0.7)]
  let d = 0
  const pts = [p]
  for (let k = 0; k < 18; k++) {
    if (r() < 0.3) d = (d + (r() < 0.5 ? 1 : 3)) % 4
    let next = [p[0] + dirs[d][0], p[1] + dirs[d][1]]
    if (next[0] < 1 || next[0] > cols - 2 || next[1] < 1 || next[1] > rows - 2) {
      d = (d + 1) % 4
      next = [p[0] + dirs[d][0], p[1] + dirs[d][1]]
    }
    p = next
    pts.push(p)
  }
  const head = pts[pts.length - 1]
  const fx = Math.min(cols - 2, head[0] + 2)
  const poly = pts.map(([x, y]) => `${x * s + s / 2},${y * s + s / 2}`).join(' ')
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {Array.from({ length: cols * rows }, (_, k) => (
        <circle key={k} cx={(k % cols) * s + s / 2} cy={Math.floor(k / cols) * s + s / 2} r="1.5" fill={fg} opacity="0.25" />
      ))}
      <polyline points={poly} fill="none" stroke={fg} strokeWidth={s * 0.78} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={head[0] * s + s / 2} cy={head[1] * s + s / 2} r={s * 0.5} fill={fg} />
      <circle cx={head[0] * s + s * 0.38} cy={head[1] * s + s * 0.38} r={s * 0.11} fill={bg} />
      <circle cx={head[0] * s + s * 0.66} cy={head[1] * s + s * 0.38} r={s * 0.11} fill={bg} />
      <circle cx={fx * s + s / 2} cy={head[1] * s + s / 2} r={s * 0.34} fill="#FFD23F" />
      <rect x={fx * s + s * 0.47} y={head[1] * s + s * 0.04} width={s * 0.08} height={s * 0.2} fill={bg === INK ? '#7BD389' : INK} />
    </>
  )
}

const TILE = {
  2: ['#FFE8D6', INK], 4: ['#FFD3B0', INK], 8: ['#FFB27A', INK], 16: ['#FF9248', INK],
  32: ['#FF6FA8', INK], 64: ['#E2364A', PAPER], 128: ['#FFD23F', INK], 256: ['#7BD389', INK],
  512: ['#5CC8FF', INK], 1024: ['#8E7CFF', PAPER], 2048: [PAPER, INK],
}

function NumerosScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const size = Math.min(w, h) * 0.78
  const x0 = (w - size) / 2
  const y0 = (h - size) / 2
  const gap = size * 0.03
  const cell = (size - gap * 5) / 4
  const vals = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      <rect x={x0} y={y0} width={size} height={size} rx={size * 0.04} fill={bg === INK ? '#2A2452' : INK} />
      {Array.from({ length: 16 }, (_, k) => {
        const i = k % 4
        const j = Math.floor(k / 4)
        const v = r() < 0.72 ? vals[Math.floor(r() ** 1.6 * vals.length)] : null
        const x = x0 + gap + i * (cell + gap)
        const y = y0 + gap + j * (cell + gap)
        const [tf, tc] = v ? TILE[v] : ['#3A3466', INK]
        return (
          <g key={k}>
            <rect x={x} y={y} width={cell} height={cell} rx={cell * 0.1} fill={v ? tf : bg === INK ? '#3A3466' : '#2A2452'} />
            {v && (
              <text x={x + cell / 2} y={y + cell * 0.64} textAnchor="middle" fontSize={cell * (v > 512 ? 0.3 : 0.4)} fontWeight="800" fontFamily="Bricolage Grotesque Variable, sans-serif" fill={tc}>
                {v}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
}

const SCENES = {
  'salto-guisante': SaltoScene,
  'entre-tubos': TubosScene,
  buscaminas: MinasScene,
  serpiente: SerpienteScene,
  2048: NumerosScene,
}

/** Póster vertical en el color del juego. */
export function Poster({ game, animate = false, className }) {
  const Scene = SCENES[game.id] ?? SaltoScene
  return (
    <svg className={className} viewBox="0 0 400 500" role="img" aria-label={`Póster de ${game.title}`} preserveAspectRatio="xMidYMid slice">
      <Scene w={400} h={500} bg={game.color} fg={INK} seed={7} animate={animate} />
    </svg>
  )
}

/** Captura horizontal (fondo tinta, elementos en el color del juego). */
export function Shot({ game, n = 1, className }) {
  const Scene = SCENES[game.id] ?? SaltoScene
  return (
    <svg className={className} viewBox="0 0 640 360" role="img" aria-label={`Captura ${n} de ${game.title}`} preserveAspectRatio="xMidYMid slice">
      <Scene w={640} h={360} bg={INK} fg={game.color} seed={n * 13} />
    </svg>
  )
}
