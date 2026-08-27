import { useState } from 'react'
import { useData } from './data/DataProvider'
import { useAuth } from './auth/AuthContext'
import { AuthGateProvider, type AuthGate } from './auth/AuthGate'
import type { BuyFilters, Screen, Tab } from './core/navigation'
import { LoginScreen } from './features/auth/LoginScreen'
import { RegisterScreen } from './features/auth/RegisterScreen'
import { SplashScreen } from './features/onboarding/SplashScreen'
import { TermsScreen } from './features/onboarding/TermsScreen'
import { OnboardingScreen } from './features/onboarding/OnboardingScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { MarketScreen } from './features/market/MarketScreen'
import { BuyScreen } from './features/buying/BuyScreen'
import { ResultsScreen } from './features/buying/ResultsScreen'
import { LotDetailScreen } from './features/buying/LotDetailScreen'
import { CompareScreen } from './features/buying/CompareScreen'
import { FarmProfileScreen } from './features/buying/FarmProfileScreen'
import { BTAMatchScreen } from './features/match/BTAMatchScreen'
import { RadarScreen } from './features/radar/RadarScreen'
import { SellScreen } from './features/selling/SellScreen'
import { CreateListingScreen } from './features/selling/CreateListingScreen'
import { SellerAnalyticsScreen } from './features/selling/SellerAnalyticsScreen'
import { SimulatorScreen } from './features/simulator/SimulatorScreen'
import { AIScreen } from './features/ai/AIScreen'
import { DealClosedScreen } from './features/negotiation/DealClosedScreen'
import { NegotiationScreen } from './features/negotiation/NegotiationScreen'
import { BTACheckScreen } from './features/check/BTACheckScreen'
import { OpportunitiesScreen } from './features/opportunities/OpportunitiesScreen'
import { AcademyScreen } from './features/academy/AcademyScreen'
import { LessonScreen } from './features/academy/LessonScreen'
import { BTAPathScreen } from './features/academy/BTAPathScreen'
import { BTALogScreen } from './features/logistics/BTALogScreen'
import { ServicesScreen } from './features/logistics/ServicesScreen'
import { BusinessScreen } from './features/business/BusinessScreen'
import { ProfileScreen } from './features/profile/ProfileScreen'
import { BTAProScreen } from './features/profile/BTAProScreen'
import { FavoritesScreen } from './features/profile/FavoritesScreen'
import { NotificationsScreen } from './features/profile/NotificationsScreen'
// Fusão VetAgro — insumos, veterinários, usados e vídeos técnicos
import {
  InsumosHubScreen, InsumosMarketplaceScreen, InsumosEstoqueScreen,
  InsumosColetivaScreen, InsumosAlertasScreen, InsumosRelatoriosScreen,
} from './features/insumos/InsumosScreens'
import { VetConnectScreen, VetProfileScreen, VetScheduleScreen } from './features/vet/VetConnectScreens'
import { UsadosFeedScreen, UsadoDetailScreen } from './features/usados/UsadosScreens'
import { VetVideoFeedScreen } from './features/videos/VetVideoScreen'

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const { LOTS } = useData()
  const { isDemo, isAuthenticated } = useAuth()
  const [screen, setScreen] = useState<Screen>('splash')
  const [history, setHistory] = useState<Screen[]>([])
  // Fluxo de autenticação (modo api): tela de origem p/ voltar após login e a
  // mensagem curta do gate ("Entre para favoritar" etc.).
  const [authReturn, setAuthReturn] = useState<Screen | null>(null)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedLotId, setSelectedLotId] = useState<number>(1)
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1)
  const [compareLotIds, setCompareLotIds] = useState<number[]>([1, 15])
  const [preFillLotId, setPreFillLotId] = useState<number | null>(null)
  const [buyFilters, setBuyFilters] = useState<BuyFilters | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1)
  // Fusão VetAgro: seleção de veterinário/anúncio + dica contextual da tela de vets
  const [selectedVetId, setSelectedVetId] = useState<string>('vt1')
  const [selectedUsadoId, setSelectedUsadoId] = useState<string>('u1')
  const [vetContext, setVetContext] = useState<string | undefined>(undefined)

  const navigate = (s: Screen, lotId?: number, farmId?: number) => {
    setHistory(prev => [...prev, screen])
    if (lotId !== undefined) setSelectedLotId(lotId)
    if (farmId !== undefined) setSelectedFarmId(farmId)
    setScreen(s)
  }
  const back = () => {
    if (history.length > 0) { setScreen(history[history.length - 1]); setHistory(prev => prev.slice(0, -1)) }
  }
  const goTab = (tab: Tab) => {
    setActiveTab(tab); setHistory([]); setVetContext(undefined)
    const screenMap: Record<Tab, Screen> = { home: 'home', market: 'market', academy: 'academy', business: 'business', profile: 'profile' }
    setScreen(screenMap[tab])
  }
  const navigateLot = (id: number) => navigate('lot-detail', id)
  const navigateFarm = (id: number) => { setSelectedFarmId(id); navigate('farm-profile') }
  const navigateCompare = (ids: number[]) => { setCompareLotIds(ids); navigate('compare') }
  const navigateSimulatorWithLot = (lotId: number) => { setPreFillLotId(lotId); navigate('simulator') }
  const navigateResults = (filters: BuyFilters) => { setBuyFilters(filters); navigate('results') }
  const navigateLesson = (courseId: number) => { setSelectedCourseId(courseId); navigate('lesson') }
  // ─── Fusão VetAgro: navegação ──────────────────────────────────────────────
  const goVetConnect = (context?: string) => { setVetContext(context); navigate('vet-connect') }
  const navigateVet = (id: string) => { setSelectedVetId(id); navigate('vet-profile') }
  const navigateVetSchedule = (id: string) => { setSelectedVetId(id); navigate('vet-schedule') }
  const navigateUsado = (id: string) => { setSelectedUsadoId(id); navigate('usado-detail') }

  // ─── Autenticação: gate + navegação para login/cadastro ────────────────────
  // goAuth lembra a tela de origem só ao ENTRAR no fluxo (persiste ao alternar
  // login↔cadastro) e NÃO usa a pilha de histórico, para não interferir no back
  // do app. leaveAuth volta à origem (sucesso ou cancelar).
  const goAuth = (target: 'login' | 'register', message?: string) => {
    setLoginMessage(message ?? null)
    if (screen !== 'login' && screen !== 'register') setAuthReturn(screen)
    setScreen(target)
  }
  const leaveAuth = () => {
    const target = authReturn ?? 'home'
    setLoginMessage(null)
    setAuthReturn(null)
    setScreen(target)
  }
  const promptLogin = (message?: string) => goAuth('login', message)
  const promptRegister = (message?: string) => goAuth('register', message)
  // requireAuth: em demo (mock) ou logado, roda a ação. Deslogado (api) => login.
  const requireAuth = (action: () => void, message?: string): boolean => {
    if (isDemo || isAuthenticated) { action(); return true }
    promptLogin(message ?? 'Entre para continuar')
    return false
  }
  const authGate: AuthGate = { requireAuth, promptLogin, promptRegister }

  const prefillLot = preFillLotId ? LOTS.find(l => l.id === preFillLotId) ?? null : null

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen onDone={() => setScreen('onboarding')} />
      case 'onboarding': return <OnboardingScreen onDone={() => setScreen('terms')} />
      case 'terms': return <TermsScreen onAccept={() => setScreen('home')} />
      case 'home': return <HomeScreen onNavigate={navigate} onTab={goTab} />
      case 'market': return <MarketScreen onBack={back} onTab={goTab} onNavigate={navigate} onCompare={navigateCompare} />
      case 'buy': return <BuyScreen onBack={back} onNavigate={navigate} onSearch={navigateResults} />
      case 'results': return <ResultsScreen onBack={back} onLot={navigateLot} onCompare={navigateCompare} filters={buyFilters} />
      case 'lot-detail': return <LotDetailScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} onFarm={navigateFarm} onSimulate={navigateSimulatorWithLot} />
      case 'match': return <BTAMatchScreen onBack={back} onLot={navigateLot} onNavigate={navigate} />
      case 'radar': return <RadarScreen onBack={back} onLot={navigateLot} />
      case 'sell': return <SellScreen onBack={back} onNavigate={navigate} />
      case 'create-listing': return <CreateListingScreen onBack={back} />
      case 'simulator': return <SimulatorScreen onBack={back} onNavigate={navigate} onCompare={navigateCompare} prefillLot={prefillLot} />
      case 'ai': return <AIScreen onBack={back} />
      case 'academy': return <AcademyScreen onBack={back} onTab={goTab} onLesson={navigateLesson} />
      case 'lesson': return <LessonScreen courseId={selectedCourseId} onBack={back} onNavigate={navigate} />
      case 'bta-path': return <BTAPathScreen onBack={back} onNavigate={navigate} />
      case 'business': return <BusinessScreen onTab={goTab} onLot={navigateLot} onNavigate={navigate} />
      case 'profile': return <ProfileScreen onTab={goTab} onNavigate={navigate} />
      case 'notifications': return <NotificationsScreen onBack={back} />
      case 'negotiation': return <NegotiationScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} />
      case 'bta-check': return <BTACheckScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} />
      case 'farm-profile': return <FarmProfileScreen farmId={selectedFarmId} onBack={back} onLot={navigateLot} onNavigate={navigate} />
      case 'opportunities': return <OpportunitiesScreen onBack={back} onLot={navigateLot} onCompare={navigateCompare} />
      case 'compare': return <CompareScreen lotIds={compareLotIds} onBack={back} onLot={navigateLot} onNavigate={navigate} />
      case 'deal-closed': return <DealClosedScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} />
      case 'bta-log': return <BTALogScreen lotId={selectedLotId} onBack={back} />
      case 'services': return <ServicesScreen onBack={back} onNavigate={navigate} />
      case 'favorites': return <FavoritesScreen onBack={back} onLot={navigateLot} onFarm={navigateFarm} />
      case 'bta-pro': return <BTAProScreen onBack={back} />
      case 'seller-analytics': return <SellerAnalyticsScreen onBack={back} />
      // ─── Fusão VetAgro ──────────────────────────────────────────────────────
      case 'insumos': return <InsumosHubScreen onNavigate={(s) => s === 'vet-connect' ? goVetConnect() : navigate(s)} onBack={back} />
      case 'insumos-marketplace': return <InsumosMarketplaceScreen onBack={back} onFindVet={(p) => goVetConnect(`Comprando "${p}"? Encontre um veterinário qualificado para aplicar com segurança.`)} />
      case 'insumos-estoque': return <InsumosEstoqueScreen onBack={back} />
      case 'insumos-coletiva': return <InsumosColetivaScreen onBack={back} />
      case 'insumos-alertas': return <InsumosAlertasScreen onBack={back} />
      case 'insumos-relatorios': return <InsumosRelatoriosScreen onBack={back} />
      case 'vet-connect': return <VetConnectScreen onBack={back} onVet={navigateVet} context={vetContext} />
      case 'vet-profile': return <VetProfileScreen vetId={selectedVetId} onBack={back} onSchedule={navigateVetSchedule} />
      case 'vet-schedule': return <VetScheduleScreen vetId={selectedVetId} onBack={back} onDone={() => goTab('home')} />
      case 'usados': return <UsadosFeedScreen onBack={back} onDetail={navigateUsado} />
      case 'usado-detail': return <UsadoDetailScreen listingId={selectedUsadoId} onBack={back} />
      case 'video-feed': return <VetVideoFeedScreen onBack={back} onFindVet={() => goVetConnect('Veja um veterinário próximo para realizar este procedimento com segurança.')} />
      case 'login': return <LoginScreen message={loginMessage} onSuccess={leaveAuth} onRegister={() => goAuth('register')} onBack={leaveAuth} />
      case 'register': return <RegisterScreen message={loginMessage} onSuccess={leaveAuth} onLogin={() => goAuth('login')} onBack={leaveAuth} />
      default: return <HomeScreen onNavigate={navigate} onTab={goTab} />
    }
  }

  return (
    <AuthGateProvider value={authGate}>
      <div className="min-h-screen flex items-start justify-center" style={{ background: '#DDE0DA' }}>
        <div className="relative w-full bg-bta-bg flex flex-col overflow-hidden" style={{ maxWidth: 390, minHeight: '100dvh' }}>
          <div key={screen} className={screen === 'splash' || screen === 'onboarding' || screen === 'terms' ? '' : 'slide-in'} style={{ display: 'contents' }}>
            {renderScreen()}
          </div>
        </div>
      </div>
    </AuthGateProvider>
  )
}
