import { useState } from 'react'
import type { Lot } from '@/data/mock'
import { useData } from '@/data/DataProvider'
import { useAuthGate } from '@/auth/AuthGate'
import type { Screen } from '@/core/navigation'
import { Header, Btn, Ic } from '@/components'

// Picks up to 2 other lots of the same category as the simulated lot, so
// "Comparar cenário" opens the Comparador grounded in the numbers just
// simulated instead of an unrelated/default lot pair.
function relatedLotIds(lot: Lot, lots: Lot[]): number[] {
  const others = lots
    .filter(l => l.id !== lot.id && l.category === lot.category)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(l => l.id)
  return [lot.id, ...others]
}

export function SimulatorScreen({ onBack, onNavigate, onCompare, prefillLot }: {
  onBack: () => void; onNavigate: (s: Screen, lotId?: number) => void; onCompare: (ids: number[]) => void; prefillLot?: Lot | null
}) {
  const { LOTS } = useData()
  const { requireAuth } = useAuthGate()
  const [qty, setQty] = useState(String(prefillLot?.quantity ?? 50))
  const [buyPrice, setBuyPrice] = useState(String(prefillLot ? (prefillLot.priceUnit === '/@' ? prefillLot.price : Math.round(prefillLot.price / (prefillLot.weight / 15))) : 2400))
  const [freight, setFreight] = useState(String(prefillLot?.freight ?? 5000))
  const [feed, setFeed] = useState('18000')
  const [period, setPeriod] = useState('90')
  const [sellPrice, setSellPrice] = useState('315')
  const [finalWeight, setFinalWeight] = useState(String(prefillLot ? Math.round(prefillLot.weight * 1.1) : 420))

  const qtyN = parseInt(qty) || 0
  const buyPriceN = parseFloat(buyPrice) || 0
  const freightN = parseFloat(freight) || 0
  const feedN = parseFloat(feed) || 0
  const sellPriceN = parseFloat(sellPrice) || 0
  const finalWeightN = parseFloat(finalWeight) || 0
  const arroba = finalWeightN / 15

  function calcScenario(mult: number) {
    const cost = qtyN * buyPriceN + freightN + feedN * mult
    const revenue = qtyN * arroba * sellPriceN * mult
    const margin = revenue > 0 ? ((revenue - cost) / cost) * 100 : 0
    const breakEven = qtyN > 0 && arroba > 0 ? cost / (qtyN * arroba * mult) : 0
    return { cost, revenue, margin, breakEven }
  }

  const toneClasses: Record<string, { bg: string; text: string }> = {
    error: { bg: 'bg-bta-error/15', text: 'text-bta-error' },
    amber: { bg: 'bg-bta-amber/15', text: 'text-bta-amber' },
    success: { bg: 'bg-bta-success/15', text: 'text-bta-success' },
  }
  const scenarios = [
    { label: 'Pessimista', mult: 0.88, tone: 'error' },
    { label: 'Base', mult: 1.0, tone: 'amber' },
    { label: 'Otimista', mult: 1.12, tone: 'success' },
  ].map(s => ({ ...s, ...calcScenario(s.mult) }))
  const base = scenarios[1]
  const fmt = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Simulador" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Simule antes de investir.</h1>
          {prefillLot && <p className="text-bta-primary text-xs font-semibold bg-bta-primary/10 px-3 py-1.5 rounded-full inline-block mt-1">Dados do lote: {prefillLot.title}</p>}
        </div>
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4 space-y-4">
          <p className="font-display font-bold text-bta-text text-sm">Dados da operação</p>
          {[{ label: 'Quantidade (cabeças)', value: qty, set: setQty }, { label: 'Preço de compra (R$/cab)', value: buyPrice, set: setBuyPrice }, { label: 'Frete total (R$)', value: freight, set: setFreight }, { label: 'Alimentação total (R$)', value: feed, set: setFeed }, { label: 'Período (dias)', value: period, set: setPeriod }, { label: 'Preço de venda (R$/@)', value: sellPrice, set: setSellPrice }, { label: 'Peso final médio (kg)', value: finalWeight, set: setFinalWeight }].map(f => (
            <div key={f.label} className="flex items-center justify-between gap-4">
              <label className="text-bta-text text-xs flex-1">{f.label}</label>
              <input type="number" value={f.value} onChange={e => f.set(e.target.value)} className="w-28 bg-bta-bg border border-bta-border rounded-xl px-3 py-2 text-sm text-right font-display font-bold text-bta-text outline-none focus:border-bta-primary" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {scenarios.map(s => (
            <div key={s.label} className="bg-bta-surface rounded-2xl border border-bta-border overflow-hidden">
              <div className={`px-4 py-3 flex items-center justify-between ${toneClasses[s.tone].bg}`}>
                <span className={`font-display font-bold text-sm ${toneClasses[s.tone].text}`}>{s.label}</span>
                <span className={`font-display font-black text-lg ${s.margin >= 0 ? toneClasses[s.tone].text : 'text-bta-error'}`}>{s.margin >= 0 ? '+' : ''}{s.margin.toFixed(1)}%</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                {[{ label: 'Custo total', value: fmt(s.cost) }, { label: 'Receita', value: fmt(s.revenue) }, { label: 'Resultado', value: fmt(s.revenue - s.cost) }, { label: 'Ponto equilíbrio', value: `R$ ${s.breakEven.toFixed(0)}/@` }].map(i => (
                  <div key={i.label}><p className="text-bta-muted text-[10px]">{i.label}</p><p className="font-display font-bold text-bta-text text-sm mt-0.5">{i.value}</p></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-bta-primary rounded-2xl p-5 text-white">
          <p className="font-display font-semibold text-white/70 text-xs mb-2">Cenário base — resumo</p>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-white/60 text-xs">Investimento</p><p className="font-display font-black text-white text-xl">{fmt(base.cost)}</p></div>
            <div><p className="text-white/60 text-xs">Margem</p><p className="font-display font-black text-bta-amber text-xl">{base.margin.toFixed(1)}%</p></div>
            <div><p className="text-white/60 text-xs">Custo/cabeça</p><p className="font-display font-bold text-white text-sm">{qtyN > 0 ? fmt(base.cost / qtyN) : '—'}</p></div>
            <div><p className="text-white/60 text-xs">Custo/@</p><p className="font-display font-bold text-white text-sm">{qtyN > 0 && arroba > 0 ? `R$ ${(base.cost / (qtyN * arroba)).toFixed(0)}/@` : '—'}</p></div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <Btn
          sound="cta"
          disabled={!prefillLot}
          title={!prefillLot ? 'Simule a partir de um lote para fazer proposta' : undefined}
          onClick={() => prefillLot && requireAuth(() => onNavigate('negotiation', prefillLot.id), 'Entre para fazer uma proposta')}
          className={`w-full font-display font-bold text-base py-4 rounded-xl ${prefillLot ? 'btn-primary-grad text-white' : 'bg-bta-border text-bta-muted opacity-50 cursor-not-allowed'}`}
        >
          Fazer proposta
        </Btn>
        <div className="flex gap-3">
          <Btn sound="success" onClick={() => requireAuth(() => onNavigate('business'), 'Entre para salvar simulações')} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm flex items-center justify-center gap-1.5">
            <Ic.Check /> Salvar simulação
          </Btn>
          <Btn
            sound="tap"
            disabled={!prefillLot}
            title={!prefillLot ? 'Simule a partir de um lote para comparar' : undefined}
            onClick={() => prefillLot && onCompare(relatedLotIds(prefillLot, LOTS))}
            className={`flex-1 py-3 rounded-xl border font-display font-semibold text-sm flex items-center justify-center gap-1.5 border-bta-border ${prefillLot ? 'text-bta-text' : 'text-bta-muted opacity-50 cursor-not-allowed'}`}
          >
            <Ic.Scale /> Comparar cenário
          </Btn>
        </div>
        <div className="flex gap-3">
          <Btn sound="tap" onClick={() => onNavigate('academy')} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm flex items-center justify-center gap-1.5">
            <Ic.Book /> Aprender como funciona
          </Btn>
          <Btn sound="tap" onClick={() => onNavigate('ai')} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm flex items-center justify-center gap-1.5">
            <Ic.Sparkles /> Analisar com IA
          </Btn>
        </div>
      </div>
    </div>
  )
}
