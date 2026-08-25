// BTA — Camada de acesso ao backend HTTP real (modo `api`).
//
// Uma função `fetch` tipada por coleção. Cada função devolve exatamente a
// mesma forma do export correspondente de `mock.ts`, de modo que o resto do
// app não percebe diferença entre consumir o mock ou a API.
//
// Base: import.meta.env.VITE_API_URL (padrão http://localhost:3001), rotas
// sob `/api`. `AI_SUGGESTIONS` NÃO vem da API — continua constante local do
// mock — por isso não há `fetch` para ela aqui.

import type { Lot, Farm } from './mock'
import { getStoredToken } from '../auth/token'

// Tipos das coleções derivados diretamente dos exports do mock (somente em
// nível de tipo, sem carregar o mock em runtime), garantindo que o contrato
// da API fique sempre em sincronia com a forma dos dados fictícios.
type MarketData = typeof import('./mock').MARKET_DATA
type Opportunities = typeof import('./mock').OPPORTUNITIES
type Notifications = typeof import('./mock').NOTIFICATIONS
type Courses = typeof import('./mock').COURSES
type Lessons = typeof import('./mock').LESSONS
type RadarAlerts = typeof import('./mock').RADAR_ALERTS
type MatchResults = typeof import('./mock').MATCH_RESULTS
type ChatMessages = typeof import('./mock').CHAT_MESSAGES
type Transporters = typeof import('./mock').TRANSPORTERS
type Services = typeof import('./mock').SERVICES
type SavedSimulations = typeof import('./mock').SAVED_SIMULATIONS

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Erro específico de "precisa estar logado" (HTTP 401 numa escrita/leitura
// autenticada). O app trata este erro levando o usuário ao login, em vez de
// mostrar um erro genérico. NUNCA carrega token/senha.
export class AuthRequiredError extends Error {
  constructor(message = 'Autenticação necessária.') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

// Monta os headers padrão, anexando `Authorization: Bearer <token>` quando há
// token guardado (mesma chave do AuthContext). Leituras públicas funcionam sem
// token; leituras pessoais passam a vir preenchidas quando ele existe.
function authHeaders(base: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken()
  return token ? { ...base, Authorization: `Bearer ${token}` } : base
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: authHeaders({ Accept: 'application/json' }),
  })
  if (!res.ok) {
    throw new Error(`GET /api${path} falhou: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

// POST autenticado para as ESCRITAS pessoais. Em 401 (anônimo ou sessão
// expirada) lança AuthRequiredError para o app pedir login; outros erros viram
// Error comum.
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: authHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (res.status === 401) {
    throw new AuthRequiredError()
  }
  if (!res.ok) {
    throw new Error(`POST /api${path} falhou: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export const fetchLots = () => getJSON<Lot[]>('/lots')
export const fetchFarms = () => getJSON<Farm[]>('/farms')
export const fetchMarket = () => getJSON<MarketData>('/market')
export const fetchOpportunities = () => getJSON<Opportunities>('/opportunities')
export const fetchNotifications = () => getJSON<Notifications>('/notifications')
export const fetchCourses = () => getJSON<Courses>('/courses')
export const fetchLessons = () => getJSON<Lessons>('/lessons')
export const fetchRadarAlerts = () => getJSON<RadarAlerts>('/radar-alerts')
export const fetchMatchResults = () => getJSON<MatchResults>('/match-results')
export const fetchChatMessages = () => getJSON<ChatMessages>('/chat-messages')
export const fetchTransporters = () => getJSON<Transporters>('/transporters')
export const fetchServices = () => getJSON<Services>('/services')
export const fetchSavedSimulations = () => getJSON<SavedSimulations>('/saved-simulations')

// ─── Escritas pessoais (exigem Bearer; 401 => AuthRequiredError) ─────────────

// POST /api/favorites — favorita um lote do usuário logado. body { lotId }.
export const createFavorite = (lotId: number) =>
  postJSON<unknown>('/favorites', { lotId })

// POST /api/proposals — cria uma proposta do comprador logado.
// body { lotId, quantity, pricePerUnit, priceUnit }.
export const createProposal = (input: {
  lotId: number
  quantity: number
  pricePerUnit: number
  priceUnit: '/@' | '/cab'
}) => postJSON<unknown>('/proposals', input)
