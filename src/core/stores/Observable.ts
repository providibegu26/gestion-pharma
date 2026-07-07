/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Observable<T> — Mini-store réactif framework-agnostic
 * ─────────────────────────────────────────────────────────────────────────────
 *  Implémente un pattern observer minimal sur lequel TOUS les stores du core
 *  peuvent se construire. Aucun import React/Angular/Vue.
 *
 *  Adaptation par framework :
 *    - React   : useSyncExternalStore(observable.subscribe, observable.getState)
 *    - Angular : exposer le state en BehaviorSubject (cf. core/stores/README)
 *    - Vue     : encapsuler dans reactive() / ref()
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Listener<T> = (state: T) => void
export type Unsubscribe = () => void
export type Updater<T> = (current: T) => T

export class Observable<T> {
  private state: T
  private listeners = new Set<Listener<T>>()

  constructor(initialState: T) {
    this.state = initialState
  }

  /** Snapshot synchrone du state. */
  getState = (): T => this.state

  /** Remplace le state (ou applique un updater) et notifie. */
  setState = (next: T | Updater<T>): void => {
    const value = typeof next === 'function' ? (next as Updater<T>)(this.state) : next
    if (Object.is(value, this.state)) return
    this.state = value
    for (const l of this.listeners) l(this.state)
  }

  /**
   * S'abonne aux changements. Renvoie une fonction de désinscription.
   * Compatible avec React.useSyncExternalStore.
   */
  subscribe = (listener: Listener<T>): Unsubscribe => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}
