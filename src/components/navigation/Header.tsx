import { Ic } from '@/components/foundation/icons'
import { Btn } from '@/components/foundation/Button'

export function Header({ title, onBack, rightAction, dark = false }: {
  title?: string; onBack?: () => void; rightAction?: React.ReactNode; dark?: boolean
}) {
  return (
    <div
      className={`flex items-center px-5 pt-12 pb-4 sticky top-0 z-10 ${dark ? 'header-dark border-transparent' : 'bg-bta-surface border-b border-bta-border'}`}
    >
      {onBack && (
        <Btn
          sound="back"
          onClick={onBack}
          className={`mr-3 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${dark ? 'text-white/70 bg-white/10' : 'text-bta-text bg-bta-bg'}`}
        >
          <Ic.Back />
        </Btn>
      )}
      {title && (
        <span className={`font-display font-bold text-base flex-1 ${dark ? 'text-white' : 'text-bta-text'}`}>
          {title}
        </span>
      )}
      {rightAction && <div className="ml-auto">{rightAction}</div>}
    </div>
  )
}
