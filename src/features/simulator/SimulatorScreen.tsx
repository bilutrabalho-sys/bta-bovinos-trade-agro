import { useState } from 'react'
import type { Lot } from '@/data/mock'
import type { Screen } from '@/core/navigation'
import { Header, Btn } from '@/components'

export function SimulatorScreen({ onBack, onNavigate, prefillLot }: {
  onBack: () => void; onNavigate: (s: Screen) => void; prefillLot?: Lot | null
}) {
  const [qty, setQty] = useState(String(prefillLot?.quantity ?? 50))
  const [buyPrice, setBuyPrice] = useState(String(prefillLot ? (prefillLot.priceUnit === '/@' ? prefillLot.price : Math.round(prefillLot.price / (prefillLot.weight / 15))) : 2400))
  const [freight, setFreight] = useState(String(prefillLot?.freight ?? 5000))
  const [feed, setFeed] = useState('18000')
  const [period, setPeriod] = useState('90')
  const [sellPrice, setSellPrice] = useState('315')
  const [finalWeight, setFinalWeight] = useState(String(prefillLot ? Math.round(prefillLot.weight * 1.1) : 420))
  const [saved, setSaved] = useState(false)

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

  const scenarios = [
    { label: 'Pessimista', mult: 0.88, color: '#C94A45' },
    { label: 'Base', mult: 1.0, color: '#D6A84F' },
    { label: 'Otimista', mult: 1.12, color: '#2E7D52' },
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
              <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: s.color + '15' }}>
                <span className="font-display font-bold text-sm" style={{ color: s.color }}>{s.label}</span>
                <span className="font-display font-black text-lg" style={{ color: s.margin >= 0 ? s.color : '#C94A45' }}>{s.margin >= 0 ? '+' : ''}{s.margin.toFixed(1)}%</span>
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
        <Btn sound="cta" onClick={() => onNavigate('negotiation')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-2xl">Fazer proposta</Btn>
        <div className="flex gap-3">
          <Btn sound="success" onClick={() => setSaved(true)} className={`flex-1 py-3 rounded-xl border font-display font-semibold text-sm ${saved ? 'border-bta-success text-bta-success' : 'border-bta-border text-bta-text'}`}>
            {saved ? '✓ Simulação salva' : 'Salvar simulação'}
          </Btn>
          <Btn sound="tap" onClick={() => onNavigate('ai')} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm">
            ✨ Analisar com IA
          </Btn>
        </div>
      </div>
    </div>
  )
}
