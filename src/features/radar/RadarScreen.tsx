import { useState } from 'react'
import { sounds } from '@/utils/sound'
import { RADAR_ALERTS } from '@/data/mock'
import { Header, Ic } from '@/components'

export function RadarScreen({ onBack }: { onBack: () => void }) {
  const [alerts, setAlerts] = useState(RADAR_ALERTS)
  const [showNew, setShowNew] = useState(true)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Radar" onBack={onBack} rightAction={
        <button className="w-8 h-8 bg-bta-primary text-white rounded-full flex items-center justify-center"><Ic.Plus /></button>
      } />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Seu Radar</h1>
          <p className="text-bta-muted text-sm">O BTA trabalha enquanto você não está procurando.</p>
        </div>
        {showNew && (
          <div className="bg-bta-amber/10 border border-bta-amber rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="text-lg">⚡</span><span className="font-display font-bold text-bta-text text-sm">Nova oportunidade encontrada!</span></div>
                <p className="text-bta-muted text-xs ml-7">Garrotes Nelore — R$ 2.350/cab · Barretos, SP · 92 km</p>
              </div>
              <button onClick={() => setShowNew(false)} className="text-bta-muted text-lg leading-none">×</button>
            </div>
            <button className="ml-7 mt-2 text-bta-primary text-xs font-display font-bold">Ver oportunidade →</button>
          </div>
        )}
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-bta-text text-sm">{alert.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-semibold ${alert.active ? 'bg-bta-success/10 text-bta-success' : 'bg-bta-muted/10 text-bta-muted'}`}>{alert.active ? 'Ativo' : 'Pausado'}</span>
                  </div>
                  <p className="text-bta-muted text-xs">{alert.criteria}</p>
                  {alert.matches > 0 && <p className="text-bta-primary text-xs font-semibold mt-1">{alert.matches} lote{alert.matches > 1 ? 's' : ''} compatível{alert.matches > 1 ? 'is' : ''}</p>}
                </div>
                <button onClick={() => { sounds.toggle(); setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a)) }} className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${alert.active ? 'bg-bta-primary' : 'bg-bta-border'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alert.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-bta-border rounded-2xl p-5 text-bta-muted">
          <Ic.Plus /><span className="font-display font-semibold text-sm">Criar novo alerta</span>
        </button>
      </div>
    </div>
  )
}
