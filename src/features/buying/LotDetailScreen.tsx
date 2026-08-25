import { useState } from 'react'
import type { Lot } from '@/data/mock'
import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Ic, VerifiedBadge, BTAScore, Btn, LotImage } from '@/components'

// Shares a lot via the native share sheet when available, falling back to
// copying the summary to the clipboard so the action always does something.
async function shareLot(lot: Lot) {
  const text = `${lot.title} — ${lot.breed} · ${lot.weight}kg · R$ ${lot.price.toLocaleString('pt-BR')}${lot.priceUnit}`
  try {
    if (navigator.share) {
      await navigator.share({ title: lot.title, text })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  } catch {
    // user cancelled the share sheet or clipboard is unavailable — no-op
  }
}

export function LotDetailScreen({ lotId, onBack, onNavigate, onFarm, onSimulate }: {
  lotId: number; onBack: () => void; onNavigate: (s: Screen) => void; onFarm: (id: number) => void; onSimulate: (lotId: number) => void
}) {
  const { LOTS, FARMS, MARKET_DATA } = useData()
  const lot = LOTS.find(l => l.id === lotId)!
  const farm = FARMS.find(f => f.id === lot.sellerId)!
  const [imgIdx, setImgIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const marketRef = (MARKET_DATA as Record<string, { current: number }>)[lot.category]
  const vsMarket = marketRef ? ((lot.price - marketRef.current) / marketRef.current) * 100 : null
  const scoreBreakdown = [
    { label: 'Qualidade dos dados', value: 97 }, { label: 'Fazenda', value: lot.score - 2 },
    { label: 'Lote', value: lot.score }, { label: 'Localização', value: 88 },
    { label: 'Documentação', value: lot.verified ? 100 : 72 }, { label: 'Histórico', value: Math.min(99, lot.score + 4) },
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-72 bg-bta-primary-10">
          <LotImage src={lot.images[imgIdx]} alt={lot.title} size="lg" />
          <div className="absolute top-12 left-4">
            <button onClick={onBack} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center card-shadow text-bta-text"><Ic.Back /></button>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {lot.images.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />)}
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-black text-bta-text text-2xl" style={{ letterSpacing: '-0.02em' }}>{lot.title}</h1>
                  {lot.verified && <VerifiedBadge />}
                </div>
                <p className="text-bta-muted text-sm">{lot.breed} · {lot.category} · {lot.age}</p>
              </div>
              <BTAScore score={lot.score} size="md" />
            </div>
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-bta-muted text-xs mb-1">Preço</p>
                <p className="font-display font-black text-bta-amber text-2xl">R$ {lot.price.toLocaleString('pt-BR')}</p>
                <p className="text-bta-muted text-xs">{lot.priceUnit}</p>
                {vsMarket !== null && (
                  <p className={`flex items-center gap-1 text-xs font-display font-bold mt-1 ${vsMarket <= 0 ? 'text-bta-success' : 'text-bta-error'}`}>
                    {vsMarket <= 0 ? <Ic.ArrowDown /> : <Ic.ArrowUp />} {Math.abs(vsMarket).toFixed(1)}% vs. média {lot.category.toLowerCase()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-bta-muted text-xs mb-1">Total estimado</p>
                <p className="font-display font-bold text-bta-text text-xl">R$ {lot.priceTotal.toLocaleString('pt-BR')}</p>
                <p className="text-bta-muted text-xs">{lot.quantity} cabeças</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-bta-border grid grid-cols-3 gap-3">
              {[{ label: 'Peso médio', value: `${lot.weight} kg` }, { label: 'Sexo', value: lot.sex }, { label: 'Finalidade', value: lot.purpose }].map(i => (
                <div key={i.label}><p className="text-bta-muted text-[10px]">{i.label}</p><p className="font-display font-semibold text-bta-text text-xs mt-0.5">{i.value}</p></div>
              ))}
            </div>
          </div>

          {/* Contextual actions row */}
          <div className="flex gap-2">
            <button onClick={() => onSimulate(lot.id)} className="flex-1 flex items-center justify-center gap-2 border border-bta-primary text-bta-primary font-display font-semibold text-xs py-3 rounded-xl">
              <Ic.Calculator /> Simular compra
            </button>
            <button onClick={() => onNavigate('bta-check')} className="flex-1 flex items-center justify-center gap-2 border border-bta-border text-bta-text font-display font-semibold text-xs py-3 rounded-xl">
              <Ic.Search /> BTA Check
            </button>
            <button onClick={() => onNavigate('ai')} className="flex-1 flex items-center justify-center gap-2 border border-bta-border text-bta-text font-display font-semibold text-xs py-3 rounded-xl">
              <Ic.Sparkles /> Analisar com IA
            </button>
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <p className="font-display font-bold text-bta-text text-sm mb-3">Logística</p>
            <div className="space-y-3">
              {[{ label: 'Localização', value: lot.location, icon: <Ic.Pin /> }, { label: 'Distância', value: `${lot.distance} km`, icon: <Ic.Pin /> }, { label: 'Frete estimado', value: `R$ ${lot.freight.toLocaleString('pt-BR')}`, icon: <Ic.Truck /> }, { label: 'Custo total estimado', value: `R$ ${(lot.priceTotal + lot.freight).toLocaleString('pt-BR')}`, icon: <Ic.Wallet /> }].map(i => (
                <div key={i.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-bta-muted">{i.icon}<span className="text-xs">{i.label}</span></div>
                  <span className="font-display font-semibold text-bta-text text-sm">{i.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => onFarm(farm.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-bta-text text-sm">{farm.name}</p>
                  {farm.verified && <VerifiedBadge small />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Ic.Star filled /><span className="text-bta-text text-xs font-semibold">{farm.rating}</span></span>
                  <span className="text-bta-muted text-xs">{farm.deals} negociações</span>
                  <span className="text-bta-success text-xs font-semibold">{farm.completion}% concluídas</span>
                </div>
              </div>
              <Ic.ChevronRight />
            </div>
          </button>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-bta-text text-sm">BTA Score Detalhado</p>
              <BTAScore score={lot.score} size="sm" />
            </div>
            <div className="space-y-3">
              {scoreBreakdown.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-bta-text text-xs">{s.label}</span>
                    <span className="font-display font-bold text-xs text-bta-primary">{s.value}</span>
                  </div>
                  <div className="h-1.5 bg-bta-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.value >= 90 ? 'bg-bta-primary' : s.value >= 75 ? 'bg-bta-amber' : 'bg-bta-error'}`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div><p className="font-display font-bold text-bta-text text-sm mb-2">Sobre o lote</p><p className="text-bta-muted text-sm leading-relaxed">{lot.description}</p></div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border">
        <Btn sound="cta" onClick={() => onNavigate('negotiation')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl mb-3">Fazer proposta</Btn>
        <div className="flex gap-3">
          <Btn
            sound="select"
            onClick={() => setSaved(s => !s)}
            className={`flex-1 py-3 rounded-xl border font-display font-semibold text-sm transition-colors ${saved ? 'border-bta-amber text-bta-amber bg-bta-amber-light' : 'border-bta-border text-bta-text bg-bta-bg'}`}
          >
            <span className={`inline-flex items-center gap-1.5 ${saved ? 'heartbeat' : ''}`}><Ic.Star filled={saved} /> {saved ? 'Salvo' : 'Salvar'}</span>
          </Btn>
          <Btn sound="tap" onClick={() => shareLot(lot)} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text bg-bta-bg font-display font-semibold text-sm flex items-center justify-center gap-1.5">
            <Ic.Share /> Compartilhar
          </Btn>
        </div>
      </div>
    </div>
  )
}
