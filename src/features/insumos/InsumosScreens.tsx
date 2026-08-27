import { useState } from 'react'
import { sounds } from '@/utils/sound'
import { Ic } from '@/components'
import type { Screen } from '@/core/navigation'

// ─── Botão com ripple + som (padrão das telas de fusão) ────────────────────────
function Btn({ children, className = '', onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { sounds.tap(); onClick?.(e) }
  return <button className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>{children}</button>
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: 'vacinas', label: 'Vacinas', Icon: Ic.Syringe, count: 18, color: '#1565C0', bg: '#EFF6FF' },
  { id: 'medicamentos', label: 'Medicamentos', Icon: Ic.Pill, count: 34, color: '#6A1B9A', bg: '#F5F3FF' },
  { id: 'racao', label: 'Ração', Icon: Ic.Grain, count: 12, color: '#795548', bg: '#FDF8F0' },
  { id: 'suplementos', label: 'Suplementos', Icon: Ic.Flask, count: 9, color: '#E65100', bg: '#FFF7ED' },
  { id: 'equipamentos', label: 'Equipamentos', Icon: Ic.Wrench, count: 21, color: '#123B2A', bg: '#F0FDF4' },
  { id: 'defensivos', label: 'Defensivos', Icon: Ic.Shield, count: 7, color: '#C94A45', bg: '#FEF2F2' },
] as const

function CatIcon({ cat, className = 'w-5 h-5' }: { cat: string; className?: string }) {
  const c = CATEGORIAS.find(x => x.id === cat)
  return <span className={`inline-flex [&>svg]:w-full [&>svg]:h-full ${className}`}>{c ? <c.Icon /> : <Ic.Package />}</span>
}

const PRODUTOS = [
  {
    id: 'v1', cat: 'vacinas', nome: 'Vacina Febre Aftosa (100 doses)',
    fornecedores: [
      { nome: 'Boehringer BR', preco: 187.50, frete: 0, prazo: 3, rating: 4.9, estoque: 500 },
      { nome: 'Vetcamp Sul', preco: 194.00, frete: 15, prazo: 5, rating: 4.7, estoque: 200 },
      { nome: 'AgroVet SP', preco: 201.00, frete: 0, prazo: 4, rating: 4.6, estoque: 350 },
    ],
    tags: ['FMD', 'Obrigatória', 'Refrigerado'], frio: true, tempRange: '2°C–8°C',
  },
  {
    id: 'm1', cat: 'medicamentos', nome: 'Ivermectina 1% Injetável (500ml)',
    fornecedores: [
      { nome: 'Zoetis Distribuidora', preco: 89.90, frete: 0, prazo: 3, rating: 5.0, estoque: 1200 },
      { nome: 'MSD Animal Health', preco: 94.50, frete: 0, prazo: 4, rating: 4.8, estoque: 800 },
      { nome: 'CentraVet', preco: 98.00, frete: 18, prazo: 6, rating: 4.5, estoque: 150 },
    ],
    tags: ['Antiparasitário', 'Endectocida'], frio: false,
  },
  {
    id: 'r1', cat: 'racao', nome: 'Ração Bovinos Confinamento 23% (sc 40kg)',
    fornecedores: [
      { nome: 'Purina Agroshop', preco: 142.00, frete: 35, prazo: 5, rating: 4.8, estoque: 5000 },
      { nome: 'Guabi Distribuidora', preco: 138.50, frete: 40, prazo: 7, rating: 4.6, estoque: 3000 },
      { nome: 'Cargill Feed', preco: 135.00, frete: 50, prazo: 8, rating: 4.9, estoque: 8000 },
    ],
    tags: ['Alto Proteína', 'Confinamento'], frio: false,
  },
  {
    id: 's1', cat: 'suplementos', nome: 'Sal Mineral Bovinos Corte (30kg)',
    fornecedores: [
      { nome: 'Tortuga Distribuidora', preco: 98.50, frete: 20, prazo: 4, rating: 4.9, estoque: 2000 },
      { nome: 'Provimi BR', preco: 102.00, frete: 15, prazo: 5, rating: 4.7, estoque: 1500 },
    ],
    tags: ['Fase Recria', 'Suplementação'], frio: false,
  },
]

const ESTOQUE = [
  { id: 'e1', prod: 'Vacina Febre Aftosa', cat: 'vacinas', qtd: 180, un: 'doses', min: 200, lote: 'FAF-2026-04', validade: '2026-12-15', local: 'Câmara Fria A', temp: 4.2, preco: 1.88 },
  { id: 'e2', prod: 'Ivermectina 1%', cat: 'medicamentos', qtd: 12, un: 'frascos', min: 15, lote: 'IVE-2025-11', validade: '2026-09-30', local: 'Depósito Central', temp: undefined, preco: 89.9 },
  { id: 'e3', prod: 'Ração Confinamento', cat: 'racao', qtd: 85, un: 'sacos', min: 50, lote: 'RAC-2026-08', validade: '2027-02-10', local: 'Armazém 1', temp: undefined, preco: 135.0 },
  { id: 'e4', prod: 'Sal Mineral', cat: 'suplementos', qtd: 22, un: 'sacos', min: 30, lote: 'SAL-2026-07', validade: '2027-06-30', local: 'Armazém 2', temp: undefined, preco: 98.5 },
  { id: 'e5', prod: 'Vacina Brucelose', cat: 'vacinas', qtd: 50, un: 'doses', min: 100, lote: 'BRU-2026-03', validade: '2026-09-05', local: 'Câmara Fria B', temp: 3.8, preco: 2.10 },
]

const COLETIVAS = [
  { id: 'c1', prod: 'Vacina Febre Aftosa 100d', cat: 'vacinas', qtdMeta: 5000, qtdAtual: 3800, participantes: 28, deadline: '2026-09-05', precoBase: 2.05, precoGrupo: 1.62, un: 'doses', regiao: 'Triângulo Mineiro/MG' },
  { id: 'c2', prod: 'Ração Confinamento 23%', cat: 'racao', qtdMeta: 800, qtdAtual: 610, participantes: 14, deadline: '2026-09-10', precoBase: 138.50, precoGrupo: 112.0, un: 'sacos', regiao: 'São Paulo Noroeste/SP' },
  { id: 'c3', prod: 'Ivermectina 1% 500ml', cat: 'medicamentos', qtdMeta: 300, qtdAtual: 218, participantes: 19, deadline: '2026-09-15', precoBase: 94.50, precoGrupo: 76.80, un: 'frascos', regiao: 'Sul do Mato Grosso/MT' },
]

const ALERTAS = [
  { id: 'a1', prod: 'Ivermectina 1% 500ml', meta: 85.00, atual: 89.90, ativo: true, atingido: false },
  { id: 'a2', prod: 'Ração Confinamento sc 40kg', meta: 132.00, atual: 135.00, ativo: true, atingido: false },
  { id: 'a3', prod: 'Vacina Febre Aftosa (d)', meta: 1.75, atual: 1.72, ativo: true, atingido: true },
]

const GASTOS_MENSAIS = [
  { mes: 'Mar', vacinas: 3200, medicamentos: 1800, racao: 9500, suplementos: 2200, outros: 800, total: 17500 },
  { mes: 'Abr', vacinas: 1400, medicamentos: 2100, racao: 9800, suplementos: 2100, outros: 650, total: 16050 },
  { mes: 'Mai', vacinas: 4800, medicamentos: 1500, racao: 10200, suplementos: 2300, outros: 700, total: 19500 },
  { mes: 'Jun', vacinas: 1200, medicamentos: 2400, racao: 9600, suplementos: 2000, outros: 750, total: 15950 },
  { mes: 'Jul', vacinas: 1600, medicamentos: 1900, racao: 10500, suplementos: 2400, outros: 850, total: 17250 },
  { mes: 'Ago', vacinas: 5890, medicamentos: 2200, racao: 11000, suplementos: 2500, outros: 900, total: 22490 },
]

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function diasAte(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) }

// ─── Hub ──────────────────────────────────────────────────────────────────────
export function InsumosHubScreen({ onNavigate, onBack }: {
  onNavigate: (s: Screen) => void; onBack: () => void
}) {
  const estoquesCriticos = ESTOQUE.filter(e => e.qtd <= e.min)
  const vencendo = ESTOQUE.filter(e => diasAte(e.validade) <= 30)
  const alertasAtingidos = ALERTAS.filter(a => a.atingido)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(160deg, #0F2E1E 0%, #123B2A 60%, #1E5A40 100%)' }}>
          <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-4"><Ic.Back /> Início</button>
          <div className="flex items-end gap-3 mb-4">
            <span className="font-display font-black text-bta-amber text-2xl" style={{ letterSpacing: '-0.03em', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>BTA</span>
            <span className="font-display font-bold text-white text-xl mb-0.5">Insumos</span>
          </div>
          <p className="text-white/50 text-xs font-display mb-4">Marketplace de insumos agropecuários para sua fazenda.</p>

          <div className="space-y-2">
            {estoquesCriticos.length > 0 && (
              <button onClick={() => onNavigate('insumos-estoque')} className="w-full flex items-center gap-2 bg-bta-amber/20 border border-bta-amber/40 rounded-xl px-3 py-2.5 text-left">
                <span className="text-bta-amber"><Ic.AlertCircle /></span>
                <span className="text-bta-amber text-xs font-display font-semibold flex-1">{estoquesCriticos.length} produto(s) com estoque crítico</span>
                <span className="text-bta-amber text-[10px] font-bold">Repor →</span>
              </button>
            )}
            {vencendo.length > 0 && (
              <button onClick={() => onNavigate('insumos-estoque')} className="w-full flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-xl px-3 py-2.5 text-left">
                <span className="text-red-200"><Ic.Calendar className="w-4 h-4" /></span>
                <span className="text-red-200 text-xs font-display font-semibold flex-1">{vencendo.length} item(ns) vencem em 30 dias</span>
                <span className="text-red-300 text-[10px] font-bold">Ver →</span>
              </button>
            )}
            {alertasAtingidos.length > 0 && (
              <button onClick={() => onNavigate('insumos-alertas')} className="w-full flex items-center gap-2 bg-bta-success/20 border border-bta-success/40 rounded-xl px-3 py-2.5 text-left">
                <span className="text-green-200 [&>svg]:w-4 [&>svg]:h-4"><Ic.Bell /></span>
                <span className="text-green-200 text-xs font-display font-semibold flex-1">{alertasAtingidos.length} alerta(s) de preço atingido!</span>
                <span className="text-green-300 text-[10px] font-bold">Comprar →</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Gasto mês', val: `R$ ${(GASTOS_MENSAIS[5].total / 1000).toFixed(1)}k`, Icon: Ic.TrendingUp, color: 'text-bta-error' },
              { label: 'Itens estoque', val: String(ESTOQUE.length), Icon: Ic.Package, color: 'text-bta-primary' },
              { label: 'Custo/@', val: 'R$ 142', Icon: Ic.Cow, color: 'text-bta-amber' },
            ].map(s => (
              <div key={s.label} className="bg-bta-surface rounded-xl border border-bta-border p-3 text-center">
                <span className={`inline-flex ${s.color}`}><s.Icon /></span>
                <p className={`font-display font-black text-base mt-1 ${s.color}`}>{s.val}</p>
                <p className="text-bta-muted text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Marketplace', Icon: Ic.Cart, sub: 'Compare 20+ fornecedores', nav: 'insumos-marketplace' as Screen, primary: true },
              { label: 'Meu Estoque', Icon: Ic.Package, sub: `${estoquesCriticos.length} críticos`, nav: 'insumos-estoque' as Screen, primary: false },
              { label: 'Compra Coletiva', Icon: Ic.Handshake, sub: `${COLETIVAS.length} abertas`, nav: 'insumos-coletiva' as Screen, primary: false },
              { label: 'Gastos', Icon: Ic.Chart, sub: 'Análise financeira', nav: 'insumos-relatorios' as Screen, primary: false },
            ].map(item => (
              <Btn key={item.label} onClick={() => onNavigate(item.nav)}
                className={`rounded-2xl p-4 text-left transition-transform active:scale-[0.98] ${item.primary ? 'bg-bta-primary' : 'bg-bta-surface border border-bta-border'}`}>
                <span className={`inline-flex ${item.primary ? 'text-bta-amber' : 'text-bta-primary'}`}><item.Icon /></span>
                <p className={`font-display font-bold text-sm mt-2 ${item.primary ? 'text-white' : 'text-bta-text'}`}>{item.label}</p>
                <p className={`text-[10px] mt-0.5 ${item.primary ? 'text-white/60' : 'text-bta-muted'}`}>{item.sub}</p>
              </Btn>
            ))}
          </div>

          {/* Ponte para serviços veterinários */}
          <button onClick={() => onNavigate('vet-connect')} className="w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={{ background: 'linear-gradient(135deg, #6A1B9A, #2D1B69)' }}>
            <span className="text-white [&>svg]:w-6 [&>svg]:h-6"><Ic.Stethoscope /></span>
            <div className="flex-1">
              <p className="font-display font-bold text-white text-sm">Veterinários próximos</p>
              <p className="text-purple-200 text-[10px]">Agende quem aplica seus insumos com segurança</p>
            </div>
            <span className="text-white/80 text-xs font-bold">→</span>
          </button>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-bta-text text-sm">Compras Coletivas Ativas</h3>
              <button onClick={() => onNavigate('insumos-coletiva')} className="text-bta-secondary text-xs font-display font-semibold">Ver todas →</button>
            </div>
            <div className="space-y-2">
              {COLETIVAS.slice(0, 2).map(g => {
                const pct = Math.round((g.qtdAtual / g.qtdMeta) * 100)
                const economia = Math.round(((g.precoBase - g.precoGrupo) / g.precoBase) * 100)
                return (
                  <button key={g.id} onClick={() => onNavigate('insumos-coletiva')} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-4 text-left">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-display font-bold text-bta-text">{g.prod}</p>
                        <p className="text-[10px] text-bta-muted">{g.regiao} · {g.participantes} produtores</p>
                      </div>
                      <span className="text-[10px] font-bold bg-bta-success/10 text-bta-success px-2 py-0.5 rounded-full">-{economia}%</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-bta-bg rounded-full overflow-hidden">
                        <div className="h-2 rounded-full bg-bta-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-bta-text">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-bta-muted">
                      <span>{g.qtdAtual}/{g.qtdMeta} {g.un}</span>
                      <span className="text-bta-amber font-semibold">{diasAte(g.deadline)}d restantes</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-bta-text text-sm">Alertas de Preço</h3>
              <button onClick={() => onNavigate('insumos-alertas')} className="text-bta-secondary text-xs font-display font-semibold">Gerenciar →</button>
            </div>
            <div className="space-y-2">
              {ALERTAS.map(a => (
                <div key={a.id} className={`flex items-center gap-3 rounded-xl p-3 border ${a.atingido ? 'border-bta-success/30 bg-bta-success/5' : 'border-bta-border bg-bta-surface'}`}>
                  <span className={`inline-flex [&>svg]:w-4 [&>svg]:h-4 ${a.atingido ? 'text-bta-success' : 'text-bta-amber'}`}>{a.atingido ? <Ic.Check /> : <Ic.Bell />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold text-bta-text truncate">{a.prod}</p>
                    <p className="text-[10px] text-bta-muted">Meta R$ {fmt(a.meta)} · Atual R$ {fmt(a.atual)}</p>
                  </div>
                  {a.atingido
                    ? <button className="text-[10px] font-bold text-white bg-bta-success px-2.5 py-1 rounded-lg">Comprar</button>
                    : <span className="text-[10px] font-medium text-bta-amber">-R$ {fmt(a.atual - a.meta)}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
function ProdutoDetail({ prodId, onBack, onFindVet }: { prodId: string; onBack: () => void; onFindVet?: (produto: string) => void }) {
  const prod = PRODUTOS.find(p => p.id === prodId)!
  const [fornSel, setFornSel] = useState(prod.fornecedores[0].nome)
  const [qty, setQty] = useState(1)
  const [alertAdded, setAlertAdded] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const forn = prod.fornecedores.find(f => f.nome === fornSel) ?? prod.fornecedores[0]
  const best = [...prod.fornecedores].sort((a, b) => a.preco - b.preco)[0]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 bg-bta-surface border-b border-bta-border sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-1 text-bta-muted text-sm mb-3"><Ic.Back /> Voltar</button>
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-2xl bg-bta-bg border border-bta-border flex items-center justify-center text-bta-primary [&>span>svg]:w-7 [&>span>svg]:h-7"><CatIcon cat={prod.cat} className="w-7 h-7" /></div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-bta-text text-base leading-tight">{prod.nome}</h2>
            {prod.frio && <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full mt-1"><Ic.Thermometer className="w-3 h-3" /> {prod.tempRange}</span>}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {prod.tags.map(t => <span key={t} className="text-[10px] bg-bta-primary/10 text-bta-primary font-display font-semibold px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between bg-bta-success/5 border border-bta-success/20 rounded-xl px-3 py-2">
          <div>
            <span className="font-display font-black text-bta-primary text-xl">R$ {fmt(best.preco)}</span>
            <span className="text-bta-muted text-xs ml-1">· melhor preço</span>
          </div>
          <button onClick={() => setAlertAdded(a => !a)} className={`inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl border ${alertAdded ? 'bg-bta-success text-white border-transparent' : 'border-bta-amber text-bta-amber'}`}>
            {alertAdded ? <><Ic.Check /> Alerta ativo</> : <><Ic.Bell /> Me avise se baixar</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {prod.fornecedores.map((f, i) => (
          <div key={f.nome} onClick={() => setFornSel(f.nome)}
            className={`rounded-2xl p-3 border-2 cursor-pointer transition-all ${fornSel === f.nome ? 'border-bta-primary bg-bta-primary/5' : 'border-bta-border bg-bta-surface'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-bta-primary">
                  {fornSel === f.nome && <div className="w-2 h-2 rounded-full bg-bta-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-display font-bold text-bta-text">{f.nome}</p>
                    {i === 0 && <span className="text-[9px] font-bold bg-bta-success/10 text-bta-success px-1.5 py-0.5 rounded-full">Melhor preço</span>}
                  </div>
                  <p className="text-[10px] text-bta-amber">{'★'.repeat(Math.round(f.rating))}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-bta-primary text-sm">R$ {fmt(f.preco)}</p>
                {i > 0 && <p className="text-[9px] text-bta-error">+R$ {fmt(f.preco - best.preco)}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-2 ml-6 text-[10px] text-bta-muted">
              <span className="inline-flex items-center gap-1"><Ic.Package className="w-3 h-3" /> {f.estoque} em estoque</span>
              <span className="inline-flex items-center gap-1"><Ic.Truck /> {f.frete === 0 ? 'Frete grátis' : `R$ ${fmt(f.frete)}`} · {f.prazo}d</span>
            </div>
          </div>
        ))}

        {onFindVet && (
          <button onClick={() => onFindVet(prod.nome)} className="w-full text-left rounded-2xl p-3 flex items-center gap-3 mt-1" style={{ background: '#F5F3FF', border: '1px solid #6A1B9A22' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#6A1B9A15', color: '#6A1B9A' }}><Ic.Stethoscope /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-bold" style={{ color: '#6A1B9A' }}>Precisa de ajuda para aplicar?</p>
              <p className="text-[10px] text-bta-muted">Encontre um veterinário qualificado perto de você</p>
            </div>
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#6A1B9A' }}>Ver →</span>
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-t border-bta-border bg-bta-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bta-bg rounded-xl px-2 py-1.5">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg bg-bta-surface border border-bta-border font-bold text-bta-text">−</button>
            <span className="text-sm font-bold w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-7 h-7 rounded-lg bg-bta-surface border border-bta-border font-bold text-bta-text">+</button>
          </div>
          <button onClick={() => { sounds.success(); setAddedToCart(true) }} className="flex-1 py-3 rounded-2xl text-white text-sm font-display font-bold bg-bta-primary inline-flex items-center justify-center gap-2">
            {addedToCart ? <><Ic.Check /> Adicionado</> : <><Ic.Cart /> Adicionar · R$ {fmt(forn.preco * qty + forn.frete)}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InsumosMarketplaceScreen({ onBack, onFindVet }: { onBack: () => void; onFindVet?: (produto: string) => void }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [prodSel, setProdSel] = useState<string | null>(null)

  if (prodSel) return <ProdutoDetail prodId={prodSel} onBack={() => setProdSel(null)} onFindVet={onFindVet} />

  const filtered = PRODUTOS.filter(p =>
    (!cat || p.cat === cat) &&
    (!search || p.nome.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #0F2E1E, #123B2A)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Insumos</button>
        <h1 className="font-display font-bold text-white text-xl mb-0.5">Marketplace</h1>
        <p className="text-white/40 text-xs mb-3">Compare preços de múltiplos fornecedores</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bta-muted"><Ic.Search /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/95 text-bta-text outline-none placeholder:text-bta-muted" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
          <button onClick={() => setCat(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-bold border transition-colors ${!cat ? 'bg-bta-primary text-white border-bta-primary' : 'bg-bta-surface text-bta-muted border-bta-border'}`}>Todos</button>
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id === cat ? null : c.id)} className={`inline-flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-bold border transition-colors ${cat === c.id ? 'bg-bta-primary text-white border-bta-primary' : 'bg-bta-surface text-bta-muted border-bta-border'}`}>
              <c.Icon /> {c.label}
            </button>
          ))}
        </div>

        {!cat && !search && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className="rounded-xl p-3 text-center active:scale-95 transition-transform" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                <span className="inline-flex [&>svg]:w-6 [&>svg]:h-6" style={{ color: c.color }}><c.Icon /></span>
                <p className="text-[10px] font-bold mt-1" style={{ color: c.color }}>{c.label}</p>
                <p className="text-[9px] text-bta-muted">{c.count} itens</p>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-bta-muted mb-3">{filtered.length} produto(s) {cat ? `em ${CATEGORIAS.find(c => c.id === cat)?.label}` : ''}</p>
        <div className="space-y-2">
          {filtered.map(p => {
            const best = [...p.fornecedores].sort((a, b) => a.preco - b.preco)[0]
            const pior = [...p.fornecedores].sort((a, b) => b.preco - a.preco)[0]
            const economia = pior.preco - best.preco
            return (
              <button key={p.id} onClick={() => setProdSel(p.id)} className="w-full bg-bta-surface rounded-2xl border border-bta-border p-3 text-left flex items-center gap-3 active:scale-[0.99] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-bta-bg flex items-center justify-center text-bta-primary flex-shrink-0"><CatIcon cat={p.cat} className="w-6 h-6" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-bold text-bta-text truncate">{p.nome}</p>
                  <p className="text-[10px] text-bta-muted mt-0.5">{p.fornecedores.length} fornecedores</p>
                  {economia > 0 && <p className="text-[10px] text-bta-success font-semibold">Economize até R$ {fmt(economia)}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-bta-primary text-sm">R$ {fmt(best.preco)}</p>
                  {p.frio && <p className="inline-flex items-center gap-0.5 text-[9px] text-blue-600 mt-0.5"><Ic.Thermometer className="w-3 h-3" /> Frio</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Estoque ──────────────────────────────────────────────────────────────────
export function InsumosEstoqueScreen({ onBack }: { onBack: () => void }) {
  const [filtro, setFiltro] = useState<'todos' | 'critico' | 'vencendo'>('todos')
  const items = ESTOQUE.filter(e => {
    if (filtro === 'critico') return e.qtd <= e.min
    if (filtro === 'vencendo') return diasAte(e.validade) <= 30
    return true
  })
  const totalValor = ESTOQUE.reduce((s, e) => s + e.qtd * e.preco, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #0F2E1E, #123B2A)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Insumos</button>
        <h1 className="font-display font-bold text-white text-xl mb-0.5">Estoque da Fazenda</h1>
        <p className="text-white/40 text-xs mb-3">Valor em estoque: R$ {fmt(totalValor)}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total', val: ESTOQUE.length, color: 'text-white' },
            { label: 'Crítico', val: ESTOQUE.filter(e => e.qtd <= e.min).length, color: 'text-bta-amber' },
            { label: 'Vencendo', val: ESTOQUE.filter(e => diasAte(e.validade) <= 30).length, color: 'text-red-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className={`font-display font-black text-xl ${s.color}`}>{s.val}</p>
              <p className="text-white/50 text-[9px]">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {(['todos', 'critico', 'vencendo'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} className="text-[10px] font-bold px-3 py-1.5 rounded-full"
              style={filtro === f ? { background: '#fff', color: '#123B2A' } : { background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {f === 'todos' ? 'Todos' : f === 'critico' ? 'Crítico' : 'Vencendo'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-2">
        {items.map(item => {
          const dias = diasAte(item.validade)
          const critico = item.qtd <= item.min
          const vencendo = dias <= 30
          const pct = Math.min(100, Math.round((item.qtd / (item.min * 3)) * 100))

          return (
            <div key={item.id} className={`bg-bta-surface rounded-2xl border p-3 ${critico || vencendo ? 'border-bta-amber' : 'border-bta-border'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-display font-bold text-bta-text">{item.prod}</p>
                    {critico && <span className="text-[9px] font-bold bg-bta-amber/10 text-bta-amber px-1.5 py-0.5 rounded-full">Estoque baixo</span>}
                    {vencendo && <span className="text-[9px] font-bold bg-bta-error/10 text-bta-error px-1.5 py-0.5 rounded-full">{dias}d p/ vencer</span>}
                    {item.temp !== undefined && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full"><Ic.Thermometer className="w-3 h-3" /> {item.temp}°C</span>}
                  </div>
                  <p className="text-[10px] text-bta-muted mt-0.5">Lote: {item.lote} · {item.local}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`font-display font-black text-base ${critico ? 'text-bta-amber' : 'text-bta-primary'}`}>{item.qtd}</p>
                  <p className="text-[10px] text-bta-muted">{item.un}</p>
                </div>
              </div>
              <div className="h-1.5 bg-bta-bg rounded-full overflow-hidden mb-2">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: critico ? '#D6A84F' : '#123B2A' }} />
              </div>
              <div className="flex justify-between text-[10px] text-bta-muted">
                <span>Validade: {new Date(item.validade).toLocaleDateString('pt-BR')}</span>
                <span className="font-bold text-bta-primary">R$ {fmt(item.qtd * item.preco)}</span>
              </div>
              {critico && (
                <button className="mt-2 w-full py-1.5 rounded-xl text-white text-[10px] font-display font-bold bg-bta-amber inline-flex items-center justify-center gap-1">
                  <Ic.Cart /> Repor estoque agora
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Compra Coletiva ──────────────────────────────────────────────────────────
export function InsumosColetivaScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #0F2E1E, #123B2A)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Insumos</button>
        <h1 className="flex items-center gap-2 font-display font-bold text-white text-xl mb-0.5"><Ic.Handshake /> Compra Coletiva</h1>
        <p className="text-white/40 text-xs">Una-se a produtores e economize até 35%</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
        {COLETIVAS.map(g => {
          const pct = Math.round((g.qtdAtual / g.qtdMeta) * 100)
          const economia = Math.round(((g.precoBase - g.precoGrupo) / g.precoBase) * 100)
          const dias = diasAte(g.deadline)
          return (
            <div key={g.id} className="bg-bta-surface rounded-2xl border border-bta-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex text-bta-primary [&>span>svg]:w-6 [&>span>svg]:h-6"><CatIcon cat={g.cat} className="w-6 h-6" /></span>
                      <span className="text-[10px] font-bold bg-bta-success/10 text-bta-success px-2 py-0.5 rounded-full">-{economia}% de desconto</span>
                    </div>
                    <h3 className="font-display font-bold text-bta-text text-sm">{g.prod}</h3>
                    <p className="text-[10px] text-bta-muted">{g.regiao} · {g.participantes} produtores</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-bta-muted line-through">R$ {fmt(g.precoBase)}</p>
                    <p className="font-display font-black text-bta-primary text-base">R$ {fmt(g.precoGrupo)}</p>
                    <p className="text-[9px] text-bta-muted">/{g.un}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-bta-text font-medium">{g.qtdAtual} / {g.qtdMeta} {g.un}</span>
                    <span className={`font-bold ${pct >= 75 ? 'text-bta-success' : 'text-bta-amber'}`}>{pct}%</span>
                  </div>
                  <div className="h-3 bg-bta-bg rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-bta-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-bta-muted mb-3">
                  <span>Faltam {g.qtdMeta - g.qtdAtual} {g.un} para ativar</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${dias <= 5 ? 'text-bta-error' : 'text-bta-amber'}`}><Ic.Clock className="w-3 h-3" /> {dias} dias restantes</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-bta-bg rounded-xl p-2 mb-3">
                  <div><p className="text-xs font-bold text-bta-text">R$ {fmt((g.precoBase - g.precoGrupo) * g.qtdAtual)}</p><p className="text-[9px] text-bta-muted">Economia do grupo</p></div>
                  <div><p className="text-xs font-bold text-bta-text">{g.participantes}</p><p className="text-[9px] text-bta-muted">Produtores</p></div>
                  <div><p className="text-xs font-bold text-bta-success">R$ {fmt(g.precoBase - g.precoGrupo)}</p><p className="text-[9px] text-bta-muted">Sua economia</p></div>
                </div>
                <Btn onClick={() => sounds.success()} className="w-full py-2.5 rounded-2xl text-white text-xs font-display font-bold bg-bta-primary inline-flex items-center justify-center gap-1">
                  <Ic.Check /> Participar desta compra coletiva
                </Btn>
              </div>
            </div>
          )
        })}
        <div className="bg-bta-primary/5 rounded-2xl p-4 border border-bta-primary/20">
          <h4 className="flex items-center gap-1.5 text-sm font-display font-bold text-bta-primary mb-2"><Ic.Bulb className="w-4 h-4" /> Como funciona?</h4>
          <ol className="space-y-1 text-[10px] text-bta-muted leading-relaxed">
            <li>1. Escolha um produto e confirme sua quantidade</li>
            <li>2. Quando a meta for atingida, o pedido é enviado automaticamente</li>
            <li>3. O pagamento só é debitado quando a meta é atingida</li>
            <li>4. O produto chega em até 5 dias úteis</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// ─── Alertas ──────────────────────────────────────────────────────────────────
export function InsumosAlertasScreen({ onBack }: { onBack: () => void }) {
  const [alertas, setAlertas] = useState(ALERTAS)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 bg-bta-surface border-b border-bta-border sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-1 text-bta-muted text-sm mb-2"><Ic.Back /> Insumos</button>
        <h2 className="flex items-center gap-2 font-display font-bold text-bta-text text-xl"><Ic.Bell /> Alertas de Preço</h2>
        <p className="text-bta-muted text-xs mt-0.5">Receba notificação quando o preço baixar</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-3">
        {alertas.map(a => (
          <div key={a.id} className={`rounded-2xl p-4 border ${a.atingido ? 'border-bta-success/30 bg-bta-success/5' : 'border-bta-border bg-bta-surface'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-display font-bold text-bta-text">{a.prod}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-[9px] text-bta-muted">Preço alvo</p>
                    <p className="font-display font-bold text-bta-primary text-sm">R$ {fmt(a.meta)}</p>
                  </div>
                  <div className="text-bta-muted">→</div>
                  <div className="text-center">
                    <p className="text-[9px] text-bta-muted">Atual</p>
                    <p className={`font-display font-bold text-sm ${a.atingido ? 'text-bta-success' : 'text-bta-text'}`}>R$ {fmt(a.atual)}</p>
                  </div>
                </div>
                {a.atingido
                  ? <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-bta-success/10 text-bta-success px-2 py-0.5 rounded-full"><Ic.Check /> Preço atingido!</span>
                      <button className="text-[10px] font-bold text-white bg-bta-success px-3 py-1 rounded-xl">Comprar agora</button>
                    </div>
                  : <p className="text-[10px] text-bta-muted mt-2">Falta R$ {fmt(a.atual - a.meta)} para a meta</p>
                }
              </div>
              <button onClick={() => { sounds.toggle(); setAlertas(prev => prev.map(x => x.id === a.id ? { ...x, ativo: !x.ativo } : x)) }}
                className={`w-10 h-6 rounded-full flex-shrink-0 ml-3 relative transition-colors ${a.ativo ? 'bg-bta-primary' : 'bg-bta-border'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${a.ativo ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        ))}
        <button className="w-full py-3 rounded-2xl border-2 border-dashed border-bta-border text-sm font-display font-semibold text-bta-muted inline-flex items-center justify-center gap-1">
          <Ic.Plus /> Criar novo alerta
        </button>
      </div>
    </div>
  )
}

// ─── Relatórios ───────────────────────────────────────────────────────────────
export function InsumosRelatoriosScreen({ onBack }: { onBack: () => void }) {
  const [periodo, setPeriodo] = useState<'6m' | '3m' | '1m'>('6m')
  const data = periodo === '1m' ? GASTOS_MENSAIS.slice(-1) : periodo === '3m' ? GASTOS_MENSAIS.slice(-3) : GASTOS_MENSAIS
  const totalGasto = data.reduce((s, d) => s + d.total, 0)
  const maxVal = Math.max(...data.map(d => d.total))
  const catCores: Record<string, string> = { vacinas: '#1565C0', medicamentos: '#6A1B9A', racao: '#795548', suplementos: '#E65100', outros: '#68736D' }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(160deg, #0F2E1E, #123B2A)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 text-sm mb-3"><Ic.Back /> Insumos</button>
        <h1 className="font-display font-bold text-white text-xl mb-0.5">Gastos da Fazenda</h1>
        <p className="text-white/40 text-xs mb-3">Análise financeira de insumos</p>
        <div className="flex gap-2">
          {(['6m', '3m', '1m'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)} className="text-[10px] font-bold px-3 py-1.5 rounded-full"
              style={periodo === p ? { background: '#fff', color: '#123B2A' } : { background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {p === '6m' ? '6 meses' : p === '3m' ? '3 meses' : '1 mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total gasto', val: `R$ ${(totalGasto / 1000).toFixed(1)}k`, sub: `em ${data.length} mês(es)`, color: 'text-bta-primary' },
            { label: 'Custo/@/boi', val: 'R$ 142,50', sub: 'Meta: R$ 130,00', color: 'text-bta-error' },
            { label: 'Maior gasto', val: 'Ração', sub: 'R$ 11.000/mês', color: 'text-bta-amber' },
            { label: 'Eco. alertas', val: 'R$ 480', sub: 'vs preço máximo', color: 'text-bta-success' },
          ].map(k => (
            <div key={k.label} className="bg-bta-surface rounded-2xl border border-bta-border p-3">
              <p className={`font-display font-black text-base ${k.color}`}>{k.val}</p>
              <p className="text-[10px] text-bta-muted mt-0.5">{k.label}</p>
              <p className="text-[9px] text-bta-muted">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <h4 className="font-display font-bold text-bta-text text-sm mb-3">Gastos por Mês</h4>
          <div className="flex items-end gap-2 h-28">
            {data.map(d => (
              <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-bta-muted font-medium">R${Math.round(d.total / 1000)}k</span>
                <div className="w-full rounded-t-lg bg-bta-primary" style={{ height: `${(d.total / maxVal) * 80}px` }} />
                <span className="text-[9px] text-bta-muted">{d.mes}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
          <h4 className="font-display font-bold text-bta-text text-sm mb-3">Por Categoria</h4>
          {(['vacinas', 'medicamentos', 'racao', 'suplementos', 'outros'] as const).map(cat => {
            const total = data.reduce((s, d) => s + (d[cat as keyof typeof d] as number), 0)
            const pct = Math.round((total / totalGasto) * 100)
            return (
              <div key={cat} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-display font-medium text-bta-text capitalize">{cat}</span>
                  <span className="font-bold text-bta-text">R$ {fmt(total)} <span className="text-bta-muted font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-bta-bg rounded-full overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: catCores[cat] }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-bta-primary rounded-2xl p-4">
          <h4 className="font-display font-bold text-white text-sm mb-1">Custo por @/boi</h4>
          <p className="text-white/50 text-[10px] mb-3">Baseado em 350 cabeças · média 15 @ por boi</p>
          <div className="space-y-2">
            {[
              { label: 'Sanidade', val: 42.5 },
              { label: 'Alimentação', val: 68.0 },
              { label: 'Suplementação', val: 22.0 },
              { label: 'Outros', val: 10.0 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-white/70">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full bg-bta-amber" style={{ width: `${(item.val / 142.5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-14 text-right">R$ {fmt(item.val)}/boi</span>
                </div>
              </div>
            ))}
            <div className="border-t border-white/20 pt-2 flex justify-between">
              <span className="text-xs font-bold text-white">Total</span>
              <span className="font-display font-black text-bta-amber text-base">R$ 142,50/boi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
