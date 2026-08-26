// ─── Global Visual Engine — Color Spaces ───────────────────────────────────
//
// Conversões de cor puras: hex <-> RGB <-> HSL, mais sRGB <-> linear e
// luminância relativa. Espelha `visual-engine-spec/tokens/color.json` do
// repositório vrm_project — o VRM usa HCT (material_color_utilities) como
// espaço de trabalho perceptual; aqui usamos HSL como aproximação (BTA não
// depende de nenhuma lib de color science externa). Ver COLOR_SYSTEM.md do
// VRM para a limitação documentada.

export interface Rgb {
  r: number // 0..255
  g: number // 0..255
  b: number // 0..255
}

export interface Hsl {
  h: number // 0..360
  s: number // 0..1
  l: number // 0..1
}

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized
  const value = Number.parseInt(full, 16)
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { h: 0, s: 0, l }

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / delta) % 6
  else if (max === gn) h = (bn - rn) / delta + 2
  else h = (rn - gn) / delta + 4

  h *= 60
  if (h < 0) h += 360

  return { h, s, l }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const m = l - c / 2

  let r1 = 0, g1 = 0, b1 = 0
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0]
  else if (hp < 2) [r1, g1, b1] = [x, c, 0]
  else if (hp < 3) [r1, g1, b1] = [0, c, x]
  else if (hp < 4) [r1, g1, b1] = [0, x, c]
  else if (hp < 5) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  }
}

/** Canal sRGB (0..1) -> luz linear — IEC 61966-2-1. */
export function srgbChannelToLinear(c: number): number {
  const v = Math.min(1, Math.max(0, c))
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/** Luminância relativa (ITU-R BT.709) de uma cor hex, em luz linear (0..1). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const rl = srgbChannelToLinear(r / 255)
  const gl = srgbChannelToLinear(g / 255)
  const bl = srgbChannelToLinear(b / 255)
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}
