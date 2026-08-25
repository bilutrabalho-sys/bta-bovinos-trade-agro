import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { Header, Ic, EmptyState } from '@/components'

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { NOTIFICATIONS } = useData()
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const iconMap: Record<string, React.ReactNode> = { match: <Ic.Target />, proposal: <Ic.Handshake />, price: <Ic.TrendingUp />, radar: <Ic.Radar />, academy: <Ic.Book /> }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Notificações" onBack={onBack} rightAction={<button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))} className="text-bta-secondary text-xs font-display font-semibold">Marcar todas</button>} />
      <div className="flex-1 overflow-y-auto">
        {notifs.length === 0 && (
          <div className="px-5">
            <EmptyState
              icon={<Ic.Bell />}
              title="Nenhuma notificação"
              description="Você está em dia. Novidades sobre lotes, propostas e mercado aparecem aqui."
            />
          </div>
        )}
        {notifs.map(n => (
          <button key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} className={`w-full flex items-start gap-3 px-5 py-4 text-left border-b border-bta-border transition-colors ${n.read ? 'bg-bta-surface' : 'bg-bta-primary/5'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-bta-bg text-bta-muted' : 'bg-bta-primary/10 text-bta-primary'}`}>{iconMap[n.type]}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className={`font-display font-semibold text-sm ${n.read ? 'text-bta-muted' : 'text-bta-text'}`}>{n.title}</p>
                <span className="text-bta-muted text-[10px] ml-2 flex-shrink-0">{n.time}</span>
              </div>
              <p className="text-bta-muted text-xs mt-0.5 leading-relaxed">{n.body}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-bta-primary rounded-full mt-1 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}
