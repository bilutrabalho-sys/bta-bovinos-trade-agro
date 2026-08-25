import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Libera hosts de túnel (Cloudflare / ngrok / localtunnel) para testar em outros dispositivos
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', '.loca.lt'],
    // No modo `api`, o app chama `/api/...` no mesmo endereço; o dev server
    // repassa para o backend Express (localhost:3001). Assim um único túnel
    // serve app + API, sem CORS e sem expor a porta 3001.
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
