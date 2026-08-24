import { useState } from 'react'
import { TRANSPORTERS, LOTS } from '@/data/mock'
import { Header, SectionTitle, VerifiedBadge, Ic, Btn } from '@/components'

export function BTALogScreen({ lotId, onBack }: { lotId: number; onBack: () => void }) {
  const lot = LOTS.find(l => l.id === lotId)!
  const [selected, setSelected] = useState<number | null>(null)
  const [requested, setRequested] = useState(false)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="BTA Log" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <h1 className="font-display font-black text-bta-text text-xl mb-1" style={{ letterSpacing: '-0.02em' }}>Logística</h1>
          <p className="text-bta-muted text-sm">Organize o transporte após o negócio fechado.</p>
        </div>

        {/* Route */}
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="font-display font-bold text-bta-text text-sm mb-3">Rota</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-bta-muted text-[10px]">Origem</p>
              <p className="font-display font-bold text-bta-text text-sm">{lot.location}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-0.5 bg-bta-primary" />
              <span className="text-bta-muted text-[10px] font-bold">{lot.distance} km</span>
            </div>
            <div className="flex-1 text-center">
              <p className="text-bta-muted text-[10px]">Destino</p>
              <p className="font-display font-bold text-bta-text text-sm">São José do Rio Preto, SP</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-bta-border grid grid-cols-3 gap-3">
            {[{ label: 'Animais', value: `${lot.quantity} cab` }, { label: 'Carga', value: `~${Math.round(lot.quantity * lot.weight / 1000)} t` }, { label: 'Frete est.', value: `R$ ${lot.freight.toLocaleString('pt-BR')}` }].map(i => (
              <div key={i.label} className="text-center"><p className="text-bta-muted text-[10px]">{i.label}</p><p className="font-display font-bold text-bta-text text-xs mt-0.5">{i.value}</p></div>
            ))}
          </div>
        </div>

        {/* Transporters */}
        <div>
          <SectionTitle>Transportadoras disponíveis</SectionTitle>
          <div className="space-y-3">
            {TRANSPORTERS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                disabled={!t.available}
                className={`w-full bg-bta-surface rounded-2xl border p-4 text-left transition-colors ${selected === t.id ? 'border-bta-primary bg-bta-primary/5' : t.available ? 'border-bta-border' : 'border-bta-border opacity-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-bta-text text-sm">{t.name}</p>
                      {t.verified && <VerifiedBadge small />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><Ic.Star filled /><span className="text-bta-text text-xs font-semibold">{t.rating}</span></span>
                      <span className="text-bta-muted text-xs">{t.trips} viagens</span>
                      <span className="text-bta-muted text-xs">{t.capacity} cab/viagem</span>
                    </div>
                    <p className="text-bta-muted text-xs mt-1">{t.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-bta-amber text-base">
                      R$ {Math.round(lot.distance * t.pricePerKm).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-bta-muted text-[10px]">para {lot.distance} km</p>
                    {!t.available && <p className="text-bta-error text-[10px] font-semibold mt-1">Indisponível</p>}
                  </div>
                </div>
                {selected === t.id && <div className="mt-3 pt-3 border-t border-bta-primary/20 flex items-center gap-1 text-bta-primary"><Ic.Check /><span className="text-xs font-display font-semibold">Selecionado</span></div>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border">
        {!requested ? (
          <Btn sound="cta" onClick={() => setRequested(true)} disabled={!selected} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl disabled:opacity-40">
            Solicitar transporte
          </Btn>
        ) : (
          <div className="text-center py-2">
            <p className="font-display font-bold text-bta-success text-base flex items-center justify-center gap-1.5"><Ic.Check /> Transporte solicitado!</p>
            <p className="text-bta-muted text-xs mt-1">A transportadora entrará em contato em breve.</p>
          </div>
        )}
      </div>
    </div>
  )
}
