// BTA — Contexto de autenticação do app.
//
// Uma única fonte de verdade sobre "quem está logado". Envolve todo o app (em
// src/main.tsx, ACIMA do DataProvider — o DataProvider observa o token daqui
// para reidratar as coleções pessoais quando o usuário entra/sai).
//
// DOIS MODOS, controlados por VITE_DATA_SOURCE (o mesmo switch do DataProvider):
//
//   • mock (padrão, o APK/demo): NÃO há backend. `isDemo` = true, o usuário é um
//     demo fixo ("Rafael") e `isAuthenticated` é sempre true. login/register/
//     logout/deleteAccount são no-ops. O app roda exatamente como hoje, sem
//     login e sem gate. ZERO mudança de comportamento.
//
//   • api: autenticação real contra /api/auth. No boot, se houver token no
//     localStorage, chama GET /auth/me para reidratar o usuário; um 401 limpa o
//     token (deslogado). login/register guardam token+usuário; logout e
//     deleteAccount limpam tudo.
//
// Segurança: só o token (opaco) é persistido, no localStorage (ver ./token.ts).
// Senha e token NUNCA são logados.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import { getStoredToken, setStoredToken, clearStoredToken } from './token'

// Forma pública do usuário — espelha o contrato do backend
// (server: PublicUser). email/location podem ser nulos.
export interface AuthUser {
  id: number
  name: string
  email: string | null
  userType: string
  location: string | null
}

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isDemo: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

// Erro de autenticação com mensagem já AMIGÁVEL (pronta para exibir na UI).
export class AuthError extends Error {}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const IS_DEMO = (import.meta.env.VITE_DATA_SOURCE ?? 'mock') !== 'api'

// Usuário demo do modo mock — o mesmo "Rafael" que o app sempre mostrou.
const DEMO_USER: AuthUser = {
  id: 0,
  name: 'Rafael Mendonça',
  email: 'rafael@bta.agr.br',
  userType: 'Comprador e Investidor',
  location: 'São José do Rio Preto, SP',
}

const AuthContext = createContext<AuthContextValue | null>(null)

// fetch tipado para as rotas /api/auth com JSON de ida e volta.
async function authFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}/api/auth${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

// Lê o campo `error` de uma resposta de erro, se houver (para 400 mais preciso).
async function readError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: unknown }
    return typeof data.error === 'string' ? data.error : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Em demo: usuário fixo, sem token. Em api: token vem do localStorage (síncrono,
  // então o DataProvider já faz o 1º fetch autenticado) e o usuário é reidratado
  // via /auth/me logo abaixo.
  const [token, setToken] = useState<string | null>(() => (IS_DEMO ? null : getStoredToken()))
  const [user, setUser] = useState<AuthUser | null>(() => (IS_DEMO ? DEMO_USER : null))

  // Boot (api): reidrata o usuário a partir do token; 401 => desloga.
  useEffect(() => {
    if (IS_DEMO) return
    const t = getStoredToken()
    if (!t) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch('/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${t}` },
        })
        if (cancelled) return
        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser }
          setUser(data.user)
        } else if (res.status === 401) {
          clearStoredToken()
          setToken(null)
          setUser(null)
        }
        // outros status (ex.: 500) — mantém o token; tenta de novo no próximo boot.
      } catch {
        // erro de rede no boot — mantém o token; o usuário segue navegando.
      }
    })()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (IS_DEMO) return
    let res: Response
    try {
      res = await authFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new AuthError('Não foi possível conectar ao servidor. Verifique sua conexão.')
    }
    if (!res.ok) {
      if (res.status === 401) throw new AuthError('E-mail ou senha inválidos.')
      if (res.status === 400) throw new AuthError('Preencha e-mail e senha corretamente.')
      throw new AuthError('Não foi possível entrar agora. Tente novamente.')
    }
    const data = (await res.json()) as { token: string; user: AuthUser }
    setStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (IS_DEMO) return
    let res: Response
    try {
      res = await authFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
    } catch {
      throw new AuthError('Não foi possível conectar ao servidor. Verifique sua conexão.')
    }
    if (!res.ok) {
      if (res.status === 409) throw new AuthError('Este e-mail já está cadastrado. Tente entrar.')
      if (res.status === 400) {
        const msg = await readError(res)
        throw new AuthError(msg ?? 'Dados inválidos. Confira nome, e-mail e senha (mín. 8 caracteres).')
      }
      throw new AuthError('Não foi possível criar a conta agora. Tente novamente.')
    }
    const data = (await res.json()) as { token: string; user: AuthUser }
    setStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    if (IS_DEMO) return
    const t = getStoredToken()
    // Limpa o estado local primeiro (a sessão é stateless no servidor).
    clearStoredToken()
    setToken(null)
    setUser(null)
    if (t) {
      try {
        await authFetch('/logout', { method: 'POST' })
      } catch {
        /* best-effort — o token já foi descartado localmente */
      }
    }
  }, [])

  const deleteAccount = useCallback(async () => {
    if (IS_DEMO) return
    const t = getStoredToken()
    if (!t) {
      clearStoredToken()
      setToken(null)
      setUser(null)
      return
    }
    let res: Response
    try {
      res = await authFetch('/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      })
    } catch {
      throw new AuthError('Não foi possível excluir a conta agora. Tente novamente.')
    }
    if (res.status !== 204) {
      throw new AuthError('Não foi possível excluir a conta agora. Tente novamente.')
    }
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    // Em demo, sempre "logado". Em api, presença de token = sessão ativa.
    isAuthenticated: IS_DEMO || token !== null,
    isDemo: IS_DEMO,
    login,
    register,
    logout,
    deleteAccount,
  }), [user, token, login, register, logout, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() precisa estar dentro de <AuthProvider>.')
  }
  return ctx
}
