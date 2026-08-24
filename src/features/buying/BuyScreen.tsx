import { useRef, useState } from 'react'
import type { BuyFilters, Screen } from '@/core/navigation'
import { Ic, Chip, Header, Btn } from '@/components'

// A draggable/tappable range bar sharing the exact markup+classes of the
// original static mock sliders — only the fill width and thumb position
// become data-driven, nothing about how they look changes.
function RangeSlider({ label, value, min, max, step = 1, format, onChange }: {
  label: string; value: number; min: number; max: number; step?: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = rect.width === 0 ? 0 : Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = min + ratio * (max - min)
    const stepped = Math.round(raw / step) * step
    onChange(Math.min(max, Math.max(min, stepped)))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-semibold text-bta-text text-sm">{label}</span>
        <span className="text-bta-amber font-bold text-sm font-display">{format(value)}</span>
      </div>
      <div
        ref={trackRef}
        onClick={e => setFromClientX(e.clientX)}
        className="h-1.5 bg-bta-border rounded-full relative"
      >
        <div className="absolute left-0 top-0 h-full bg-bta-primary rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-bta-primary rounded-full card-shadow border-2 border-white cursor-pointer" style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
    </div>
  )
}

export function BuyScreen({ onBack, onNavigate, onSearch }: {
  onBack: () => void; onNavigate: (s: Screen) => void; onSearch: (filters: BuyFilters) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [breed, setBreed] = useState('')
  const [purpose, setPurpose] = useState('')
  const [minWeight, setMinWeight] = useState(300)
  const [maxPrice, setMaxPrice] = useState(330)
  const [maxDistance, setMaxDistance] = useState(300)

  const handleSearch = () => {
    onSearch({
      query: query.trim() || undefined,
      category: category || undefined,
      breed: breed || undefined,
      purpose: purpose || undefined,
      minWeight,
      maxPrice,
      maxDistance,
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Comprar" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>O que você procura?</h1>
          <p className="text-bta-muted text-sm">Filtre e encontre as melhores oportunidades.</p>
        </div>
        <div className="flex items-center gap-3 bg-bta-surface rounded-xl border border-bta-border px-4 py-3">
          <Ic.Search /><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por raça, cidade, fazenda..." className="flex-1 bg-transparent text-sm text-bta-text outline-none placeholder:text-bta-muted" />
        </div>
        <div>
          <p className="font-display font-semibold text-bta-text text-sm mb-3">Categoria</p>
          <div className="flex gap-2 flex-wrap">
            {['Boi Gordo', 'Garrote', 'Novilha', 'Bezerro', 'Vaca'].map(c => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? '' : c)} />)}
          </div>
        </div>
        <div>
          <p className="font-display font-semibold text-bta-text text-sm mb-3">Raça</p>
          <div className="flex gap-2 flex-wrap">
            {['Nelore', 'Angus', 'Brangus', 'Brahman', 'Guzerá', 'Cruzamento'].map(b => <Chip key={b} label={b} active={breed === b} onPress={() => setBreed(breed === b ? '' : b)} />)}
          </div>
        </div>
        <div>
          <p className="font-display font-semibold text-bta-text text-sm mb-3">Finalidade</p>
          <div className="flex gap-2 flex-wrap">
            {['Corte', 'Recria', 'Engorda', 'Cria'].map(p => <Chip key={p} label={p} active={purpose === p} onPress={() => setPurpose(purpose === p ? '' : p)} />)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-semibold text-bta-text text-sm">Quantidade mínima</span>
            <span className="text-bta-amber font-bold text-sm font-display">50 cabeças</span>
          </div>
          <div className="h-1.5 bg-bta-border rounded-full relative">
            <div className="absolute left-0 top-0 h-full bg-bta-primary rounded-full" style={{ width: '60%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-bta-primary rounded-full card-shadow border-2 border-white cursor-pointer" style={{ left: 'calc(60% - 8px)' }} />
          </div>
        </div>
        <RangeSlider label="Peso médio mínimo" value={minWeight} min={150} max={450} step={10} format={v => `${v} kg`} onChange={setMinWeight} />
        <RangeSlider label="Preço máximo" value={maxPrice} min={180} max={340} step={5} format={v => `R$ ${v}/@`} onChange={setMaxPrice} />
        <RangeSlider label="Distância máxima" value={maxDistance} min={0} max={600} step={10} format={v => `${v} km`} onChange={setMaxDistance} />
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-semibold text-bta-text text-sm">BTA Score mínimo</span>
            <span className="text-bta-amber font-bold text-sm font-display">75</span>
          </div>
          <div className="h-1.5 bg-bta-border rounded-full relative">
            <div className="absolute left-0 top-0 h-full bg-bta-amber rounded-full" style={{ width: '75%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-bta-amber rounded-full card-shadow border-2 border-white cursor-pointer" style={{ left: 'calc(75% - 8px)' }} />
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <Btn sound="cta" onClick={handleSearch} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl">
          Encontrar oportunidades
        </Btn>
        <Btn sound="tap" onClick={() => onNavigate('bta-path')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl">
          Não sei o que comprar →
        </Btn>
      </div>
    </div>
  )
}
