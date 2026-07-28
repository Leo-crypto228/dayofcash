import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5178,
    allowedHosts: true, // allow LAN IP + tunnel hostnames (trycloudflare, etc.)
  },
  preview: {
    host: true,
    port: 5178,
    strictPort: true,
    allowedHosts: true, // production preview served over the tunnel
  },
})
