// Porta única de import dos componentes compartilhados.
// Qualquer tela importa daqui: import { LotCard, Header } from '@/components'
// Os arquivos ficam organizados por tipo nas subpastas abaixo.

// Base do design system (ícones + botão com ripple/som)
export { Ic } from './foundation/icons'
export { Btn } from './foundation/Button'

// Identidade / marca BTA
export { BTALogo } from './brand/BTALogo'
export { VerifiedBadge } from './brand/VerifiedBadge'
export { BTAScore } from './brand/BTAScore'

// Cards de conteúdo
export { LotCard } from './cards/LotCard'
export { PriceCard } from './cards/PriceCard'

// Navegação (header + bottom nav)
export { Header } from './navigation/Header'
export { BottomNav } from './navigation/BottomNav'

// Controles de UI
export { SectionTitle } from './controls/SectionTitle'
export { Chip } from './controls/Chip'
