import { useState } from 'react'
import type { Screen } from '@/core/navigation'
import { Header, Ic } from '@/components'

export function BTAPathScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const questions = [
    { q: 'Quanto pretende investir?', opts: ['Até R$ 50 mil', 'R$ 50k–200k', 'R$ 200k–500k', 'Acima de R$ 500k'] },
    { q: 'Possui terra própria?', opts: ['Sim, tenho pasto', 'Tenho acesso a arrendamento', 'Não possuo terra'] },
    { q: 'Qual seu objetivo?', opts: ['Lucro rápido (recria)', 'Engorda / confinamento', 'Criar matrizes', 'Estou estudando ainda'] },
    { q: 'Quanto conhece de pecuária?', opts: ['Sou iniciante', 'Tenho algum conhecimento', 'Sou experiente', 'Sou profissional'] },
    { q: 'Qual seu prazo?', opts: ['Curto (90 dias)', 'Médio (6–12 meses)', 'Longo (1–3 anos)'] },
  ]
  const [result, setResult] = useState(false)
  const getProfile = () => {
    const inv = answers[0] ?? ''
    const exp = answers[3] ?? ''
    if (exp.includes('iniciante') || exp.includes('Estou')) return { profile: 'Iniciante — Recria', steps: ['1. Aprender no BTA Academy', '2. Simular uma operação de recria', '3. Analisar oportunidades de bezerros', '4. Usar o BTA Check antes de negociar', '5. Fazer sua primeira proposta'] }
    if (inv.includes('50 mil')) return { profile: 'Comprador Inicial — Garrotes', steps: ['1. Buscar garrotes até 200 km', '2. Usar BTA Match para encontrar opções', '3. Simular engorda de 90 dias', '4. Verificar fazendas BTA Verified', '5. Negociar via plataforma'] }
    return { profile: 'Operador Profissional', steps: ['1. Configurar Radar com seus critérios', '2. Usar BTA Match para volume', '3. Acompanhar mercado diariamente', '4. Gerir operações em Negócios', '5. Usar IA para decisões complexas'] }
  }

  if (result) {
    const { profile, steps } = getProfile()
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="BTA Caminho" onBack={onBack} />
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 bg-bta-primary rounded-2xl flex items-center justify-center text-white scale-[1.4]"><Ic.Compass /></div>
            <div>
              <p className="text-bta-muted text-sm">Seu caminho recomendado</p>
              <h1 className="font-display font-black text-bta-text text-2xl mt-1" style={{ letterSpacing: '-0.02em' }}>{profile}</h1>
            </div>
          </div>
          <div className="bg-bta-surface rounded-2xl border border-bta-border p-5">
            <p className="font-display font-bold text-bta-text text-sm mb-4">Próximos passos</p>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-bta-primary/10 text-bta-primary font-display font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-bta-text text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => onNavigate('academy')} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl">Ir para Academy</button>
            <button onClick={() => onNavigate('simulator')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl">Abrir Simulador</button>
            <button onClick={() => onNavigate('ai')} className="w-full border border-bta-border text-bta-text font-display font-semibold text-sm py-3 rounded-2xl flex items-center justify-center gap-1.5"><Ic.Sparkles /> Conversar com BTA IA</button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[step]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="BTA Caminho" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div className="flex gap-1">{questions.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-bta-primary' : 'bg-bta-border'}`} />)}</div>
        <div>
          <p className="text-bta-muted text-sm mb-2">Pergunta {step + 1} de {questions.length}</p>
          <h1 className="font-display font-black text-bta-text text-xl" style={{ letterSpacing: '-0.02em' }}>{q.q}</h1>
        </div>
        <div className="space-y-3">
          {q.opts.map(opt => (
            <button
              key={opt}
              onClick={() => {
                setAnswers(prev => ({ ...prev, [step]: opt }))
                if (step < questions.length - 1) setStep(s => s + 1)
                else setResult(true)
              }}
              className={`w-full text-left px-4 py-4 rounded-2xl border font-display font-semibold text-base transition-colors ${answers[step] === opt ? 'border-bta-primary bg-bta-primary/10 text-bta-primary' : 'border-bta-border bg-bta-surface text-bta-text'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
