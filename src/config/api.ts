/**
 * Configuration API / WebSocket — alignée sur GUIDE_FRONTEND.md §2
 */

type ApiMode = 'local' | 'tunnel'

const MODES = {
  local: {
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'http://localhost:3000',
    proxyTarget: 'http://localhost:3000',
  },
  tunnel: {
    apiUrl: 'https://pharmacie.loophole.site/api',
    wsUrl: 'https://pharmacie.loophole.site',
    proxyTarget: 'https://pharmacie.loophole.site',
  },
} as const

const readMode = (): ApiMode => {
  const raw = import.meta.env.VITE_API_MODE
  return raw === 'tunnel' ? 'tunnel' : 'local'
}

const mode = readMode()
const defaults = MODES[mode]

/** URL de base REST (avec préfixe /api) */
export const API_URL = import.meta.env.VITE_API_URL ?? defaults.apiUrl

/** URL Socket.IO (sans /api) */
export const WS_URL = import.meta.env.VITE_WS_URL ?? defaults.wsUrl

/** Cible du proxy Vite (dev uniquement) */
export const PROXY_TARGET = import.meta.env.VITE_PROXY_TARGET ?? defaults.proxyTarget

export const API_MODE = mode

if (import.meta.env.DEV) {
  console.info(`[API] Mode: ${mode} → ${API_URL} | WS: ${WS_URL}`)
}
