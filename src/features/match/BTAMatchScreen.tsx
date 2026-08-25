import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Header, SectionTitle, VerifiedBadge, Ic, EmptyState } from '@/components'

export function BTAMatchScreen({ onBack, onLot, onNavigate }: { onBack: () => void; onLot: (id: number) => void; onNavigate: (s: Screen) => void }) {
  const { MATCH_RESULTS, LOTS } = useData()
  const [searched, setSearched] = useState(false)
  const [saved, setSaved] = useState<number[]>([])
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="BTA Match" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-2" style={{ letterSpacing: '-0.02em' }}>BTA Match</h1>
          <p className="text-bta-muted text-sm leading-relaxed">Nós encontramos o gado. Você decide o negócio.</p>
        </div>
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="font-display font-bold text-bta-text text-sm mb-3">Sua busca</p>
          <div className="space-y-2">
            {[{ label: 'Categoria', value: 'Garrote' }, { label: 'Raça', value: 'Nelore' }, { label: 'Quantidade', value: '200–400 cabeças' }, { label: 'Peso', value: '180–250 kg' }, { label: 'Distância', value: 'Até 300 km' }, { label: 'Preço', value: 'Até R$ 2.450/cab' }].map(c => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-bta-muted text-xs">{c.label}</span>
                <span className="font-display font-semibold text-bta-text text-xs">{c.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setSearched(true)} className="w-full mt-4 bg-bta-primary text-white font-display font-bold text-sm py-3 rounded-xl transition-opacity active:opacity-80">Encontrar compatíveis</button>
        </div>
        {searched && MATCH_RESULTS.length === 0 && (
          <EmptyState
            icon={<Ic.Target />}
            title="Nenhum lote compatível ainda"
            description="Não encontramos gado com esses critérios agora. Ajuste a busca ou crie um Radar para ser avisado."
            cta={{ label: 'Criar Radar', onClick: () => onNavigate('radar') }}
          />
        )}
        {searched && MATCH_RESULTS.length > 0 && (
          <div>
            <SectionTitle>{MATCH_RESULTS.length} lotes compatíveis encontrados</SectionTitle>
            <div className="space-y-3">
              {MATCH_RESULTS.map((r, i) => {
                const lot = LOTS.find(l => l.id === r.lotId)!
                const tone = r.compatibility >= 95 ? { bg: 'bg-bta-primary/10', text: 'text-bta-primary' } : r.compatibility >= 90 ? { bg: 'bg-bta-success/10', text: 'text-bta-success' } : { bg: 'bg-bta-amber/10', text: 'text-bta-amber' }
                const isSaved = saved.includes(lot.id)
                return (
                  <button key={i} onClick={() => onLot(lot.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-4 text-left transition-transform active:scale-[0.98] flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.bg}`}>
                      <span className={`font-display font-black text-lg ${tone.text}`}>{r.compatibility}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-bta-text text-sm">{lot.title}</span>
                        {lot.verified && <VerifiedBadge small />}
                      </div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-display font-black text-bta-amber text-base">R$ {lot.price.toLocaleString('pt-BR')}{lot.priceUnit}</span>
                        <span className="font-display font-bold text-bta-primary text-[10px] bg-bta-primary/10 px-1.5 py-0.5 rounded">Score {lot.score}</span>
                      </div>
                      <p className="text-bta-muted text-xs">{lot.weight}kg · {lot.distance}km</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSaved(prev => isSaved ? prev.filter(id => id !== lot.id) : [...prev, lot.id]) }}
                      className="flex-shrink-0"
                    >
                      <Ic.Star filled={isSaved} />
                    </button>
                    <Ic.ChevronRight />
                  </button>
                )
              })}
            </div>
            <button onClick={() => onNavigate('radar')} className="w-full mt-3 border border-bta-border text-bta-muted font-display font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
              <Ic.Radar /> Criar Radar com esses critérios
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
