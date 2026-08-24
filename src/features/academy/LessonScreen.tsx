import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Header, Ic } from '@/components'

export function LessonScreen({ courseId, onBack, onNavigate }: { courseId: number; onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { LESSONS } = useData()
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saved, setSaved] = useState(false)
  const LESSON = LESSONS.find(l => l.id === courseId) ?? LESSONS[0]
  const correct = LESSON.quiz.filter((q, i) => quizAnswers[i] === q.answer).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={LESSON.category} onBack={onBack} rightAction={
        <div className="flex items-center gap-3">
          <span className="text-bta-muted text-xs">{LESSON.duration}</span>
          <button onClick={() => setSaved(s => !s)} className={`flex items-center gap-1 text-xs font-display font-semibold ${saved ? 'text-bta-amber' : 'text-bta-muted'}`}>
            <Ic.Star filled={saved} /> {saved ? 'Salvo' : 'Salvar'}
          </button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Video placeholder */}
        <div className="rounded-2xl overflow-hidden bg-bta-primary aspect-video flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-bta-secondary to-bta-primary opacity-90" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <span className="text-white ml-1"><Ic.Play /></span>
            </div>
            <p className="text-white/80 text-sm font-display font-semibold">{LESSON.title}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bta-success/10 text-bta-success`}>{LESSON.level}</span>
            <span className="text-bta-amber text-[10px] font-bold">+{LESSON.xp} XP</span>
          </div>
          <h1 className="font-display font-black text-bta-text text-xl mb-4" style={{ letterSpacing: '-0.02em' }}>{LESSON.title}</h1>
        </div>

        {/* Content sections */}
        {LESSON.sections.map((s, i) => (
          <div key={i} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <h3 className="font-display font-bold text-bta-text text-base mb-2">{s.heading}</h3>
            <p className="text-bta-muted text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}

        {/* Key concepts */}
        <div className="bg-bta-primary rounded-2xl p-4">
          <p className="font-display font-bold text-white text-sm mb-3">Conceitos-chave</p>
          <div className="space-y-2">
            {LESSON.keyConcepts.map((k, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-bta-amber rounded-full flex-shrink-0" />
                <span className="text-white/80 text-sm">{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz */}
        <div>
          <h2 className="font-display font-bold text-bta-text text-base mb-4">Quiz rápido</h2>
          <div className="space-y-5">
            {LESSON.quiz.map((q, qi) => (
              <div key={qi} className="bg-bta-surface rounded-2xl border border-bta-border p-4">
                <p className="font-display font-semibold text-bta-text text-sm mb-3">{qi + 1}. {q.q}</p>
                <div className="space-y-2">
                  {q.opts.map((opt, oi) => {
                    const selected = quizAnswers[qi] === oi
                    const isCorrect = oi === q.answer
                    const showResult = quizSubmitted
                    return (
                      <button
                        key={oi}
                        onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-display font-semibold transition-colors ${
                          showResult
                            ? isCorrect ? 'border-bta-success bg-bta-success/10 text-bta-success' : selected ? 'border-bta-error bg-bta-error/10 text-bta-error' : 'border-bta-border text-bta-muted'
                            : selected ? 'border-bta-primary bg-bta-primary/10 text-bta-primary' : 'border-bta-border text-bta-text'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!quizSubmitted ? (
          <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < LESSON.quiz.length} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl disabled:opacity-40">
            Verificar respostas
          </button>
        ) : !completed ? (
          <div className="space-y-3">
            <div className={`rounded-2xl p-4 text-center ${correct === LESSON.quiz.length ? 'bg-bta-success/10 border border-bta-success' : 'bg-bta-amber/10 border border-bta-amber'}`}>
              <p className="font-display font-bold text-bta-text text-base">{correct === LESSON.quiz.length ? 'Perfeito!' : `${correct}/${LESSON.quiz.length} corretas`}</p>
              <p className="text-bta-muted text-sm mt-1">{correct === LESSON.quiz.length ? `+${LESSON.xp} XP conquistados!` : 'Revise o conteúdo e tente novamente.'}</p>
            </div>
            <button onClick={() => setCompleted(true)} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl">
              Concluir aula
            </button>
            <button onClick={() => onNavigate('ai')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl flex items-center justify-center gap-1.5">
              <Ic.Sparkles /> Perguntar à BTA IA
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 bg-bta-success/10 rounded-full flex items-center justify-center text-bta-success scale-[1.4]"><Ic.Trophy /></div>
            <p className="font-display font-black text-bta-text text-xl">Aula concluída!</p>
            <p className="text-bta-muted text-sm">+{LESSON.xp} XP adicionados ao seu perfil.</p>
            <button onClick={() => onNavigate('academy')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl mt-2">
              Ver mais aulas →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
