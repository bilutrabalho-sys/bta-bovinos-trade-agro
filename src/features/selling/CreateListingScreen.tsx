import { useState } from 'react'
import { LOTS } from '@/data/mock'
import { Header, Ic } from '@/components'

export function CreateListingScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0)
  const steps = ['Fotos', 'Vídeo', 'Características', 'Peso', 'Quantidade', 'Localização', 'Preço', 'Condições', 'Revisão', 'Publicar']
  const stepContent = [
    <div key={0} className="space-y-4"><p className="text-bta-muted text-sm">Adicione fotos de alta qualidade do lote (mín. 3).</p><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map(i => <div key={i} className="aspect-square rounded-xl bg-bta-bg border-2 border-dashed border-bta-border flex items-center justify-center text-bta-muted"><Ic.Plus /></div>)}</div></div>,
    <div key={1} className="space-y-3"><p className="text-bta-muted text-sm">Um vídeo curto aumenta em 3× o interesse no lote.</p><div className="h-40 bg-bta-bg border-2 border-dashed border-bta-border rounded-xl flex flex-col items-center justify-center gap-2 text-bta-muted"><Ic.Play /><p className="text-xs">Adicionar vídeo</p></div></div>,
    <div key={2} className="space-y-4">{[{ label: 'Categoria', placeholder: 'Ex: Boi Gordo' }, { label: 'Raça', placeholder: 'Ex: Nelore' }, { label: 'Idade', placeholder: 'Ex: 36 meses' }, { label: 'Sexo', placeholder: 'Macho / Fêmea' }].map(f => <div key={f.label}><label className="text-bta-text text-xs font-display font-semibold block mb-1">{f.label}</label><input type="text" placeholder={f.placeholder} className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none focus:border-bta-primary" /></div>)}</div>,
    <div key={3} className="space-y-4"><div><label className="text-bta-text text-xs font-display font-semibold block mb-1">Peso médio (kg)</label><input type="number" placeholder="Ex: 380" className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none" /></div><div className="bg-bta-bg rounded-xl p-3 border border-bta-border"><p className="text-bta-muted text-xs">Arrobas estimadas por cabeça: <strong className="text-bta-primary">25,3 @</strong></p></div></div>,
    <div key={4} className="space-y-4"><div><label className="text-bta-text text-xs font-display font-semibold block mb-1">Quantidade de cabeças</label><input type="number" placeholder="Ex: 120" className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none" /></div></div>,
    <div key={5} className="space-y-4"><div><label className="text-bta-text text-xs font-display font-semibold block mb-1">Cidade / Estado</label><input type="text" placeholder="Ex: Barretos, SP" className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none" /></div><div className="bg-bta-bg rounded-xl h-36 flex items-center justify-center gap-2 text-bta-muted text-sm border border-bta-border"><Ic.Pin /> Confirmar no mapa</div></div>,
    <div key={6} className="space-y-4">{[{ label: 'Preço por arroba (R$/@)', placeholder: 'Ex: 315' }, { label: 'Forma de pagamento', placeholder: 'À vista / Parcelado' }].map(f => <div key={f.label}><label className="text-bta-text text-xs font-display font-semibold block mb-1">{f.label}</label><input type="text" placeholder={f.placeholder} className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none" /></div>)}<div className="bg-bta-bg rounded-xl p-4 border border-bta-border"><p className="text-bta-muted text-xs mb-1">Valor total estimado</p><p className="font-display font-black text-bta-amber text-2xl">R$ 143.280</p></div></div>,
    <div key={7} className="space-y-4"><div><label className="text-bta-text text-xs font-display font-semibold block mb-1">Condições especiais</label><textarea rows={3} placeholder="Ex: GTA disponível, pesagem na porteira..." className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm outline-none resize-none" /></div></div>,
    <div key={8} className="space-y-4"><div className="bg-bta-surface rounded-2xl border border-bta-border overflow-hidden"><div className="h-32"><img src={LOTS[0].image} alt="" className="w-full h-full object-cover" /></div><div className="p-4 space-y-2">{[['Lote', '120 Nelore Boi Gordo'], ['Peso médio', '380 kg'], ['Preço', 'R$ 315/@'], ['Local', 'Barretos, SP'], ['Valor total', 'R$ 143.280']].map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-bta-muted text-xs">{k}</span><span className="font-display font-semibold text-bta-text text-xs">{v}</span></div>)}</div></div></div>,
    <div key={9} className="flex flex-col items-center gap-4 py-8"><div className="w-20 h-20 bg-bta-success/10 rounded-full flex items-center justify-center text-bta-success scale-[1.8]"><Ic.Check /></div><h2 className="font-display font-black text-bta-text text-xl text-center">Lote publicado!</h2><p className="text-bta-muted text-sm text-center">Visível para compradores em todo o Brasil.</p><div className="bg-bta-bg rounded-xl p-3 w-full border border-bta-border text-center"><p className="text-bta-muted text-xs">BTA Score do anúncio</p><p className="font-display font-black text-bta-primary text-3xl mt-1">87</p></div></div>,
  ]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Novo anúncio" onBack={onBack} rightAction={<button onClick={onBack} className="text-bta-muted text-xs font-display font-semibold">Salvar rascunho</button>} />
      <div className="px-5 py-3 bg-bta-surface border-b border-bta-border">
        <div className="flex gap-0.5">{steps.map((_, i) => <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-bta-primary' : 'bg-bta-border'}`} />)}</div>
        <p className="text-bta-muted text-xs mt-2">Passo {step + 1}/{steps.length}: <span className="font-semibold text-bta-text">{steps[step]}</span></p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">{stepContent[step]}</div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border flex gap-3">
        {step > 0 && step < steps.length - 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 rounded-2xl border border-bta-border text-bta-text font-display font-bold text-sm">Voltar</button>}
        <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onBack()} className="flex-1 bg-bta-primary text-white font-display font-bold text-base py-4 rounded-xl">
          {step === steps.length - 2 ? 'Publicar' : step === steps.length - 1 ? 'Ver meus anúncios' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
