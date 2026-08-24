import { Btn } from './Button'

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Btn
      sound="select"
      onClick={onPress}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-semibold border transition-colors ${active ? 'bg-bta-primary text-white border-bta-primary' : 'bg-bta-surface text-bta-muted border-bta-border'}`}
    >
      {label}
    </Btn>
  )
}
