import { useState } from 'react'
import { sounds } from '@/utils/sound'
import { Ic } from '@/components'

function Btn({ children, className = '', onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`relative overflow-hidden ${className}`} onClick={e => { sounds.tap(); onClick?.(e) }} {...props}>{children}</button>
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const USADOS_CAT = [
  { id: 'manejo', label: 'Manejo', Icon: Ic.Wrench },
  { id: 'veiculos', label: 'Veículos', Icon: Ic.Tractor },
  { id: 'ferramentas', label: 'Ferramentas', Icon: Ic.Gear },
  { id: 'cercas', label: 'Cercas', Icon: Ic.Bolt },
  { id: 'veterinario', label: 'Veterinário', Icon: Ic.Stethoscope },
] as const

const USADOS = [
  {
    id: 'u1', titulo: 'Tronco de Contenção Bovino — metálico', cat: 'manejo',
    preco: 4800, cond: 'bom', cidade: 'Barretos', uf: 'SP', dist: 92,
    foto: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop&auto=format',
    desc: 'Tronco de contenção metálico galvanizado, suporta até 600kg. Usado por 2 anos, em ótimo estado de conservação. Acompanha gancho e peias.',
    views: 148, vendedor: 'Fazenda Santa Helena', rating: 4.9, destaque: true,
  },
  {
    id: 'u2', titulo: 'Pulverizador Costal 20L — Guarany', cat: 'ferramentas',
    preco: 320, cond: 'otimo', cidade: 'Uberaba', uf: 'MG', dist: 210,
    foto: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format',
    desc: 'Pulverizador costal 20 litros, pouco uso. Acessórios completos, mangueira em perfeito estado.',
    views: 63, vendedor: 'Paulo Saraiva', rating: 4.7, destaque: false,
  },
  {
    id: 'u3', titulo: 'Balança Eletrônica Bovina 2000kg', cat: 'manejo',
    preco: 9200, cond: 'bom', cidade: 'Rondonópolis', uf: 'MT', dist: 890,
    foto: 'https://images.unsplash.com/photo-1559523161-0fc0d8b814b6?w=400&h=300&fit=crop&auto=format',
    desc: 'Balança eletrônica com display digital, capacidade 2.000kg. Revisada em 2025. Acompanha brete de contenção.',
    views: 201, vendedor: 'Agrovil Equipamentos', rating: 4.8, destaque: true,
  },
  {
    id: 'u4', titulo: 'Conjunto de Cerca Elétrica — 3km', cat: 'cercas',
    preco: 1850, cond: 'bom', cidade: 'Campo Grande', uf: 'MS', dist: 580,
    foto: 'https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=300&fit=crop&auto=format',
    desc: '3km de fio liso + eletrificador rural 3J. Completo e funcional. Retirada local preferida.',
    views: 37, vendedor: 'Marco Antônio F.', rating: 5.0, destaque: false,
  },
  {
    id: 'u5', titulo: 'Kit Veterinário Completo — seringa dosadora', cat: 'veterinario',
    preco: 680, cond: 'otimo', cidade: 'Ponta Grossa', uf: 'PR', dist: 440,
    foto: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=400&h=300&fit=crop&auto=format',
    desc: 'Kit com seringa dosadora 10ml, aplicador de crotálias, descornador e faca cirúrgica. Tudo esterilizado.',
    views: 85, vendedor: 'Dr. Leandro Vet', rating: 4.9, destaque: false,
  },
]

const condCor: Record<string, string> = { otimo: 'text-bta-success', bom: 'text-bta-amber', regular: 'text-bta-error' }
const condLabel: Record<string, string> = { otimo: 'Ótimo', bom: 'Bom', regular: 'Regular' }

// ─── Feed ──────────────────────────────────────────────────────────────────────
export function UsadosFeedScreen({ onBack, onDetail }: {
  onBack: () => void; onDetail: (id: string) => void
}) {
  const [cat, setCat] = useState('todos')
  const [busca, setBusca] = useState('')
  const filtered = USADOS.filter(u =>
    (cat === 'todos' || u.cat === cat) &&
    (!busca || u.titulo.toLowerCase().includes(busca.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #1A2F20 0%, #123B2A 100%)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Mercado</button>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-black text-bta-amber text-xl" style={{ letterSpacing: '-0.03em' }}>BTA</span>
          <span className="font-display font-bold text-white text-lg">Usados</span>
        </div>
        <p className="text-white/40 text-xs mb-3">Equipamentos e maquinário agro de segunda mão</p>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bta-muted"><Ic.Search /></span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipamento..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/95 text-bta-text outline-none placeholder:text-bta-muted" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          <button onClick={() => setCat('todos')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-display font-bold border ${cat === 'todos' ? 'bg-white text-bta-primary border-white' : 'border-white/30 text-white/70'}`}>Todos</button>
          {USADOS_CAT.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`inline-flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-display font-bold border [&>svg]:w-3.5 [&>svg]:h-3.5 ${cat === c.id ? 'bg-white text-bta-primary border-white' : 'border-white/30 text-white/70'}`}>
              <c.Icon /> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
        <p className="text-xs text-bta-muted">{filtered.length} anúncio(s) encontrado(s)</p>
        {filtered.map(u => (
          <Btn key={u.id} onClick={() => onDetail(u.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border overflow-hidden text-left active:scale-[0.99] transition-transform">
            <div className="h-44 relative bg-bta-primary-10">
              <img src={u.foto} alt={u.titulo} className="w-full h-full object-cover" />
              {u.destaque && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-bta-amber text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full [&>svg]:w-3 [&>svg]:h-3">
                  <Ic.Star filled /> DESTAQUE
                </div>
              )}
              <div className="absolute top-2 right-2 bg-bta-surface/90 backdrop-blur px-2 py-0.5 rounded-full">
                <span className={`text-[10px] font-display font-bold ${condCor[u.cond]}`}>{condLabel[u.cond]}</span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="font-display font-bold text-bta-text text-sm flex-1 leading-tight">{u.titulo}</p>
                <p className="font-display font-black text-bta-amber text-base ml-2 flex-shrink-0">R$ {u.preco.toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3 text-bta-muted text-[10px]">
                <span className="inline-flex items-center gap-0.5"><Ic.Pin /> {u.cidade}/{u.uf}</span>
                <span>·</span>
                <span>{u.dist} km</span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5"><Ic.Eye /> {u.views}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-bta-border">
                <span className="text-bta-amber text-[10px]">★</span>
                <span className="text-bta-text text-[10px] font-semibold">{u.rating}</span>
                <span className="text-bta-muted text-[10px]">{u.vendedor}</span>
              </div>
            </div>
          </Btn>
        ))}
      </div>
    </div>
  )
}

// ─── Detalhe ─────────────────────────────────────────────────────────────────────
export function UsadoDetailScreen({ listingId, onBack }: { listingId: string; onBack: () => void }) {
  const u = USADOS.find(x => x.id === listingId) ?? USADOS[0]
  const [contatado, setContatado] = useState(false)
  const [salvo, setSalvo] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 bg-bta-primary-10">
          <img src={u.foto} alt={u.titulo} className="w-full h-full object-cover" />
          <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-bta-text"><Ic.Back /></button>
          <div className="absolute top-12 right-4 bg-bta-surface/90 backdrop-blur px-2.5 py-1 rounded-full">
            <span className={`text-[10px] font-display font-bold ${condCor[u.cond]}`}>{condLabel[u.cond]}</span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-display font-black text-bta-text text-xl flex-1" style={{ letterSpacing: '-0.02em' }}>{u.titulo}</h1>
              <p className="font-display font-black text-bta-amber text-2xl flex-shrink-0">R$ {u.preco.toLocaleString('pt-BR')}</p>
            </div>
            <div className="flex items-center gap-3 mt-2 text-bta-muted text-xs">
              <span className="inline-flex items-center gap-0.5"><Ic.Pin /> {u.cidade}/{u.uf} · {u.dist} km</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5"><Ic.Eye /> {u.views} visualizações</span>
            </div>
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <p className="font-display font-bold text-bta-text text-sm mb-2">Sobre o item</p>
            <p className="text-bta-muted text-sm leading-relaxed">{u.desc}</p>
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-bta-text text-sm">{u.vendedor}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-bta-amber text-xs">★</span>
                  <span className="text-bta-text text-xs font-semibold">{u.rating}</span>
                  <span className="text-bta-muted text-xs ml-1">Vendedor verificado</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-bta-primary/10 rounded-xl flex items-center justify-center text-bta-primary"><Ic.Home /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border space-y-3">
        <Btn onClick={() => { sounds.success(); setContatado(true) }} className="w-full inline-flex items-center justify-center gap-2 bg-bta-primary text-white font-display font-bold text-base py-4 rounded-2xl">
          {contatado ? <><Ic.Check /> Mensagem enviada</> : <><Ic.Chat /> Entrar em contato</>}
        </Btn>
        <div className="flex gap-3">
          <Btn onClick={() => setSalvo(s => !s)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border font-display font-semibold text-sm ${salvo ? 'border-bta-amber text-bta-amber' : 'border-bta-border text-bta-text'}`}>
            <span className="text-bta-amber"><Ic.Star filled={salvo} /></span> {salvo ? 'Salvo' : 'Salvar'}
          </Btn>
          <Btn onClick={() => {}} className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm">
            <Ic.Share /> Compartilhar
          </Btn>
        </div>
      </div>
    </div>
  )
}
