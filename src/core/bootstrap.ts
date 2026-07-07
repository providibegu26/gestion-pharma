/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Bootstrap du core — Composition root framework-agnostic
 * ─────────────────────────────────────────────────────────────────────────────
 *  Assemble dans l'ordre :
 *    1. HttpClient (Axios OU Fetch selon `VITE_HTTP_CLIENT`)
 *    2. Services métier qui consomment le HttpClient
 *    3. Stores qui consomment les services
 *    4. Câblage cross : le HttpClient appelle `auth.refresh()` sur 401,
 *       et `store.clear()` si le refresh échoue.
 *
 *  Aucun framework. Pour migrer vers Angular/Vue : appeler exactement la même
 *  fonction depuis le bootstrap natif du framework cible.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHttpClient, type HttpClient, type HttpClientKind } from './http'
import { API_URL } from '../config/api'
import {
  AuthService,
  CommandesService,
  FileAttenteService,
  FournisseursService,
  MedicamentsService,
  NotificationsService,
  OrdonnancesService,
  PatientsService,
  RolesService,
  SocketService,
  StockService,
  UsersService,
  VentesService,
} from './services'
import { AuthStore } from './stores'

export interface CoreContainer {
  http: HttpClient
  auth: AuthService
  users: UsersService
  commandes: CommandesService
  medicaments: MedicamentsService
  patients: PatientsService
  fournisseurs: FournisseursService
  stock: StockService
  ordonnances: OrdonnancesService
  ventes: VentesService
  notifications: NotificationsService
  roles: RolesService
  fileAttente: FileAttenteService
  socket: SocketService
  authStore: AuthStore
}

export interface BootstrapOptions {
  /** URL de base de l'API. Par défaut : import.meta.env.VITE_API_URL ?? '/api'. */
  baseURL?: string
  /** Force un client HTTP particulier. Par défaut : lu depuis VITE_HTTP_CLIENT. */
  httpClientKind?: HttpClientKind
  /** Hook appelé après un échec définitif du refresh (ex: redirection /login). */
  onAuthFailure?: () => void
}

const readEnvBaseURL = (): string => API_URL

export const createCore = (opts: BootstrapOptions = {}): CoreContainer => {
  // ─── 1. HTTP — câblage différé du refresh (auth service pas encore créé) ───
  let authServiceRef: AuthService | null = null
  let authStoreRef: AuthStore | null = null

  const http = createHttpClient({
    baseURL: opts.baseURL ?? readEnvBaseURL(),
    withCredentials: true,
    kind: opts.httpClientKind,
    onUnauthorized: async () => {
      if (!authServiceRef) return false
      try {
        await authServiceRef.refresh()
        return true
      } catch {
        return false
      }
    },
    onAuthFailure: () => {
      authStoreRef?.clear()
      opts.onAuthFailure?.()
    },
  })

  // ─── 2. Services ────────────────────────────────────────────────────────────
  const auth = new AuthService(http)
  const users = new UsersService(http)
  const commandes = new CommandesService(http)
  const medicaments = new MedicamentsService(http)
  const patients = new PatientsService(http)
  const fournisseurs = new FournisseursService(http)
  const stock = new StockService(http)
  const ordonnances = new OrdonnancesService(http)
  const ventes = new VentesService(http)
  const notifications = new NotificationsService(http)
  const roles = new RolesService(http)
  const fileAttente = new FileAttenteService(http)
  const socket = new SocketService()
  authServiceRef = auth

  // ─── 3. Stores ──────────────────────────────────────────────────────────────
  const authStore = new AuthStore(auth)
  authStoreRef = authStore

  return {
    http,
    auth,
    users,
    commandes,
    medicaments,
    patients,
    fournisseurs,
    stock,
    ordonnances,
    ventes,
    notifications,
    roles,
    fileAttente,
    socket,
    authStore,
  }
}
