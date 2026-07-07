/**
 * Types partagés entre MockHttpClient et les handlers de mocks.
 */

export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface MockHandlerContext {
  /** Paramètres d'URL extraits du pattern (ex: ':id') dans l'ordre */
  params: string[]
  /** Body JSON désérialisé tel que passé au HttpClient */
  body: unknown
  /** URL appelée (sans query string) */
  url: string
}

/** Un handler renvoie le corps de la réponse (= ce que verra le service) */
export type MockHandler = (ctx: MockHandlerContext) => Promise<unknown> | unknown

export type RegisterMockFn = (method: MockMethod, pattern: string, handler: MockHandler) => void
