import { BTALogo, Btn, Ic } from '@/components'

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const features = [
    { icon: <Ic.Search />, title: 'Encontre', sub: 'Animais e oportunidades em todo o Brasil, com filtros precisos.' },
    { icon: <Ic.Chart />, title: 'Analise', sub: 'Compare preço, distância e riscos antes de decidir.' },
    { icon: <Ic.Book />, title: 'Aprenda', sub: 'Cada dado tem contexto. Aprenda enquanto opera.' },
    { icon: <Ic.Handshake />, title: 'Negocie', sub: 'Transforme oportunidades em negócios dentro da plataforma.' },
  ]
  return (
    <div className="flex-1 flex flex-col bg-bta-bg">
      <div className="header-dark px-6 pt-14 pb-8">
        <BTALogo dark size="md" />
        <h1 className="font-display font-black text-white mt-4 leading-tight" style={{ fontSize: 26, letterSpacing: '-0.03em' }}>
          Tudo que você precisa<br />para negociar gado.
        </h1>
        <p className="text-white/40 text-xs mt-2 font-display">Inteligência. Mercado. Negociação.</p>
      </div>

      <div className="flex-1 px-5 py-6 grid grid-cols-2 gap-3 content-start">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="bg-bta-surface rounded-2xl border border-bta-border p-4 fade-up card-shadow"
            style={{ animationDelay: `${i * 0.09}s` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-bta-primary mb-3" style={{ background: 'linear-gradient(135deg, var(--color-bta-primary-20), var(--color-bta-primary-10))' }}>
              {f.icon}
            </div>
            <p className="font-display font-bold text-bta-text text-sm mb-1">{f.title}</p>
            <p className="text-bta-muted text-xs leading-snug">{f.sub}</p>
          </div>
        ))}
      </div>

      <div className="px-6 pb-12 pt-2">
        <Btn sound="cta" onClick={onDone} className="w-full btn-primary-grad text-white font-display font-bold text-base py-4 rounded-xl">
          Começar agora
        </Btn>
      </div>
    </div>
  )
}
