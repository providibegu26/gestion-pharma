import type { Role } from '@/core'

export type AccentColor = 'teal' | 'cyan' | 'sand' | 'violet'

export interface RoleUIConfig {
  homeRoute: string
  dashboardRoute: string
  accent: AccentColor
  brandSubtitle: string
  promo?: { title: string; description: string } | null
}

const STAFF_BASE = '/professionnel'
const CLIENT_BASE = '/client'

export const ROLE_UI_CONFIG: Record<Role, RoleUIConfig> = {
  ADMIN: {
    homeRoute: `${STAFF_BASE}/dashboard`,
    dashboardRoute: `${STAFF_BASE}/dashboard`,
    accent: 'violet',
    brandSubtitle: 'Administration',
    promo: { title: 'Centre de contrôle', description: 'Gérez le personnel, les rôles et les opérations.' },
  },
  PHARMACIEN: {
    homeRoute: `${STAFF_BASE}/dashboard`,
    dashboardRoute: `${STAFF_BASE}/dashboard`,
    accent: 'teal',
    brandSubtitle: 'Espace Pharmacien',
    promo: { title: 'File d\'attente', description: 'Traitez les retraits des commandes validées.' },
  },
  CAISSIER: {
    homeRoute: `${STAFF_BASE}/dashboard`,
    dashboardRoute: `${STAFF_BASE}/dashboard`,
    accent: 'sand',
    brandSubtitle: 'Espace Caissier',
    promo: null,
  },
  PREPARATEUR: {
    homeRoute: '/login-staff',
    dashboardRoute: '/login-staff',
    accent: 'cyan',
    brandSubtitle: 'Préparateur',
    promo: null,
  },
  CLIENT: {
    homeRoute: `${CLIENT_BASE}/dashboard`,
    dashboardRoute: `${CLIENT_BASE}/dashboard`,
    accent: 'teal',
    brandSubtitle: 'Espace Client',
    promo: { title: 'Commandez en ligne', description: 'Parcourez le catalogue et suivez vos commandes.' },
  },
}

export const getRoleUIConfig = (role: string): RoleUIConfig =>
  ROLE_UI_CONFIG[role as Role] ?? {
    homeRoute: STAFF_BASE,
    dashboardRoute: `${STAFF_BASE}/dashboard`,
    accent: 'teal',
    brandSubtitle: 'Espace Personnel',
    promo: null,
  }
