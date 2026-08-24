// BTA — Camada de dados unificada.
//
// Um único Context Provider entrega ao app OU os dados fictícios locais
// (modo `mock`, o padrão) OU o backend HTTP real (modo `api`), controlado pela
// variável de ambiente VITE_DATA_SOURCE. O hook `useData()` devolve um objeto
// com EXATAMENTE as mesmas chaves e tipos dos exports de `mock.ts`, então as
// telas trocam `import { LOTS } from '@/data/mock'` por `const { LOTS } =
// useData()` sem qualquer mudança de comportamento.
//
// - mock: fornece imediatamente os dados de `mock.ts` (síncrono).
// - api : no mount faz Promise.all dos fetches; mostra loading enquanto
//         carrega e um estado de erro discreto (com "Tentar de novo") em falha.
//
// AI_SUGGESTIONS é sempre a constante local do mock — nunca vem da API.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  LOTS, FARMS, MARKET_DATA, OPPORTUNITIES, NOTIFICATIONS, COURSES,
  RADAR_ALERTS, MATCH_RESULTS, CHAT_MESSAGES, AI_SUGGESTIONS,
  TRANSPORTERS, LESSONS, SAVED_SIMULATIONS, SERVICES,
} from './mock'
import {
  fetchLots, fetchFarms, fetchMarket, fetchOpportunities, fetchNotifications,
  fetchCourses, fetchLessons, fetchRadarAlerts, fetchMatchResults,
  fetchChatMessages, fetchTransporters, fetchServices, fetchSavedSimulations,
} from './api'

// Forma exata dos dados consumidos pelo app — espelha os exports do mock.
export interface AppData {
  LOTS: typeof LOTS
  FARMS: typeof FARMS
  MARKET_DATA: typeof MARKET_DATA
  OPPORTUNITIES: typeof OPPORTUNITIES
  NOTIFICATIONS: typeof NOTIFICATIONS
  COURSES: typeof COURSES
  RADAR_ALERTS: typeof RADAR_ALERTS
  MATCH_RESULTS: typeof MATCH_RESULTS
  CHAT_MESSAGES: typeof CHAT_MESSAGES
  AI_SUGGESTIONS: typeof AI_SUGGESTIONS
  TRANSPORTERS: typeof TRANSPORTERS
  LESSONS: typeof LESSONS
  SAVED_SIMULATIONS: typeof SAVED_SIMULATIONS
  SERVICES: typeof SERVICES
}

// Conjunto completo dos dados do mock, montado uma única vez.
const MOCK_DATA: AppData = {
  LOTS, FARMS, MARKET_DATA, OPPORTUNITIES, NOTIFICATIONS, COURSES,
  RADAR_ALERTS, MATCH_RESULTS, CHAT_MESSAGES, AI_SUGGESTIONS,
  TRANSPORTERS, LESSONS, SAVED_SIMULATIONS, SERVICES,
}

const DataContext = createContext<AppData | null>(null)

// Resolvido uma vez no carregamento do módulo. Padrão: 'mock'.
const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

// ─── Estados de loading / erro (discretos, paleta BTA) ───────────────────────

const SHELL_STYLE = { maxWidth: 390, minHeight: '100dvh' } as const
const SHELL_BG = { background: 'linear-gradient(160deg, #0D2B1E 0%, #123B2A 45%, #1E5A40 100%)' } as const

function DataShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center" style={{ background: '#DDE0DA' }}>
      <div className="relative w-full flex flex-col items-center justify-center gap-6 px-8 text-center" style={{ ...SHELL_STYLE, ...SHELL_BG }}>
        {children}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <DataShell>
      <span className="font-display font-black bta-mark-amber-sm" style={{ fontSize: 56, letterSpacing: '-0.055em', lineHeight: 0.88 }}>
        BTA
      </span>
      <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-bta-amber animate-spin" />
      <p className="text-white/50 font-display font-medium text-xs tracking-wide">Carregando dados...</p>
    </DataShell>
  )
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <DataShell>
      <span className="font-display font-black bta-mark-amber-sm" style={{ fontSize: 44, letterSpacing: '-0.055em', lineHeight: 0.88 }}>
        BTA
      </span>
      <div>
        <p className="font-display font-bold text-white text-base">Não foi possível carregar</p>
        <p className="text-white/50 text-sm mt-1">Verifique sua conexão e tente novamente.</p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 bg-bta-amber text-bta-primary font-display font-bold text-sm px-6 py-3 rounded-xl transition-opacity active:opacity-80"
      >
        Tentar de novo
      </button>
    </DataShell>
  )
}

// ─── Provider do modo `api` (carrega do backend) ─────────────────────────────

function ApiDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(false)
    setData(null)
    Promise.all([
      fetchLots(), fetchFarms(), fetchMarket(), fetchOpportunities(),
      fetchNotifications(), fetchCourses(), fetchRadarAlerts(), fetchMatchResults(),
      fetchChatMessages(), fetchTransporters(), fetchServices(), fetchLessons(),
      fetchSavedSimulations(),
    ])
      .then(([
        lots, farms, market, opportunities,
        notifications, courses, radarAlerts, matchResults,
        chatMessages, transporters, services, lessons,
        savedSimulations,
      ]) => {
        if (cancelled) return
        setData({
          LOTS: lots,
          FARMS: farms,
          MARKET_DATA: market,
          OPPORTUNITIES: opportunities,
          NOTIFICATIONS: notifications,
          COURSES: courses,
          RADAR_ALERTS: radarAlerts,
          MATCH_RESULTS: matchResults,
          CHAT_MESSAGES: chatMessages,
          AI_SUGGESTIONS, // constante local — nunca vem da API
          TRANSPORTERS: transporters,
          LESSONS: lessons,
          SAVED_SIMULATIONS: savedSimulations,
          SERVICES: services,
        })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => { cancelled = true }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey(k => k + 1), [])

  if (error) return <ErrorScreen onRetry={retry} />
  if (!data) return <LoadingScreen />
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

// ─── Provider público ────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  // Modo mock (padrão): entrega os dados imediatamente, sem fetch nem loading.
  if (DATA_SOURCE !== 'api') {
    return <DataContext.Provider value={MOCK_DATA}>{children}</DataContext.Provider>
  }
  return <ApiDataProvider>{children}</ApiDataProvider>
}

// Hook de consumo. Devolve o mesmo objeto (chaves/tipos) dos exports do mock.
export function useData(): AppData {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData() precisa estar dentro de <DataProvider>.')
  }
  return ctx
}
