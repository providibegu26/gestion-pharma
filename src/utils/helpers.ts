/**
 * Helpers de formatage UI — neutres vis-à-vis du framework côté logique
 * (mais retournent des classes Tailwind pour ce projet React/Tailwind).
 */

import type { Role, StatutCommande, StatutFile } from '@/core'

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

export const getRoleLabel = (role: Role | string): string => {
  const labels: Record<string, string> = {
    ADMIN:       'Administrateur',
    PHARMACIEN:  'Pharmacien',
    PREPARATEUR: 'Préparateur',
    CAISSIER:    'Caissier',
    CLIENT:      'Client',
    RECEPTIONNISTE: 'Réceptionniste',
  }
  return labels[role] ?? role
}

export const getRoleColor = (role: Role | string): string => {
  const colors: Record<string, string> = {
    ADMIN:       'text-violet-700  bg-violet-50  border-violet-200/70',
    PHARMACIEN:  'text-teal-700    bg-teal-50    border-teal-200/70',
    PREPARATEUR: 'text-cyan-700    bg-cyan-50    border-cyan-200/70',
    CAISSIER:    'text-sand-700    bg-sand-50    border-sand-200/70',
    CLIENT:      'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    RECEPTIONNISTE: 'text-indigo-700 bg-indigo-50 border-indigo-200/70',
  }
  return colors[role] ?? 'text-slate-700 bg-slate-50 border-slate-200/70'
}

// ─── Statuts commande ───────────────────────────────────────────────────────

export const getStatutCommandeLabel = (statut: StatutCommande) =>
  ({
    EN_ATTENTE: 'En attente',
    PRETE: 'Prête au retrait',
    RETIREE: 'Retirée',
    REFUSEE: 'Refusée',
  } as const)[statut]

export const getStatutCommandeColor = (statut: StatutCommande) =>
  ({
    EN_ATTENTE: 'text-amber-700   bg-amber-50   border-amber-200/70',
    PRETE:      'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    RETIREE:    'text-teal-700    bg-teal-50    border-teal-200/70',
    REFUSEE:    'text-rose-700    bg-rose-50    border-rose-200/70',
  } as const)[statut]

// ─── Statuts file d'attente ──────────────────────────────────────────────────

export const getStatutFileLabel = (statut: StatutFile) =>
  ({
    EN_ATTENTE: 'En attente',
    APPELE:     'Appelé',
    EN_COURS:   'En cours',
    TERMINE:    'Terminé',
    ANNULE:     'Annulé',
  } as const)[statut]

export const getStatutFileColor = (statut: StatutFile) =>
  ({
    EN_ATTENTE: 'text-amber-700   bg-amber-50   border-amber-200/70',
    APPELE:     'text-sky-700     bg-sky-50     border-sky-200/70',
    EN_COURS:   'text-teal-700    bg-teal-50    border-teal-200/70',
    TERMINE:    'text-emerald-700 bg-emerald-50 border-emerald-200/70',
    ANNULE:     'text-rose-700    bg-rose-50    border-rose-200/70',
  } as const)[statut]

// ─── Divers ─────────────────────────────────────────────────────────────────

export const getInitials = (nom: string, prenom: string): string =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
