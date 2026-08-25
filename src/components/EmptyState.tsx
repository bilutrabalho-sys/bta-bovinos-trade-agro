import type { ReactNode } from 'react'
import { Ic } from '@/components/foundation/icons'

// Estado vazio padrão do BTA — mesma linguagem visual da tela de Resultados:
// um círculo bta-bg com um ícone Ic discreto, título em font-display bold,
// subtítulo em text-bta-muted e um CTA opcional no verde primário.
//
// Aparece SOMENTE quando a lista correspondente está vazia. Com dados, as telas
// renderizam exatamente como antes.
export function EmptyState({ icon, title, description, cta, compact, className }: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  cta?: { label: string; onClick: () => void }
  compact?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-3 py-8' : 'gap-4 py-12'} ${className ?? ''}`}>
      <div className={`${compact ? 'w-14 h-14' : 'w-16 h-16'} bg-bta-bg rounded-full flex items-center justify-center text-bta-muted`}>
        {icon ?? <Ic.Search />}
      </div>
      <div>
        <p className="font-display font-bold text-bta-text text-base">{title}</p>
        {description && <p className="text-bta-muted text-sm mt-1">{description}</p>}
      </div>
      {cta && (
        <button
          onClick={cta.onClick}
          className="px-5 py-3 rounded-xl bg-bta-primary text-white font-display font-semibold text-sm transition-opacity active:opacity-80"
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}
