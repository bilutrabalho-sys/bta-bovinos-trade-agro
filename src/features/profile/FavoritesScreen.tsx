import { useState } from 'react'
import { LOTS, FARMS, SAVED_SIMULATIONS, COURSES } from '@/data/mock'
import { Header, LotCard, Ic, VerifiedBadge } from '@/components'

export function FavoritesScreen({ onBack, onLot }: { onBack: () => void; onLot: (id: number) => void }) {
  const [tab, setTab] = useState('Lotes')
  const favLots = LOTS.filter(l => [1, 15, 8].includes(l.id))
  const favFarms = FARMS.filter(f => [1, 4].includes(f.id))
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Favoritos" onBack={onBack} />
      <div className="px-5 py-3 bg-bta-surface border-b border-bta-border">
        <div className="flex gap-1 bg-bta-bg rounded-xl p-1">
          {['Lotes', 'Fazendas', 'Simulações', 'Conteúdos'].map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-display font-bold transition-colors ${tab === t ? 'bg-bta-surface text-bta-primary shadow-sm' : 'text-bta-muted'}`}>{t}</button>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {tab === 'Lotes' && favLots.map(lot => <LotCard key={lot.id} lot={lot} onPress={() => onLot(lot.id)} />)}
        {tab === 'Fazendas' && favFarms.map(f => (
          <div key={f.id} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-bta-primary/10 rounded-xl flex items-center justify-center text-2xl">🏡</div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><p className="font-display font-bold text-bta-text text-sm">{f.name}</p>{f.verified && <VerifiedBadge small />}</div>
                <div className="flex items-center gap-3 mt-0.5"><span className="flex items-center gap-1"><Ic.Star filled /><span className="text-xs">{f.rating}</span></span><span className="text-bta-muted text-xs">{f.deals} negociações</span></div>
              </div>
              <Ic.ChevronRight />
            </div>
          </div>
        ))}
        {tab === 'Simulações' && SAVED_SIMULATIONS.map(s => (
          <div key={s.id} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <div className="flex items-center justify-between">
              <div><p className="font-display font-bold text-bta-text text-sm">{s.name}</p><p className="text-bta-muted text-xs mt-0.5">{s.date} · Cenário {s.scenario} · R$ {s.investment.toLocaleString('pt-BR')}</p></div>
              <p className="font-display font-bold text-bta-success text-base">+{s.margin}%</p>
            </div>
          </div>
        ))}
        {tab === 'Conteúdos' && COURSES.filter(c => [1, 2].includes(c.id)).map(c => (
          <div key={c.id} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <span className="text-[10px] font-semibold bg-bta-bg text-bta-muted px-2 py-0.5 rounded-full">{c.category}</span>
            <p className="font-display font-semibold text-bta-text text-sm mt-2">{c.title}</p>
            <div className="flex items-center gap-3 mt-1"><span className="text-bta-muted text-[10px]">{c.duration}</span><span className="text-bta-amber text-[10px] font-bold">+{c.xp} XP</span>{c.progress === 100 && <span className="text-bta-success text-[10px] font-bold">✓ Concluído</span>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
