export function SectionTitle({ children, action, onAction }: {
  children: React.ReactNode; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display font-bold text-bta-text text-base">{children}</h2>
      {action && <button onClick={onAction} className="text-bta-secondary text-sm font-semibold font-display">{action}</button>}
    </div>
  )
}
