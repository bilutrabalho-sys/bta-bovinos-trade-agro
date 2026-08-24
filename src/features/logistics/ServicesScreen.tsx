import { SERVICES } from '@/data/mock'
import type { Screen } from '@/core/navigation'
import { Header } from '@/components'

export function ServicesScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Serviços" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-xl mb-1" style={{ letterSpacing: '-0.02em' }}>Central de Serviços</h1>
          <p className="text-bta-muted text-sm">Tudo que você precisa para operar com segurança.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map(s => (
            <button
              key={s.id}
              onClick={s.id === 1 ? () => onNavigate('bta-log') : undefined}
              className={`bg-bta-surface rounded-2xl border p-4 text-left transition-transform active:scale-[0.98] ${s.status === 'available' ? 'border-bta-primary/30' : 'border-bta-border opacity-75'}`}
            >
              <span className="text-3xl">{s.icon}</span>
              <p className="font-display font-bold text-bta-text text-sm mt-3">{s.name}</p>
              <p className="text-bta-muted text-[10px] mt-0.5 leading-snug">{s.description}</p>
              <div className="mt-3">
                {s.status === 'available'
                  ? <span className="text-[10px] font-display font-bold text-bta-success bg-bta-success/10 px-2 py-0.5 rounded-full">Disponível</span>
                  : <span className="text-[10px] font-display font-bold text-bta-muted bg-bta-muted/10 px-2 py-0.5 rounded-full">Em breve</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="bg-bta-primary/5 border border-bta-primary/20 rounded-2xl p-4">
          <p className="font-display font-bold text-bta-primary text-sm mb-1">🚀 Expansão planejada</p>
          <p className="text-bta-muted text-xs leading-relaxed">Novos serviços serão integrados ao longo de 2026. Ative notificações para ser avisado quando estiverem disponíveis.</p>
        </div>
      </div>
    </div>
  )
}
