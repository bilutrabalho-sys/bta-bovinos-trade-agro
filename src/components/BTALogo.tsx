// ─── Shared UI ─────────────────────────────────────────────────────────────

export function BTALogo({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) {
  const fontSize = size === 'lg' ? 64 : size === 'md' ? 32 : 22
  const markClass = dark
    ? (size === 'sm' ? 'bta-mark-amber-sm' : 'bta-mark-amber')
    : 'bta-mark-green'
  return (
    <span
      className={`font-display font-black ${markClass}`}
      style={{ fontSize, letterSpacing: '-0.05em', lineHeight: 1 }}
    >
      BTA
    </span>
  )
}
