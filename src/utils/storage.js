// Lectura y escritura segura de localStorage (puede fallar en modo incógnito).
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sin almacenamiento disponible */
  }
}

export const KEYS = {
  cart: 'steamlite:cart',
  library: 'steamlite:library',
  scores: 'steamlite:scores',
}

export function getBest(id) {
  return readJSON(KEYS.scores, {})[id] ?? null
}

/** Guarda el récord si lo mejora. Devuelve true si es un récord nuevo. */
export function saveBest(id, value, lowerIsBetter = false) {
  const scores = readJSON(KEYS.scores, {})
  const prev = scores[id]
  const better = prev == null || (lowerIsBetter ? value < prev : value > prev)
  if (better) {
    scores[id] = value
    writeJSON(KEYS.scores, scores)
  }
  return better
}
