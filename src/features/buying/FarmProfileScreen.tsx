import { useState } from 'react'
import { FARMS, LOTS } from '@/data/mock'
import type { Screen } from '@/core/navigation'
import { Ic, VerifiedBadge, SectionTitle, LotCard, Btn } from '@/components'

export function FarmProfileScreen({ farmId, onBack, onLot, onNavigate }: { farmId: number; onBack: () => void; onLot: (id: number) => void; onNavigate: (s: Screen, lotId?: number) => void }) {
  const farm = FARMS.find(f => f.id === farmId)!
  const farmLots = LOTS.filter(l => l.sellerId === farmId)
  const [following, setFollowing] = useState(false)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-bta-primary px-5 pt-12 pb-8 relative">
          <button onClick={onBack} className="absolute top-12 left-5 text-white/70"><Ic.Back /></button>
          <div className="flex flex-col items-center text-center gap-3 mt-6">
            <div className="w-20 h-20 bg-bta-secondary rounded-2xl flex items-center justify-center text-white scale-[1.4]"><Ic.Home /></div>
            <div>
              <h1 className="font-display font-black text-white text-xl">{farm.name}</h1>
              <p className="text-white/60 text-sm">{farm.location}</p>
              {farm.verified && <div className="flex justify-center mt-2"><VerifiedBadge /></div>}
            </div>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div className="bg-bta-surface rounded-2xl border border-bta-border -mt-8 card-shadow p-4">
            <div className="grid grid-cols-3 divide-x divide-bta-border">
              {[{ label: 'Avaliação', value: <span className="inline-flex items-center justify-center gap-1">{farm.rating} <Ic.Star filled /></span> }, { label: 'Negociações', value: farm.deals.toLocaleString('pt-BR') }, { label: 'Conclusão', value: `${farm.completion}%` }].map(s => <div key={s.label} className="text-center px-3"><p className="font-display font-black text-bta-primary text-base">{s.value}</p><p className="text-bta-muted text-[10px] mt-0.5">{s.label}</p></div>)}
            </div>
          </div>
          <div className="flex gap-3">
            <Btn
              sound="select"
              onClick={() => setFollowing(f => !f)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-display font-semibold text-sm transition-colors ${following ? 'border-bta-amber text-bta-amber bg-bta-amber-light' : 'border-bta-border text-bta-text bg-bta-surface'}`}
            >
              <Ic.Heart filled={following} /> {following ? 'Seguindo' : 'Seguir'}
            </Btn>
            <Btn sound="cta" onClick={() => onNavigate('negotiation', farmLots[0]?.id)} className="flex-1 flex items-center justify-center gap-2 bg-bta-primary text-white font-display font-bold text-sm py-3 rounded-xl">
              <Ic.Chat /> Entrar em contato
            </Btn>
          </div>
          <div><p className="font-display font-bold text-bta-text text-sm mb-2">Sobre</p><p className="text-bta-muted text-sm leading-relaxed">{farm.description}</p><p className="text-bta-muted text-xs mt-2">Na plataforma desde {farm.since}</p></div>
          <div><p className="font-display font-bold text-bta-text text-sm mb-2">Especialidades</p><div className="flex gap-2 flex-wrap">{farm.specialties.map(s => <span key={s} className="bg-bta-primary/10 text-bta-primary text-xs font-display font-semibold px-3 py-1 rounded-full">{s}</span>)}</div></div>
          <div><SectionTitle>Lotes ativos ({farmLots.length})</SectionTitle><div className="space-y-3">{farmLots.map(lot => <LotCard key={lot.id} lot={lot} onPress={() => onLot(lot.id)} />)}</div></div>
          <div>
            <SectionTitle>Avaliações</SectionTitle>
            <div className="space-y-3">
              {[{ user: 'Marcos A.', rating: 5, comment: 'Negociação rápida e transparente. Lote exatamente como descrito.', date: '15/08/2026' }, { user: 'Paulo S.', rating: 5, comment: 'Fazenda séria e confiável. Recomendo.', date: '02/08/2026' }, { user: 'João M.', rating: 4, comment: 'Ótima qualidade. Pequena diferença no peso, mas resolveu rápido.', date: '25/07/2026' }].map((r, i) => (
                <div key={i} className="bg-bta-surface rounded-xl border border-bta-border p-4">
                  <div className="flex items-center justify-between mb-2"><span className="font-display font-semibold text-bta-text text-sm">{r.user}</span><div className="flex items-center gap-1">{Array.from({ length: r.rating }).map((_, j) => <Ic.Star key={j} filled />)}</div></div>
                  <p className="text-bta-muted text-xs leading-relaxed">{r.comment}</p>
                  <p className="text-bta-muted text-[10px] mt-2">{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
