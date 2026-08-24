import type { Lot } from '@/data/mock'
import { Ic } from './icons'
import { Btn } from './Button'
import { VerifiedBadge } from './VerifiedBadge'
import { BTAScore } from './BTAScore'

export function LotCard({ lot, onPress, showCompare, isComparing, onToggleCompare }: {
  lot: Lot; onPress: () => void
  showCompare?: boolean; isComparing?: boolean; onToggleCompare?: () => void
}) {
  const perUnit = lot.priceUnit === '/@'
    ? `R$ ${lot.price.toLocaleString('pt-BR')}/@`
    : `R$ ${lot.price.toLocaleString('pt-BR')}/cab`

  return (
    <div className="relative">
      {showCompare && (
        <button
          onClick={e => { e.stopPropagation(); onToggleCompare?.() }}
          className={`absolute top-3 right-14 z-10 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
            isComparing ? 'bg-bta-primary border-bta-primary text-white' : 'bg-white/90 border-bta-border text-bta-muted'
          }`}
        >
          {isComparing ? <Ic.Check /> : <Ic.Scale />}
        </button>
      )}
      <Btn sound="tap" onClick={onPress} className="w-full bg-bta-surface rounded-2xl overflow-hidden border border-bta-border text-left card-shadow">
        <div className="relative h-40 bg-bta-primary-10">
          <img src={lot.image} alt={lot.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3">{lot.verified && <VerifiedBadge small />}</div>
          <div className="absolute bottom-3 right-3"><BTAScore score={lot.score} size="sm" /></div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-display font-bold text-bta-text text-base">{lot.title}</h3>
              <p className="text-bta-muted text-xs">{lot.breed} · {lot.category} · {lot.weight}kg</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-bta-amber text-base">{perUnit}</p>
              <p className="text-bta-muted text-xs">R$ {lot.priceTotal.toLocaleString('pt-BR')} total</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-bta-border">
            <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Pin /> {lot.location}</span>
            <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Truck /> R$ {lot.freight.toLocaleString('pt-BR')}</span>
            <span className="text-bta-muted text-xs ml-auto">{lot.distance} km</span>
          </div>
        </div>
      </Btn>
    </div>
  )
}
