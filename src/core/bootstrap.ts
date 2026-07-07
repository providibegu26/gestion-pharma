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
import {
  AuthService,
  CodesQrService,
  CommandesService,
  FournisseursService,
  MedicamentsService,
  NotificationsService,
  OrdonnancesService,
  PatientsService,
  QueueService,
  RolesService,
  StockService,
  UsersService,
  VentesService,
} from './services'
import { AuthStore } from './stores'
import { QueueStore } from './queue'

export interface CoreContainer {
  http: HttpClient
  auth: AuthService
  users: UsersService
  roles: RolesService
  commandes: CommandesService
  medicaments: MedicamentsService
  patients: PatientsService
  fournisseurs: FournisseursService
  stock: StockService
  ordonnances: OrdonnancesService
  ventes: VentesService
  notifications: NotificationsService
  queue: QueueService
  codesQr: CodesQrService
  authStore: AuthStore
  /** File d'attente locale (fallback démontrable si /file-attente est indisponible). */
  queueStore: QueueStore
  /** URL du serveur WebSocket temps réel (Socket.IO). */
  wsUrl: string
}

export interface BootstrapOptions {
  /** URL de base de l'API. Par défaut : import.meta.env.VITE_API_URL ?? '/api'. */
  baseURL?: string
  /** Force un client HTTP particulier. Par défaut : lu depuis VITE_HTTP_CLIENT. */
  httpClientKind?: HttpClientKind
  /** Hook appelé après un échec définitif du refresh (ex: redirection /login). */
  onAuthFailure?: () => void
}

const readEnv = (): Record<string, string> => {
  try {
    return (import.meta as unknown as { env?: Record<string, string> }).env ?? {}
  } catch {
    return {}
  }
}

const readEnvBaseURL = (): string => readEnv().VITE_API_URL ?? '/api'

/**
 * URL du serveur WebSocket (Socket.IO).
 *  1. VITE_WS_URL si défini explicitement → utilisé tel quel.
 *  2. VITE_API_URL absolu (http://host:port/api → http://host:port).
 *  3. Sinon (mode proxy Vite, VITE_API_URL vide) → chaîne vide : temps réel désactivé.
 *     Dans ce cas, le RealtimeBridge ne tente pas de connexion et l'app reste fonctionnelle.
 *
 * Chaîne vide = temps réel désactivé (repli silencieux).
 */
const readEnvWsURL = (): string => {
  const env = readEnv()
  if (env.VITE_WS_URL) return env.VITE_WS_URL
  const api = env.VITE_API_URL ?? ''
  const m = api.match(/^(https?:\/\/[^/]+)/)
  // En mode proxy Vite (VITE_API_URL vide ou relatif), on ne peut pas déduire l'URL WS :
  // Socket.IO doit se connecter directement au backend, pas à Vite. On désactive.
  return m ? m[1] : ''
}

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
  const roles = new RolesService(http)
  const commandes = new CommandesService(http)
  const medicaments = new MedicamentsService(http)
  const patients = new PatientsService(http)
  const fournisseurs = new FournisseursService(http)
  const stock = new StockService(http)
  const ordonnances = new OrdonnancesService(http)
  const ventes = new VentesService(http)
  const notifications = new NotificationsService(http)
  const queue = new QueueService(http)
  const codesQr = new CodesQrService(http)
  authServiceRef = auth

  // ─── 3. Stores ──────────────────────────────────────────────────────────────
  const authStore = new AuthStore(auth)
  authStoreRef = authStore
  const queueStore = new QueueStore()

  return {
    http,
    auth,
    users,
    roles,
    commandes,
    medicaments,
    patients,
    fournisseurs,
    stock,
    ordonnances,
    ventes,
    notifications,
    queue,
    codesQr,
    authStore,
    queueStore,
    wsUrl: readEnvWsURL(),
  }
}
