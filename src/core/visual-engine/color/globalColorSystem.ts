// ─── Global Visual Engine — GlobalColorSystem ──────────────────────────────
//
// Fachada pública da camada de cor do BTA. Componentes não devem chamar
// `applyGrading`/`rgbToHsl` diretamente — importam daqui.

import { hexToRgb, relativeLuminance, rgbToHsl, type Hsl } from './colorSpaces'
import { applyGrading, NEUTRAL_GRADING, type GradingParams } from './grading'

export { NEUTRAL_GRADING, GRADING_RANGES } from './grading'
export type { GradingParams } from './grading'
export type { ToneMapCurve } from './toneMapping'

export const GlobalColorSystem = {
  /** Aplica um grading a uma cor hex. Sem `params`, aplica o grading neutro. */
  grade(hex: string, params: GradingParams = NEUTRAL_GRADING): string {
    return applyGrading(hex, params)
  },

  /** HSL (h 0..360, s/l 0..1) de uma cor hex — para ajustes perceptuais pontuais. */
  toHsl(hex: string): Hsl {
    return rgbToHsl(hexToRgb(hex))
  },

  /** Luminância relativa (0..1) — útil para decidir contraste de texto sobre uma cor. */
  luminanceOf(hex: string): number {
    return relativeLuminance(hex)
  },
}
