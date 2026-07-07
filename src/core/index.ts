/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Point d'entrée public du core
 * ─────────────────────────────────────────────────────────────────────────────
 *  Tout code applicatif (React aujourd'hui, Angular/Vue demain) ne devrait
 *  importer QUE depuis `@/core` ou ses sous-modules — jamais des fichiers
 *  internes type `AxiosHttpClient.ts` directement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export * from './types'
export * from './http'
export * from './services'
export * from './stores'
export * from './permissions'
export * from './queue'
export * from './bootstrap'
