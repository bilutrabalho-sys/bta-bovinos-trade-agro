// BTA — Bovinos Trade Agro — Mock Data

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function generateHistory(base: number, volatility: number, seed: number, days = 30) {
  const rng = seededRng(seed)
  const now = new Date('2026-08-23')
  let price = base * 0.96
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (days - i))
    price = Math.max(base * 0.88, Math.min(base * 1.12, price + (rng() - 0.48) * volatility))
    return {
      day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: Math.round(price * 10) / 10,
    }
  })
}

const IMG = [
  'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1440428099904-c6d459a7e7b5?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1561043394-9f7d16d9ae37?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1563308294-6d63bb78d61e?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1498191923457-88552caeccb3?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1569858241634-5aee6e47091a?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1580570598977-4b2412d01bbc?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1589248529232-69c286cf2cb4?w=800&h=500&fit=crop&auto=format',
]

export interface Lot {
  id: number
  title: string
  category: string
  breed: string
  quantity: number
  weight: number
  price: number
  priceUnit: '/@' | '/cab'
  priceTotal: number
  location: string
  state: string
  distance: number
  freight: number
  score: number
  verified: boolean
  sellerId: number
  age: string
  sex: string
  purpose: string
  image: string
  images: string[]
  description: string
}

export const LOTS: Lot[] = [
  {
    id: 1, title: '120 Nelore', category: 'Boi Gordo', breed: 'Nelore', quantity: 120,
    weight: 380, price: 315, priceUnit: '/@', priceTotal: 143_280,
    location: 'Barretos, SP', state: 'SP', distance: 92, freight: 4_200,
    score: 94, verified: true, sellerId: 1, age: '36 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[0], images: [IMG[0], IMG[2], IMG[4]],
    description: 'Lote homogêneo de Nelore puro de origem, terminado em pasto com suplementação. Todos vacinados e documentados. Prontos para abate.',
  },
  {
    id: 2, title: '80 Brangus', category: 'Boi Gordo', breed: 'Brangus', quantity: 80,
    weight: 390, price: 318, priceUnit: '/@', priceTotal: 117_504,
    location: 'Uberaba, MG', state: 'MG', distance: 145, freight: 3_800,
    score: 88, verified: true, sellerId: 2, age: '38 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[1], images: [IMG[1], IMG[5], IMG[3]],
    description: 'Brangus com excelente acabamento de gordura. Criados em pastagem rotacionada. Documentação GTA em dia.',
  },
  {
    id: 3, title: '200 Nelore', category: 'Garrote', breed: 'Nelore', quantity: 200,
    weight: 220, price: 2_400, priceUnit: '/cab', priceTotal: 480_000,
    location: 'Ribeirão Preto, SP', state: 'SP', distance: 67, freight: 5_200,
    score: 91, verified: true, sellerId: 4, age: '18 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[2], images: [IMG[2], IMG[0], IMG[6]],
    description: 'Garrotes Nelore de alta genética, filhos de touros PO. Ótimo potencial de ganho. Vacinação completa.',
  },
  {
    id: 4, title: '50 Angus', category: 'Boi Gordo', breed: 'Angus', quantity: 50,
    weight: 420, price: 325, priceUnit: '/@', priceTotal: 81_375,
    location: 'Campo Grande, MS', state: 'MS', distance: 312, freight: 6_800,
    score: 85, verified: false, sellerId: 3, age: '40 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[3], images: [IMG[3], IMG[7], IMG[1]],
    description: 'Angus com acabamento premium. Alto rendimento de carcaça. Confinados nos últimos 90 dias.',
  },
  {
    id: 5, title: '150 Nelore', category: 'Novilha', breed: 'Nelore', quantity: 150,
    weight: 260, price: 268, priceUnit: '/@', priceTotal: 156_624,
    location: 'Bauru, SP', state: 'SP', distance: 180, freight: 4_900,
    score: 79, verified: false, sellerId: 8, age: '24 meses', sex: 'Fêmea', purpose: 'Recria/Cria',
    image: IMG[4], images: [IMG[4], IMG[2], IMG[5]],
    description: 'Novilhas Nelore em ótimas condições. Prontas para coberta ou engorda. Criadas em pastagem nativa.',
  },
  {
    id: 6, title: '300 Nelore', category: 'Garrote', breed: 'Nelore', quantity: 300,
    weight: 210, price: 2_280, priceUnit: '/cab', priceTotal: 684_000,
    location: 'Cuiabá, MT', state: 'MT', distance: 580, freight: 8_500,
    score: 87, verified: true, sellerId: 7, age: '15 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[5], images: [IMG[5], IMG[3], IMG[0]],
    description: 'Grande lote de garrotes Nelore do Pantanal. Rusticidade e adaptabilidade garantidas.',
  },
  {
    id: 7, title: '40 Guzerá', category: 'Vaca', breed: 'Guzerá', quantity: 40,
    weight: 380, price: 225, priceUnit: '/@', priceTotal: 51_300,
    location: 'Goiânia, GO', state: 'GO', distance: 420, freight: 5_600,
    score: 82, verified: false, sellerId: 6, age: '48 meses', sex: 'Fêmea', purpose: 'Cria',
    image: IMG[6], images: [IMG[6], IMG[4], IMG[2]],
    description: 'Vacas Guzerá com histórico de boa produção. Algumas prenhes. Ideal para reposição de rebanho.',
  },
  {
    id: 8, title: '90 Brangus', category: 'Novilha', breed: 'Brangus', quantity: 90,
    weight: 270, price: 272, priceUnit: '/@', priceTotal: 110_916,
    location: 'Araçatuba, SP', state: 'SP', distance: 88, freight: 3_200,
    score: 93, verified: true, sellerId: 5, age: '22 meses', sex: 'Fêmea', purpose: 'Engorda',
    image: IMG[7], images: [IMG[7], IMG[1], IMG[3]],
    description: 'Novilhas Brangus com excelente conformação. Ganho de peso superior à média. Documentação completa.',
  },
  {
    id: 9, title: '180 Nelore', category: 'Bezerro', breed: 'Nelore', quantity: 180,
    weight: 180, price: 1_850, priceUnit: '/cab', priceTotal: 333_000,
    location: 'Presidente Prudente, SP', state: 'SP', distance: 220, freight: 7_200,
    score: 76, verified: false, sellerId: 9, age: '8 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[0], images: [IMG[0], IMG[6], IMG[4]],
    description: 'Bezerros Nelore desmamados, saudáveis. Prontos para recria em pasto ou confinamento.',
  },
  {
    id: 10, title: '60 Cruzamento', category: 'Boi Gordo', breed: 'Cruzamento Industrial', quantity: 60,
    weight: 410, price: 320, priceUnit: '/@', priceTotal: 117_600,
    location: 'Uberaba, MG', state: 'MG', distance: 160, freight: 4_100,
    score: 90, verified: true, sellerId: 2, age: '36 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[1], images: [IMG[1], IMG[7], IMG[5]],
    description: 'Cruzamento industrial com alto rendimento. Terminados em confinamento. Frigoríficos já interessados.',
  },
  {
    id: 11, title: '120 Nelore', category: 'Garrote', breed: 'Nelore', quantity: 120,
    weight: 230, price: 2_350, priceUnit: '/cab', priceTotal: 282_000,
    location: 'Campo Grande, MS', state: 'MS', distance: 290, freight: 6_100,
    score: 86, verified: true, sellerId: 3, age: '16 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[2], images: [IMG[2], IMG[0], IMG[7]],
    description: 'Garrotes de boa procedência. Rebanho rastreado desde o nascimento.',
  },
  {
    id: 12, title: '45 Brahman', category: 'Boi Gordo', breed: 'Brahman', quantity: 45,
    weight: 395, price: 312, priceUnit: '/@', priceTotal: 83_538,
    location: 'Goiânia, GO', state: 'GO', distance: 440, freight: 6_300,
    score: 78, verified: false, sellerId: 6, age: '38 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[3], images: [IMG[3], IMG[5], IMG[1]],
    description: 'Brahman adaptados ao cerrado. Excelente rusticidade e conversão alimentar.',
  },
  {
    id: 13, title: '70 Brangus', category: 'Bezerro', breed: 'Brangus', quantity: 70,
    weight: 190, price: 1_950, priceUnit: '/cab', priceTotal: 136_500,
    location: 'Barretos, SP', state: 'SP', distance: 95, freight: 3_700,
    score: 89, verified: true, sellerId: 1, age: '9 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[4], images: [IMG[4], IMG[2], IMG[6]],
    description: 'Bezerros Brangus de alta genética. Filhos de matrizes PO. Ótima evolução esperada.',
  },
  {
    id: 14, title: '250 Nelore', category: 'Garrote', breed: 'Nelore', quantity: 250,
    weight: 220, price: 2_320, priceUnit: '/cab', priceTotal: 580_000,
    location: 'Cuiabá, MT', state: 'MT', distance: 560, freight: 9_200,
    score: 84, verified: false, sellerId: 7, age: '17 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[5], images: [IMG[5], IMG[3], IMG[7]],
    description: 'Grande lote para recria. Animais de boa conformação, adaptados ao clima quente.',
  },
  {
    id: 15, title: '30 Angus', category: 'Boi Gordo', breed: 'Angus', quantity: 30,
    weight: 430, price: 330, priceUnit: '/@', priceTotal: 63_855,
    location: 'Ribeirão Preto, SP', state: 'SP', distance: 75, freight: 2_800,
    score: 96, verified: true, sellerId: 4, age: '42 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[6], images: [IMG[6], IMG[0], IMG[4]],
    description: 'Lote premium de Angus confinado. Rendimento de carcaça acima de 60%. Documentação impecável.',
  },
  {
    id: 16, title: '100 Nelore', category: 'Vaca', breed: 'Nelore', quantity: 100,
    weight: 360, price: 218, priceUnit: '/@', priceTotal: 94_608,
    location: 'Araçatuba, SP', state: 'SP', distance: 92, freight: 3_400,
    score: 80, verified: false, sellerId: 5, age: '60 meses', sex: 'Fêmea', purpose: 'Cria',
    image: IMG[7], images: [IMG[7], IMG[5], IMG[3]],
    description: 'Vacas Nelore com bom histórico reprodutivo. Paridas recentemente. Matrizes selecionadas.',
  },
  {
    id: 17, title: '80 Guzerá', category: 'Novilha', breed: 'Guzerá', quantity: 80,
    weight: 255, price: 265, priceUnit: '/@', priceTotal: 81_264,
    location: 'Goiânia, GO', state: 'GO', distance: 430, freight: 5_900,
    score: 75, verified: false, sellerId: 6, age: '20 meses', sex: 'Fêmea', purpose: 'Recria',
    image: IMG[0], images: [IMG[0], IMG[2], IMG[6]],
    description: 'Novilhas Guzerá para recria. Animais saudáveis em bom estado nutricional.',
  },
  {
    id: 18, title: '160 Nelore', category: 'Boi Gordo', breed: 'Nelore', quantity: 160,
    weight: 370, price: 311, priceUnit: '/@', priceTotal: 221_424,
    location: 'Barretos, SP', state: 'SP', distance: 95, freight: 4_600,
    score: 92, verified: true, sellerId: 1, age: '34 meses', sex: 'Macho', purpose: 'Corte',
    image: IMG[1], images: [IMG[1], IMG[4], IMG[2]],
    description: 'Nelore de excelente padrão racial. Lote uniforme, prontos para o abate. Fazenda BTA Verified há 3 anos.',
  },
  {
    id: 19, title: '55 Cruzamento', category: 'Garrote', breed: 'Cruzamento Industrial', quantity: 55,
    weight: 240, price: 2_420, priceUnit: '/cab', priceTotal: 133_100,
    location: 'Uberaba, MG', state: 'MG', distance: 150, freight: 4_300,
    score: 88, verified: true, sellerId: 2, age: '18 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[2], images: [IMG[2], IMG[7], IMG[5]],
    description: 'Cruzamento industrial de alta performance. Genética selecionada para engorda rápida.',
  },
  {
    id: 20, title: '200 Nelore', category: 'Bezerro', breed: 'Nelore', quantity: 200,
    weight: 175, price: 1_780, priceUnit: '/cab', priceTotal: 356_000,
    location: 'Campo Grande, MS', state: 'MS', distance: 310, freight: 7_800,
    score: 83, verified: false, sellerId: 10, age: '7 meses', sex: 'Macho', purpose: 'Recria',
    image: IMG[3], images: [IMG[3], IMG[1], IMG[6]],
    description: 'Bezerros recém-desmamados, saudáveis. Ótima genética materna. Prontos para recria.',
  },
]

export interface Farm {
  id: number
  name: string
  rating: number
  deals: number
  completion: number
  location: string
  state: string
  verified: boolean
  specialties: string[]
  activeLots: number
  since: string
  description: string
}

export const FARMS: Farm[] = [
  { id: 1, name: 'Fazenda Santa Helena', rating: 4.9, deals: 1248, completion: 97, location: 'Barretos, SP', state: 'SP', verified: true, specialties: ['Nelore', 'Brangus'], activeLots: 3, since: '2021', description: 'Fazenda de 4.800 hectares especializada em Nelore e cruzamentos. Rastreamento 100% do rebanho.' },
  { id: 2, name: 'Agropecuária Três Irmãos', rating: 4.8, deals: 892, completion: 95, location: 'Uberaba, MG', state: 'MG', verified: true, specialties: ['Cruzamento', 'Brangus'], activeLots: 2, since: '2022', description: 'Referência em cruzamento industrial no Triângulo Mineiro. Confinamento próprio com 2.000 cabeças.' },
  { id: 3, name: 'Pecuária Pantanal Verde', rating: 4.7, deals: 634, completion: 93, location: 'Campo Grande, MS', state: 'MS', verified: true, specialties: ['Nelore', 'Garrotes'], activeLots: 2, since: '2020', description: 'Pecuária extensiva no Pantanal Sul-Mato-Grossense. Gado rústico e adaptado ao bioma.' },
  { id: 4, name: 'Fazenda Boa Vista', rating: 4.9, deals: 1856, completion: 98, location: 'Ribeirão Preto, SP', state: 'SP', verified: true, specialties: ['Angus', 'Nelore', 'Brangus'], activeLots: 4, since: '2019', description: 'Maior produtor de Angus certificado da região de Ribeirão Preto. Parceiro de frigoríficos premium.' },
  { id: 5, name: 'Confinamento Rio Claro', rating: 4.6, deals: 423, completion: 91, location: 'Araçatuba, SP', state: 'SP', verified: true, specialties: ['Novilha', 'Boi Gordo'], activeLots: 2, since: '2023', description: 'Confinamento moderno com capacidade de 5.000 cabeças. Dieta formulada por nutrólogos.' },
  { id: 6, name: 'Fazenda São Lucas', rating: 4.5, deals: 312, completion: 89, location: 'Goiânia, GO', state: 'GO', verified: false, specialties: ['Guzerá', 'Brahman'], activeLots: 2, since: '2022', description: 'Especialista em zebuínos do Cerrado. Foco em matrizes e reprodutores de alta genética.' },
  { id: 7, name: 'Agro Cuiabá Pecuária', rating: 4.8, deals: 768, completion: 94, location: 'Cuiabá, MT', state: 'MT', verified: true, specialties: ['Nelore', 'Garrotes'], activeLots: 2, since: '2021', description: 'Produção em larga escala no Mato Grosso. Rebanho rastreado, vacinado e documentado.' },
  { id: 8, name: 'Fazenda Nova Esperança', rating: 4.7, deals: 534, completion: 92, location: 'Bauru, SP', state: 'SP', verified: false, specialties: ['Nelore', 'Novilha'], activeLots: 1, since: '2022', description: 'Produção familiar de alta qualidade. Foco em bem-estar animal e sustentabilidade.' },
  { id: 9, name: 'Haras e Pecuária JB', rating: 4.4, deals: 198, completion: 87, location: 'Presidente Prudente, SP', state: 'SP', verified: false, specialties: ['Nelore', 'Bezerros'], activeLots: 1, since: '2023', description: 'Operação diversificada com pecuária de cria e recria. Bezerros de boa procedência.' },
  { id: 10, name: 'Fazenda São Judas', rating: 4.6, deals: 445, completion: 90, location: 'Campo Grande, MS', state: 'MS', verified: false, specialties: ['Nelore', 'Bezerros'], activeLots: 1, since: '2022', description: 'Pecuária tradicional do MS com foco em bezerros desmamados e garrotes.' },
]

export const MARKET_DATA = {
  'Boi Gordo': {
    current: 315.4,
    change: 2.3,
    unit: '/@',
    color: '#123B2A',
    history7: generateHistory(315, 4, 1, 7),
    history30: generateHistory(315, 4, 1, 30),
    history90: generateHistory(310, 6, 1, 90),
  },
  'Vaca': {
    current: 220.8,
    change: -0.8,
    unit: '/@',
    color: '#1E5A40',
    history7: generateHistory(220, 3, 2, 7),
    history30: generateHistory(220, 3, 2, 30),
    history90: generateHistory(218, 5, 2, 90),
  },
  'Novilha': {
    current: 268.2,
    change: 1.2,
    unit: '/@',
    color: '#2E7D52',
    history7: generateHistory(268, 3.5, 3, 7),
    history30: generateHistory(268, 3.5, 3, 30),
    history90: generateHistory(265, 5, 3, 90),
  },
  'Bezerro': {
    current: 1_852,
    change: 3.1,
    unit: '/cab',
    color: '#D6A84F',
    history7: generateHistory(1852, 30, 4, 7),
    history30: generateHistory(1852, 30, 4, 30),
    history90: generateHistory(1800, 50, 4, 90),
  },
  'Garrote': {
    current: 2_380,
    change: 0.9,
    unit: '/cab',
    color: '#68736D',
    history7: generateHistory(2380, 40, 5, 7),
    history30: generateHistory(2380, 40, 5, 30),
    history90: generateHistory(2320, 60, 5, 90),
  },
}

export const OPPORTUNITIES = [
  { id: 1, lotId: 15, title: 'Angus Premium', avgRegional: 318, priceDiff: -3.6, distance: 75, freight: 2_800, score: 96, reason: 'Preço 3,6% abaixo da média regional para Angus. Fazenda com 98% de conclusão de negócios.' },
  { id: 2, lotId: 1, title: 'Nelore Gordo', avgRegional: 319, priceDiff: -1.3, distance: 92, freight: 4_200, score: 94, reason: 'Fazenda BTA Verified com histórico impecável. Lote homogêneo, ideal para abate direto.' },
  { id: 3, lotId: 8, title: 'Brangus Novilha', avgRegional: 280, priceDiff: -2.9, distance: 88, freight: 3_200, score: 93, reason: 'Novilhas Brangus com excelente conformação, 2,9% abaixo do mercado. Frete acessível.' },
  { id: 4, lotId: 18, title: 'Nelore Gordo', avgRegional: 315, priceDiff: -1.3, distance: 95, freight: 4_600, score: 92, reason: 'Segunda oportunidade na Fazenda Santa Helena. Uniformidade acima da média.' },
  { id: 5, lotId: 10, title: 'Cruzamento Gordo', avgRegional: 322, priceDiff: -0.6, distance: 160, freight: 4_100, score: 90, reason: 'Cruzamento industrial com rendimento de carcaça excepcional.' },
  { id: 6, lotId: 3, title: 'Garrotes Nelore', avgRegional: 2_450, priceDiff: -2.0, distance: 67, freight: 5_200, score: 91, reason: 'Garrotes com genética superior 2% abaixo do mercado. Distância curta, frete competitivo.' },
  { id: 7, lotId: 19, title: 'Garrotes Cruzamento', avgRegional: 2_480, priceDiff: -2.4, distance: 150, freight: 4_300, score: 88, reason: 'Alta performance de ganho estimada. Fazenda verificada com bom histórico.' },
  { id: 8, lotId: 13, title: 'Bezerros Brangus', avgRegional: 2_020, priceDiff: -3.5, distance: 95, freight: 3_700, score: 89, reason: 'Bezerros Brangus 3,5% abaixo da média. Boa genética para recria.' },
  { id: 9, lotId: 2, title: 'Brangus Gordo', avgRegional: 322, priceDiff: -1.2, distance: 145, freight: 3_800, score: 88, reason: 'Excelente acabamento de gordura. Indicado para frigoríficos exportadores.' },
  { id: 10, lotId: 11, title: 'Garrotes Nelore MS', avgRegional: 2_390, priceDiff: -1.7, distance: 290, freight: 6_100, score: 86, reason: 'Lote de 120 garrotes homogêneos. Bom custo por cabeça considerando a qualidade.' },
]

export const NOTIFICATIONS = [
  { id: 1, type: 'match', title: 'Novo lote compatível', body: '120 Nelore em Barretos — 96% de compatibilidade com sua busca.', time: '2 min', read: false },
  { id: 2, type: 'proposal', title: 'Proposta recebida', body: 'Você recebeu uma proposta para seu anúncio de 80 Brangus.', time: '18 min', read: false },
  { id: 3, type: 'price', title: 'Alerta de preço', body: 'Boi Gordo subiu 2,3% hoje. Confira as oportunidades no radar.', time: '1h', read: false },
  { id: 4, type: 'radar', title: 'Radar encontrou algo', body: 'Garrotes Nelore em Campo Grande — R$ 2.350/cab. Dentro do seu critério.', time: '3h', read: true },
  { id: 5, type: 'academy', title: 'Nova aula disponível', body: 'Como calcular o custo de arroba na engorda — BTA Academy.', time: '5h', read: true },
  { id: 6, type: 'match', title: 'Compatibilidade alta', body: '30 Angus em Ribeirão Preto — Score 96. Oportunidade premium.', time: '8h', read: true },
  { id: 7, type: 'price', title: 'Bezerro em alta', body: 'Bezerro subiu 3,1% na semana. Momento de comprar para recria.', time: '1d', read: true },
  { id: 8, type: 'proposal', title: 'Contraproposta enviada', body: 'O vendedor da Fazenda Boa Vista respondeu sua proposta.', time: '1d', read: true },
  { id: 9, type: 'radar', title: 'Alerta ativado', body: 'Seu radar de Garrotes Nelore até R$ 320/@ encontrou 3 lotes.', time: '2d', read: true },
  { id: 10, type: 'academy', title: 'Parabéns!', body: 'Você concluiu o módulo "Entendendo a arroba". +50 XP.', time: '3d', read: true },
]

export const COURSES = [
  { id: 1, title: 'O que é arroba e como calcular', category: 'Comece aqui', duration: '8 min', progress: 100, level: 'Iniciante', xp: 50 },
  { id: 2, title: 'Como analisar um lote antes de comprar', category: 'Compra', duration: '15 min', progress: 60, level: 'Iniciante', xp: 80 },
  { id: 3, title: 'Entendendo o custo de frete na pecuária', category: 'Compra', duration: '12 min', progress: 0, level: 'Iniciante', xp: 70 },
  { id: 4, title: 'Como precificar seu gado para venda', category: 'Venda', duration: '18 min', progress: 0, level: 'Intermediário', xp: 100 },
  { id: 5, title: 'Recria: do bezerro ao garrote', category: 'Recria', duration: '22 min', progress: 0, level: 'Intermediário', xp: 120 },
  { id: 6, title: 'Confinamento: custo, dieta e resultado', category: 'Engorda', duration: '30 min', progress: 0, level: 'Avançado', xp: 150 },
  { id: 7, title: 'Leitura de mercado e timing de compra', category: 'Mercado', duration: '20 min', progress: 0, level: 'Intermediário', xp: 110 },
  { id: 8, title: 'Calculando margem e ponto de equilíbrio', category: 'Finanças', duration: '25 min', progress: 0, level: 'Intermediário', xp: 130 },
  { id: 9, title: 'Genética Nelore: o que avaliar no lote', category: 'Genética', duration: '28 min', progress: 0, level: 'Avançado', xp: 140 },
  { id: 10, title: 'Gestão de rebanho com tecnologia', category: 'Gestão', duration: '20 min', progress: 0, level: 'Intermediário', xp: 110 },
]

export const RADAR_ALERTS = [
  { id: 1, title: 'Garrotes Nelore', criteria: 'Até R$ 2.400/cab · Até 200 km · SP/MG', active: true, matches: 3 },
  { id: 2, title: 'Boi Gordo Premium', criteria: 'R$ 310–325/@ · Score ≥ 90 · Qualquer estado', active: true, matches: 1 },
  { id: 3, title: 'Bezerros para Recria', criteria: 'Até R$ 2.000/cab · Macho · SP', active: false, matches: 0 },
]

export const MATCH_RESULTS = [
  { lotId: 1, compatibility: 96, highlight: 'Nelore 380kg · R$ 315/@ · 92km' },
  { lotId: 18, compatibility: 94, highlight: 'Nelore 370kg · R$ 311/@ · 95km' },
  { lotId: 10, compatibility: 91, highlight: 'Cruzamento 410kg · R$ 320/@ · 160km' },
  { lotId: 4, compatibility: 87, highlight: 'Angus 420kg · R$ 325/@ · 312km' },
]

export const CHAT_MESSAGES = [
  { id: 1, from: 'buyer', text: 'Tenho interesse no lote de 120 Nelore. Ainda disponível?', time: '14:22' },
  { id: 2, from: 'seller', text: 'Sim, disponível! O lote está em ótimas condições, prontos para abate.', time: '14:25' },
  { id: 3, from: 'buyer', text: 'Consegue fazer R$ 310/@? Pago à vista.', time: '14:28' },
  { id: 4, from: 'seller', text: 'Minha base é R$ 315. Posso chegar a R$ 312 à vista, mas não consigo ir além.', time: '14:31' },
  { id: 5, from: 'buyer', text: 'Fechamos a R$ 312/@. Como procedemos?', time: '14:35' },
  { id: 6, from: 'seller', text: 'Perfeito! Vou emitir a proposta formal pelo BTA. Pode aceitar por lá.', time: '14:36' },
]

export const AI_SUGGESTIONS = [
  'Tenho R$ 100 mil. Como começo na pecuária?',
  'Como analisar este lote antes de comprar?',
  'Quanto custa engordar um boi por 90 dias?',
  'O que é arroba e como calcular?',
  'Como calcular minha margem de lucro?',
  'Qual a melhor raça para confinamento?',
]

export const TRANSPORTERS = [
  { id: 1, name: 'Transportadora JB Cargas', rating: 4.8, trips: 234, capacity: 40, pricePerKm: 4.5, verified: true, location: 'Barretos, SP', available: true },
  { id: 2, name: 'Fretes Agro SP', rating: 4.6, trips: 167, capacity: 26, pricePerKm: 3.8, verified: true, location: 'Ribeirão Preto, SP', available: true },
  { id: 3, name: 'Transporte Rural Centro-Oeste', rating: 4.4, trips: 89, capacity: 52, pricePerKm: 4.2, verified: false, location: 'Uberaba, MG', available: false },
]

export const LESSON = {
  id: 1,
  title: 'O que é arroba e como calcular',
  category: 'Comece aqui',
  level: 'Iniciante',
  duration: '8 min',
  xp: 50,
  sections: [
    {
      heading: 'O que é a arroba?',
      body: 'A arroba (símbolo @) é a principal unidade de peso usada no mercado bovino brasileiro. Cada arroba equivale a 15 quilogramas de peso vivo do animal.',
    },
    {
      heading: 'Como calcular?',
      body: 'Divida o peso do animal por 15. Um boi de 420 kg tem 28 arrobas. Se o preço está a R$ 315/@, o valor do animal é R$ 315 × 28 = R$ 8.820.',
    },
    {
      heading: 'Exemplo prático',
      body: 'Você está analisando um lote de 120 Nelore a R$ 315/@, com peso médio de 380 kg. Cada animal tem 25,3 arrobas. O valor por cabeça é R$ 7.969. O lote completo: R$ 956.280.',
    },
  ],
  keyConcepts: ['1 @ = 15 kg', 'Arrobas = Peso ÷ 15', 'Valor = Arrobas × Preço/@', 'Rendimento de carcaça ≈ 52% do peso vivo'],
  quiz: [
    { q: 'Um boi de 420 kg tem quantas arrobas?', opts: ['24 @', '28 @', '30 @'], answer: 1 },
    { q: 'Se o preço é R$ 315/@ e o boi tem 28@, qual o valor?', opts: ['R$ 7.560', 'R$ 8.820', 'R$ 9.450'], answer: 1 },
  ],
}

export const SAVED_SIMULATIONS = [
  { id: 1, name: 'Recria 50 Nelore — Barretos', date: '20/08/2026', margin: 18.4, investment: 125_000, scenario: 'Base' },
  { id: 2, name: 'Engorda 30 Angus — Ribeirão Preto', date: '15/08/2026', margin: 22.1, investment: 87_000, scenario: 'Base' },
  { id: 3, name: 'Confinamento 120 Nelore', date: '10/08/2026', margin: 14.7, investment: 287_400, scenario: 'Pessimista' },
]

export const SERVICES = [
  { id: 1, name: 'BTA Log', icon: '🚛', description: 'Logística e transporte após a negociação.', status: 'available' },
  { id: 2, name: 'Seguro Rural', icon: '🛡️', description: 'Proteção do rebanho durante o transporte.', status: 'soon' },
  { id: 3, name: 'Financiamento', icon: '💳', description: 'Crédito rural para compra de gado.', status: 'soon' },
  { id: 4, name: 'Documentação', icon: '📄', description: 'GTA, laudos e documentação sanitária.', status: 'soon' },
  { id: 5, name: 'Avaliação', icon: '🔬', description: 'Avaliação profissional de lote in loco.', status: 'soon' },
  { id: 6, name: 'Veterinário', icon: '🩺', description: 'Consulta veterinária e laudos.', status: 'soon' },
]
