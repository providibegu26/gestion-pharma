/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useObservable — Bind un `Observable<T>` du core à React
 * ─────────────────────────────────────────────────────────────────────────────
 *  Utilise `useSyncExternalStore` (React 18+) pour une intégration optimale.
 *  Aucun re-render inutile : on retourne la même référence tant que `setState`
 *  n'a pas produit une nouvelle valeur.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useSyncExternalStore } from 'react'
import type { Observable } from '@/core'

export const useObservable = <T,>(observable: Observable<T>): T => {
  return useSyncExternalStore(
    observable.subscribe,
    observable.getState,
    observable.getState, // côté serveur : même snapshot
  )
}
