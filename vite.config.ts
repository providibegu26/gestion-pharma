import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiMode = env.VITE_API_MODE ?? 'local'
  const proxyTarget =
    env.VITE_PROXY_TARGET ??
    (apiMode === 'tunnel'
      ? 'https://pharmacie.loophole.site'
      : 'http://localhost:3000')

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
          secure: proxyTarget.startsWith('https'),
          cookieDomainRewrite: proxyTarget.includes('loophole.site')
            ? { 'pharmacie.loophole.site': 'localhost' }
            : undefined,
        },
      },
    },

    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
            'vendor-query':  ['@tanstack/react-query'],
            'vendor-motion': ['framer-motion'],
            'vendor-ui':     ['lucide-react'],
            'vendor-axios':  ['axios'],
          },
        },
      },
      minify: 'esbuild',
      target: 'es2020',
    },

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
