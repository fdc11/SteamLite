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

/* ---------- Juegos nuevos ---------- */

function LlamaFigure({ x, y, s = 1, body, eye, animate }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={animate ? 'llama-hop' : undefined}>
        {[8, 18, 32, 42].map((lx, i) => (
          <rect key={lx} x={lx} y={36} width={7} height={22} rx={3} fill={body} transform={`rotate(${i % 2 ? 14 : -14} ${lx + 3} 36)`} />
        ))}
        <ellipse cx={26} cy={32} rx={28} ry={16} fill={body} />
        <rect x={40} y={-2} width={13} height={36} rx={6} fill={body} />
        <ellipse cx={54} cy={0} rx={13} ry={8} fill={body} />
        <path d="M42 -4 L45 -16 L49 -4z" fill={body} />
        <circle cx={45} cy={-16} r={3.5} fill="#FF6FA8" />
        <circle cx={57} cy={-2} r={2.4} fill={eye} />
        {['#FF6FA8', '#FFD23F', '#5CC8FF', '#7BD389'].map((c, i) => (
          <rect key={c} x={12 + i * 7} y={20} width={7} height={13} fill={c} />
        ))}
      </g>
    </g>
  )
}

function Cactus({ x, ground, h, fill }) {
  return (
    <g fill={fill}>
      <rect x={x} y={ground - h} width={16} height={h} rx={8} />
      <rect x={x - 10} y={ground - h * 0.7} width={10} height={7} rx={3} />
      <rect x={x - 10} y={ground - h * 0.92} width={7} height={h * 0.28} rx={3.5} />
      <rect x={x + 16} y={ground - h * 0.5} width={10} height={7} rx={3} />
      <rect x={x + 19} y={ground - h * 0.75} width={7} height={h * 0.3} rx={3.5} />
    </g>
  )
}

function LlamaScene({ w, h, bg, fg, seed, animate }) {
  const r = rng(seed)
  const ground = h * 0.8
  const dark = bg === INK
  const peaks = Array.from({ length: 6 }, (_, i) => ({ x: i * (w / 4) - r() * 40, ph: h * (0.28 + r() * 0.2) }))
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      <circle cx={w * 0.78} cy={h * 0.22} r={Math.min(w, h) * 0.09} fill={fg} opacity={dark ? 1 : 0.9} />
      {peaks.map((p, i) => (
        <g key={i}>
          <path d={`M${p.x - w * 0.22} ${ground} L${p.x} ${ground - p.ph} L${p.x + w * 0.22} ${ground}z`} fill={fg} opacity={dark ? 0.16 : 0.14} />
          <path d={`M${p.x - 18} ${ground - p.ph + 26} L${p.x} ${ground - p.ph} L${p.x + 18} ${ground - p.ph + 26} L${p.x + 6} ${ground - p.ph + 20} L${p.x - 4} ${ground - p.ph + 28}z`} fill={dark ? PAPER : '#FFFFFF'} opacity="0.8" />
        </g>
      ))}
      <rect x={0} y={ground} width={w} height={h - ground} fill={fg} opacity={dark ? 0.12 : 0.1} />
      <rect x={0} y={ground} width={w} height={4} fill={fg} />
      <Cactus x={w * 0.62} ground={ground} h={h * 0.13} fill={dark ? '#7BD389' : INK} />
      <Cactus x={w * 0.86} ground={ground} h={h * 0.09} fill={dark ? '#7BD389' : INK} />
      <path d={`M${w * 0.12} ${ground - 6} Q ${w * 0.3} ${ground - h * 0.42} ${w * 0.5} ${ground - h * 0.1}`} stroke={fg} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <LlamaFigure x={w * 0.22} y={ground - h * 0.38} s={Math.min(w, h) / 230} body={dark ? fg : INK} eye={dark ? INK : bg} animate={animate} />
    </>
  )
}

function BreakoutScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const dark = bg === INK
  const cols = 7
  const rows = 6
  const gap = 8
  const bw = (w - 40 - gap * (cols - 1)) / cols
  const bh = h * 0.045
  const colors = ['#FF5D5D', '#FF9248', '#FFD23F', '#7BD389', '#5CC8FF', '#A78BFA']
  const py = h * 0.86
  const px = w * 0.38
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {Array.from({ length: rows * cols }, (_, k) => {
        const c = k % cols
        const rr = Math.floor(k / cols)
        if (r() < 0.22 + rr * 0.04) return null
        return <rect key={k} x={20 + c * (bw + gap)} y={h * 0.12 + rr * (bh + gap)} width={bw} height={bh} rx={4} fill={dark ? colors[rr] : rr % 2 ? INK : PAPER} />
      })}
      <path d={`M${px + w * 0.11} ${py - 8} L${w * 0.66} ${h * 0.5} L${w * 0.82} ${h * 0.62}`} stroke={fg} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" fill="none" />
      <circle cx={w * 0.82} cy={h * 0.62} r={Math.min(w, h) * 0.025} fill={dark ? PAPER : INK} />
      <rect x={px} y={py} width={w * 0.22} height={h * 0.028} rx={6} fill={fg} />
    </>
  )
}

const ALIEN = ['...XXXXX...', '.XXXXXXXXX.', 'XX..XXX..XX', 'XXXXXXXXXXX', '.XXX...XXX.', '..XX.X.XX..', '.X..X.X..X.', 'X.........X']
const ALIEN2 = ['.X.......X.', '..X.....X..', '..XXXXXXX..', '.XX.XXX.XX.', '.XXXXXXXXX.', '...XXXXX...', '..X.X.X.X..', '.X.......X.']

function Pixels({ map, x, y, px, fill }) {
  const cells = []
  map.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cells.push(<rect key={`${i}-${j}`} x={x + i * px} y={y + j * px} width={px} height={px} />)))
  return <g fill={fill}>{cells}</g>
}

function GalaxiaScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const dark = bg === INK
  const px = Math.round(Math.min(w, h) / 85)
  const sx = w * (0.35 + r() * 0.3)
  return (
    <>
      <rect width={w} height={h} fill={dark ? '#100D24' : bg} />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={r() * w} y={r() * h} width={1 + r() * 2} height={1 + r() * 2} fill={dark ? PAPER : INK} opacity={0.5} />
      ))}
      {Array.from({ length: 12 }, (_, k) => {
        const c = k % 4
        const row = Math.floor(k / 4)
        if (r() < 0.15) return null
        return <Pixels key={k} map={row === 0 ? ALIEN2 : ALIEN} x={w * 0.14 + c * w * 0.2} y={h * 0.1 + row * px * 12} px={px} fill={dark ? '#EADBB8' : INK} />
      })}
      <rect x={sx - 2} y={h * 0.45} width={4} height={h * 0.06} fill={fg} />
      <rect x={sx - 2} y={h * 0.6} width={4} height={h * 0.06} fill={fg} />
      <g transform={`translate(${sx} ${h * 0.84}) scale(${Math.min(w, h) / 140})`} fill={fg}>
        <path d="M0 -20 L8 -6 L18 8 L18 14 L-18 14 L-18 8 L-8 -6z" />
        <circle cy="-2" r="4" fill={dark ? INK : bg} />
        <path d="M-6 14 L0 24 L6 14z" fill="#FF9248" />
      </g>
    </>
  )
}

const PIECE_COLORS = ['#5CC8FF', '#FFD23F', '#A78BFA', '#7BD389', '#FF5D5D', '#4FE3D7', '#FF9248']

function BloquesScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const dark = bg === INK
  const cell = Math.round(Math.min(w / 12, h / 16))
  const cols = 10
  const rowsN = Math.floor(h / cell)
  const ox = (w - cols * cell) / 2
  const heights = Array.from({ length: cols }, () => 2 + Math.floor(r() * 5))
  const gapCol = Math.floor(r() * cols)
  const blocks = []
  heights.forEach((hh, c) => {
    for (let k = 0; k < hh; k++) {
      if (c === gapCol && k < 3) continue
      blocks.push({ c, row: rowsN - 1 - k, color: dark ? PIECE_COLORS[(c + k * 3) % 7] : (c + k) % 3 ? INK : PAPER })
    }
  })
  const T = [[1, 0], [0, 1], [1, 1], [2, 1]].map(([dx, dy]) => ({ c: 4 + dx, row: 3 + dy }))
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      <rect x={ox} y={0} width={cols * cell} height={h} fill={dark ? '#211C44' : fg} opacity={dark ? 1 : 0.08} />
      {blocks.map((b, i) => (
        <rect key={i} x={ox + b.c * cell + 2} y={b.row * cell + 2} width={cell - 4} height={cell - 4} rx={4} fill={b.color} />
      ))}
      {T.map((b, i) => (
        <rect key={`t${i}`} x={ox + b.c * cell + 2} y={b.row * cell + 2} width={cell - 4} height={cell - 4} rx={4} fill={dark ? fg : INK} />
      ))}
      {T.map((b, i) => (
        <rect key={`g${i}`} x={ox + b.c * cell + 4} y={(b.row + rowsN - 9) * cell + 4} width={cell - 8} height={cell - 8} rx={3} fill="none" stroke={dark ? fg : INK} strokeWidth="2" opacity="0.5" />
      ))}
    </>
  )
}

const MEMO_COLORS = ['#7BD389', '#FFD23F', '#FF6FA8', '#5CC8FF', '#A78BFA', '#4FE3D7']

function MemoriaScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const dark = bg === INK
  const cols = 4
  const rows = w > h ? 3 : 4
  const gap = 12
  const cw = Math.min((w - 60 - gap * (cols - 1)) / cols, ((h - 60 - gap * (rows - 1)) / rows) * 0.8)
  const ch = cw * 1.25
  const ox = (w - cols * cw - gap * (cols - 1)) / 2
  const oy = (h - rows * ch - gap * (rows - 1)) / 2
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {Array.from({ length: cols * rows }, (_, k) => {
        const x = ox + (k % cols) * (cw + gap)
        const y = oy + Math.floor(k / cols) * (ch + gap)
        const open = r() < 0.35
        const color = MEMO_COLORS[Math.floor(r() * MEMO_COLORS.length)]
        return (
          <g key={k} transform={`rotate(${(r() - 0.5) * 6} ${x + cw / 2} ${y + ch / 2})`}>
            <rect x={x} y={y} width={cw} height={ch} rx={8} fill={open ? color : dark ? fg : INK} />
            {open ? (
              <circle cx={x + cw / 2} cy={y + ch / 2} r={cw * 0.22} fill={INK} />
            ) : (
              <path d={`M${x + cw / 2} ${y + ch * 0.3} l${cw * 0.18} ${ch * 0.2} l-${cw * 0.18} ${ch * 0.2} l-${cw * 0.18} -${ch * 0.2}z`} fill={dark ? INK : bg} opacity="0.5" />
            )}
          </g>
        )
      })}
    </>
  )
}

function PalabraScene({ w, h, bg, fg, seed }) {
  const r = rng(seed)
  const dark = bg === INK
  const words = [['P', 'L', 'A', 'Y', 'A'], ['L', 'L', 'A', 'V', 'E'], ['L', 'L', 'A', 'M', 'A']]
  const states = [
    ['a', 'p', 'c', 'a', 'p'],
    ['c', 'c', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'c', 'c'],
  ]
  const fills = { c: '#7BD389', p: '#FFD23F', a: dark ? '#3D3670' : INK }
  const rows = w > h ? 3 : 5
  const size = Math.min((w - 80) / 5.6, (h - 60) / (rows + 0.8))
  const gap = size * 0.14
  const ox = (w - 5 * size - 4 * gap) / 2
  const oy = (h - rows * size - (rows - 1) * gap) / 2
  void r
  return (
    <>
      <rect width={w} height={h} fill={bg} />
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: 5 }, (_, i) => {
          const x = ox + i * (size + gap)
          const y = oy + row * (size + gap)
          const word = words[row]
          const st = states[row]
          return (
            <g key={`${row}-${i}`}>
              <rect x={x} y={y} width={size} height={size} rx={size * 0.12} fill={word ? fills[st[i]] : 'none'} stroke={word ? 'none' : dark ? '#3D3670' : INK} strokeWidth="3" opacity={word ? 1 : 0.4} />
              {word && (
                <text x={x + size / 2} y={y + size * 0.7} textAnchor="middle" fontSize={size * 0.55} fontWeight="800" fontFamily="Bricolage Grotesque Variable, sans-serif" fill={st[i] === 'a' ? PAPER : INK}>
                  {word[i]}
                </text>
              )}
            </g>
          )
        }),
      )}
      {!dark && <circle cx={w - 40} cy={40} r={16} fill={fg} opacity="0.12" />}
    </>
  )
}

const SCENES = {
  'corre-llama': LlamaScene,
  rompeladrillos: BreakoutScene,
  galaxia: GalaxiaScene,
  bloques: BloquesScene,
  memoria: MemoriaScene,
  'palabra-secreta': PalabraScene,
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
