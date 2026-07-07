/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Registre des rôles & permissions — Source de vérité unique (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Ce module centralise :
 *    - la liste des permissions applicatives (`Permission`)
 *    - la définition de chaque rôle (`RoleDefinition`) : libellé, couleur,
 *      espace, permissions accordées et entrées de navigation
 *
 *  Il pilote la navigation par rôle, le masquage des actions et la gestion des rôles.
 *  Ajouter un rôle ou une permission = éditer CE fichier uniquement.
 *  Aucun import React/Angular/Vue : les icônes de navigation sont exprimées par
 *  une CLÉ sémantique (string) que la couche UI mappe vers ses composants.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Role, StaffRole } from '../types'

// ─── Permissions applicatives ────────────────────────────────────────────────

export type Permission =
  | 'dashboard.view'
  | 'produits.view'
  | 'produits.manage'   // CRUD médicaments + stock (pharmacien)
  | 'produits.order'    // passer commande (client)
  | 'commandes.view'
  | 'commandes.validate' // valider/refuser (pharmacien)
  | 'commandes.pickup'   // scanner QR + confirmer retrait (pharmacien)
  | 'ventes.view'        // voir les ventes/CA (caissier)
  | 'ventes.manage'      // créer/annuler une vente (caissier)
  | 'users.manage'
  | 'roles.manage'
  | 'queue.manage'  // gérer la file (staff)
  | 'queue.join'    // rejoindre la file (client)

/** Libellés lisibles des permissions (formulaire de gestion des rôles). */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.view': 'Voir le tableau de bord',
  'produits.view': 'Consulter le catalogue',
  'produits.manage': 'Gérer les médicaments et le stock',
  'produits.order': 'Passer des commandes',
  'commandes.view': 'Consulter les commandes',
  'commandes.validate': 'Valider / refuser les commandes',
  'commandes.pickup': 'Scanner et confirmer les retraits',
  'ventes.view': 'Consulter les ventes et le chiffre d\'affaires',
  'ventes.manage': 'Créer et annuler des ventes',
  'users.manage': 'Gérer le personnel',
  'roles.manage': 'Gérer les rôles',
  'queue.manage': "Gérer la file d'attente",
  'queue.join': "Rejoindre la file d'attente",
}

/** Liste ordonnée de toutes les permissions applicatives. */
export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

// ─── Jeton de couleur (mappé en classes Tailwind par la couche UI) ───────────

export type RoleColor = 'violet' | 'teal' | 'cyan' | 'sand' | 'emerald'

// ─── Navigation ──────────────────────────────────────────────────────────────

/** Clé d'icône sémantique — mappée vers un composant d'icône par la couche UI. */
export type NavIconKey =
  | 'dashboard'
  | 'produits'
  | 'commandes'
  | 'queue'
  | 'users'
  | 'roles'
  | 'ventes'

export interface RoleNavItem {
  to: string
  label: string
  icon: NavIconKey
  section?: string
}

// ─── Définition d'un rôle ─────────────────────────────────────────────────────

export interface RoleDefinition {
  key: Role
  label: string
  description: string
  color: RoleColor
  /** Espace applicatif : détermine l'accent visuel et le préfixe de routes. */
  space: 'client' | 'professionnel'
  /** Route d'accueil par défaut après connexion. */
  home: string
  /** Rôle masqué du front (conservé pour extensibilité / compatibilité backend). */
  hidden?: boolean
  /** Rôle attribuable à un membre du personnel lors de la création d'un compte. */
  assignable?: boolean
  permissions: Permission[]
  nav: RoleNavItem[]
}

// ─── Registre ─────────────────────────────────────────────────────────────────

const ADM = 'Administration'
const OPS = 'Opérations'
const CATAL = 'Catalogue'
const COMPTA = 'Comptabilité'
const ESPACE = 'Espace client'

export const ROLE_REGISTRY: Record<Role, RoleDefinition> = {

  // ── ADMIN : gestion des comptes uniquement (backend → 403 sur toute autre route)
  ADMIN: {
    key: 'ADMIN',
    label: 'Administrateur',
    description: 'Supervision du personnel et des rôles.',
    color: 'violet',
    space: 'professionnel',
    home: '/professionnel/tableau-de-bord',
    permissions: [
      'dashboard.view',
      'users.manage',
      'roles.manage',
    ],
    nav: [
      { to: '/professionnel/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard', section: 'Pilotage' },
      { to: '/professionnel/utilisateurs', label: 'Personnel', icon: 'users', section: ADM },
      { to: '/professionnel/roles', label: 'Rôles', icon: 'roles', section: ADM },
    ],
  },

  // ── PHARMACIEN : médicaments, stock, ordonnances, commandes, file pharmacie
  PHARMACIEN: {
    key: 'PHARMACIEN',
    label: 'Pharmacien',
    description: 'Gestion des médicaments, des commandes et de la file pharmacie.',
    color: 'teal',
    space: 'professionnel',
    home: '/professionnel/tableau-de-bord',
    assignable: true,
    permissions: [
      'dashboard.view',
      'produits.view',
      'produits.manage',
      'commandes.view',
      'commandes.validate',
      'commandes.pickup',
      'queue.manage',
    ],
    nav: [
      { to: '/professionnel/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard', section: 'Pilotage' },
      { to: '/professionnel/produits', label: 'Médicaments', icon: 'produits', section: CATAL },
      { to: '/professionnel/commandes', label: 'Commandes', icon: 'commandes', section: OPS },
      { to: '/professionnel/file-attente', label: "File pharmacie", icon: 'queue', section: OPS },
    ],
  },

  // ── CAISSIER : ventes, recettes, file caisse — aucun accès aux commandes médicales
  CAISSIER: {
    key: 'CAISSIER',
    label: 'Caissier',
    description: 'Enregistrement des ventes, suivi du chiffre d\'affaires et file caisse.',
    color: 'sand',
    space: 'professionnel',
    home: '/professionnel/tableau-de-bord',
    assignable: true,
    permissions: [
      'dashboard.view',
      'produits.view',
      'ventes.view',
      'ventes.manage',
      'queue.manage',
    ],
    nav: [
      { to: '/professionnel/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard', section: 'Pilotage' },
      { to: '/professionnel/ventes', label: 'Ventes & CA', icon: 'ventes', section: COMPTA },
      { to: '/professionnel/produits', label: 'Catalogue', icon: 'produits', section: CATAL },
      { to: '/professionnel/file-attente', label: 'File caisse', icon: 'queue', section: OPS },
    ],
  },

  // ── CLIENT : commander des médicaments en ligne et suivre ses commandes
  CLIENT: {
    key: 'CLIENT',
    label: 'Client',
    description: 'Commande de médicaments en ligne et suivi personnel.',
    color: 'emerald',
    space: 'client',
    home: '/client/tableau-de-bord',
    permissions: [
      'dashboard.view',
      'produits.view',
      'produits.order',
      'commandes.view',
      'queue.join',
    ],
    nav: [
      { to: '/client/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard', section: ESPACE },
      { to: '/client/produits', label: 'Médicaments', icon: 'produits', section: ESPACE },
      { to: '/client/commandes', label: 'Mes commandes', icon: 'commandes', section: ESPACE },
    ],
  },

  // Rôle backend conservé mais masqué du front (aucune interface dédiée).
  PREPARATEUR: {
    key: 'PREPARATEUR',
    label: 'Préparateur',
    description: 'Rôle backend non exposé dans l\'interface.',
    color: 'cyan',
    space: 'professionnel',
    home: '/login-staff',
    hidden: true,
    permissions: [],
    nav: [],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Définition d'un rôle (jamais nul : garde-fou sur les rôles inconnus). */
export const getRoleDefinition = (role: Role): RoleDefinition =>
  ROLE_REGISTRY[role] ?? ROLE_REGISTRY.CLIENT

/** Vrai si le rôle possède la permission demandée. */
export const can = (role: Role | null | undefined, permission: Permission): boolean =>
  !!role && !!ROLE_REGISTRY[role]?.permissions.includes(permission)

/** Entrées de navigation à afficher pour un rôle donné. */
export const navForRole = (role: Role | null | undefined): RoleNavItem[] =>
  role ? getRoleDefinition(role).nav : []

/**
 * Rôles attribuables à la création d'un compte personnel.
 * Backend : seuls PHARMACIEN et CAISSIER sont acceptés (pas ADMIN, pas CLIENT).
 */
export const assignableRoles = (): RoleDefinition[] =>
  (Object.values(ROLE_REGISTRY) as RoleDefinition[]).filter((r) => r.assignable && !r.hidden)

/** Type guard pratique pour restreindre aux rôles staff attribuables. */
export const isAssignableStaffRole = (role: string): role is StaffRole =>
  assignableRoles().some((r) => r.key === role)
