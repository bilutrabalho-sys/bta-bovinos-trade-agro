import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Header, Btn, Ic } from '@/components'

export function DealClosedScreen({ lotId, onBack, onNavigate }: { lotId: number; onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { LOTS, FARMS } = useData()
  const lot = LOTS.find(l => l.id === lotId)!
  const steps = [
    { label: 'Negócio confirmado', done: true },
    { label: 'Documentação (GTA)', done: true },
    { label: 'Transporte', done: false },
    { label: 'Entrega', done: false },
    { label: 'Conclusão', done: false },
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Negócio Fechado" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 bg-bta-success/10 rounded-full flex items-center justify-center text-bta-success scale-[1.6]"><Ic.Handshake /></div>
          <div>
            <h1 className="font-display font-black text-bta-text text-2xl" style={{ letterSpacing: '-0.02em' }}>Negócio fechado!</h1>
            <p className="text-bta-muted text-sm mt-1">Parabéns. Agora é hora de organizar a entrega.</p>
          </div>
        </div>

        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="font-display font-bold text-bta-text text-sm mb-3">Resumo do negócio</p>
          <div className="space-y-2">
            {[
              { label: 'Lote', value: lot.title },
              { label: 'Fazenda', value: FARMS.find(f => f.id === lot.sellerId)?.name ?? '—' },
              { label: 'Quantidade', value: `${lot.quantity} cabeças` },
              { label: 'Preço acordado', value: `R$ 312${lot.priceUnit}` },
              { label: 'Valor total', value: `R$ ${(312 * lot.quantity * (lot.weight / 15)).toLocaleString('pt-BR')}` },
              { label: 'Data', value: '23/08/2026' },
              { label: 'Origem', value: lot.location },
            ].map(i => (
              <div key={i.label} className="flex items-center justify-between">
                <span className="text-bta-muted text-xs">{i.label}</span>
                <span className="font-display font-semibold text-bta-text text-xs">{i.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress timeline */}
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="font-display font-bold text-bta-text text-sm mb-4">Próximas etapas</p>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-bta-border" />
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${s.done ? 'bg-bta-success text-white' : i === steps.findIndex(x => !x.done) ? 'bg-bta-primary text-white' : 'bg-bta-border text-bta-muted'}`}>
                    {s.done ? <Ic.Check /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-sm font-display font-semibold ${s.done ? 'text-bta-success' : i === steps.findIndex(x => !x.done) ? 'text-bta-primary' : 'text-bta-muted'}`}>{s.label}</span>
                  {i === steps.findIndex(x => !x.done) && <span className="text-xs text-bta-primary bg-bta-primary/10 px-2 py-0.5 rounded-full font-semibold ml-auto">Agora</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <Btn sound="success" onClick={() => onNavigate('bta-log')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2"><Ic.Truck /> Organizar transporte</Btn>
        <Btn sound="tap" onClick={() => onNavigate('business')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl">Ver em Meus Negócios</Btn>
      </div>
    </div>
  )
}
