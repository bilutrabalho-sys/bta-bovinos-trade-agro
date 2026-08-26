// ─── Global Visual Engine — Grading ─────────────────────────────────────────
//
// Pipeline de exposure/contraste/saturação/temperatura, espelhando os
// defaults e ranges de `visual-engine-spec/tokens/color.json` (vrm_project).
// Opera em HSL (lightness 0..1) em vez do HCT usado no VRM — ver
// COLOR_SYSTEM.md do VRM para a limitação. Usado hoje só pelo tema/gráficos
// do BTA, não pela identidade visual automotiva (que é exclusiva do VRM).

import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './colorSpaces'
import { applyToneMap, type ToneMapCurve } from './toneMapping'

export interface GradingParams {
  exposure: number // stops, range [-3, 3]
  contrast: number // pivô em 0.5, range [0.5, 1.8]
  saturation: number // multiplicador de saturação HSL, range [0, 1.6]
  temperatureK: number // Kelvin, range [3000, 10000], 6500 = neutro
  tint: number // range [-1, 1]
  highlights: number // range [-1, 1]
  shadows: number // range [-1, 1]
  blacks: number // range [-1, 1]
  whites: number // range [-1, 1]
  toneMapCurve: ToneMapCurve
}

export const GRADING_RANGES: Record<string, [number, number]> = {
  exposure: [-3, 3],
  contrast: [0.5, 1.8],
  saturation: [0, 1.6],
  temperatureK: [3000, 10000],
  tint: [-1, 1],
  highlights: [-1, 1],
  shadows: [-1, 1],
  blacks: [-1, 1],
  whites: [-1, 1],
}

export const NEUTRAL_GRADING: GradingParams = {
  exposure: 0,
  contrast: 1,
  saturation: 1,
  temperatureK: 6500,
  tint: 0,
  highlights: 0,
  shadows: 0,
  blacks: 0,
  whites: 0,
  toneMapCurve: 'acesFilmic',
}

function clamp(value: number, [min, max]: [number, number]): number {
  return Math.min(max, Math.max(min, value))
}

export function clampGradingParams(params: GradingParams): GradingParams {
  return {
    exposure: clamp(params.exposure, GRADING_RANGES.exposure),
    contrast: clamp(params.contrast, GRADING_RANGES.contrast),
    saturation: clamp(params.saturation, GRADING_RANGES.saturation),
    temperatureK: clamp(params.temperatureK, GRADING_RANGES.temperatureK),
    tint: clamp(params.tint, GRADING_RANGES.tint),
    highlights: clamp(params.highlights, GRADING_RANGES.highlights),
    shadows: clamp(params.shadows, GRADING_RANGES.shadows),
    blacks: clamp(params.blacks, GRADING_RANGES.blacks),
    whites: clamp(params.whites, GRADING_RANGES.whites),
    toneMapCurve: params.toneMapCurve,
  }
}

/** Desloca o hue em direção a dourado (quente) ou azul (frio), suavemente. */
function temperatureHueShift(kelvin: number): number {
  const delta = clamp((6500 - kelvin) / 3200, [-1.5, 1.5])
  return -delta * 6
}

function wrapHue(hue: number): number {
  const h = hue % 360
  return h < 0 ? h + 360 : h
}

/**
 * Aplica [rawParams] a uma cor hex e retorna a cor resultante, também em hex.
 * Mesmo pipeline conceitual de `grading.dart` (vrm_project): exposure ->
 * highlights/shadows/whites/blacks -> tone mapping -> contraste -> saturação
 * -> temperatura/tint.
 */
export function applyGrading(hex: string, rawParams: GradingParams): string {
  const params = clampGradingParams(rawParams)
  const { h, s, l } = rgbToHsl(hexToRgb(hex))

  let light = Math.pow(l, 2.4)
  light *= Math.pow(2, params.exposure)

  const highlightWeight = l * l
  const shadowWeight = (1 - l) * (1 - l)
  light += params.highlights * 0.35 * highlightWeight
  light += params.shadows * 0.35 * shadowWeight
  light += params.whites * 0.15 * highlightWeight
  light += params.blacks * 0.15 * shadowWeight
  light = clamp(light, [0, 8])

  const mapped = applyToneMap(light, params.toneMapCurve)
  const contrasted = clamp((mapped - 0.5) * params.contrast + 0.5, [0, 1])

  const newL = clamp(Math.pow(contrasted, 1 / 2.4), [0, 1])
  const newS = clamp(s * params.saturation, [0, 1])
  const newH = wrapHue(h + temperatureHueShift(params.temperatureK) + params.tint * 6)

  return rgbToHex(hslToRgb({ h: newH, s: newS, l: newL }))
}
