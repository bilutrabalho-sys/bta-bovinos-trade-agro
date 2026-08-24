import { LOTS, FARMS } from '@/data/mock'
import type { Screen } from '@/core/navigation'
import { Header, BTAScore, Ic } from '@/components'

export function BTACheckScreen({ lotId, onBack, onNavigate }: { lotId: number; onBack: () => void; onNavigate: (s: Screen) => void }) {
  const lot = LOTS.find(l => l.id === lotId)!
  const farm = FARMS.find(f => f.id === lot.sellerId)!
  const items = [
    { label: 'Dados do vendedor', status: 'ok', note: <span className="inline-flex items-center gap-1">Fazenda BTA Verified, 4.9 <Ic.Star filled /></span> },
    { label: 'Documentação (GTA)', status: 'ok', note: 'GTA emitida, válida por 30 dias' },
    { label: 'Origem do rebanho', status: 'ok', note: 'Rastreamento confirmado' },
    { label: 'Peso declarado', status: 'verify', note: 'Solicite pesagem na balança' },
    { label: 'Idade declarada', status: 'ok', note: 'Dentição compatível com 36 meses' },
    { label: 'Conformidade do lote', status: 'ok', note: 'Homogêneo — variação < 10%' },
    { label: 'Sanidade animal', status: 'ok', note: 'Vacinação FMD e Brucelose em dia' },
    { label: 'Transporte', status: 'attention', note: 'Confirme capacidade do veículo' },
    { label: 'Condições comerciais', status: 'verify', note: 'Cláusula de peso vivo — atenção' },
  ]
  const statusConfig = {
    ok: { label: 'OK', bg: 'bg-bta-success/10', text: 'text-bta-success', icon: <Ic.Check /> },
    verify: { label: 'VERIFICAR', bg: 'bg-bta-amber/10', text: 'text-bta-amber', icon: <Ic.HelpCircle /> },
    attention: { label: 'ATENÇÃO', bg: 'bg-bta-error/10', text: 'text-bta-error', icon: <Ic.AlertCircle /> },
  }
  const score = Math.round((items.filter(i => i.status === 'ok').length / items.length) * 100)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="BTA Check" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Antes de fechar, confira.</h1>
          <p className="text-bta-muted text-sm">{lot.title} · {farm.name}</p>
        </div>
        <div className="flex items-center gap-5 bg-bta-surface rounded-2xl border border-bta-border p-4">
          <BTAScore score={score} size="lg" />
          <div>
            <p className="font-display font-bold text-bta-text text-base">{score >= 80 ? 'Lote seguro' : 'Revisar pontos'}</p>
            <p className="text-bta-muted text-xs mt-1">{items.filter(i => i.status === 'ok').length} OK · {items.filter(i => i.status === 'verify').length} verificar · {items.filter(i => i.status === 'attention').length} atenção</p>
          </div>
        </div>
        <div className="space-y-2">
          {items.map(item => {
            const cfg = statusConfig[item.status as keyof typeof statusConfig]
            return (
              <div key={item.label} className="bg-bta-surface rounded-xl border border-bta-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1"><p className="font-display font-semibold text-bta-text text-sm">{item.label}</p><p className="text-bta-muted text-xs mt-0.5">{item.note}</p></div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-display font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.icon} {cfg.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <button onClick={() => onNavigate('negotiation')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl">Continuar para negociação</button>
        <button onClick={onBack} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl">Voltar ao lote</button>
      </div>
    </div>
  )
}
