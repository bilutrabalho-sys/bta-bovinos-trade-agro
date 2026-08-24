import { useState } from 'react'
import { LOTS } from '@/data/mock'
import { Header, Ic, LotCard } from '@/components'

export function ResultsScreen({ onBack, onLot, onCompare }: {
  onBack: () => void; onLot: (id: number) => void; onCompare: (ids: number[]) => void
}) {
  const [sort, setSort] = useState('score')
  const [comparing, setComparing] = useState<number[]>([])
  const sorted = [...LOTS].sort((a, b) => sort === 'score' ? b.score - a.score : a.distance - b.distance)

  const toggleCompare = (id: number) => {
    setComparing(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Resultados" onBack={onBack} rightAction={
        <div className="flex items-center gap-2 text-bta-muted"><Ic.Filter /><span className="text-xs font-semibold">Filtros</span></div>
      } />
      <div className="px-5 py-3 bg-bta-surface border-b border-bta-border flex items-center justify-between">
        <p className="text-bta-muted text-xs">{LOTS.length} lotes · selecione para comparar</p>
        <div className="flex gap-2">
          {[{ key: 'score', label: 'Score' }, { key: 'distance', label: 'Distância' }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)} className={`px-3 py-1 rounded-lg text-xs font-display font-bold transition-colors ${sort === s.key ? 'bg-bta-primary text-white' : 'text-bta-muted bg-bta-bg'}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {sorted.map(lot => (
          <LotCard key={lot.id} lot={lot} onPress={() => onLot(lot.id)} showCompare isComparing={comparing.includes(lot.id)} onToggleCompare={() => toggleCompare(lot.id)} />
        ))}
      </div>
      {comparing.length >= 2 && (
        <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border">
          <button onClick={() => onCompare(comparing)} className="w-full bg-bta-secondary text-white font-display font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2">
            <Ic.Scale /> Comparar {comparing.length} lotes selecionados
          </button>
        </div>
      )}
    </div>
  )
}
