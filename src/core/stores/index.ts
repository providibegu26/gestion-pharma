/**
 * Exports des primitives d'état agnostiques.
 *
 * `Observable` sert de base portable (React/Vue/Angular) et `AuthStore`
 * implémente la logique d'authentification côté frontend.
 */
export { Observable } from './Observable'
export type { Listener, Unsubscribe, Updater } from './Observable'
export { AuthStore } from './AuthStore'
export type { AuthState } from './AuthStore'
