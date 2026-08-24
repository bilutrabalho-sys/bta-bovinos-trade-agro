import { useState } from 'react'
import type { Lot } from '@/data/mock'
import { useData } from '@/data/DataProvider'
import { Header, BTAScore, Ic } from '@/components'

// Picks up to 2 other lots of the same category as the opportunity, so
// "Comparar" opens the Comparador with a real second/third lot instead of
// a lone lot that the Comparador would falsely mark as "winner" on every row.
function relatedLotIds(lot: Lot, lots: Lot[]): number[] {
  const others = lots
    .filter(l => l.id !== lot.id && l.category === lot.category)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(l => l.id)
  return [lot.id, ...others]
}

export function OpportunitiesScreen({ onBack, onLot, onCompare }: { onBack: () => void; onLot: (id: number) => void; onCompare: (ids: number[]) => void }) {
  const { OPPORTUNITIES, LOTS } = useData()
  const [ignored, setIgnored] = useState<number[]>([])
  const visible = OPPORTUNITIES.filter(opp => !ignored.includes(opp.id))
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Oportunidades" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div><h1 className="font-display font-black text-bta-text text-xl mb-1" style={{ letterSpacing: '-0.02em' }}>Oportunidades para você</h1><p className="text-bta-muted text-sm">Selecionadas com base no seu perfil e radar.</p></div>
        {visible.length === 0 ? (
          <p className="text-bta-muted text-sm text-center py-10">Nenhuma oportunidade no momento. Ajuste seu Radar para encontrar mais.</p>
        ) : (
        <div className="space-y-4">
          {visible.map(opp => {
            const lot = LOTS.find(l => l.id === opp.lotId)!
            return (
              <button key={opp.id} onClick={() => onLot(lot.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border overflow-hidden text-left transition-transform active:scale-[0.98]">
                <div className="h-32 relative bg-bta-primary-10">
                  <img src={lot.image} alt={lot.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-bta-amber text-white text-[10px] font-display font-bold px-2 py-0.5 rounded-full">Oportunidade detectada</div>
                  <div className="absolute bottom-2 right-2"><BTAScore score={lot.score} size="sm" /></div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-display font-bold text-bta-text text-base">{lot.title}</h3><p className="text-bta-muted text-xs">{lot.breed} · {lot.category}</p></div>
                    <div className="text-right"><p className="font-display font-bold text-bta-amber text-base">R$ {lot.price.toLocaleString('pt-BR')}{lot.priceUnit}</p><p className="text-bta-success text-xs font-bold">{opp.priceDiff.toFixed(1)}% abaixo da média</p></div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-bta-border">
                    <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Pin /> {lot.location}</span>
                    <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Truck /> R$ {lot.freight.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="mt-3 p-3 bg-bta-bg rounded-xl">
                    <p className="text-bta-muted text-[10px] font-semibold mb-1">Por que apareceu?</p>
                    <p className="text-bta-text text-xs leading-relaxed">{opp.reason}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex items-center gap-1 text-bta-primary text-[10px] font-display font-semibold border border-bta-primary px-3 py-1.5 rounded-full"
                      onClick={e => { e.stopPropagation(); onCompare(relatedLotIds(lot, LOTS)) }}
                    >
                      <Ic.Scale /> Comparar
                    </button>
                    <button
                      className="text-bta-muted text-[10px] font-semibold border border-bta-border px-3 py-1.5 rounded-full"
                      onClick={e => { e.stopPropagation(); setIgnored(prev => [...prev, opp.id]) }}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        )}
      </div>
    </div>
  )
}
