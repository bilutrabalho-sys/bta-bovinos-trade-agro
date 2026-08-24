import { useState } from 'react'
import { LOTS } from './data/mock'
import type { Screen, Tab } from './core/navigation'
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

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [history, setHistory] = useState<Screen[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [selectedLotId, setSelectedLotId] = useState<number>(1)
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1)
  const [compareLotIds, setCompareLotIds] = useState<number[]>([1, 15])
  const [preFillLotId, setPreFillLotId] = useState<number | null>(null)

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
    setActiveTab(tab); setHistory([])
    const screenMap: Record<Tab, Screen> = { home: 'home', market: 'market', academy: 'academy', business: 'business', profile: 'profile' }
    setScreen(screenMap[tab])
  }
  const navigateLot = (id: number) => navigate('lot-detail', id)
  const navigateFarm = (id: number) => { setSelectedFarmId(id); navigate('farm-profile') }
  const navigateCompare = (ids: number[]) => { setCompareLotIds(ids); navigate('compare') }
  const navigateSimulatorWithLot = (lotId: number) => { setPreFillLotId(lotId); navigate('simulator') }

  const prefillLot = preFillLotId ? LOTS.find(l => l.id === preFillLotId) ?? null : null

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen onDone={() => setScreen('onboarding')} />
      case 'onboarding': return <OnboardingScreen onDone={() => setScreen('terms')} />
      case 'terms': return <TermsScreen onAccept={() => setScreen('home')} />
      case 'home': return <HomeScreen onNavigate={navigate} onTab={goTab} />
      case 'market': return <MarketScreen onBack={back} onTab={goTab} onNavigate={navigate} />
      case 'buy': return <BuyScreen onBack={back} onNavigate={navigate} />
      case 'results': return <ResultsScreen onBack={back} onLot={navigateLot} onCompare={navigateCompare} />
      case 'lot-detail': return <LotDetailScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} onFarm={navigateFarm} onSimulate={navigateSimulatorWithLot} />
      case 'match': return <BTAMatchScreen onBack={back} onLot={navigateLot} />
      case 'radar': return <RadarScreen onBack={back} />
      case 'sell': return <SellScreen onBack={back} onNavigate={navigate} />
      case 'create-listing': return <CreateListingScreen onBack={back} />
      case 'simulator': return <SimulatorScreen onBack={back} onNavigate={navigate} prefillLot={prefillLot} />
      case 'ai': return <AIScreen onBack={back} />
      case 'academy': return <AcademyScreen onBack={back} onTab={goTab} onLesson={() => navigate('lesson')} />
      case 'lesson': return <LessonScreen onBack={back} onNavigate={navigate} />
      case 'bta-path': return <BTAPathScreen onBack={back} onNavigate={navigate} />
      case 'business': return <BusinessScreen onTab={goTab} />
      case 'profile': return <ProfileScreen onTab={goTab} onNavigate={navigate} />
      case 'notifications': return <NotificationsScreen onBack={back} />
      case 'negotiation': return <NegotiationScreen onBack={back} onNavigate={navigate} />
      case 'bta-check': return <BTACheckScreen onBack={back} onNavigate={navigate} />
      case 'farm-profile': return <FarmProfileScreen farmId={selectedFarmId} onBack={back} onLot={navigateLot} />
      case 'opportunities': return <OpportunitiesScreen onBack={back} onLot={navigateLot} />
      case 'compare': return <CompareScreen lotIds={compareLotIds} onBack={back} onLot={navigateLot} onNavigate={navigate} />
      case 'deal-closed': return <DealClosedScreen lotId={selectedLotId} onBack={back} onNavigate={navigate} />
      case 'bta-log': return <BTALogScreen onBack={back} />
      case 'services': return <ServicesScreen onBack={back} onNavigate={navigate} />
      case 'favorites': return <FavoritesScreen onBack={back} onLot={navigateLot} />
      case 'bta-pro': return <BTAProScreen onBack={back} />
      case 'seller-analytics': return <SellerAnalyticsScreen onBack={back} />
      default: return <HomeScreen onNavigate={navigate} onTab={goTab} />
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center" style={{ background: '#DDE0DA' }}>
      <div className="relative w-full bg-bta-bg flex flex-col overflow-hidden" style={{ maxWidth: 390, minHeight: '100dvh' }}>
        <div key={screen} className={screen === 'splash' || screen === 'onboarding' || screen === 'terms' ? '' : 'slide-in'} style={{ display: 'contents' }}>
          {renderScreen()}
        </div>
      </div>
    </div>
  )
}
