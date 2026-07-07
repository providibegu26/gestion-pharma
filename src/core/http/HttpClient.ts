/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HttpClient — Interface abstraite (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Tous les services consomment cette interface. Le choix d'implémentation
 *  (Axios, Fetch natif, ou autre) se fait dans `core/http/index.ts` via une
 *  factory, paramétrable par variable d'environnement.
 *
 *  Pour basculer Axios → Fetch (ou inverse) : changer UNE seule ligne dans
 *  `core/http/index.ts` (ou la valeur de VITE_HTTP_CLIENT dans .env).
 *  Aucun service ni aucune page n'a besoin d'être modifié.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface HttpRequestConfig {
  /** Headers additionnels (mergés avec les defaults du client) */
  headers?: Record<string, string>
  /** Query string (sera sérialisée par l'implémentation) */
  params?: Record<string, string | number | boolean | undefined | null>
  /** Timeout en ms (0 ou undefined = pas de timeout) */
  timeout?: number
  /** Envoyer les cookies cross-origin (par défaut true pour ce projet) */
  withCredentials?: boolean
  /** Signal d'annulation (AbortController) */
  signal?: AbortSignal
  /**
   * Type de contenu attendu en réponse.
   * - `json` (défaut) : parse JSON si possible, sinon texte.
   * - `text` : force response.text()
   * - `blob` : utile pour les fichiers (ex: ticket PDF)
   * - `arrayBuffer` : utile pour traitements binaires avancés.
   */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer'
}

/**
 * Contrat minimaliste d'un client HTTP. Toute méthode résout avec le corps
 * désérialisé (JSON) et rejette avec une `HttpError` en cas d'échec.
 */
export interface HttpClient {
  get<T>(url: string, config?: HttpRequestConfig): Promise<T>
  post<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T>
  put<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T>
  patch<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T>
  delete<T>(url: string, config?: HttpRequestConfig): Promise<T>
}

/** Options passées à toutes les implémentations à l'instanciation. */
export interface HttpClientOptions {
  baseURL: string
  /** Envoyer les cookies par défaut (auth via cookies HTTP-only) */
  withCredentials?: boolean
  /** Headers par défaut (ex: { 'Content-Type': 'application/json' }) */
  defaultHeaders?: Record<string, string>
  /** Hook appelé sur 401 pour tenter un refresh — doit renvoyer true si succès */
  onUnauthorized?: () => Promise<boolean>
  /** Hook appelé après échec définitif du refresh (logout / redirection) */
  onAuthFailure?: () => void
}
