import { useState, type ReactNode } from 'react'
import { sounds } from '@/utils/sound'
import { Ic } from '@/components'

// ─── Botão com ripple + som ────────────────────────────────────────────────────
function Btn({ children, className = '', onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`relative overflow-hidden ${className}`} onClick={e => { sounds.tap(); onClick?.(e) }} {...props}>{children}</button>
}

// Acento de serviço veterinário — o roxo "medicamentos" usado em toda a fusão.
const VET = '#6A1B9A'
const VET_SOFT = '#F5F3FF'

// Mapas de ícone (dados guardam uma chave; renderizamos o SVG do set Ic).
const CERT_ICON: Record<string, () => ReactNode> = {
  grad: () => <Ic.GraduationCap />, trophy: () => <Ic.Trophy />, cert: () => <Ic.FileText />,
  check: () => <Ic.Check />, hospital: () => <Ic.Hospital />, lab: () => <Ic.Microscope />, chart: () => <Ic.Chart />,
}
const SERV_ICON: Record<string, () => ReactNode> = {
  vacina: () => <Ic.Syringe />, cirurgia: () => <Ic.Scissors />, iatf: () => <Ic.Cow />,
  ultrassom: () => <Ic.Chart />, emergencia: () => <Ic.Bolt />, consulta: () => <Ic.Stethoscope />,
  exames: () => <Ic.Flask />, raiox: () => <Ic.Camera />, manejo: () => <Ic.Wrench />,
}
const CertIcon = ({ k }: { k: string }) => <span className="inline-flex [&>svg]:w-5 [&>svg]:h-5">{(CERT_ICON[k] ?? CERT_ICON.cert)()}</span>
const ServIcon = ({ k }: { k: string }) => <span className="inline-flex [&>svg]:w-5 [&>svg]:h-5">{(SERV_ICON[k] ?? SERV_ICON.consulta)()}</span>

// ─── Mock Data ──────────────────────────────────────────────────────────────────
type Vet = {
  id: string; nome: string; tipo: 'vet' | 'clinica' | 'tecnico'; tipoLabel: string
  verificado: boolean; especialidades: string[]; cidade: string; uf: string; dist: number
  rating: number; avaliacoes: number; anos: number; formacao: string
  foto: string; capa: string
  precoLabel: string; disp: 'hoje' | 'amanha' | 'lotado'; resposta: string
  sobre: string
  certificacoes: { titulo: string; inst: string; ano: string; icon: string }[]
  servicos: { nome: string; preco: string; dur: string; icon: string }[]
  agenda: { dia: string; status: 'on' | 'partial' | 'off'; horario: string }[]
  reviews: { nome: string; data: string; nota: number; texto: string; servico: string }[]
}

export const VETS: Vet[] = [
  {
    id: 'vt1', nome: 'Dr. Carlos Mendes', tipo: 'vet', tipoLabel: 'Verificado', verificado: true,
    especialidades: ['Vacinação', 'Cirurgia', 'Medicina Bovina'], cidade: 'Rondonópolis', uf: 'MT', dist: 12,
    rating: 4.9, avaliacoes: 127, anos: 15, formacao: 'UFMT — Medicina Veterinária (2011)',
    foto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format',
    capa: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&h=300&fit=crop&auto=format',
    precoLabel: 'Consulta R$ 250', disp: 'hoje', resposta: 'Responde em ~15min',
    sobre: 'Médico veterinário com 15 anos de experiência em pecuária de corte e leite. Especialista em vacinação em grande escala, cirurgia de rúmen e reprodução animal. Atendo Rondonópolis e região num raio de 100km, com equipamento próprio para manejo no curral do cliente.',
    certificacoes: [
      { titulo: 'Medicina Veterinária', inst: 'UFMT — Univ. Federal de Mato Grosso', ano: '2011', icon: 'grad' },
      { titulo: 'Especialização em Medicina Bovina', inst: 'USP — Univ. de São Paulo', ano: '2014', icon: 'trophy' },
      { titulo: 'Cirurgia de Rúmen', inst: 'ABMV', ano: 'válido até 2028', icon: 'cert' },
      { titulo: 'MAPA — Inseminador Credenciado', inst: 'Reg. 12345/2015', ano: 'ativo', icon: 'check' },
    ],
    servicos: [
      { nome: 'Vacinação em grande escala', preco: 'R$ 8,00/cabeça', dur: '4–6h', icon: 'vacina' },
      { nome: 'Cirurgia de rúmen', preco: 'R$ 800,00', dur: '2–3h', icon: 'cirurgia' },
      { nome: 'Inseminação Artificial (IATF)', preco: 'R$ 45,00/cabeça', dur: '3–4h', icon: 'iatf' },
      { nome: 'Ultrassom gestacional', preco: 'R$ 150,00', dur: '1h', icon: 'ultrassom' },
      { nome: 'Emergência 24h', preco: 'R$ 500,00 + deslocamento', dur: 'imediato', icon: 'emergencia' },
    ],
    agenda: [
      { dia: 'Seg', status: 'on', horario: '08–18h' }, { dia: 'Ter', status: 'on', horario: '08–18h' },
      { dia: 'Qua', status: 'partial', horario: '14–18h' }, { dia: 'Qui', status: 'on', horario: '08–18h' },
      { dia: 'Sex', status: 'on', horario: '08–18h' }, { dia: 'Sáb', status: 'off', horario: '—' },
      { dia: 'Dom', status: 'partial', horario: 'Emerg.' },
    ],
    reviews: [
      { nome: 'João Silva — Faz. Boa Vista', data: '15/08/2026', nota: 5, texto: 'Dr. Carlos salvou meu rebanho! Vacinação rápida e profissional, voltou no dia seguinte para verificar os animais. Recomendo!', servico: 'Vacinação de 500 cabeças' },
      { nome: 'Maria Souza — Sítio Esperança', data: '10/08/2026', nota: 5, texto: 'Fez a IATF no meu rebanho com excelente resultado. 85% de prenhez! Vale cada centavo.', servico: 'Inseminação Artificial' },
      { nome: 'Carlos R. — Rancho do Gado', data: '05/08/2026', nota: 4, texto: 'Bom profissional, serviço bem feito, mas chegou 1h atrasado. Pontualidade pode melhorar.', servico: 'Cirurgia de rúmen' },
    ],
  },
  {
    id: 'vt2', nome: 'VetAgro Clínica — Dr. João Silva', tipo: 'clinica', tipoLabel: 'Clínica Veterinária', verificado: true,
    especialidades: ['Vacinação', 'Emergência 24h', 'Exames'], cidade: 'Rondonópolis', uf: 'MT', dist: 8,
    rating: 4.7, avaliacoes: 89, anos: 12, formacao: 'Clínica com estrutura completa de manejo',
    foto: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&h=200&fit=crop&auto=format',
    capa: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=600&h=300&fit=crop&auto=format',
    precoLabel: 'Consulta R$ 180', disp: 'hoje', resposta: 'Aberto agora (24h)',
    sobre: 'Clínica veterinária com curral para manejo, raio-X e laboratório de exames próprio. Atendimento de emergência 24 horas e equipe multidisciplinar para grandes rebanhos.',
    certificacoes: [
      { titulo: 'Registro de Clínica Veterinária', inst: 'CRMV-MT', ano: 'ativo', icon: 'hospital' },
      { titulo: 'Laboratório credenciado', inst: 'MAPA', ano: '2023', icon: 'lab' },
    ],
    servicos: [
      { nome: 'Consulta clínica', preco: 'R$ 180,00', dur: '1h', icon: 'consulta' },
      { nome: 'Emergência 24h', preco: 'R$ 450,00', dur: 'imediato', icon: 'emergencia' },
      { nome: 'Exames laboratoriais', preco: 'a partir de R$ 90,00', dur: '24–48h', icon: 'exames' },
      { nome: 'Raio-X', preco: 'R$ 220,00', dur: '30min', icon: 'raiox' },
    ],
    agenda: [
      { dia: 'Seg', status: 'on', horario: '24h' }, { dia: 'Ter', status: 'on', horario: '24h' },
      { dia: 'Qua', status: 'on', horario: '24h' }, { dia: 'Qui', status: 'on', horario: '24h' },
      { dia: 'Sex', status: 'on', horario: '24h' }, { dia: 'Sáb', status: 'on', horario: '24h' },
      { dia: 'Dom', status: 'on', horario: '24h' },
    ],
    reviews: [
      { nome: 'Pedro L. — Faz. Três Rios', data: '18/08/2026', nota: 5, texto: 'Atenderam meu boi de madrugada numa emergência. Estrutura excelente, salvaram o animal.', servico: 'Emergência 24h' },
      { nome: 'Ana P. — Sítio Bela Vista', data: '12/08/2026', nota: 4, texto: 'Exames rápidos e precisos. Recomendo para quem precisa de laboratório.', servico: 'Exames laboratoriais' },
    ],
  },
  {
    id: 'vt3', nome: 'Téc. Maria Souza', tipo: 'tecnico', tipoLabel: 'Técnica em Pecuária', verificado: true,
    especialidades: ['Vacinação', 'Inseminação', 'Manejo'], cidade: 'Campo Verde', uf: 'MT', dist: 35,
    rating: 4.6, avaliacoes: 54, anos: 8, formacao: 'Senar — Técnico em Pecuária (2018)',
    foto: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format',
    capa: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=300&fit=crop&auto=format',
    precoLabel: 'Vacinação R$ 8/cab', disp: 'amanha', resposta: 'Responde em ~1h',
    sobre: 'Técnica em pecuária especializada em vacinação, inseminação e manejo de curral. Atendimento ágil e preço acessível para pequenos e médios produtores da região de Campo Verde.',
    certificacoes: [
      { titulo: 'Técnico em Pecuária', inst: 'Senar', ano: '2018', icon: 'grad' },
      { titulo: 'Curso de Inseminação Artificial', inst: 'Embrapa', ano: '2020', icon: 'cert' },
    ],
    servicos: [
      { nome: 'Vacinação', preco: 'R$ 8,00/cabeça', dur: '4h', icon: 'vacina' },
      { nome: 'Inseminação Artificial', preco: 'R$ 40,00/cabeça', dur: '3h', icon: 'iatf' },
      { nome: 'Apoio de manejo', preco: 'R$ 200,00/dia', dur: 'dia', icon: 'manejo' },
    ],
    agenda: [
      { dia: 'Seg', status: 'on', horario: '07–17h' }, { dia: 'Ter', status: 'on', horario: '07–17h' },
      { dia: 'Qua', status: 'on', horario: '07–17h' }, { dia: 'Qui', status: 'partial', horario: '13–17h' },
      { dia: 'Sex', status: 'on', horario: '07–17h' }, { dia: 'Sáb', status: 'partial', horario: 'manhã' },
      { dia: 'Dom', status: 'off', horario: '—' },
    ],
    reviews: [
      { nome: 'Roberto F. — Faz. Nova Era', data: '14/08/2026', nota: 5, texto: 'Preço justo e trabalho caprichado. Vacinou 200 cabeças sem estresse pro gado.', servico: 'Vacinação' },
    ],
  },
  {
    id: 'vt4', nome: 'Dra. Ana Paula Costa', tipo: 'vet', tipoLabel: 'Verificada', verificado: true,
    especialidades: ['Reprodução', 'Ultrassom', 'IATF'], cidade: 'Rondonópolis', uf: 'MT', dist: 18,
    rating: 5.0, avaliacoes: 43, anos: 10, formacao: 'USP — Medicina Veterinária (2015)',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format',
    capa: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=600&h=300&fit=crop&auto=format',
    precoLabel: 'Consulta R$ 300', disp: 'lotado', resposta: 'Próxima agenda em 5 dias',
    sobre: 'Especialista em reprodução animal e ultrassonografia bovina. Credenciada pelo MAPA como inseminadora, com foco em protocolos IATF de alta taxa de prenhez.',
    certificacoes: [
      { titulo: 'Medicina Veterinária', inst: 'USP', ano: '2015', icon: 'grad' },
      { titulo: 'Especialista em Reprodução Animal', inst: 'Unesp', ano: '2018', icon: 'trophy' },
      { titulo: 'Ultrassom Bovino', inst: 'Certificado técnico', ano: '2019', icon: 'chart' },
      { titulo: 'MAPA — Inseminadora Credenciada', inst: 'Reg. 55821/2016', ano: 'ativo', icon: 'check' },
    ],
    servicos: [
      { nome: 'Consulta reprodutiva', preco: 'R$ 300,00', dur: '1h', icon: 'consulta' },
      { nome: 'IATF', preco: 'R$ 45,00/cabeça', dur: '3–4h', icon: 'iatf' },
      { nome: 'Ultrassom gestacional', preco: 'R$ 150,00', dur: '1h', icon: 'ultrassom' },
    ],
    agenda: [
      { dia: 'Seg', status: 'off', horario: '—' }, { dia: 'Ter', status: 'off', horario: '—' },
      { dia: 'Qua', status: 'off', horario: '—' }, { dia: 'Qui', status: 'off', horario: '—' },
      { dia: 'Sex', status: 'partial', horario: 'lista de espera' }, { dia: 'Sáb', status: 'off', horario: '—' },
      { dia: 'Dom', status: 'off', horario: '—' },
    ],
    reviews: [
      { nome: 'Lucas M. — Faz. Horizonte', data: '20/08/2026', nota: 5, texto: 'Taxa de prenhez impressionante. Profissional extremamente competente e organizada.', servico: 'IATF — 300 matrizes' },
    ],
  },
]

const dispMap: Record<Vet['disp'], { label: string; dot: string; cls: string }> = {
  hoje: { label: 'Disponível hoje', dot: '#2E7D52', cls: 'text-bta-success' },
  amanha: { label: 'Disponível amanhã', dot: '#D6A84F', cls: 'text-bta-amber' },
  lotado: { label: 'Agenda lotada', dot: '#C94A45', cls: 'text-bta-error' },
}

const FILTROS = ['Todos', 'Vacinação', 'Cirurgia', 'Reprodução', 'Emergência 24h']

// ─── Lista de Veterinários ───────────────────────────────────────────────────────
export function VetConnectScreen({ onBack, onVet, context }: {
  onBack: () => void; onVet: (id: string) => void; context?: string
}) {
  const [filtro, setFiltro] = useState('Todos')
  const [busca, setBusca] = useState('')

  const filtered = VETS.filter(v => {
    const okFiltro = filtro === 'Todos'
      || v.especialidades.some(e => e.toLowerCase().includes(filtro.toLowerCase()))
      || (filtro === 'Emergência 24h' && v.especialidades.some(e => e.includes('Emergência')))
    const okBusca = !busca || v.nome.toLowerCase().includes(busca.toLowerCase())
      || v.especialidades.join(' ').toLowerCase().includes(busca.toLowerCase())
      || v.cidade.toLowerCase().includes(busca.toLowerCase())
    return okFiltro && okBusca
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: `linear-gradient(160deg, #1A0F2E 0%, ${VET} 100%)` }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Voltar</button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white [&>svg]:w-6 [&>svg]:h-6"><Ic.Stethoscope /></span>
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">Veterinários Próximos</p>
            <p className="text-purple-200 text-[10px]">Profissionais qualificados perto de você</p>
          </div>
        </div>
        <div className="relative mt-3 mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bta-muted"><Ic.Search /></span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, especialidade ou cidade..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/95 text-bta-text outline-none placeholder:text-bta-muted" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-display font-bold border ${filtro === f ? 'bg-white border-white' : 'border-white/30 text-white/70'}`}
              style={filtro === f ? { color: VET } : undefined}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
        {context && (
          <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: VET_SOFT, border: `1px solid ${VET}22` }}>
            <span style={{ color: VET }}><Ic.Bulb className="w-4 h-4" /></span>
            <p className="text-[11px] leading-relaxed" style={{ color: VET }}>{context}</p>
          </div>
        )}
        <div className="rounded-2xl overflow-hidden border border-bta-border relative h-24 bg-bta-primary-10">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=200&fit=crop&auto=format" alt="mapa" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 flex items-center justify-between px-4" style={{ background: 'linear-gradient(90deg, rgba(106,27,154,0.85), rgba(106,27,154,0.25))' }}>
            <div>
              <p className="text-white text-xs font-display font-bold">{VETS.length + 8} veterinários</p>
              <p className="text-white/80 text-[10px]">num raio de 50km de você</p>
            </div>
            <span className="text-white text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full">Ver mapa →</span>
          </div>
        </div>

        <p className="text-xs text-bta-muted">{filtered.length} profissional(is) encontrado(s)</p>
        {filtered.map(v => {
          const d = dispMap[v.disp]
          return (
            <Btn key={v.id} onClick={() => onVet(v.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-3 text-left active:scale-[0.99] transition-transform">
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <img src={v.foto} alt={v.nome} className="w-16 h-16 rounded-2xl object-cover" />
                  {v.verificado && <span className="absolute -bottom-1 -right-1 bg-bta-success text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-bta-surface [&>svg]:w-3 [&>svg]:h-3"><Ic.Check /></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold text-bta-text text-sm leading-tight">{v.nome}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5" style={{ background: VET_SOFT, color: VET }}>{v.tipoLabel}</span>
                  <p className="text-[10px] text-bta-muted mt-1 truncate">{v.especialidades.join(' · ')}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-bta-muted">
                    <span className="inline-flex items-center gap-0.5"><Ic.Pin /> {v.cidade}/{v.uf} · {v.dist}km</span>
                    <span>·</span>
                    <span className="text-bta-amber">★ {v.rating} ({v.avaliacoes})</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-bta-border">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: d.dot }} />
                  <span className={d.cls}>{d.label}</span>
                </span>
                <span className="font-display font-bold text-sm" style={{ color: VET }}>{v.precoLabel}</span>
              </div>
            </Btn>
          )
        })}
        <p className="text-center text-[10px] text-bta-muted py-2">É veterinário? <span className="font-bold" style={{ color: VET }}>Cadastre seu perfil →</span></p>
      </div>
    </div>
  )
}

// ─── Perfil do Veterinário ───────────────────────────────────────────────────────
const agendaCor: Record<'on' | 'partial' | 'off', string> = { on: '#2E7D52', partial: '#D6A84F', off: '#C94A45' }

export function VetProfileScreen({ vetId, onBack, onSchedule }: {
  vetId: string; onBack: () => void; onSchedule: (id: string) => void
}) {
  const v = VETS.find(x => x.id === vetId) ?? VETS[0]
  const [fav, setFav] = useState(false)
  const notas = [5, 4, 3, 2, 1].map(n => ({ n, count: v.reviews.filter(r => r.nota === n).length }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-44 bg-bta-primary-10">
          <img src={v.capa} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,15,46,0.3), rgba(26,15,46,0.65))' }} />
          <button onClick={onBack} className="absolute top-12 left-4 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-bta-text"><Ic.Back /></button>
          <button onClick={() => setFav(f => !f)} className="absolute top-12 right-4 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-bta-error"><Ic.Heart filled={fav} /></button>
        </div>

        <div className="px-5 -mt-10 relative">
          <div className="flex items-end gap-3">
            <img src={v.foto} alt={v.nome} className="w-20 h-20 rounded-2xl object-cover border-4 border-bta-bg" />
            <div className="pb-1 flex-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block" style={{ background: VET_SOFT, color: VET }}>{v.tipoLabel}</span>
            </div>
          </div>
          <h1 className="font-display font-black text-bta-text text-xl mt-2" style={{ letterSpacing: '-0.02em' }}>{v.nome}</h1>
          <p className="text-bta-muted text-xs mt-0.5">{v.especialidades.join(' · ')}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 text-bta-muted"><Ic.Pin /> {v.cidade}/{v.uf} · {v.dist}km</span>
            <span className="text-bta-amber font-semibold">★ {v.rating} ({v.avaliacoes})</span>
          </div>
          <p className="inline-flex items-center gap-1 text-[11px] mt-1 font-semibold" style={{ color: VET }}><Ic.Bolt /> {v.resposta}</p>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <h3 className="font-display font-bold text-bta-text text-sm mb-2">Sobre</h3>
            <p className="text-bta-muted text-sm leading-relaxed">{v.sobre}</p>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.GraduationCap className="w-4 h-4" /> Formação & Certificações</h3>
            <div className="space-y-2">
              {v.certificacoes.map(c => (
                <div key={c.titulo} className="bg-bta-surface rounded-xl border border-bta-border p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: VET_SOFT, color: VET }}><CertIcon k={c.icon} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-bold text-bta-text">{c.titulo}</p>
                    <p className="text-[10px] text-bta-muted">{c.inst} · {c.ano}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Wrench /> Serviços</h3>
            <div className="space-y-2">
              {v.servicos.map(s => (
                <div key={s.nome} className="bg-bta-surface rounded-xl border border-bta-border p-3 flex items-center gap-3">
                  <span className="text-bta-primary"><ServIcon k={s.icon} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-bold text-bta-text">{s.nome}</p>
                    <p className="text-[10px] text-bta-muted">Duração: {s.dur}</p>
                  </div>
                  <span className="text-xs font-display font-bold" style={{ color: VET }}>{s.preco}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Calendar className="w-4 h-4" /> Disponibilidade</h3>
            <div className="bg-bta-surface rounded-2xl border border-bta-border p-3 grid grid-cols-7 gap-1 text-center">
              {v.agenda.map(a => (
                <div key={a.dia}>
                  <p className="text-[10px] font-bold text-bta-text">{a.dia}</p>
                  <span className="w-2 h-2 rounded-full inline-block my-1" style={{ background: agendaCor[a.status] }} />
                  <p className="text-[8px] text-bta-muted leading-tight">{a.horario}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><span className="text-bta-amber"><Ic.Star filled /></span> Avaliações ({v.avaliacoes})</h3>
            <div className="bg-bta-surface rounded-2xl border border-bta-border p-3 mb-2">
              {notas.map(({ n, count }) => (
                <div key={n} className="flex items-center gap-2 mb-1 last:mb-0">
                  <span className="text-[10px] text-bta-muted w-6">{n}★</span>
                  <div className="flex-1 h-1.5 bg-bta-bg rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full bg-bta-amber" style={{ width: `${v.reviews.length ? (count / v.reviews.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {v.reviews.map((r, i) => (
                <div key={i} className="bg-bta-surface rounded-xl border border-bta-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-display font-bold text-bta-text">{r.nome}</p>
                    <span className="text-[10px] text-bta-amber">{'★'.repeat(r.nota)}</span>
                  </div>
                  <p className="text-[10px] text-bta-muted">{r.data} · {r.servico}</p>
                  <p className="text-xs text-bta-text mt-1.5 leading-relaxed">{r.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4 bg-bta-surface border-t border-bta-border flex gap-2">
        <Btn onClick={() => {}} className="w-12 h-12 rounded-xl border border-bta-border flex items-center justify-center flex-shrink-0 text-bta-text"><Ic.Phone /></Btn>
        <Btn onClick={() => {}} className="w-12 h-12 rounded-xl border border-bta-border flex items-center justify-center flex-shrink-0 text-bta-text"><Ic.Chat /></Btn>
        <Btn onClick={() => onSchedule(v.id)} disabled={v.disp === 'lotado'}
          className="flex-1 inline-flex items-center justify-center gap-2 text-white font-display font-bold text-base py-3.5 rounded-xl disabled:opacity-40"
          style={{ background: VET }}>
          {v.disp === 'lotado' ? 'Entrar na lista de espera' : <><Ic.Calendar className="w-5 h-5" /> Agendar consulta</>}
        </Btn>
      </div>
    </div>
  )
}

// ─── Agendamento ─────────────────────────────────────────────────────────────────
export function VetScheduleScreen({ vetId, onBack, onDone }: {
  vetId: string; onBack: () => void; onDone: () => void
}) {
  const v = VETS.find(x => x.id === vetId) ?? VETS[0]
  const [servIdx, setServIdx] = useState(0)
  const [hora, setHora] = useState<string | null>(null)
  const [local, setLocal] = useState<'fazenda' | 'clinica'>('fazenda')
  const [qtd, setQtd] = useState(100)
  const [pgto, setPgto] = useState<'pix' | 'cartao' | 'presencial'>('pix')
  const [confirmado, setConfirmado] = useState(false)

  const serv = v.servicos[servIdx]
  const porCabeca = serv.preco.includes('/cabeça')
  const precoNum = parseFloat(serv.preco.replace(/[^0-9,]/g, '').replace(',', '.')) || 0
  const subtotal = porCabeca ? precoNum * qtd : precoNum
  const desloc = local === 'fazenda' ? 100 : 0
  const total = subtotal + desloc
  const totalFinal = pgto === 'pix' ? total * 0.95 : total
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const horarios = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00']
  const lotados = ['10:00']

  if (confirmado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" style={{ background: `linear-gradient(160deg, #1A0F2E, ${VET})` }}>
        <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-white mb-5 [&>svg]:w-10 [&>svg]:h-10"><Ic.Check /></div>
        <h1 className="font-display font-black text-white text-2xl mb-2">Agendamento confirmado!</h1>
        <p className="text-purple-200 text-sm mb-1">{serv.nome} com {v.nome}</p>
        <p className="text-white/60 text-xs mb-8">{hora} · {local === 'fazenda' ? 'Na sua fazenda' : 'Na clínica'} · {porCabeca ? `${qtd} cabeças` : '1 procedimento'}</p>
        <p className="font-display font-black text-bta-amber text-3xl mb-8">R$ {fmt(totalFinal)}</p>
        <Btn onClick={onDone} className="w-full bg-white font-display font-bold text-base py-4 rounded-2xl" style={{ color: VET }}>Voltar ao início</Btn>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: `linear-gradient(160deg, #1A0F2E, ${VET})` }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Voltar</button>
        <p className="flex items-center gap-2 font-display font-bold text-white text-lg"><Ic.Calendar className="w-5 h-5" /> Agendar consulta</p>
        <div className="flex items-center gap-2 mt-2">
          <img src={v.foto} alt={v.nome} className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <p className="text-white text-xs font-display font-bold">{v.nome}</p>
            <p className="text-purple-200 text-[10px]">★ {v.rating} · {v.especialidades[0]}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-5">
        <div>
          <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Wrench /> Serviço</h3>
          <div className="space-y-2">
            {v.servicos.map((s, i) => (
              <button key={s.nome} onClick={() => { sounds.select(); setServIdx(i) }} className="w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors"
                style={servIdx === i ? { borderColor: VET, background: VET_SOFT } : { borderColor: '#E4E8E5', background: '#fff' }}>
                <span className="text-bta-primary"><ServIcon k={s.icon} /></span>
                <div className="flex-1"><p className="text-xs font-display font-bold text-bta-text">{s.nome}</p><p className="text-[10px] text-bta-muted">{s.dur}</p></div>
                <span className="text-xs font-bold" style={{ color: VET }}>{s.preco}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Clock className="w-4 h-4" /> Horário — 28/08/2026</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {horarios.map(h => {
              const off = lotados.includes(h)
              return (
                <button key={h} disabled={off} onClick={() => { sounds.select(); setHora(h) }} className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border-2 disabled:opacity-30"
                  style={hora === h ? { borderColor: VET, background: VET, color: '#fff' } : { borderColor: '#E4E8E5', color: '#18211D' }}>
                  {h}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Pin /> Local do atendimento</h3>
          <div className="grid grid-cols-2 gap-2">
            {([['fazenda', 'Minha fazenda', '+ R$ 100 deslocamento', <Ic.Home key="h" />], ['clinica', 'Na clínica', 'Sem deslocamento', <Ic.Hospital key="c" />]] as const).map(([k, t, sub, icon]) => (
              <button key={k} onClick={() => { sounds.select(); setLocal(k) }} className="rounded-xl border-2 p-3 text-left"
                style={local === k ? { borderColor: VET, background: VET_SOFT } : { borderColor: '#E4E8E5', background: '#fff' }}>
                <p className="flex items-center gap-1.5 text-xs font-display font-bold text-bta-text"><span className="text-bta-primary">{icon}</span> {t}</p>
                <p className="text-[10px] text-bta-muted mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {porCabeca && (
          <div>
            <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Cow /> Quantidade de animais</h3>
            <div className="flex items-center gap-3 bg-bta-surface rounded-xl border border-bta-border p-3">
              <button onClick={() => setQtd(q => Math.max(10, q - 10))} className="w-9 h-9 rounded-lg bg-bta-bg border border-bta-border font-bold text-bta-text">−</button>
              <span className="flex-1 text-center font-display font-black text-lg text-bta-text">{qtd}</span>
              <button onClick={() => setQtd(q => q + 10)} className="w-9 h-9 rounded-lg bg-bta-bg border border-bta-border font-bold text-bta-text">+</button>
            </div>
          </div>
        )}

        <div>
          <h3 className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.CreditCard /> Pagamento</h3>
          <div className="space-y-2">
            {([['pix', 'Pix', '5% de desconto', <Ic.CreditCard key="p" />], ['cartao', 'Cartão', '2x sem juros', <Ic.CreditCard key="c" />], ['presencial', 'Ao veterinário', 'Após o serviço', <Ic.Wallet key="w" />]] as const).map(([k, t, sub, icon]) => (
              <button key={k} onClick={() => { sounds.select(); setPgto(k) }} className="w-full flex items-center justify-between rounded-xl border-2 p-3"
                style={pgto === k ? { borderColor: VET, background: VET_SOFT } : { borderColor: '#E4E8E5', background: '#fff' }}>
                <div className="flex items-center gap-2 text-left"><span className="text-bta-primary">{icon}</span><div><p className="text-xs font-display font-bold text-bta-text">{t}</p><p className="text-[10px] text-bta-muted">{sub}</p></div></div>
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: VET }}>{pgto === k && <span className="w-2 h-2 rounded-full" style={{ background: VET }} />}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <p className="flex items-center gap-1.5 font-display font-bold text-bta-text text-sm mb-2"><Ic.Clipboard /> Resumo</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-bta-muted"><span>{serv.nome}{porCabeca ? ` (${qtd} cab.)` : ''}</span><span className="text-bta-text">R$ {fmt(subtotal)}</span></div>
            <div className="flex justify-between text-bta-muted"><span>Deslocamento</span><span className="text-bta-text">R$ {fmt(desloc)}</span></div>
            {pgto === 'pix' && <div className="flex justify-between text-bta-success"><span>Desconto Pix (5%)</span><span>− R$ {fmt(total * 0.05)}</span></div>}
            <div className="flex justify-between pt-2 mt-1 border-t border-bta-border">
              <span className="font-display font-bold text-bta-text">Total</span>
              <span className="font-display font-black text-lg" style={{ color: VET }}>R$ {fmt(totalFinal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-3 bg-bta-surface border-t border-bta-border">
        <Btn onClick={() => { if (hora) { sounds.success(); setConfirmado(true) } }} disabled={!hora}
          className="w-full text-white font-display font-bold text-base py-4 rounded-2xl disabled:opacity-40" style={{ background: VET }}>
          {hora ? `Confirmar · R$ ${fmt(totalFinal)}` : 'Selecione um horário'}
        </Btn>
      </div>
    </div>
  )
}
