import { Header, SectionTitle, BTAScore } from '@/components'

export function SellerAnalyticsScreen({ onBack }: { onBack: () => void }) {
  const funnel = [
    { label: 'Visualizações', value: 211, pct: 100 },
    { label: 'Favoritos', value: 34, pct: 16 },
    { label: 'Propostas recebidas', value: 3, pct: 1.4 },
    { label: 'Negociações abertas', value: 2, pct: 0.9 },
    { label: 'Negócios fechados', value: 1, pct: 0.5 },
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Analytics" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-xl mb-1" style={{ letterSpacing: '-0.02em' }}>Desempenho dos anúncios</h1>
          <p className="text-bta-muted text-sm">Últimos 30 dias</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'Visualizações', value: '211', icon: '👁', color: 'text-bta-primary' }, { label: 'Favoritos', value: '34', icon: '❤️', color: 'text-bta-error' }, { label: 'Propostas', value: '3', icon: '🤝', color: 'text-bta-success' }, { label: 'Conversão', value: '1,4%', icon: '📈', color: 'text-bta-amber' }].map(k => (
            <div key={k.label} className="bg-bta-surface rounded-xl border border-bta-border p-4">
              <div className="flex items-center gap-2 mb-1"><span>{k.icon}</span><p className="text-bta-muted text-[10px]">{k.label}</p></div>
              <p className={`font-display font-black text-2xl ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="font-display font-bold text-bta-text text-sm mb-4">Funil de conversão</p>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1"><span className="text-bta-text text-xs">{f.label}</span><div className="flex items-center gap-2"><span className="font-display font-bold text-bta-text text-sm">{f.value}</span><span className="text-bta-muted text-[10px]">({f.pct}%)</span></div></div>
                <div className="h-2 bg-bta-bg rounded-full overflow-hidden"><div className="h-full bg-bta-primary rounded-full transition-all" style={{ width: `${f.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Por anúncio</SectionTitle>
          <div className="space-y-3">
            {[{ title: '120 Nelore', views: 148, favs: 24, proposals: 2, score: 94 }, { title: '80 Brangus', views: 63, favs: 8, proposals: 1, score: 88 }, { title: '160 Nelore', views: 12, favs: 2, proposals: 0, score: 92 }].map(l => (
              <div key={l.title} className="bg-bta-surface rounded-xl border border-bta-border p-4">
                <div className="flex items-center justify-between mb-2"><span className="font-display font-bold text-bta-text text-sm">{l.title}</span><BTAScore score={l.score} size="sm" /></div>
                <div className="flex items-center gap-4">
                  <span className="text-bta-muted text-xs">👁 {l.views}</span>
                  <span className="text-bta-muted text-xs">❤️ {l.favs}</span>
                  <span className={`text-xs font-semibold ${l.proposals > 0 ? 'text-bta-success' : 'text-bta-muted'}`}>🤝 {l.proposals} proposta{l.proposals !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
