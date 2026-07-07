import { useEffect, useMemo, useRef } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createCore } from '@/core'
import { ServicesProvider, useAuth } from '@/adapters/react'
import { AppRouter } from './router/AppRouter'
import { ToastContainer } from './components/ui/Toast'

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
  const core = useMemo(
    () => createCore({
      onAuthFailure: () => {
        if (typeof window !== 'undefined') window.location.href = '/login-staff'
      },
    }),
    [],
  )

  return (
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
  )
}
