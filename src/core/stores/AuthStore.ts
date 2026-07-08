/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AuthStore — État d'authentification global (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Étend Observable<AuthState>
 *  - Persiste l'utilisateur dans `sessionStorage` (1 session = 1 onglet)
 *    → Permet d'ouvrir plusieurs onglets avec des rôles différents en local.
 *  - Expose une API métier : init/login/register/logout/changePassword
 *  - Délègue les appels HTTP à `AuthService` (injecté)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AuthService } from '../services/AuthService'
import type {
  ChangePasswordPayload,
  RegisterClientPayload,
  Role,
  User,
} from '../types'
import { getRoleDefinition } from '../permissions'
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

// ─── Persistance sessionStorage (indépendante par onglet) ────────────────────

const safeWindow = (): Window | null =>
  typeof window === 'undefined' ? null : window

const loadFromStorage = (): Partial<AuthState> => {
  const w = safeWindow()
  if (!w) return {}
  try {
    const raw = w.sessionStorage.getItem(STORAGE_KEY)
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
    if (state.user) {
      w.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: state.user, isAuthenticated: state.isAuthenticated }),
      )
    } else {
      w.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch { /* quota dépassé / mode privé : silencieux */ }
}

// ─── Garde contre les initialisations parallèles ─────────────────────────────
let _initInProgress = false

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
  isCaissier    = (): boolean => this.hasRole('CAISSIER')
  isClient      = (): boolean => this.hasRole('CLIENT')
  isStaff       = (): boolean => this.hasRole('ADMIN', 'PHARMACIEN', 'CAISSIER')
  isProfessionnel = (): boolean => !this.isClient() && this.getUser() !== null

  /** Route d'accueil par défaut selon le rôle (déléguée au registre). */
  homeForRole = (): string => {
    const role = this.getUser()?.role
    if (!role) return '/login-staff'
    return getRoleDefinition(role).home
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Vérifie la session via `GET /auth/me` au démarrage de l'app.
   * - Ne relance PAS si déjà en cours (protection anti double-appel HMR/StrictMode).
   * - Si l'utilisateur est déjà en sessionStorage, on suppose qu'il est connecté
   *   et on tente une validation silencieuse en arrière-plan sans bloquer l'UI.
   */
  init = async (): Promise<void> => {
    if (_initInProgress) return
    _initInProgress = true

    const hasStoredSession = !!this.getState().user

    if (!hasStoredSession) {
      // Pas de session locale → vérifier le cookie avec le backend
      this.setState((s) => ({ ...s, isLoading: true }))
    }

    try {
      // Timeout généreux : le backend tunnel (Loophole) peut être lent au 1er hit.
      const user = await this.authService.me({ timeout: 10000 })
      this.setUser(user)
    } catch {
      if (!hasStoredSession) {
        // Pas de session valide → déconnecté
        this.setState({ user: null, isAuthenticated: false, isLoading: false })
      } else {
        // Session locale présente mais vérification impossible (backend lent,
        // hors-ligne, 401 ponctuel) → on GARDE la session. L'utilisateur n'est
        // déconnecté que par un logout explicite. Politique permissive assumée.
        this.setState((s) => ({ ...s, isLoading: false }))
      }
    } finally {
      _initInProgress = false
    }
  }

  login = async (email: string, motDePasse: string): Promise<User> => {
    const user = await this.authService.login({ email, motDePasse })
    this.setUser(user)
    return user
  }

  /**
   * Connexion directe via objet User (mode test/démo).
   * Utilisé par les boutons de connexion rapide sur la page login.
   */
  loginAs = (user: User): void => {
    this.setUser(user)
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
