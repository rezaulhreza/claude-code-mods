// A 6×6 mirrored identicon per agent: colour from its type, pattern from its id.
// Drawn as a Raster of 6 columns × 3 rows, each cell two pixels high.

const HUES: Record<string, number> = {
  Explore: 0x4fa3a5,
  Plan: 0x6a8fd8,
  'general-purpose': 0xc9a66b,
  fork: 0x7faf6a,
}

const SPARE = [0x9b84d6, 0xcf7f9a, 0x7faf6a, 0x4fa3a5, 0x6a8fd8, 0xc9a66b]

const DEFAULT = 0x01000000
const UPPER = 0x2580
const LOWER = 0x2584
const FULL = 0x2588
const SPACE = 0x20

export const COLUMNS = 6
export const ROWS = 3

export function hash(text: string): number {
  let h = 2166136261

  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12

  return h >>> 0
}

export function hueOf(type: string): number {
  return HUES[type] ?? SPARE[hash(type) % SPARE.length]!
}

export const hex = (color: number) => '#' + color.toString(16).padStart(6, '0')

function dim(color: number): number {
  const scale = (shift: number) => Math.round(((color >> shift) & 0xff) * 0.45) << shift

  return scale(16) | scale(8) | scale(0)
}

export function pixels(id: string, type: string): boolean[][] {
  const h = hash(id + ':' + type)

  return Array.from({ length: 6 }, (_, y) =>
    Array.from({ length: 6 }, (_, x) => ((h >>> (y * 3 + (x < 3 ? x : 5 - x))) & 1) === 1),
  )
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(bytes: Uint8Array): string {
  let out = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!
    out += b === undefined ? '=' : B64[(n >> 6) & 63]!
    out += c === undefined ? '=' : B64[n & 63]!
  }

  return out
}

// The Raster's `cells`: one [codePoint, foreground, background] triplet per cell.
export function avatarCells(id: string, type: string, isDim: boolean): string {
  const grid = pixels(id, type)
  const color = isDim ? dim(hueOf(type)) : hueOf(type)
  const words = new Uint32Array(COLUMNS * ROWS * 3)

  for (let row = 0; row < ROWS; row++) {
    for (let x = 0; x < COLUMNS; x++) {
      const top = grid[row * 2]![x]!
      const bottom = grid[row * 2 + 1]![x]!
      const glyph = top && bottom ? FULL : top ? UPPER : bottom ? LOWER : SPACE
      const at = (row * COLUMNS + x) * 3
      words[at] = glyph
      words[at + 1] = glyph === SPACE ? DEFAULT : color
      words[at + 2] = DEFAULT
    }
  }

  return base64(new Uint8Array(words.buffer))
}
