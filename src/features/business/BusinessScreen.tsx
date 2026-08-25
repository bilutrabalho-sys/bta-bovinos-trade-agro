import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useData } from '@/data/DataProvider'
import type { Screen, Tab } from '@/core/navigation'
import { BTALogo, Ic, SectionTitle, BottomNav, EmptyState } from '@/components'

export function BusinessScreen({ onTab, onLot, onNavigate }: {
  onTab: (t: Tab) => void; onLot: (id: number) => void; onNavigate: (s: Screen) => void
}) {
  const { SAVED_SIMULATIONS } = useData()
  const [period, setPeriod] = useState('Mês')
  const kpis = [
    { label: 'Capital investido', value: 'R$ 287.400', color: 'text-bta-primary' },
    { label: 'Animais em operação', value: '230 cab.', color: 'text-bta-text' },
    { label: 'Compras', value: 'R$ 143.280', color: 'text-bta-text' },
    { label: 'Vendas', value: 'R$ 168.000', change: +8, color: 'text-bta-success' },
    { label: 'Custos', value: 'R$ 22.400', change: -3, color: 'text-bta-error' },
    { label: 'Receita líquida', value: 'R$ 145.600', color: 'text-bta-success' },
  ]
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    m: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'][i],
    receita: 80000 + Math.sin(i * 0.8) * 20000 + i * 5000,
    custo: 60000 + Math.cos(i * 0.6) * 10000 + i * 2000,
  }))
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="header-dark px-5 pt-12 pb-6 sticky top-0 z-10">
          <BTALogo dark />
          <h1 className="font-display font-black text-white mt-3" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Negócios</h1>
        </div>
        <div className="px-5 py-5 space-y-5">
          {/* Period filter */}
          <div className="flex gap-1 bg-bta-bg rounded-xl p-1">
            {['Mês', 'Trimestre', 'Ano'].map(p => <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-colors ${period === p ? 'bg-bta-surface text-bta-primary card-shadow' : 'text-bta-muted'}`}>{p}</button>)}
          </div>

          <div className="bg-bta-primary rounded-2xl p-5">
            <p className="text-white/60 text-xs">Margem líquida — {period.toLowerCase()} atual</p>
            <p className="font-display font-black text-bta-amber text-4xl mt-1" style={{ letterSpacing: '-0.04em' }}>+18,4%</p>
            <div className="flex items-center gap-2 mt-2"><Ic.ArrowUp /><span className="text-white/70 text-xs">2,1 pp acima do período anterior</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-bta-surface rounded-xl border border-bta-border p-4">
                <p className="text-bta-muted text-[10px] mb-1">{k.label}</p>
                <p className={`font-display font-black text-base ${k.color}`}>{k.value}</p>
                {'change' in k && k.change !== undefined && (
                  <div className={`flex items-center gap-0.5 mt-0.5 ${k.change >= 0 ? 'text-bta-success' : 'text-bta-error'}`}>
                    {k.change >= 0 ? <Ic.ArrowUp /> : <Ic.ArrowDown />}
                    <span className="text-[10px] font-bold">{Math.abs(k.change)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <p className="font-display font-bold text-bta-text text-sm mb-4">Receita vs. Custo (12 meses)</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-bta-primary)" stopOpacity={0.15} /><stop offset="100%" stopColor="var(--color-bta-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-bta-error)" stopOpacity={0.12} /><stop offset="100%" stopColor="var(--color-bta-error)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bta-border)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 9, fill: 'var(--color-bta-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--color-bta-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-bta-surface)', border: '1px solid var(--color-bta-border)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any, name: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, name === 'receita' ? 'Receita' : 'Custo']} />
                  <Area type="monotone" dataKey="receita" stroke="var(--color-bta-primary)" strokeWidth={2} fill="url(#recGrad)" dot={false} />
                  <Area type="monotone" dataKey="custo" stroke="var(--color-bta-error)" strokeWidth={1.5} fill="url(#custGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saved simulations */}
          <div>
            <SectionTitle action="Nova simulação" onAction={() => onNavigate('simulator')}>Simulações salvas</SectionTitle>
            {SAVED_SIMULATIONS.length === 0 ? (
              <EmptyState
                compact
                icon={<Ic.Calculator />}
                title="Nenhuma simulação salva"
                description="Simule uma operação e salve os cenários para acompanhar aqui."
                cta={{ label: 'Nova simulação', onClick: () => onNavigate('simulator') }}
              />
            ) : (
            <div className="space-y-2">
              {SAVED_SIMULATIONS.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-bta-surface rounded-xl border border-bta-border px-4 py-3">
                  <div>
                    <p className="font-display font-semibold text-bta-text text-xs">{s.name}</p>
                    <p className="text-bta-muted text-[10px]">{s.date} · Cenário {s.scenario}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-bta-success text-sm">+{s.margin}%</p>
                    <p className="text-bta-muted text-[10px]">R$ {s.investment.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Operations */}
          <div>
            <SectionTitle>Operações recentes</SectionTitle>
            <div className="space-y-2">
              {[
                { type: 'Compra', lot: '120 Nelore', date: '20/08', value: 'R$ 143.280', color: 'text-bta-error', lotId: 1 },
                { type: 'Venda', lot: '80 Brangus', date: '15/08', value: 'R$ 117.504', color: 'text-bta-success', lotId: 2 },
                { type: 'Frete', lot: 'Transportadora JB', date: '20/08', value: 'R$ 4.200', color: 'text-bta-error', lotId: 1 },
                { type: 'Venda', lot: '30 Angus', date: '10/08', value: 'R$ 63.855', color: 'text-bta-success', lotId: 15 },
              ].map((o, i) => (
                <button key={i} onClick={() => onLot(o.lotId)} className="w-full flex items-center justify-between bg-bta-surface rounded-xl border border-bta-border px-4 py-3 text-left transition-transform active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.type === 'Compra' || o.type === 'Frete' ? 'bg-bta-error/10 text-bta-error' : 'bg-bta-success/10 text-bta-success'}`}>{o.type}</div>
                    <div><p className="font-display font-semibold text-bta-text text-xs">{o.lot}</p><p className="text-bta-muted text-[10px]">{o.date}</p></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-display font-bold text-sm ${o.color}`}>{o.value}</span>
                    <Ic.ChevronRight />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="business" onTab={onTab} />
    </div>
  )
}
