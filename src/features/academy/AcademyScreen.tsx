import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import type { Tab } from '@/core/navigation'
import { BTALogo, Chip, Ic, BottomNav, EmptyState } from '@/components'

export function AcademyScreen({ onBack, onTab, onLesson }: { onBack: () => void; onTab: (t: Tab) => void; onLesson: (courseId: number) => void }) {
  const { COURSES } = useData()
  const [cat, setCat] = useState('Todos')
  const categories = ['Todos', 'Comece aqui', 'Compra', 'Venda', 'Mercado', 'Finanças', 'Genética', 'Gestão']
  const filtered = cat === 'Todos' ? COURSES : COURSES.filter(c => c.category === cat)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="header-dark px-5 pt-12 pb-6 sticky top-0 z-10">
          <BTALogo dark />
          <h1 className="font-display font-black text-white mt-3" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Academy</h1>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div className="bg-bta-primary rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Nível atual</p>
                <p className="font-display font-black text-white text-2xl">Iniciante</p>
                <p className="text-bta-amber font-semibold text-sm mt-1">380 XP</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs">Aulas concluídas</p>
                <p className="font-display font-black text-white text-3xl">1</p>
                <p className="text-white/60 text-xs">de {COURSES.length}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-white/60 text-[10px] mb-1"><span>Progresso para Intermediário</span><span>380 / 500 XP</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-bta-amber rounded-full" style={{ width: '76%' }} /></div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
            {categories.map(c => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <EmptyState
                icon={<Ic.Book />}
                title={COURSES.length === 0 ? 'Conteúdos em breve' : 'Nada nesta categoria ainda'}
                description={COURSES.length === 0 ? 'Novas aulas da BTA Academy chegam em breve.' : 'Escolha outra categoria para ver mais aulas.'}
                cta={cat === 'Todos' ? undefined : { label: 'Ver todos', onClick: () => setCat('Todos') }}
              />
            )}
            {filtered.map(c => (
              <button key={c.id} onClick={() => onLesson(c.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-4 text-left transition-transform active:scale-[0.98]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-bta-bg text-bta-muted text-[10px] font-semibold px-2 py-0.5 rounded-full">{c.category}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.level === 'Iniciante' ? 'bg-bta-success/10 text-bta-success' : c.level === 'Intermediário' ? 'bg-bta-amber/10 text-bta-amber' : 'bg-bta-error/10 text-bta-error'}`}>{c.level}</span>
                    </div>
                    <p className="font-display font-semibold text-bta-text text-sm leading-tight">{c.title}</p>
                    <div className="flex items-center gap-3 mt-1"><span className="text-bta-muted text-[10px]">{c.duration}</span><span className="text-bta-amber text-[10px] font-bold">+{c.xp} XP</span></div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.progress === 100 ? 'bg-bta-success text-white' : 'bg-bta-bg text-bta-muted'}`}>
                    {c.progress === 100 ? <Ic.Check /> : <Ic.ChevronRight />}
                  </div>
                </div>
                {c.progress > 0 && c.progress < 100 && <div className="mt-3"><div className="h-1 bg-bta-bg rounded-full overflow-hidden"><div className="h-full bg-bta-primary rounded-full" style={{ width: `${c.progress}%` }} /></div><p className="text-bta-muted text-[10px] mt-0.5">{c.progress}% concluído</p></div>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="academy" onTab={onTab} />
    </div>
  )
}
