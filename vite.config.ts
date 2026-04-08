import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    // Client build must clear dist; SSR build writes only to dist/server (nested).
    emptyOutDir: !isSsrBuild,
  },
  ssr: {
    noExternal: ['react-router', 'react-router-dom'],
  },
}))
