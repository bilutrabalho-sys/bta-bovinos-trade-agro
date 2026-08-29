import { useData } from '@/data/DataProvider'
import type { Screen, Tab } from '@/core/navigation'
import { Ic, BTALogo, PriceCard, SectionTitle, LotCard, Btn, BottomNav, EmptyState } from '@/components'

export function HomeScreen({ onNavigate, onTab }: {
  onNavigate: (s: Screen, lotId?: number) => void; onTab: (t: Tab) => void
}) {
  const { NOTIFICATIONS, MARKET_DATA, RADAR_ALERTS, OPPORTUNITIES, LOTS, COURSES } = useData()
  const unread = NOTIFICATIONS.filter(n => !n.read).length
  const marketEntries = Object.entries(MARKET_DATA)
  const activeRadar = RADAR_ALERTS.filter(r => r.active)
  const topLots = LOTS.filter(l => l.score >= 90).slice(0, 3)
  const topCourses = COURSES.slice(0, 4)
  const actions = [
    { label: 'Comprar gado', icon: <Ic.Cart />, fn: () => onNavigate('buy') },
    { label: 'Vender gado', icon: <Ic.Clipboard />, fn: () => onNavigate('sell') },
    { label: 'Simular negócio', icon: <Ic.Calculator />, fn: () => onNavigate('simulator') },
    { label: 'Aprender', icon: <Ic.Book />, fn: () => onTab('academy') },
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="header-dark px-5 pt-12 pb-7">
          <div className="flex items-start justify-between mb-5">
            <div className="flex flex-col gap-1">
              <BTALogo size="md" dark />
              <div className="flex items-center gap-1 mt-0.5">
                <Ic.Pin />
                <span className="text-white/40 text-xs">São José do Rio Preto, SP</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => onNavigate('ai')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/70">
                <Ic.Sparkles />
              </button>
              <button onClick={() => onNavigate('notifications')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/70 relative">
                <Ic.Bell count={unread} />
              </button>
            </div>
          </div>
          <p className="text-white/40 text-xs font-display font-medium mb-1">Bom dia, Rafael</p>
          <h1 className="font-display font-black text-white leading-tight" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>
            O que você quer<br />fazer hoje?
          </h1>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {actions.map(a => (
              <Btn key={a.label} sound="tap" onClick={a.fn} className="bg-bta-surface rounded-2xl p-4 border border-bta-border card-shadow text-left">
                <div className="w-10 h-10 rounded-xl bg-bta-primary/10 flex items-center justify-center text-bta-primary mb-3">{a.icon}</div>
                <p className="font-display font-bold text-bta-text text-sm">{a.label}</p>
              </Btn>
            ))}
          </div>

          {/* Mercado hoje */}
          {marketEntries.length > 0 && (
          <div>
            <SectionTitle action="Ver tudo" onAction={() => onTab('market')}>Mercado hoje</SectionTitle>
            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2">
              {marketEntries.map(([name, data]) => (
                <PriceCard key={name} name={name} current={data.current} change={data.change} unit={data.unit} onPress={() => onTab('market')} />
              ))}
            </div>
            <p className="text-bta-muted text-[11px] mt-1 px-0.5">Fonte: {marketEntries[0]?.[1]?.source}</p>
          </div>
          )}

          {/* Radar section */}
          <div>
            <SectionTitle action="Ver radar" onAction={() => onNavigate('radar')}>Seu Radar</SectionTitle>
            {activeRadar.length > 0 ? (
            <div className="space-y-2">
              {activeRadar.map(r => (
                <button key={r.id} onClick={() => onNavigate('radar')} className="w-full flex items-center justify-between bg-bta-surface rounded-xl border border-bta-border px-4 py-3 text-left">
                  <div>
                    <p className="font-display font-semibold text-bta-text text-sm">{r.title}</p>
                    <p className="text-bta-muted text-xs mt-0.5">{r.criteria}</p>
                  </div>
                  {r.matches > 0 && (
                    <span className="bg-bta-amber/10 text-bta-amber text-xs font-display font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                      {r.matches} novo{r.matches > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
            ) : (
              <div className="bg-bta-surface rounded-2xl border border-bta-border">
                <EmptyState
                  compact
                  icon={<Ic.Radar />}
                  title="Nenhum alerta ativo"
                  description="Crie um radar e o BTA avisa quando surgir gado no seu critério."
                  cta={{ label: 'Criar alerta', onClick: () => onNavigate('radar') }}
                />
              </div>
            )}
          </div>

          {/* Match + BTA Check shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('match')} className="bg-bta-primary rounded-2xl p-4 text-left transition-transform active:scale-[0.98]">
              <div className="text-bta-amber mb-2"><Ic.Target /></div>
              <p className="font-display font-bold text-white text-sm">BTA Match</p>
              <p className="text-white/60 text-xs mt-0.5">Nós encontramos o gado.</p>
            </button>
            <button onClick={() => onNavigate('opportunities')} className="bg-bta-surface border border-bta-border rounded-2xl p-4 text-left transition-transform active:scale-[0.98]">
              <div className="text-bta-amber mb-2"><Ic.Bolt /></div>
              <p className="font-display font-bold text-bta-text text-sm">Oportunidades</p>
              <p className="text-bta-muted text-xs mt-0.5">{OPPORTUNITIES.length} detectadas</p>
            </button>
          </div>

          {/* Insumos, serviços veterinários, usados e vídeos técnicos */}
          <div>
            <SectionTitle action="Ver insumos" onAction={() => onNavigate('insumos')}>Insumos &amp; Serviços</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Insumos', sub: 'Compare fornecedores', icon: <Ic.Package />, nav: 'insumos' as Screen },
                { label: 'Veterinários', sub: 'Agende quem aplica', icon: <Ic.Stethoscope />, nav: 'vet-connect' as Screen },
                { label: 'Usados', sub: 'Máquinas e equipamentos', icon: <Ic.Tractor />, nav: 'usados' as Screen },
                { label: 'Vídeos', sub: 'Aulas de veterinários', icon: <Ic.Video />, nav: 'video-feed' as Screen },
              ].map(c => (
                <Btn key={c.label} sound="tap" onClick={() => onNavigate(c.nav)} className="bg-bta-surface rounded-2xl p-4 border border-bta-border card-shadow text-left">
                  <div className="w-10 h-10 rounded-xl bg-bta-primary/10 flex items-center justify-center text-bta-primary mb-3 [&>svg]:w-5 [&>svg]:h-5">{c.icon}</div>
                  <p className="font-display font-bold text-bta-text text-sm">{c.label}</p>
                  <p className="text-bta-muted text-xs mt-0.5">{c.sub}</p>
                </Btn>
              ))}
            </div>
          </div>

          {/* Opportunities for you */}
          {topLots.length > 0 && (
          <div>
            <SectionTitle action="Ver todas" onAction={() => onNavigate('opportunities')}>Oportunidades para você</SectionTitle>
            <div className="space-y-3">
              {topLots.map(lot => (
                <LotCard key={lot.id} lot={lot} onPress={() => onNavigate('lot-detail', lot.id)} />
              ))}
            </div>
          </div>
          )}

          {/* Continue learning */}
          {topCourses.length > 0 && (
          <div>
            <SectionTitle action="Ver tudo" onAction={() => onTab('academy')}>Continue aprendendo</SectionTitle>
            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2">
              {topCourses.map(c => (
                <div key={c.id} className="flex-shrink-0 w-52 bg-bta-surface rounded-xl p-4 border border-bta-border card-shadow">
                  <span className="inline-block px-2 py-0.5 bg-bta-bg text-bta-muted text-[10px] font-semibold rounded-full mb-2">{c.category}</span>
                  <p className="font-display font-semibold text-bta-text text-xs leading-tight mb-2">{c.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-bta-muted text-[10px]">{c.duration}</span>
                    {c.progress > 0 ? <span className="inline-flex items-center gap-1 text-bta-success text-[10px] font-bold">{c.progress}% <Ic.Check /></span> : <span className="text-bta-muted text-[10px]">+{c.xp} XP</span>}
                  </div>
                  {c.progress > 0 && c.progress < 100 && (
                    <div className="mt-2 h-1 bg-bta-bg rounded-full overflow-hidden">
                      <div className="h-full bg-bta-primary rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Services teaser */}
          <button onClick={() => onNavigate('services')} className="w-full flex items-center gap-3 bg-bta-bg border border-bta-border rounded-2xl p-5 text-left">
            <span className="text-bta-primary"><Ic.Wrench /></span>
            <div className="flex-1">
              <p className="font-display font-bold text-bta-text text-sm">Central de Serviços</p>
              <p className="text-bta-muted text-xs mt-0.5">Log · Seguro · Financiamento · Documentação</p>
            </div>
            <Ic.ChevronRight />
          </button>
        </div>
      </div>
      <BottomNav active="home" onTab={onTab} />
    </div>
  )
}
