import type { Lot } from '@/data/mock'
import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Header, VerifiedBadge, Ic } from '@/components'

export function CompareScreen({ lotIds, onBack, onLot, onNavigate }: {
  lotIds: number[]; onBack: () => void; onLot: (id: number) => void; onNavigate: (s: Screen) => void
}) {
  const { LOTS, FARMS } = useData()
  const lots = lotIds.map(id => LOTS.find(l => l.id === id)!).filter(Boolean)

  const rows: { label: string; key: keyof Lot | string; fmt?: (v: unknown, lot: Lot) => string; lower?: boolean }[] = [
    { label: 'Preço', key: 'price', fmt: (_, l) => `R$ ${l.price.toLocaleString('pt-BR')}${l.priceUnit}`, lower: true },
    { label: 'Peso médio', key: 'weight', fmt: (v) => `${v} kg` },
    { label: 'Quantidade', key: 'quantity', fmt: (v) => `${v} cab` },
    { label: 'Distância', key: 'distance', fmt: (v) => `${v} km`, lower: true },
    { label: 'Frete', key: 'freight', fmt: (v) => `R$ ${Number(v).toLocaleString('pt-BR')}`, lower: true },
    { label: 'Custo total', key: 'priceTotal', fmt: (_, l) => `R$ ${(l.priceTotal + l.freight).toLocaleString('pt-BR')}`, lower: true },
    { label: 'Custo/@', key: 'costPerArroba', fmt: (_, l) => `R$ ${Math.round((l.priceTotal + l.freight) / (l.quantity * (l.weight / 15)))}/@`, lower: true },
    { label: 'BTA Score', key: 'score' },
    { label: 'Raça', key: 'breed', fmt: (v) => String(v) },
    { label: 'Fazenda', key: 'sellerId', fmt: (_, l) => FARMS.find(f => f.id === l.sellerId)?.name.replace('Fazenda ', '').substring(0, 16) ?? '—' },
  ]

  function getWinner(key: string, lower: boolean) {
    const vals = lots.map(l => {
      if (key === 'priceTotal') return l.priceTotal + l.freight
      if (key === 'costPerArroba') return (l.priceTotal + l.freight) / (l.quantity * (l.weight / 15))
      return Number((l as unknown as Record<string, unknown>)[key] ?? 0)
    })
    const best = lower ? Math.min(...vals) : Math.max(...vals)
    return vals.map(v => v === best)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Comparador" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        {/* Lot headers */}
        <div className="flex border-b border-bta-border bg-bta-surface">
          <div className="w-28 flex-shrink-0 p-3 border-r border-bta-border" />
          {lots.map(l => (
            <button key={l.id} onClick={() => onLot(l.id)} className="flex-1 p-3 text-center border-r border-bta-border last:border-0">
              <div className="h-16 rounded-xl overflow-hidden bg-bta-primary-10 mb-2">
                <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
              </div>
              <p className="font-display font-bold text-bta-text text-xs leading-tight">{l.title}</p>
              <p className="text-bta-muted text-[10px] mt-0.5">{l.breed}</p>
              {l.verified && <div className="flex justify-center mt-1"><VerifiedBadge small /></div>}
            </button>
          ))}
        </div>

        {/* Comparison rows */}
        {rows.map(row => {
          const winners = getWinner(row.key === 'priceTotal' ? 'priceTotal' : row.key, row.lower ?? false)
          return (
            <div key={row.label} className="flex border-b border-bta-border">
              <div className="w-28 flex-shrink-0 px-3 py-3 border-r border-bta-border flex items-center">
                <span className="text-bta-muted text-[10px] font-semibold">{row.label}</span>
              </div>
              {lots.map((l, i) => {
                const rawVal = row.key === 'priceTotal' ? l.priceTotal : (l as unknown as Record<string, unknown>)[row.key]
                const display = row.fmt ? row.fmt(rawVal, l) : String(rawVal)
                const isWinner = winners[i]
                return (
                  <div key={l.id} className={`flex-1 px-3 py-3 border-r border-bta-border last:border-0 flex items-center justify-center ${isWinner ? 'bg-bta-success/5' : ''}`}>
                    <span className={`text-center text-sm font-display font-semibold ${isWinner ? 'text-bta-success' : 'text-bta-text'}`}>
                      {display}
                      {isWinner && <span className="inline-flex ml-0.5 align-middle"><Ic.Check /></span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="px-5 py-5">
          <button onClick={() => onNavigate('ai')} className="w-full flex items-center justify-center gap-2 bg-bta-primary text-white font-display font-bold text-sm py-4 rounded-xl">
            <Ic.Sparkles /> Analisar diferenças com BTA IA
          </button>
        </div>
      </div>
    </div>
  )
}
