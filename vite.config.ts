import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Cible du proxy Vite (/api). Par défaut : tunnel Loophole.
  // Basculer en local : VITE_PROXY_TARGET=http://localhost:3000 dans .env
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://pharmacie.loophole.site'
  const isLocalProxy = proxyTarget.includes('localhost')

  return {
  plugins: [react()],

  resolve: {
    alias: { '@': '/src' },
  },

  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: !isLocalProxy,
        ...(isLocalProxy ? {} : { cookieDomainRewrite: { 'pharmacie.loophole.site': 'localhost' } }),
      },
      // Note : Socket.IO (socket.io-client) se connecte DIRECTEMENT à l'URL backend
      // (définie dans VITE_WS_URL), pas via le proxy Vite — pas de proxy /socket.io ici.
    },
  },

  build: {
    // Augmenter la limite d'avertissement (images légitimement grandes)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Séparer les vendors lourds en chunks dédiés — mis en cache séparément
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui':     ['lucide-react'],
          'vendor-axios':  ['axios'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
    // Activer la minification avancée
    minify: 'esbuild',
    target: 'es2020',
  },

  // Pré-bundler les dépendances les plus lourdes dès le démarrage
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'axios',
      'lucide-react',
      '@tanstack/react-query',
      'socket.io-client',
    ],
  },
  }
})
