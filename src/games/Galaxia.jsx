import { useEffect, useRef, useState } from 'react'
import { FONT, GAME_KEYS, INK, Overlay, PAPER, setupCanvas, startLoop } from './shared'

const W = 440
const H = 640
const SY = H - 64 // altura de la nave
const SHIP_W = 36
const PX = 3 // tamaño de cada pixel de los invasores

// Sprites originales de 11x8, dos cuadros de animación cada uno.
const SPRITES = {
  blob: [
    ['...XXXXX...', '.XXXXXXXXX.', 'XX..XXX..XX', 'XXXXXXXXXXX', '.XXX...XXX.', '..XX.X.XX..', '.X..X.X..X.', 'X.........X'],
    ['...XXXXX...', '.XXXXXXXXX.', 'XX..XXX..XX', 'XXXXXXXXXXX', '.XXX...XXX.', '..XX.X.XX..', '..X.X.X.X..', '.X.......X.'],
  ],
  horn: [
    ['.X.......X.', '..X.....X..', '..XXXXXXX..', '.XX.XXX.XX.', '.XXXXXXXXX.', '...XXXXX...', '..X.X.X.X..', '.X.......X.'],
    ['.X.......X.', '..X.....X..', '..XXXXXXX..', '.XX.XXX.XX.', '.XXXXXXXXX.', '...XXXXX...', '...X.X.X...', '..X.....X..'],
  ],
}
const BEIGES = ['#EADBB8', '#DCC9A0', '#CDB88C']

function makeWave(wave) {
  const rows = Math.min(3 + wave, 6)
  const enemies = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < 8; c++)
      enemies.push({ x: 34 + c * 46, y: 70 + r * 38, alive: true, kind: r < 2 ? 'horn' : 'blob', row: r, color: BEIGES[r % 3] })
  return enemies
}

function newState() {
  return { x: W / 2, target: null, bullets: [], shots: [], enemies: makeWave(1), dir: 1, wave: 1, lives: 3, score: 0, cool: 0, inv: 0, frame: 0, ft: 0, booms: [], banner: 1.5 }
}

export default function Galaxia({ color, onFinish, onStart }) {
  const canvasRef = useRef(null)
  const state = useRef(newState())
  const keys = useRef({ left: false, right: false })
  const [phase, setPhase] = useState('ready')
  const phaseRef = useRef(phase)
  const [result, setResult] = useState({ score: 0, record: false })
  phaseRef.current = phase

  const start = () => {
    state.current = newState()
    phaseRef.current = 'playing'
    setPhase('playing')
    onStart?.()
  }

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current, W, H)
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.8 + 0.4, v: 20 + Math.random() * 60 }))

    const end = () => {
      const s = state.current
      phaseRef.current = 'over'
      const record = onFinish(s.score)
      setResult({ score: s.score, record })
      setPhase('over')
    }

    const update = (dt) => {
      const s = state.current
      s.banner = Math.max(0, s.banner - dt)
      // Movimiento: teclado o seguir al dedo/mouse
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      if (dir) {
        s.x += dir * 360 * dt
        s.target = null
      } else if (s.target != null) {
        const d = s.target - s.x
        s.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt)
      }
      s.x = Math.max(SHIP_W / 2 + 4, Math.min(W - SHIP_W / 2 - 4, s.x))

      // Disparo automático
      s.cool -= dt
      if (s.cool <= 0) {
        s.bullets.push({ x: s.x, y: SY - 18 })
        s.cool = 0.32
      }
      s.bullets.forEach((b) => (b.y -= 600 * dt))
      s.bullets = s.bullets.filter((b) => b.y > 40)

      // Formación
      const alive = s.enemies.filter((e) => e.alive)
      const speed = 30 + s.wave * 8 + (1 - alive.length / s.enemies.length) * 90
      let edge = false
      for (const e of alive) {
        e.x += s.dir * speed * dt
        if (e.x < 10 || e.x + 11 * PX > W - 10) edge = true
      }
      if (edge) {
        s.dir *= -1
        for (const e of alive) {
          e.y += 14
          e.x += s.dir * 4
        }
      }
      s.ft += dt
      if (s.ft > 0.45) {
        s.ft = 0
        s.frame ^= 1
      }

      // Disparos enemigos: el de más abajo de una columna al azar
      if (Math.random() < dt * (0.8 + s.wave * 0.35) && alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        const lowest = alive.filter((e) => Math.abs(e.x - shooter.x) < 20).sort((a, b) => b.y - a.y)[0]
        s.shots.push({ x: lowest.x + (11 * PX) / 2, y: lowest.y + 8 * PX })
      }
      s.shots.forEach((b) => (b.y += (240 + s.wave * 15) * dt))
      s.shots = s.shots.filter((b) => b.y < H)

      // Impactos a invasores
      for (const b of s.bullets) {
        for (const e of alive) {
          if (e.alive && b.x > e.x && b.x < e.x + 11 * PX && b.y > e.y && b.y < e.y + 8 * PX) {
            e.alive = false
            b.y = -100
            s.score += e.kind === 'horn' ? 30 : 10
            s.booms.push({ x: e.x + 16, y: e.y + 12, life: 0.35, color: e.color })
            break
          }
        }
      }

      // Impactos a la nave
      s.inv = Math.max(0, s.inv - dt)
      if (!s.inv) {
        for (const b of s.shots) {
          if (Math.abs(b.x - s.x) < SHIP_W / 2 - 4 && b.y > SY - 14 && b.y < SY + 14) {
            b.y = H + 10
            s.lives--
            s.inv = 1.6
            s.booms.push({ x: s.x, y: SY, life: 0.5, color })
            if (s.lives <= 0) return end()
          }
        }
      }

      if (alive.some((e) => e.alive && e.y + 8 * PX >= SY - 16)) return end()

      s.booms.forEach((b) => (b.life -= dt))
      s.booms = s.booms.filter((b) => b.life > 0)

      if (s.enemies.every((e) => !e.alive)) {
        s.wave++
        s.score += 200
        s.enemies = makeWave(s.wave)
        s.shots = []
        s.banner = 1.5
      }
    }

    const drawSprite = (e) => {
      const map = SPRITES[e.kind][state.current.frame]
      ctx.fillStyle = e.color
      for (let y = 0; y < map.length; y++)
        for (let x = 0; x < map[y].length; x++) if (map[y][x] === 'X') ctx.fillRect(e.x + x * PX, e.y + y * PX, PX, PX)
    }

    const drawShip = (x, t) => {
      const s = state.current
      if (s.inv && Math.floor(t / 100) % 2) return
      ctx.save()
      ctx.translate(x, SY)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, -20)
      ctx.lineTo(8, -6)
      ctx.lineTo(18, 8)
      ctx.lineTo(18, 14)
      ctx.lineTo(-18, 14)
      ctx.lineTo(-18, 8)
      ctx.lineTo(-8, -6)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(0, -2, 4, 0, Math.PI * 2)
      ctx.fill()
      // fuego del motor
      ctx.fillStyle = '#FF9248'
      ctx.beginPath()
      ctx.moveTo(-6, 14)
      ctx.lineTo(0, 22 + Math.sin(t / 40) * 4)
      ctx.lineTo(6, 14)
      ctx.fill()
      ctx.restore()
    }

    const draw = (t) => {
      const s = state.current
      ctx.fillStyle = '#100D24'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = PAPER
      for (const st of stars) {
        st.y += st.v * (1 / 60)
        if (st.y > H) st.y = 0
        ctx.globalAlpha = 0.25 + st.s * 0.3
        ctx.fillRect(st.x, st.y, st.s, st.s)
      }
      ctx.globalAlpha = 1

      for (const e of s.enemies) if (e.alive) drawSprite(e)
      ctx.fillStyle = color
      for (const b of s.bullets) ctx.fillRect(b.x - 1.5, b.y - 8, 3, 10)
      ctx.fillStyle = '#EADBB8'
      for (const b of s.shots) {
        ctx.fillRect(b.x - 2, b.y - 4, 4, 4)
        ctx.fillRect(b.x - 2 + (Math.floor(b.y / 6) % 2 ? 2 : -2), b.y, 4, 4)
      }
      for (const b of s.booms) {
        ctx.strokeStyle = b.color
        ctx.lineWidth = 3
        const r = (0.5 - b.life) * 60 + 6
        ctx.globalAlpha = Math.min(1, b.life * 3)
        ctx.beginPath()
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2
          ctx.moveTo(b.x + Math.cos(a) * r * 0.4, b.y + Math.sin(a) * r * 0.4)
          ctx.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      drawShip(s.x, t)

      // HUD
      ctx.font = `800 18px ${FONT}`
      ctx.fillStyle = PAPER
      ctx.fillText(String(s.score), 16, 30)
      ctx.textAlign = 'right'
      ctx.fillStyle = color
      ctx.fillText('▲'.repeat(Math.max(0, s.lives)), W - 16, 30)
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(79,227,215,.35)'
      ctx.fillRect(0, SY + 30, W, 2)

      if (phaseRef.current === 'playing' && s.banner > 0) {
        ctx.globalAlpha = Math.min(1, s.banner * 2)
        ctx.textAlign = 'center'
        ctx.font = `800 40px ${FONT}`
        ctx.fillStyle = color
        ctx.fillText(`Oleada ${s.wave}`, W / 2, H / 2)
        ctx.textAlign = 'left'
        ctx.globalAlpha = 1
      }
    }

    const stop = startLoop((dt, t) => {
      if (phaseRef.current === 'playing') update(dt)
      draw(t)
    })

    const onKey = (down) => (e) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault()
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') keys.current.left = down
      if (k === 'arrowright' || k === 'd') keys.current.right = down
      if (down && (k === ' ' || k === 'enter') && phaseRef.current !== 'playing') start()
    }
    const kd = onKey(true)
    const ku = onKey(false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      stop()
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aim = (e) => {
    if (e.pointerType === 'mouse' && !e.buttons && e.type !== 'pointermove') return
    const rect = canvasRef.current.getBoundingClientRect()
    state.current.target = ((e.clientX - rect.left) / rect.width) * W
  }

  return (
    <div className="game game--tall">
      <canvas
        ref={canvasRef}
        className="game__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerMove={aim}
        onPointerDown={aim}
        aria-label="Galaxia. Muévete con las flechas o el mouse; la nave dispara sola."
      />
      {phase === 'ready' && (
        <Overlay title="Galaxia" action="Despegar" onAction={start}>
          Muévete con ← → o con el mouse. Tu nave dispara sola: esquiva lo beige.
        </Overlay>
      )}
      {phase === 'over' && (
        <Overlay title={result.record ? '¡Nuevo récord!' : 'Invadidos'} action="Despegar otra vez" onAction={start}>
          Hiciste <strong>{result.score}</strong> puntos.
        </Overlay>
      )}
    </div>
  )
}
