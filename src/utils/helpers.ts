/**
 * Helpers de formatage UI — neutres vis-à-vis du framework côté logique
 * (mais retournent des classes Tailwind pour ce projet React/Tailwind).
 */

import type { QueueStatut, Role, RoleColor, StatutCommande } from '@/core'
import { getRoleDefinition } from '@/core'

// ─── Dates ──────────────────────────────────────────────────────────────────

export const formatDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))

export const formatDateShort = (dateStr: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr))

// ─── Rôles ──────────────────────────────────────────────────────────────────

// Libellé et couleur proviennent du registre de rôles (core/permissions) :
// source de vérité unique, extensible sans toucher à ces helpers.

export const getRoleLabel = (role: Role): string => getRoleDefinition(role).label

/** Classes Tailwind (badge) associées à un jeton de couleur de rôle. */
export const roleColorClasses: Record<RoleColor, string> = {
  violet:  'text-violet-700  bg-violet-50  border-violet-200/70',
  teal:    'text-teal-700    bg-teal-50    border-teal-200/70',
  cyan:    'text-cyan-700    bg-cyan-50    border-cyan-200/70',
  sand:    'text-sand-700    bg-sand-50    border-sand-200/70',
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
}

export const getRoleColor = (role: Role): string =>
  roleColorClasses[getRoleDefinition(role).color]

// ─── Statuts commande ───────────────────────────────────────────────────────

export const getStatutCommandeLabel = (statut: StatutCommande) =>
  ({
    EN_ATTENTE: 'En attente',
    PRETE: 'Prête',
    RETIREE: 'Retirée',
    REFUSEE: 'Refusée',
  } as const)[statut]

export const getStatutCommandeColor = (statut: StatutCommande) =>
  ({
    EN_ATTENTE: 'text-amber-700   bg-amber-50   border-amber-200/70',
    PRETE:      'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    RETIREE:    'text-slate-600   bg-slate-100  border-slate-200',
    REFUSEE:    'text-rose-700    bg-rose-50    border-rose-200/70',
  } as const)[statut]

// ─── Statuts file d'attente ─────────────────────────────────────────────────

export const getStatutQueueLabel = (statut: QueueStatut) =>
  ({
    EN_ATTENTE: 'En attente',
    APPELE: 'Appelé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
  } as const)[statut]

export const getStatutQueueColor = (statut: QueueStatut) =>
  ({
    EN_ATTENTE: 'text-amber-700   bg-amber-50   border-amber-200/70',
    APPELE:     'text-cyan-700    bg-cyan-50    border-cyan-200/70',
    EN_COURS:   'text-teal-700    bg-teal-50    border-teal-200/70',
    TERMINE:    'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    ANNULE:     'text-slate-600   bg-slate-100  border-slate-200',
  } as const)[statut]

// ─── Divers ─────────────────────────────────────────────────────────────────

export const getInitials = (nom: string, prenom: string): string =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
