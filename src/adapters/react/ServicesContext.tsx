/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ServicesContext — Pont entre le core agnostique et React
 * ─────────────────────────────────────────────────────────────────────────────
 *  Le `CoreContainer` (créé par `createCore()` du core) est injecté dans l'arbre
 *  React via ce context. Les hooks `useServices()` / `useAuthStore()` viennent
 *  ensuite lire ce container.
 *
 *  Pour Angular : remplacer par un `Injectable` qui expose le container.
 *  Pour Vue     : remplacer par un `provide()` au niveau de l'app.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { CoreContainer } from '@/core'

const ServicesContext = createContext<CoreContainer | null>(null)

export interface ServicesProviderProps {
  container: CoreContainer
  children: ReactNode
}

export const ServicesProvider = ({ container, children }: ServicesProviderProps) => (
  <ServicesContext.Provider value={container}>{children}</ServicesContext.Provider>
)

export const useServices = (): CoreContainer => {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices() must be used inside <ServicesProvider>.')
  return ctx
}
