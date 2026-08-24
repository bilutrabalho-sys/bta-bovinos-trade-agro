import { useState } from 'react'
import { sounds } from '@/utils/sound'
import { RADAR_ALERTS, LOTS } from '@/data/mock'
import { Header, Ic } from '@/components'

export function RadarScreen({ onBack, onLot }: { onBack: () => void; onLot: (id: number) => void }) {
  const [alerts, setAlerts] = useState(RADAR_ALERTS)
  const [showNew, setShowNew] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const bannerLot = LOTS.find(l => l.id === 3)!
  const addAlert = () => {
    setAlerts(prev => [...prev, { id: Date.now(), title: 'Novo alerta', criteria: 'Defina categoria, preço máximo e distância', active: true, matches: 0 }])
  }
  const startEdit = (alert: (typeof RADAR_ALERTS)[number]) => { setEditingId(alert.id); setEditDraft(alert.criteria) }
  const saveEdit = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, criteria: editDraft } : a))
    setEditingId(null)
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Radar" onBack={onBack} rightAction={
        <button onClick={addAlert} className="w-8 h-8 bg-bta-primary text-white rounded-full flex items-center justify-center"><Ic.Plus /></button>
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
                <div className="flex items-center gap-2 mb-1"><span className="text-bta-amber"><Ic.Bolt /></span><span className="font-display font-bold text-bta-text text-sm">Nova oportunidade encontrada!</span></div>
                <p className="text-bta-muted text-xs ml-7">Garrotes Nelore — R$ {bannerLot.price.toLocaleString('pt-BR')}{bannerLot.priceUnit} · {bannerLot.location} · {bannerLot.distance} km</p>
              </div>
              <button onClick={() => setShowNew(false)} className="text-bta-muted"><Ic.X /></button>
            </div>
            <button onClick={() => onLot(3)} className="ml-7 mt-2 text-bta-primary text-xs font-display font-bold">Ver oportunidade →</button>
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
                  {editingId === alert.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text" value={editDraft} onChange={e => setEditDraft(e.target.value)} autoFocus
                        className="flex-1 bg-bta-bg border border-bta-primary rounded-lg px-2 py-1 text-xs text-bta-text outline-none"
                      />
                      <button onClick={() => saveEdit(alert.id)} className="text-bta-primary text-[10px] font-display font-bold flex-shrink-0">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-bta-muted text-[10px] font-display font-semibold flex-shrink-0">Cancelar</button>
                    </div>
                  ) : (
                    <p className="text-bta-muted text-xs">{alert.criteria}</p>
                  )}
                  {alert.matches > 0 && <p className="text-bta-primary text-xs font-semibold mt-1">{alert.matches} lote{alert.matches > 1 ? 's' : ''} compatível{alert.matches > 1 ? 'is' : ''}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={() => { sounds.toggle(); setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a)) }} className={`w-11 h-6 rounded-full transition-colors relative ${alert.active ? 'bg-bta-primary' : 'bg-bta-border'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full card-shadow transition-transform ${alert.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <button onClick={() => startEdit(alert)} className="text-bta-primary text-[10px] font-display font-semibold">Editar</button>
                  <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} className="text-bta-muted text-[10px] font-display font-semibold">Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addAlert} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-bta-border rounded-2xl p-5 text-bta-muted">
          <Ic.Plus /><span className="font-display font-semibold text-sm">Criar novo alerta</span>
        </button>
      </div>
    </div>
  )
}
