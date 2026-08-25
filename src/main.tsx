import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { DataProvider } from './data/DataProvider'
import './index.css'

// AuthProvider fica ACIMA do DataProvider: o DataProvider observa o token do
// AuthContext para reidratar as coleções pessoais ao logar/deslogar.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)
