/**
 * Barrel des hooks React branchés sur le `core/`.
 *
 * Chaque hook encapsule le besoin React (query cache, context, subscriptions)
 * sans introduire de dépendance React dans la logique métier.
 */
export { useAuth } from './useAuth'
export { usePermissions } from './usePermissions'
export { useApiError } from './useApiError'
export { useObservable } from './useObservable'
export { useUsers, useUser } from './useUsers'
export { useRoles } from './useRoles'
export { useCommandes, useCommande } from './useCommandes'
export { useMedicaments, useMedicament } from './useMedicaments'
export { useQueue } from './useQueue'
export { useVentes } from './useVentes'
