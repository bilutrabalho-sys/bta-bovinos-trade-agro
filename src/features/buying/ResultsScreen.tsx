import { useState } from 'react'
import type { Lot } from '@/data/mock'
import { useData } from '@/data/DataProvider'
import type { BuyFilters } from '@/core/navigation'
import { Header, Ic, LotCard } from '@/components'

// Filters LOTS against the criteria filled in on BuyScreen. Price is only
// enforced against /@ lots — the "Preço máximo" slider is denominated in
// R$/@, so comparing it against /cab lots (garrotes, bezerros — prices in
// the thousands) would silently wipe them all out rather than filter them
// meaningfully.
//
// Breed/purpose match exactly, or as a "/"-separated token, or as a leading
// word (e.g. chip "Cruzamento" matching value "Cruzamento Industrial") —
// never a raw substring-anywhere check, which would wrongly match "Angus"
// against "Brangus" (the chip label is literally a substring of the breed).
function matchesLoosely(value: string, query: string) {
  const v = value.toLowerCase()
  const q = query.toLowerCase()
  if (v === q) return true
  if (v.split('/').map(part => part.trim()).includes(q)) return true
  if (v.startsWith(`${q} `)) return true
  return false
}

function applyFilters(filters: BuyFilters | null | undefined, lots: Lot[]) {
  if (!filters) return lots
  const q = filters.query?.trim().toLowerCase()
  return lots.filter(lot => {
    if (filters.category && lot.category !== filters.category) return false
    if (filters.breed && !matchesLoosely(lot.breed, filters.breed)) return false
    if (filters.purpose && !matchesLoosely(lot.purpose, filters.purpose)) return false
    if (filters.minWeight && lot.weight < filters.minWeight) return false
    if (filters.maxPrice && lot.priceUnit === '/@' && lot.price > filters.maxPrice) return false
    if (filters.maxDistance && lot.distance > filters.maxDistance) return false
    if (q) {
      const haystack = `${lot.title} ${lot.breed} ${lot.location} ${lot.state}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function ResultsScreen({ onBack, onLot, onCompare, filters }: {
  onBack: () => void; onLot: (id: number) => void; onCompare: (ids: number[]) => void; filters?: BuyFilters | null
}) {
  const { LOTS } = useData()
  const [sort, setSort] = useState('score')
  const [comparing, setComparing] = useState<number[]>([])
  const [saved, setSaved] = useState<number[]>([])
  const filtered = applyFilters(filters, LOTS)
  const sorted = [...filtered].sort((a, b) => sort === 'score' ? b.score - a.score : a.distance - b.distance)

  const toggleCompare = (id: number) => {
    setComparing(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev)
  }
  const toggleSave = (id: number) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Resultados" onBack={onBack} rightAction={
        <button onClick={onBack} className="flex items-center gap-2 text-bta-muted"><Ic.Filter /><span className="text-xs font-semibold">Filtros</span></button>
      } />
      <div className="px-5 py-3 bg-bta-surface border-b border-bta-border flex items-center justify-between">
        <p className="text-bta-muted text-xs">{sorted.length} lotes · selecione para comparar</p>
        <div className="flex gap-2">
          {[{ key: 'score', label: 'Score' }, { key: 'distance', label: 'Distância' }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)} className={`px-3 py-1 rounded-lg text-xs font-display font-bold transition-colors ${sort === s.key ? 'bg-bta-primary text-white' : 'text-bta-muted bg-bta-bg'}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-10">
            <div className="w-16 h-16 bg-bta-bg rounded-full flex items-center justify-center text-bta-muted"><Ic.Search /></div>
            <div>
              <p className="font-display font-bold text-bta-text text-base">Nenhum lote encontrado</p>
              <p className="text-bta-muted text-sm mt-1">Não encontramos lotes com esses critérios.<br />Ajuste os filtros e tente novamente.</p>
            </div>
            <button onClick={onBack} className="px-5 py-3 rounded-xl bg-bta-primary text-white font-display font-semibold text-sm">Ajustar filtros</button>
          </div>
        ) : sorted.map(lot => (
          <LotCard
            key={lot.id} lot={lot} onPress={() => onLot(lot.id)}
            showCompare isComparing={comparing.includes(lot.id)} onToggleCompare={() => toggleCompare(lot.id)}
            showSave isSaved={saved.includes(lot.id)} onToggleSave={() => toggleSave(lot.id)}
          />
        ))}
      </div>
      {comparing.length >= 2 && (
        <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border">
          <button onClick={() => onCompare(comparing)} className="w-full bg-bta-secondary text-white font-display font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2">
            <Ic.Scale /> Comparar {comparing.length} lotes selecionados
          </button>
        </div>
      )}
    </div>
  )
}
