import { useState } from 'react'
import { sounds } from '@/utils/sound'
import type { Tab } from '@/core/navigation'
import { Ic } from '@/components/foundation/icons'

export function BottomNav({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  const [animKey, setAnimKey] = useState('')
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'home',     label: 'Início',   icon: <Ic.Home /> },
    { key: 'market',   label: 'Mercado',  icon: <Ic.Chart /> },
    { key: 'academy',  label: 'Aprender', icon: <Ic.Book /> },
    { key: 'business', label: 'Negócios', icon: <Ic.Briefcase /> },
    { key: 'profile',  label: 'Perfil',   icon: <Ic.User /> },
  ]
  return (
    <div
      className="flex bg-bta-surface px-1 pb-6 pt-0 sticky bottom-0 z-10"
      style={{ boxShadow: '0 -1px 0 rgba(18,59,42,0.08), 0 -4px 24px rgba(18,59,42,0.08)' }}
    >
      {tabs.map(t => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            onClick={() => { sounds.nav(); setAnimKey(t.key); onTab(t.key) }}
            className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 relative"
          >
            {/* amber top-line indicator */}
            <div
              className={`absolute top-0 left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${isActive ? 'bg-bta-amber' : 'bg-transparent'}`}
            />
            <span
              key={animKey === t.key ? `${t.key}-anim` : t.key}
              className={`transition-colors ${isActive ? 'text-bta-primary' : 'text-bta-muted/60'} ${isActive && animKey === t.key ? 'tab-pop' : ''}`}
            >
              {t.icon}
            </span>
            <span
              className={`text-[9px] font-display font-bold tracking-wide transition-colors ${isActive ? 'text-bta-primary' : 'text-bta-muted/50'}`}
            >
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
