// BTA — Armazenamento do token de sessão (JWT) no localStorage.
//
// Fonte ÚNICA da verdade sobre onde o token vive, compartilhada entre o
// AuthContext (que faz login/logout) e a camada de dados (src/data/api.ts, que
// anexa o token em cada requisição). Mantê-lo aqui evita import circular entre
// os dois e garante que ambos leem/escrevem exatamente a mesma chave.
//
// Segurança: guardamos SOMENTE o token (opaco) — nunca a senha. Todas as
// operações são defensivas: em contextos sem localStorage (SSR, modo privado
// restrito) elas falham em silêncio em vez de derrubar o app.

const TOKEN_KEY = 'bta_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage indisponível — no-op */
  }
}
