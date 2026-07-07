/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useAuth — Hook React qui expose l'AuthStore du core
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Lit l'état réactif via useObservable
 *  - Ré-expose les actions du store pour un usage idiomatique React
 *
 *  Équivalent Angular : un service `@Injectable({ providedIn: 'root' })`
 *  Équivalent Vue     : un composable `useAuth()` retournant des refs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useServices } from '../ServicesContext'
import { useObservable } from './useObservable'

export const useAuth = () => {
  const { authStore } = useServices()
  const state = useObservable(authStore)

  return {
    // état
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,

    // actions
    initAuth: authStore.init,
    login: authStore.login,
    register: authStore.register,
    changePassword: authStore.changePassword,
    signOut: authStore.signOut,

    // sélecteurs
    hasRole: authStore.hasRole,
    isAdmin: authStore.isAdmin,
    isPharmacien: authStore.isPharmacien,
    isPreparateur: authStore.isPreparateur,
    isCaissier: authStore.isCaissier,
    isClient: authStore.isClient,
    isStaff: authStore.isStaff,
    isProfessionnel: authStore.isProfessionnel,
    homeForRole: authStore.homeForRole,
  }
}
