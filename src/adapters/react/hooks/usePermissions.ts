/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  usePermissions — Contrôle d'accès basé sur le registre de rôles
 * ─────────────────────────────────────────────────────────────────────────────
 *  Expose `can(permission)` calculé à partir du rôle de l'utilisateur courant
 *  et du registre `core/permissions`. Sert à masquer les actions non autorisées
 *  dans les pages (source de vérité unique, extensible).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { can as canForRole, getRoleDefinition, navForRole, type Permission } from '@/core'
import { useAuth } from './useAuth'

export const usePermissions = () => {
  const { user } = useAuth()
  const role = user?.role ?? null

  return {
    role,
    /** Définition complète du rôle courant (libellé, couleur, espace…). */
    definition: role ? getRoleDefinition(role) : null,
    /** Vrai si le rôle courant possède la permission. */
    can: (permission: Permission) => canForRole(role, permission),
    /** Entrées de navigation du rôle courant. */
    nav: navForRole(role),
  }
}
