// ─── Global Visual Engine — Theme Presets (BTA) ────────────────────────────
//
// BTA não herda a identidade automotiva do VRM (ver SCHEMA.md em
// visual-engine-spec/, no repositório vrm_project) — só a matemática de
// grading. `BTA_PALETTE` espelha os tokens `--color-bta-*` definidos em
// `src/index.css`; mantenha os dois em sincronia manualmente ao editar um
// dos dois.

import { GlobalColorSystem } from '../color/globalColorSystem'
import { NEUTRAL_GRADING, type GradingParams } from '../color/grading'

export const BTA_PALETTE = {
  primary: '#123B2A',
  secondary: '#1E5A40',
  amber: '#D6A84F',
  amberLight: '#F5E6C8',
  bg: '#F6F7F3',
  surface: '#FFFFFF',
  text: '#18211D',
  muted: '#68736D',
  success: '#2E7D52',
  error: '#C94A45',
  border: '#E4E8E5',
} as const

export type BtaPaletteKey = keyof typeof BTA_PALETTE

/**
 * Aplica um grading a todas as cores de `BTA_PALETTE`, retornando uma nova
 * paleta com a mesma matemática usada nos presets do VRM (exposure/
 * contraste/saturação/temperatura). Útil para variantes consistentes de
 * tema (ex.: uma série de gráfico Recharts levemente mais escura) sem
 * inventar cores hardcoded ad-hoc.
 */
export function gradedPalette(
  params: GradingParams = NEUTRAL_GRADING,
): Record<BtaPaletteKey, string> {
  const entries = Object.entries(BTA_PALETTE) as [BtaPaletteKey, string][]
  return Object.fromEntries(
    entries.map(([key, hex]) => [key, GlobalColorSystem.grade(hex, params)]),
  ) as Record<BtaPaletteKey, string>
}
