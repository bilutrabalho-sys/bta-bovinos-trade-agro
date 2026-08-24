export function BTAScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const r = size === 'lg' ? 36 : size === 'md' ? 26 : 18
  const sw = size === 'lg' ? 4 : 3
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const dim = (r + sw + 2) * 2
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs'
  const labelSize = size === 'lg' ? 'text-[9px]' : 'text-[7px]'
  const scoreColor = score >= 90 ? '#123B2A' : score >= 75 ? '#D6A84F' : '#C94A45'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#E4E8E5" strokeWidth={sw} />
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={scoreColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-black text-bta-text ${textSize}`} style={{ lineHeight: 1 }}>{score}</span>
          <span className={`text-bta-muted ${labelSize} font-display font-semibold`}>/100</span>
        </div>
      </div>
      <span className="text-[9px] font-display font-bold text-bta-muted mt-0.5 tracking-wider uppercase">BTA Score</span>
    </div>
  )
}
