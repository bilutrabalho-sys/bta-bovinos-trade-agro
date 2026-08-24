import { useState } from 'react'
import { Header, Ic, Btn } from '@/components'

export function BTAProScreen({ onBack }: { onBack: () => void }) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const plans = [
    {
      name: 'Gratuito', price: 'R$ 0', sub: 'Para começar', color: 'border-bta-border',
      features: ['Busca básica', 'Ver lotes', 'BTA Academy (básico)', 'Radar (1 alerta)', 'Simulador básico'],
      missing: ['Match prioritário', 'Analytics', 'Radar ilimitado', 'Destaque de lotes'],
      cta: 'Plano atual', ctaStyle: 'bg-bta-bg border border-bta-border text-bta-muted',
    },
    {
      name: 'BTA PRO', price: 'R$ 79', sub: '/mês', color: 'border-bta-primary', highlight: true,
      features: ['Tudo do Gratuito', 'Match prioritário', 'Radar ilimitado', 'Analytics completo', 'Destaque de lotes', 'Histórico completo', 'Relatórios PDF', 'Ferramentas comerciais'],
      cta: 'Assinar PRO', ctaStyle: 'bg-bta-primary text-white',
    },
    {
      name: 'Empresa', price: 'Consulte', sub: '', color: 'border-bta-border',
      features: ['Tudo do PRO', 'Multiusuário', 'Dashboard corporativo', 'Volume maior', 'Suporte dedicado', 'API de integração'],
      cta: 'Falar com time', ctaStyle: 'bg-bta-bg border border-bta-border text-bta-text',
    },
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="BTA PRO" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="text-center">
          <div className="flex justify-center mb-3"><Ic.Crown /></div>
          <h1 className="font-display font-black text-bta-text text-2xl" style={{ letterSpacing: '-0.02em' }}>Escolha seu plano</h1>
          <p className="text-bta-muted text-sm mt-1">Comece grátis. Evolua quando quiser.</p>
        </div>
        {plans.map(p => {
          const isFree = p.name === 'Gratuito'
          const done = confirmed[p.name]
          return (
            <div key={p.name} className={`bg-bta-surface rounded-2xl border-2 p-5 relative overflow-hidden ${p.color}`}>
              {p.highlight && <div className="absolute top-3 right-3 bg-bta-amber text-white text-[10px] font-display font-black px-2 py-0.5 rounded-full">MAIS POPULAR</div>}
              <div className="mb-4">
                <p className="font-display font-bold text-bta-muted text-xs uppercase tracking-wider">{p.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="font-display font-black text-bta-text text-3xl" style={{ letterSpacing: '-0.03em' }}>{p.price}</span>
                  <span className="text-bta-muted text-sm mb-0.5">{p.sub}</span>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {p.features.map(f => <div key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-bta-success/10 text-bta-success flex items-center justify-center flex-shrink-0"><Ic.Check /></div><span className="text-bta-text text-xs">{f}</span></div>)}
                {'missing' in p && p.missing?.map(f => <div key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-bta-muted/10 flex items-center justify-center flex-shrink-0 text-bta-muted"><Ic.X /></div><span className="text-bta-muted text-xs line-through">{f}</span></div>)}
              </div>
              {isFree ? (
                <button disabled className={`w-full py-3 rounded-xl font-display font-bold text-sm cursor-default ${p.ctaStyle}`}>{p.cta}</button>
              ) : (
                <Btn
                  sound="cta"
                  disabled={done}
                  onClick={() => setConfirmed(c => ({ ...c, [p.name]: true }))}
                  className={`w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-1.5 transition-colors ${done ? 'bg-bta-success/10 text-bta-success border border-bta-success' : p.ctaStyle}`}
                >
                  {done ? <><Ic.Check /> {p.name === 'BTA PRO' ? 'Assinatura confirmada' : 'Solicitação enviada'}</> : p.cta}
                </Btn>
              )}
            </div>
          )
        })}
        <p className="text-bta-muted text-[10px] text-center">Cancele quando quiser. Sem fidelidade.</p>
      </div>
    </div>
  )
}
