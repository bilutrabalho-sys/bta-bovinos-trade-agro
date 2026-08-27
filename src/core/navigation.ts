// ─── Navigation types ──────────────────────────────────────────────────────
export type Screen =
  | 'splash' | 'onboarding' | 'terms' | 'home' | 'market' | 'buy' | 'results'
  | 'lot-detail' | 'match' | 'radar' | 'sell' | 'create-listing'
  | 'simulator' | 'ai' | 'academy' | 'business' | 'profile'
  | 'notifications' | 'negotiation' | 'bta-check' | 'farm-profile'
  | 'opportunities' | 'compare' | 'deal-closed' | 'bta-log'
  | 'lesson' | 'bta-path' | 'services' | 'favorites' | 'bta-pro'
  | 'seller-analytics' | 'login' | 'register'
  // Fusão VetAgro — insumos, veterinários, usados e vídeos técnicos
  | 'insumos' | 'insumos-marketplace' | 'insumos-estoque' | 'insumos-coletiva'
  | 'insumos-alertas' | 'insumos-relatorios'
  | 'vet-connect' | 'vet-profile' | 'vet-schedule'
  | 'usados' | 'usado-detail'
  | 'video-feed'

export type Tab = 'home' | 'market' | 'academy' | 'business' | 'profile'

// ─── Cross-screen data payloads ────────────────────────────────────────────
// Criteria filled in on BuyScreen, carried through App state to ResultsScreen
// (same pattern as selectedLotId/compareLotIds) so results can be filtered
// against what the user actually asked for.
export interface BuyFilters {
  query?: string
  category?: string
  breed?: string
  purpose?: string
  minWeight?: number
  maxPrice?: number
  maxDistance?: number
}
