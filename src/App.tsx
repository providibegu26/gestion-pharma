import { useEffect, useMemo, useRef } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createCore } from '@/core'
import { ServicesProvider, useAuth } from '@/adapters/react'
import { AppRouter } from './router/AppRouter'
import { ToastContainer } from './components/ui/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initAuth } = useAuth()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}

export default function App() {
  // Création du container core une seule fois — le HTTP, les services et le store
  // sont alors stables pour toute la vie de l'app (HMR-safe en dev grâce à useMemo).
  // Pas de redirection dure ici : le bootstrap appelle déjà `authStore.clear()`
  // sur échec définitif du refresh. `ProtectedRoute` détecte alors l'absence
  // d'utilisateur et redirige via React Router (sans rechargement complet).
  // Un `window.location.href` provoquerait un reload → boucle au démarrage.
  const core = useMemo(() => createCore(), [])

  return (
    <ErrorBoundary>
      <ServicesProvider container={core}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthInitializer>
              <AppRouter />
              <ToastContainer />
            </AuthInitializer>
          </BrowserRouter>
        </QueryClientProvider>
      </ServicesProvider>
    </ErrorBoundary>
  )
}
