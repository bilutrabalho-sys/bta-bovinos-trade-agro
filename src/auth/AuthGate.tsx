// BTA — "Portão" de autenticação para ações de alto valor.
//
// O contexto vive AQUI (tipo + hook), mas o valor é fornecido pelo App
// (src/App.tsx), que é quem detém a navegação por useState. Assim qualquer tela
// pede `useAuthGate()` sem precisar receber navegação por props.
//
// Modelo "entregar valor → pedir cadastro":
//   • Em modo demo (mock) NADA muda: requireAuth roda a ação direto.
//   • Em modo api, se o visitante estiver deslogado e tentar uma ação que exige
//     conta (favoritar, propor, anunciar, criar alerta, salvar simulação), ele é
//     levado à tela de login com uma mensagem curta ("Entre para continuar").

import { createContext, useContext } from 'react'

export interface AuthGate {
  // Roda `action` se permitido (modo demo ou usuário logado). Caso contrário,
  // leva ao login com uma mensagem curta e devolve false (ação NÃO rodou).
  requireAuth: (action: () => void, message?: string) => boolean
  // Leva o usuário ao login com uma mensagem (ex.: sessão expirada em um 401).
  promptLogin: (message?: string) => void
  // Leva o usuário direto à tela de cadastro.
  promptRegister: (message?: string) => void
}

const AuthGateContext = createContext<AuthGate | null>(null)

export const AuthGateProvider = AuthGateContext.Provider

export function useAuthGate(): AuthGate {
  const ctx = useContext(AuthGateContext)
  if (!ctx) {
    throw new Error('useAuthGate() precisa estar dentro de <AuthGateProvider>.')
  }
  return ctx
}
