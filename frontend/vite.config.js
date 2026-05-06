import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config supports both Cloudflare Pages (base = '/') and GitHub Pages (base = '/mid-manual-viewer/')
// To deploy to GitHub Pages: set VITE_BASE=/mid-manual-viewer/ before build.
// To deploy to Cloudflare Pages: leave VITE_BASE empty (default to '/').

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'antd': ['antd', '@ant-design/icons'],
          'antd-mobile': ['antd-mobile'],
          'liff': ['@line/liff']
        }
      }
    }
  },
  server: {
    port: 5173
  }
})
