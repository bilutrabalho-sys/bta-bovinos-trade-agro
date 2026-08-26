// ─── Global Visual Engine — Tone Mapping ───────────────────────────────────
//
// Mesmas curvas de `visual-engine-spec/tokens/color.json`, reimplementadas
// em TypeScript puro. Ver COLOR_SYSTEM.md (vrm_project) para a origem
// conceitual de cada curva — nenhum código de terceiros foi copiado, só as
// fórmulas matemáticas publicadas.

export type ToneMapCurve = 'linear' | 'reinhard' | 'acesFilmic' | 'neutral'

export function applyToneMap(x: number, curve: ToneMapCurve): number {
  const v = x < 0 ? 0 : x
  switch (curve) {
    case 'linear':
      return Math.min(1, Math.max(0, v))
    case 'reinhard':
      return v / (1 + v)
    case 'acesFilmic':
      return acesFilmic(v)
    case 'neutral':
      return pbrNeutral(v)
  }
}

/** Fit analítico de Narkowicz (2015) para a curva de referência ACES. */
function acesFilmic(x: number): number {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14
  const result = (x * (a * x + b)) / (x * (c * x + d) + e)
  return Math.min(1, Math.max(0, result))
}

/** Aproximação da família "PBR Neutral" — linear até o joelho, depois
 * comprime suavemente sem tingir a imagem como o Reinhard puro. */
function pbrNeutral(x: number): number {
  const kneeStart = 0.8
  if (x <= kneeStart) return x
  const d = 1 - kneeStart
  const compressed = kneeStart + d * (1 - Math.exp(-(x - kneeStart) / d))
  return Math.min(1, Math.max(0, compressed))
}
