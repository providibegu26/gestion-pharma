import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': '/src' },
  },

  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'https://pharmacie.loophole.site',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: { 'pharmacie.loophole.site': 'localhost' },
      },
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
    ],
  },
})
