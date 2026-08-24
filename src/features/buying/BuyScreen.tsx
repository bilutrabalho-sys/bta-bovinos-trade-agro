import { useState } from 'react'
import type { Screen } from '@/core/navigation'
import { Ic, Chip, Header, Btn } from '@/components'

export function BuyScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const [category, setCategory] = useState('')
  const [breed, setBreed] = useState('')
  const [purpose, setPurpose] = useState('')
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Comprar" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>O que você procura?</h1>
          <p className="text-bta-muted text-sm">Filtre e encontre as melhores oportunidades.</p>
        </div>
        <div className="flex items-center gap-3 bg-bta-surface rounded-xl border border-bta-border px-4 py-3">
          <Ic.Search /><input type="text" placeholder="Buscar por raça, cidade, fazenda..." className="flex-1 bg-transparent text-sm text-bta-text outline-none placeholder:text-bta-muted" />
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
        {[{ label: 'Quantidade mínima', value: '50 cabeças' }, { label: 'Peso médio mínimo', value: '300 kg' }, { label: 'Preço máximo', value: 'R$ 330/@' }, { label: 'Distância máxima', value: '300 km' }].map(f => (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-bta-text text-sm">{f.label}</span>
              <span className="text-bta-amber font-bold text-sm font-display">{f.value}</span>
            </div>
            <div className="h-1.5 bg-bta-border rounded-full relative">
              <div className="absolute left-0 top-0 h-full bg-bta-primary rounded-full" style={{ width: '60%' }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-bta-primary rounded-full shadow-md border-2 border-white cursor-pointer" style={{ left: 'calc(60% - 8px)' }} />
            </div>
          </div>
        ))}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-semibold text-bta-text text-sm">BTA Score mínimo</span>
            <span className="text-bta-amber font-bold text-sm font-display">75</span>
          </div>
          <div className="h-1.5 bg-bta-border rounded-full relative">
            <div className="absolute left-0 top-0 h-full bg-bta-amber rounded-full" style={{ width: '75%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-bta-amber rounded-full shadow-md border-2 border-white cursor-pointer" style={{ left: 'calc(75% - 8px)' }} />
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <Btn sound="cta" onClick={() => onNavigate('results')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-2xl">
          Encontrar oportunidades
        </Btn>
        <Btn sound="tap" onClick={() => onNavigate('bta-path')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl">
          Não sei o que comprar →
        </Btn>
      </div>
    </div>
  )
}
