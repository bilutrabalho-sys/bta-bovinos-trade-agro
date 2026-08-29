import { useState, type ReactNode } from 'react'
import { sounds } from '@/utils/sound'
import { Ic } from '@/components'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const VET_CATS = [
  { id: 'todos', label: 'Todos', Icon: null as null | (() => ReactNode) },
  { id: 'vacinacao', label: 'Vacinação', Icon: Ic.Syringe },
  { id: 'reproducao', label: 'Reprodução', Icon: Ic.Cow },
  { id: 'manejo', label: 'Manejo', Icon: Ic.Wrench },
  { id: 'nutricao', label: 'Nutrição', Icon: Ic.Grain },
  { id: 'cirurgia', label: 'Cirurgia', Icon: Ic.Scissors },
] as const

const VET_VIDEOS = [
  {
    id: 'v1', titulo: 'Vacinação contra Febre Aftosa — passo a passo completo',
    vet: 'Dr. Fernando Melo', vetCredencial: 'CRMV-SP 12458', categoria: 'vacinacao',
    views: 48200, duracao: '14:32',
    thumb: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=280&fit=crop&auto=format',
    desc: 'Tutorial completo de como realizar a vacinação corretamente, evitando desperdício e garantindo imunidade.',
    destaque: true, likes: 3840, saves: 1200,
  },
  {
    id: 'v2', titulo: 'Diagnóstico de gestação por ultrassom em bovinos',
    vet: 'Dra. Ana Cristina', vetCredencial: 'CRMV-MG 8834', categoria: 'reproducao',
    views: 31500, duracao: '22:15',
    thumb: 'https://images.unsplash.com/photo-1559523161-0fc0d8b814b6?w=400&h=280&fit=crop&auto=format',
    desc: 'Como identificar fêmeas prenhas com precisão. Técnicas de ultrassonografia para bovinos.',
    destaque: false, likes: 2100, saves: 890,
  },
  {
    id: 'v3', titulo: 'Manejo correto no tronco de contenção — sem estresse animal',
    vet: 'Dr. Roberto Nunes', vetCredencial: 'CRMV-MT 5521', categoria: 'manejo',
    views: 19700, duracao: '08:44',
    thumb: 'https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=400&h=280&fit=crop&auto=format',
    desc: 'Técnicas de bem-estar animal no manejo. Reduz estresse e aumenta produtividade.',
    destaque: false, likes: 1580, saves: 620,
  },
  {
    id: 'v4', titulo: 'Suplementação mineral para bovinos em pasto — quando e como',
    vet: 'Dr. Sandro Lima', vetCredencial: 'CRMV-GO 9942', categoria: 'nutricao',
    views: 28900, duracao: '18:08',
    thumb: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=280&fit=crop&auto=format',
    desc: 'Qual sal mineral escolher, dosagem correta e como monitorar o consumo do rebanho.',
    destaque: true, likes: 2340, saves: 950,
  },
  {
    id: 'v5', titulo: 'Aplicação de ivermectina — via ideal e dosagem correta',
    vet: 'Dra. Paula Costa', vetCredencial: 'CRMV-PR 7710', categoria: 'vacinacao',
    views: 41300, duracao: '11:20',
    thumb: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=400&h=280&fit=crop&auto=format',
    desc: 'Subcutânea ou pour-on? Quando usar cada via e como calcular a dose pelo peso do animal.',
    destaque: false, likes: 3120, saves: 1450,
  },
]

type Video = typeof VET_VIDEOS[number]

// ─── Player (extraído: hooks no topo, sem violar as regras de hooks) ────────────
function VideoDetail({ v, onBack, onFindVet }: { v: Video; onBack: () => void; onFindVet?: () => void }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-video bg-bta-primary flex items-center justify-center">
          <img src={v.thumb} alt={v.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white [&>svg]:w-8 [&>svg]:h-8 ml-1"><Ic.Play /></div>
          </div>
          <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white"><Ic.Back /></button>
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded [&>svg]:w-3 [&>svg]:h-3"><Ic.Clock /> {v.duracao}</div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <h1 className="font-display font-bold text-bta-text text-base leading-tight">{v.titulo}</h1>
            <div className="flex items-center gap-4 mt-2 text-bta-muted text-xs">
              <span className="inline-flex items-center gap-1"><Ic.Eye /> {v.views.toLocaleString('pt-BR')} views</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 [&>svg]:w-3.5 [&>svg]:h-3.5"><Ic.Heart /> {v.likes.toLocaleString('pt-BR')}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 [&>svg]:w-3.5 [&>svg]:h-3.5"><Ic.Bookmark /> {v.saves.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-bta-surface rounded-2xl border border-bta-border p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-bta-primary/10 flex items-center justify-center text-bta-primary flex-shrink-0"><Ic.Stethoscope /></div>
            <div className="flex-1">
              <p className="font-display font-bold text-bta-text text-sm">{v.vet}</p>
              <p className="text-bta-muted text-[10px]">{v.vetCredencial}</p>
            </div>
            <button className="text-[10px] font-display font-bold border border-bta-primary text-bta-primary px-3 py-1.5 rounded-full">Seguir</button>
          </div>

          <div className="bg-bta-bg rounded-2xl p-4 border border-bta-border">
            <p className="text-bta-muted text-sm leading-relaxed">{v.desc}</p>
          </div>

          {onFindVet && (
            <button onClick={onFindVet} className="w-full text-left rounded-2xl p-3 flex items-center gap-3" style={{ background: '#F5F3FF', border: '1px solid #6A1B9A22' }}>
              <span style={{ color: '#6A1B9A' }}><Ic.Stethoscope /></span>
              <div className="flex-1">
                <p className="text-xs font-display font-bold" style={{ color: '#6A1B9A' }}>Prefere que um profissional faça?</p>
                <p className="text-[10px] text-bta-muted">Agende um veterinário próximo para este procedimento</p>
              </div>
              <span className="text-[10px] font-bold" style={{ color: '#6A1B9A' }}>Ver →</span>
            </button>
          )}

          <div className="flex gap-3">
            <button onClick={() => { sounds.tap(); setLiked(l => !l) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-display font-semibold text-sm ${liked ? 'border-bta-error text-bta-error' : 'border-bta-border text-bta-text'}`}>
              <Ic.Heart filled={liked} /> Curtir
            </button>
            <button onClick={() => { sounds.tap(); setSaved(s => !s) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-display font-semibold text-sm ${saved ? 'border-bta-primary text-bta-primary' : 'border-bta-border text-bta-text'}`}>
              <Ic.Bookmark filled={saved} /> Salvar
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-bta-border text-bta-text font-display font-semibold text-sm">
              <Ic.Share /> Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feed ────────────────────────────────────────────────────────────────────────
export function VetVideoFeedScreen({ onBack, onFindVet }: { onBack: () => void; onFindVet?: () => void }) {
  const [cat, setCat] = useState('todos')
  const [videoSel, setVideoSel] = useState<string | null>(null)

  if (videoSel) {
    const v = VET_VIDEOS.find(x => x.id === videoSel) ?? VET_VIDEOS[0]
    return <VideoDetail v={v} onBack={() => setVideoSel(null)} onFindVet={onFindVet} />
  }

  const filtered = VET_VIDEOS.filter(v => cat === 'todos' || v.categoria === cat)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #2D1B69 100%)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Academy</button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white [&>svg]:w-6 [&>svg]:h-6"><Ic.Video /></span>
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">Vídeos dos Veterinários</p>
            <p className="text-purple-300 text-[10px]">Conteúdo técnico exclusivo · CRMV verificado</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-5 px-5">
          {VET_CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`inline-flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-display font-bold border [&>svg]:w-3.5 [&>svg]:h-3.5 ${cat === c.id ? 'bg-white text-purple-900 border-white' : 'border-white/30 text-white/70'}`}>
              {c.Icon && <c.Icon />} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
        {filtered.map(v => (
          <button key={v.id} onClick={() => { sounds.tap(); setVideoSel(v.id) }} className="w-full bg-bta-surface rounded-2xl border border-bta-border overflow-hidden text-left active:scale-[0.99] transition-transform">
            <div className="relative h-44 bg-bta-primary-10">
              <img src={v.thumb} alt={v.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {v.destaque && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-bta-amber text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full [&>svg]:w-3 [&>svg]:h-3">
                  <Ic.Star filled /> DESTAQUE
                </div>
              )}
              <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded [&>svg]:w-3 [&>svg]:h-3"><Ic.Clock /> {v.duracao}</div>
              <div className="absolute bottom-2 left-2">
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white [&>svg]:w-3.5 [&>svg]:h-3.5 ml-0.5"><Ic.Play /></div>
              </div>
            </div>
            <div className="p-3">
              <p className="font-display font-bold text-bta-text text-sm leading-tight mb-1">{v.titulo}</p>
              <div className="flex items-center justify-between">
                <p className="text-bta-muted text-[10px]">{v.vet} · {v.vetCredencial}</p>
                <div className="flex items-center gap-2 text-[10px] text-bta-muted">
                  <span className="inline-flex items-center gap-0.5"><Ic.Eye /> {(v.views / 1000).toFixed(1)}k</span>
                  <span className="inline-flex items-center gap-0.5 [&>svg]:w-3 [&>svg]:h-3"><Ic.Heart /> {(v.likes / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
