import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Production env vars — hardcoded as fallback.
// These are NOT secrets (LIFF ID, channel ID, public Workers URL — all visible to client anyway).
const PROD_ENV = {
  VITE_LIFF_ID: '2009983667-uAwjnIIa',
  VITE_LINE_CHANNEL_ID: '2009983667',
  VITE_API_URL: 'https://mid-manual-api.elizanu-de.workers.dev'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // env file overrides hardcoded
  const finalEnv = { ...PROD_ENV, ...env }

  return {
    plugins: [react()],
    base: process.env.VITE_BASE || '/',

    define: {
      'import.meta.env.VITE_LIFF_ID': JSON.stringify(finalEnv.VITE_LIFF_ID),
      'import.meta.env.VITE_LINE_CHANNEL_ID': JSON.stringify(finalEnv.VITE_LINE_CHANNEL_ID),
      'import.meta.env.VITE_API_URL': JSON.stringify(finalEnv.VITE_API_URL)
    },

    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'antd': ['antd'],
            'liff': ['@line/liff']
          }
        }
      }
    },

    server: {
      port: 5173
    }
  }
})
