/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useApiError — Extraction de message d'erreur lisible
 * ─────────────────────────────────────────────────────────────────────────────
 *  Indépendant de l'implémentation HTTP : reconnaît `HttpError` (de notre core)
 *  et tombe en fallback sur `Error.message`.
 *  Aucune dépendance à axios — fonctionne identiquement avec Fetch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { HttpError } from '@/core'

export const useApiError = () => {
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof HttpError) return error.toUserMessage()
    if (error instanceof Error) return error.message
    return 'Une erreur inattendue est survenue.'
  }

  const getStatusCode = (error: unknown): number => {
    if (error instanceof HttpError) return error.status
    return 500
  }

  return { getErrorMessage, getStatusCode }
}
