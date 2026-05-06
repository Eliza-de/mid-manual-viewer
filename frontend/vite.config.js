import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages serves at /<repo-name>/, so we need base path
  // For dev mode, base is '/'
  const base = mode === 'production' ? '/mid-manual-viewer/' : '/';

  return {
    base,
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'antd': ['antd'],
            'antd-mobile': ['antd-mobile'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'liff': ['@line/liff']
          }
        }
      }
    },
    server: {
      port: 5173,
      host: true
    }
  };
});
