/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AuthStore — État d'authentification global (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Étend Observable<AuthState>
 *  - Persiste l'utilisateur dans `localStorage` (clé STORAGE_KEY)
 *  - Expose une API métier : init/login/register/logout/changePassword
 *  - Délègue les appels HTTP à `AuthService` (injecté)
 *
 *  Pas de hook, pas de décorateur Angular, pas de composition Vue.
 *  Les adaptateurs (react/angular/vue) viennent S'ABONNER à `subscribe()`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AuthService } from '../services/AuthService'
import type {
  ChangePasswordPayload,
  RegisterClientPayload,
  Role,
  User,
} from '../types'
import { Observable } from './Observable'

const STORAGE_KEY = 'pharma-auth'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const INITIAL: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

// ─── Persistance localStorage ───────────────────────────────────────────────

const safeWindow = (): Window | null =>
  typeof window === 'undefined' ? null : window

const loadFromStorage = (): Partial<AuthState> => {
  const w = safeWindow()
  if (!w) return {}
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<AuthState>
    return {
      user: parsed.user ?? null,
      isAuthenticated: !!parsed.isAuthenticated,
    }
  } catch {
    return {}
  }
}

const persist = (state: AuthState) => {
  const w = safeWindow()
  if (!w) return
  try {
    w.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: state.user, isAuthenticated: state.isAuthenticated }),
    )
  } catch { /* quota dépassé / mode privé : silencieux */ }
}

// ─── Store ──────────────────────────────────────────────────────────────────

export class AuthStore extends Observable<AuthState> {
  constructor(private readonly authService: AuthService) {
    super({ ...INITIAL, ...loadFromStorage() })
    this.subscribe(persist)
  }

  // ─── Sélecteurs ──────────────────────────────────────────────────────────

  getUser = (): User | null => this.getState().user
  hasRole = (...roles: Role[]): boolean => {
    const u = this.getUser()
    return !!u && roles.includes(u.role)
  }
  isAdmin       = (): boolean => this.hasRole('ADMIN')
  isPharmacien  = (): boolean => this.hasRole('PHARMACIEN')
  isPreparateur = (): boolean => false
  isCaissier    = (): boolean => this.hasRole('ADMIN', 'CAISSIER')
  isClient      = (): boolean => this.hasRole('CLIENT')
  isStaff       = (): boolean => this.hasRole('ADMIN', 'PHARMACIEN', 'CAISSIER')
  isProfessionnel = (): boolean => !this.isClient() && this.getUser() !== null

  /** Route d'accueil par défaut selon le rôle. */
  homeForRole = (): string => {
    const role = this.getUser()?.role
    switch (role) {
      case 'ADMIN':       return '/professionnel'
      case 'PHARMACIEN':
      case 'CAISSIER':    return '/professionnel'
      case 'PREPARATEUR': return '/login-staff'
      case 'CLIENT':      return '/client/produits'
      default:            return '/login-staff'
    }
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  /** À appeler au démarrage de l'app pour récupérer le user via le cookie. */
  init = async (): Promise<void> => {
    this.setState((s) => ({ ...s, isLoading: true }))
    try {
      // Timeout court pour éviter de bloquer l'UI sur écran de chargement
      // quand le backend est indisponible ou lent.
      const user = await this.authService.me({ timeout: 5000 })
      this.setUser(user)
    } catch {
      // Pas de session valide — on reste déconnecté
      this.setState((s) => ({ ...s, isLoading: false }))
    }
  }

  login = async (email: string, motDePasse: string): Promise<User> => {
    const user = await this.authService.login({ email, motDePasse })
    this.setUser(user)
    return user
  }

  register = async (payload: RegisterClientPayload): Promise<User> => {
    return this.authService.register(payload)
  }

  changePassword = (payload: ChangePasswordPayload): Promise<string> => {
    return this.authService.changePassword(payload)
  }

  signOut = async (): Promise<void> => {
    try { await this.authService.logout() } catch { /* ignore */ }
    this.clear()
  }

  /** Utilisé par le HttpClient lors d'un échec définitif de refresh. */
  clear = (): void => {
    this.setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  private setUser = (user: User | null) => {
    this.setState({ user, isAuthenticated: !!user, isLoading: false })
  }
}
