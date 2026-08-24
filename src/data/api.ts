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

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`GET /api${path} falhou: ${res.status} ${res.statusText}`)
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
