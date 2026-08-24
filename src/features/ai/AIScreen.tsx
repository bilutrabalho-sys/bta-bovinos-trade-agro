import { useState, useRef } from 'react'
import { AI_SUGGESTIONS } from '@/data/mock'
import { BTALogo, Ic } from '@/components'

export function AIScreen({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<{ from: 'user' | 'ai'; text: string }[]>([{ from: 'ai', text: 'Olá! Sou a IA do BTA. Posso ajudar com análises de mercado, cálculos de operação, dúvidas sobre pecuária e avaliação de lotes. Por onde começamos?' }])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const responses: Record<string, string> = {
    default: 'Ótima pergunta. Para responder com precisão, preciso de mais contexto sobre sua operação. Pode me contar mais?',
    '100 mil': 'Com R$ 100 mil, você pode adquirir aproximadamente 40–50 bezerros para recria (R$ 1.800–2.000/cab), com margem estimada de 18–25% em 90 dias. Prefira animais com BTA Score acima de 80 e distância máxima de 150 km para reduzir frete.',
    arroba: 'A arroba (@) equivale a 15 kg. Um boi de 420 kg tem 28 arrobas. Com preço a R$ 315/@, o valor é R$ 8.820. Use o BTA Academy para aprender mais — tem uma aula completa sobre esse tema.',
    margem: 'Margem = (Receita - Custo Total) / Custo Total × 100. Custo total inclui compra, frete e alimentação. Use o Simulador para calcular automaticamente nos 3 cenários.',
    lote: 'Para analisar um lote: verifique o BTA Score (acima de 85 é bom), confirme a fazenda pelo BTA Verified, use o BTA Check antes de negociar e simule sua margem no Simulador.',
    bezerro: 'Para engordar um boi por 90 dias: custo médio de R$ 18–22/cabeça/dia em confinamento. Em 90 dias: R$ 1.620–1.980/cabeça. Use o Simulador com esses números para calcular sua margem.',
  }
  const send = (text: string) => {
    if (!text.trim()) return
    const key = Object.keys(responses).find(k => text.toLowerCase().includes(k)) ?? 'default'
    setMessages(prev => [...prev, { from: 'user', text }, { from: 'ai', text: responses[key] }])
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 bg-bta-primary border-b border-bta-secondary sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/70"><Ic.Back /></button>
          <div>
            <div className="flex items-center gap-2"><BTALogo dark size="sm" /><span className="text-white font-display font-bold text-sm">IA</span></div>
            <div className="flex items-center gap-1 mt-0.5"><div className="w-1.5 h-1.5 bg-bta-amber rounded-full" /><span className="text-white/60 text-[10px]">Online agora</span></div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 1 && <div className="flex flex-wrap gap-2">{AI_SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="bg-bta-surface border border-bta-border rounded-full px-3 py-1.5 text-xs text-bta-text font-display font-medium">{s}</button>)}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'ai' && <div className="w-7 h-7 rounded-full bg-bta-primary flex items-center justify-center text-white text-[10px] font-display font-black mr-2 flex-shrink-0 mt-0.5">IA</div>}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.from === 'user' ? 'bg-bta-primary text-white rounded-br-sm' : 'bg-bta-surface border border-bta-border text-bta-text rounded-bl-sm'}`}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-5 pb-8 pt-3 bg-bta-surface border-t border-bta-border flex gap-3 items-center">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Pergunte sobre pecuária, mercado, operações..." className="flex-1 bg-bta-bg border border-bta-border rounded-xl px-4 py-3 text-sm outline-none focus:border-bta-primary" />
        <button onClick={() => send(input)} className="w-11 h-11 bg-bta-primary rounded-xl flex items-center justify-center text-white flex-shrink-0"><Ic.Sparkles /></button>
      </div>
    </div>
  )
}
