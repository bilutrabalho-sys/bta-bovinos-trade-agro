/// <reference types="vite/client" />

// Variáveis de ambiente do app BTA.
// - VITE_DATA_SOURCE: 'mock' (padrão) consome os dados fictícios locais;
//   'api' consome o backend HTTP real.
// - VITE_API_URL: base do backend no modo 'api' (padrão http://localhost:3001).
interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'api'
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
