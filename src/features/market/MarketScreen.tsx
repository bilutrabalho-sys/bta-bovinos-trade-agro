import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MARKET_DATA, LOTS } from '@/data/mock'
import type { Screen, Tab } from '@/core/navigation'
import { Ic, BTALogo, Chip, SectionTitle, BottomNav } from '@/components'

type MarketPeriod = '7D' | '30D' | '90D'
type MarketCategory = 'Boi Gordo' | 'Vaca' | 'Novilha' | 'Bezerro' | 'Garrote'

// Picks up to 3 lots of the given category from distinct states, so
// "Comparar regiões" opens the Comparador with a real regional spread
// instead of the screen's leftover/default lot selection.
function regionalCompareLots(category: MarketCategory): number[] {
  const ids: number[] = []
  const seenStates = new Set<string>()
  for (const lot of LOTS) {
    if (lot.category !== category) continue
    if (seenStates.has(lot.state)) continue
    seenStates.add(lot.state)
    ids.push(lot.id)
    if (ids.length === 3) break
  }
  return ids
}

export function MarketScreen({ onBack, onTab, onNavigate, onCompare }: {
  onBack: () => void; onTab: (t: Tab) => void; onNavigate: (s: Screen) => void; onCompare: (ids: number[]) => void
}) {
  const [period, setPeriod] = useState<MarketPeriod>('30D')
  const [category, setCategory] = useState<MarketCategory>('Boi Gordo')
  const data = MARKET_DATA[category]
  const history = period === '7D' ? data.history7 : period === '30D' ? data.history30 : data.history90

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="header-dark px-5 pt-12 pb-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <BTALogo dark />
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigate('radar')} className="flex items-center gap-1.5 bg-bta-amber/20 border border-bta-amber/30 text-bta-amber text-xs font-display font-bold px-3 py-1.5 rounded-full">
                <Ic.Radar /> Criar alerta
              </button>
              <button onClick={() => onNavigate('notifications')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/70">
                <Ic.Bell count={3} />
              </button>
            </div>
          </div>
          <h1 className="font-display font-black text-white" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Mercado</h1>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
            {(Object.keys(MARKET_DATA) as MarketCategory[]).map(c => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </div>

          {/* Price hero with chart */}
          <div className="bg-bta-surface rounded-2xl border border-bta-border card-shadow p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-bta-muted text-xs font-medium mb-1">{category}</p>
                <p className="font-display font-black text-bta-text text-3xl" style={{ letterSpacing: '-0.03em' }}>
                  R$ {data.current.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  <span className="text-base font-medium text-bta-muted ml-1">{data.unit}</span>
                </p>
                <div className={`flex items-center gap-1 mt-1 ${data.change >= 0 ? 'text-bta-success' : 'text-bta-error'}`}>
                  {data.change >= 0 ? <Ic.ArrowUp /> : <Ic.ArrowDown />}
                  <span className="text-sm font-bold">{Math.abs(data.change)}%</span>
                  <span className="text-bta-muted text-xs">hoje</span>
                </div>
              </div>
              <div className="flex gap-1">
                {(['7D', '30D', '90D'] as MarketPeriod[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-xs font-display font-bold transition-colors ${period === p ? 'bg-bta-primary text-white' : 'text-bta-muted'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-bta-primary)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="var(--color-bta-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bta-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--color-bta-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--color-bta-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-bta-surface)', border: '1px solid var(--color-bta-border)', borderRadius: 12, fontSize: 12, fontFamily: 'Inter' }} labelStyle={{ color: 'var(--color-bta-muted)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}${data.unit}`, category]} />
                  <Area type="monotone" dataKey="value" stroke="var(--color-bta-primary)" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Stats under chart */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-bta-border">
              {[{ label: 'Máximo', value: `R$ ${Math.max(...history.map(h => h.value)).toFixed(0)}` },
                { label: 'Mínimo', value: `R$ ${Math.min(...history.map(h => h.value)).toFixed(0)}` },
                { label: 'Média', value: `R$ ${(history.reduce((a, h) => a + h.value, 0) / history.length).toFixed(0)}` }].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-bta-muted text-[10px]">{s.label}</p>
                  <p className="font-display font-bold text-bta-text text-xs mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators */}
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Oferta', value: 'Alta', color: 'text-bta-success' }, { label: 'Demanda', value: 'Muito Alta', color: 'text-bta-amber' }, { label: 'Liquidez', value: 'Boa', color: 'text-bta-primary' }].map(i => (
              <div key={i.label} className="bg-bta-surface rounded-xl border border-bta-border p-3 text-center">
                <p className="text-bta-muted text-[10px] font-medium mb-1">{i.label}</p>
                <p className={`font-display font-bold text-xs ${i.color}`}>{i.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('buy')} className="flex items-center justify-center gap-2 bg-bta-primary text-white font-display font-bold text-sm py-3 rounded-xl">
              <Ic.Cart /> Ver lotes
            </button>
            <button onClick={() => onNavigate('radar')} className="flex items-center justify-center gap-2 border border-bta-primary text-bta-primary font-display font-bold text-sm py-3 rounded-xl">
              <Ic.Radar /> Criar alerta
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onTab('academy')} className="flex items-center justify-center gap-2 border border-bta-border text-bta-text font-display font-semibold text-xs py-3 rounded-xl">
              <Ic.Book /> Aprender sobre esse indicador
            </button>
            <button onClick={() => onNavigate('ai')} className="flex items-center justify-center gap-2 border border-bta-border text-bta-text font-display font-semibold text-xs py-3 rounded-xl">
              <Ic.Sparkles /> Perguntar à BTA IA
            </button>
          </div>

          {/* All prices */}
          <div>
            <SectionTitle>Todos os preços</SectionTitle>
            <div className="space-y-2">
              {Object.entries(MARKET_DATA).map(([name, d]) => (
                <button key={name} onClick={() => setCategory(name as MarketCategory)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${category === name ? 'border-bta-primary bg-bta-primary/5' : 'border-bta-border bg-bta-surface'}`}>
                  <span className="font-display font-semibold text-bta-text text-sm">{name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-bold text-bta-amber text-sm">R$ {d.current.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}{d.unit}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${d.change >= 0 ? 'text-bta-success' : 'text-bta-error'}`}>
                      {d.change >= 0 ? <Ic.ArrowUp /> : <Ic.ArrowDown />}{Math.abs(d.change)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Regional */}
          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <SectionTitle action="Comparar regiões" onAction={() => onCompare(regionalCompareLots(category))}>Por região</SectionTitle>
            <div className="space-y-3">
              {[{ region: 'São Paulo (interior)', price: 316, change: +1.8 }, { region: 'Minas Gerais (Triângulo)', price: 312, change: +0.5 }, { region: 'Mato Grosso', price: 308, change: -0.9 }, { region: 'Mato Grosso do Sul', price: 310, change: +1.1 }].map(r => (
                <div key={r.region} className="flex items-center justify-between">
                  <span className="text-bta-text text-xs font-medium">{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-bta-amber text-sm">R$ {r.price}/@</span>
                    <span className={`text-xs font-bold ${r.change >= 0 ? 'text-bta-success' : 'text-bta-error'}`}>{r.change > 0 ? '+' : ''}{r.change}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="market" onTab={onTab} />
    </div>
  )
}
