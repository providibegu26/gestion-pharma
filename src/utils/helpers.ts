/**
 * Helpers de formatage UI — neutres vis-à-vis du framework côté logique
 * (mais retournent des classes Tailwind pour ce projet React/Tailwind).
 */

import type { Role, StatutCommande } from '@/core'

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

export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    ADMIN:       'Administrateur',
    PHARMACIEN:  'Pharmacien',
    PREPARATEUR: 'Préparateur',
    CAISSIER:    'Caissier',
    CLIENT:      'Client',
  }
  return labels[role]
}

export const getRoleColor = (role: Role): string => {
  const colors: Record<Role, string> = {
    ADMIN:       'text-violet-700  bg-violet-50  border-violet-200/70',
    PHARMACIEN:  'text-teal-700    bg-teal-50    border-teal-200/70',
    PREPARATEUR: 'text-cyan-700    bg-cyan-50    border-cyan-200/70',
    CAISSIER:    'text-sand-700    bg-sand-50    border-sand-200/70',
    CLIENT:      'text-emerald-700 bg-emerald-50 border-emerald-200/70',
  }
  return colors[role]
}

// ─── Statuts commande ───────────────────────────────────────────────────────

export const getStatutCommandeLabel = (statut: StatutCommande) =>
  ({ EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REFUSEE: 'Refusée' } as const)[statut]

export const getStatutCommandeColor = (statut: StatutCommande) =>
  ({
    EN_ATTENTE: 'text-amber-700   bg-amber-50   border-amber-200/70',
    VALIDEE:    'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    REFUSEE:    'text-rose-700    bg-rose-50    border-rose-200/70',
  } as const)[statut]

// ─── Divers ─────────────────────────────────────────────────────────────────

export const getInitials = (nom: string, prenom: string): string =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
