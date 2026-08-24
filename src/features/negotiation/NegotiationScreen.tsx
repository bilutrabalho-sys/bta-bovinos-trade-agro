import { useState, useRef } from 'react'
import { useData } from '@/data/DataProvider'
import type { Screen } from '@/core/navigation'
import { Btn, Ic } from '@/components'

export function NegotiationScreen({ lotId, onBack, onNavigate }: { lotId: number; onBack: () => void; onNavigate: (s: Screen) => void }) {
  const { CHAT_MESSAGES, LOTS, FARMS } = useData()
  const lot = LOTS.find(l => l.id === lotId)!
  const farm = FARMS.find(f => f.id === lot.sellerId)!
  const [msgs, setMsgs] = useState(CHAT_MESSAGES)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'active' | 'accepted' | 'refused'>('active')
  const bottomRef = useRef<HTMLDivElement>(null)
  const send = () => {
    if (!input.trim()) return
    setMsgs(prev => [...prev, { id: prev.length + 1, from: 'buyer', text: input, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }])
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="header-dark px-5 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Btn sound="back" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/70"><Ic.Back /></Btn>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/80"><Ic.Home /></div>
          <div><p className="font-display font-bold text-white text-sm">{farm.name}</p><p className="text-white/50 text-xs">{lot.title} · {lot.location}</p></div>
        </div>
      </div>
      <div className="px-5 py-3 bg-bta-bg border-b border-bta-border">
        <div className="flex items-center justify-between text-xs">
          {[{ label: 'Preço acordado', value: `R$ ${lot.price.toLocaleString('pt-BR')}${lot.priceUnit}` }, { label: 'Cabeças', value: String(lot.quantity) }, { label: 'Total', value: `R$ ${lot.priceTotal.toLocaleString('pt-BR')}` }].map(i => <div key={i.label} className="text-center"><p className="text-bta-muted">{i.label}</p><p className="font-display font-bold text-bta-text mt-0.5">{i.value}</p></div>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.from === 'buyer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] flex flex-col gap-0.5 ${m.from === 'buyer' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2 rounded-2xl text-sm ${m.from === 'buyer' ? 'bg-bta-primary text-white rounded-br-sm' : 'bg-bta-surface border border-bta-border text-bta-text rounded-bl-sm'}`}>{m.text}</div>
              <span className="text-bta-muted text-[10px] px-1">{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {status === 'active' && (
        <div className="px-5 py-3 bg-bta-bg border-t border-bta-border">
          <p className="text-bta-muted text-xs text-center mb-3">Proposta ativa: <strong className="text-bta-text">R$ {lot.price.toLocaleString('pt-BR')}{lot.priceUnit}</strong></p>
          <button onClick={() => onNavigate('bta-check')} className="w-full flex items-center justify-center gap-1.5 text-bta-primary text-[11px] font-display font-bold mb-3">
            <Ic.Search /> Verificar lote com BTA Check antes de aceitar
          </button>
          <div className="flex gap-2">
            <Btn sound="success" onClick={() => { setStatus('accepted'); onNavigate('deal-closed') }} className="flex-1 bg-bta-success text-white font-display font-bold text-xs py-3 rounded-xl">Aceitar</Btn>
            <Btn sound="tap" onClick={() => setInput('Contraproposta: R$ ')} className="flex-1 bg-bta-bg border border-bta-border text-bta-text font-display font-bold text-xs py-3 rounded-xl">Contraproposta</Btn>
            <Btn sound="error" onClick={() => setStatus('refused')} className="flex-1 bg-bta-error/10 text-bta-error font-display font-bold text-xs py-3 rounded-xl">Recusar</Btn>
          </div>
          <button onClick={onBack} className="w-full mt-2 text-bta-muted text-[11px] font-display font-semibold text-center">Encerrar negociação</button>
        </div>
      )}
      {status === 'refused' && <div className="px-5 py-4 bg-bta-error/10 border-t border-bta-error/30 text-center"><p className="font-display font-bold text-bta-error text-sm flex items-center justify-center gap-1.5"><Ic.X /> Proposta recusada</p></div>}
      <div className="px-5 pb-8 pt-3 bg-bta-surface border-t border-bta-border flex gap-3">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Mensagem..." className="flex-1 bg-bta-bg border border-bta-border rounded-xl px-4 py-3 text-sm outline-none" />
        <button onClick={send} className="w-11 h-11 bg-bta-primary rounded-xl flex items-center justify-center text-white flex-shrink-0"><Ic.Chat /></button>
      </div>
    </div>
  )
}
