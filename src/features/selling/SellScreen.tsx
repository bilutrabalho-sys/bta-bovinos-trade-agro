import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useAuthGate } from '@/auth/AuthGate'
import type { Screen } from '@/core/navigation'
import { Header, Ic, LotImage, EmptyState } from '@/components'

export function SellScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: Screen, lotId?: number) => void }) {
  const { LOTS } = useData()
  const { requireAuth } = useAuthGate()
  const createListing = () => requireAuth(() => onNavigate('create-listing'), 'Entre para anunciar seu gado')
  const [tab, setTab] = useState('Ativos')
  const myLots = LOTS.slice(0, 3).map((l, i) => ({ ...l, proposals: [2, 1, 0][i], views: [148, 63, 12][i], favorites: [24, 8, 2][i], status: ['Ativo', 'Ativo', 'Publicado'][i] }))
  const tabLots = myLots.filter(l => tab === 'Ativos' ? true : tab === 'Propostas' ? l.proposals > 0 : false)
  const emptyByTab: Record<string, string> = {
    Ativos: 'Nenhum anúncio ativo no momento.',
    Propostas: 'Nenhuma proposta por enquanto.',
    Vendidos: 'Nenhuma venda concluída ainda.',
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Vender" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Venda seu gado</h1>
          <p className="text-bta-muted text-sm">Gerencie seus anúncios e propostas.</p>
        </div>
        <button onClick={createListing} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2">
          <Ic.Plus /> Cadastrar lote
        </button>
        {myLots.length === 0 ? (
          <EmptyState
            icon={<Ic.Clipboard />}
            title="Você ainda não anunciou"
            description="Cadastre seu primeiro lote e comece a receber propostas de compradores."
            cta={{ label: 'Cadastrar meu primeiro lote', onClick: createListing }}
          />
        ) : (
        <>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Anúncios ativos', value: '2' }, { label: 'Propostas', value: '3' }, { label: 'Visualizações', value: '211' }].map(s => (
            <div key={s.label} className="bg-bta-surface rounded-xl border border-bta-border p-3 text-center">
              <p className="font-display font-black text-bta-primary text-xl">{s.value}</p>
              <p className="text-bta-muted text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate('seller-analytics')} className="w-full flex items-center gap-3 bg-bta-bg border border-bta-border rounded-xl px-4 py-3 text-left">
          <span className="text-bta-primary"><Ic.Chart /></span>
          <div className="flex-1"><p className="font-display font-semibold text-bta-text text-sm">Analytics do vendedor</p><p className="text-bta-muted text-xs">Ver desempenho detalhado</p></div>
          <Ic.ChevronRight />
        </button>
        <div className="flex gap-1 bg-bta-bg rounded-xl p-1">
          {['Ativos', 'Propostas', 'Vendidos'].map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-colors ${tab === t ? 'bg-bta-surface text-bta-primary card-shadow' : 'text-bta-muted'}`}>{t}</button>)}
        </div>
        <div className="space-y-3">
          {tabLots.length === 0 ? (
            <EmptyState compact icon={<Ic.Clipboard />} title={emptyByTab[tab]} />
          ) : tabLots.map(lot => (
            <div key={lot.id} className="bg-bta-surface rounded-2xl border border-bta-border overflow-hidden">
              <div className="h-24 relative">
                <LotImage src={lot.image} alt={lot.title} size="md" />
                {lot.proposals > 0 && <div className="absolute top-2 right-2 bg-bta-amber text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{lot.proposals} proposta{lot.proposals > 1 ? 's' : ''}</div>}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-bta-text text-sm">{lot.title}</span>
                  <span className="font-display font-bold text-bta-amber text-sm">R$ {lot.price.toLocaleString('pt-BR')}{lot.priceUnit}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Eye /> {lot.views}</span>
                  <span className="flex items-center gap-1 text-bta-muted text-xs"><Ic.Heart /> {lot.favorites}</span>
                  <span className="text-bta-muted text-xs">{lot.breed} · {lot.quantity} cab</span>
                </div>
                {lot.proposals > 0 && <button onClick={() => onNavigate('negotiation', lot.id)} className="mt-2 text-bta-primary text-xs font-display font-bold">Ver proposta{lot.proposals > 1 ? 's' : ''} →</button>}
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
