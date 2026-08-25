// ─── Navigation types ──────────────────────────────────────────────────────
export type Screen =
  | 'splash' | 'onboarding' | 'terms' | 'home' | 'market' | 'buy' | 'results'
  | 'lot-detail' | 'match' | 'radar' | 'sell' | 'create-listing'
  | 'simulator' | 'ai' | 'academy' | 'business' | 'profile'
  | 'notifications' | 'negotiation' | 'bta-check' | 'farm-profile'
  | 'opportunities' | 'compare' | 'deal-closed' | 'bta-log'
  | 'lesson' | 'bta-path' | 'services' | 'favorites' | 'bta-pro'
  | 'seller-analytics' | 'login' | 'register'

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
