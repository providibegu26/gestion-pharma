import type { Role } from '@/core'

export type Permission =
  | 'dashboard:view'
  | 'produits:read'
  | 'produits:write'
  | 'commandes:read'
  | 'commandes:valider'
  | 'users:manage'
  | 'roles:manage'
  | 'file:view'
  | 'file:manage'

/** Permissions des 5 rôles système (coexistent avec les rôles dynamiques). */
export const SYSTEM_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'dashboard:view', 'produits:read', 'produits:write',
    'commandes:read', 'users:manage', 'roles:manage',
    'file:view', 'file:manage',
  ],
  PHARMACIEN: [
    'dashboard:view', 'produits:read', 'produits:write',
    'commandes:read', 'commandes:valider',
    'file:view', 'file:manage',
  ],
  CAISSIER: [
    'dashboard:view', 'produits:read', 'file:view', 'file:manage',
  ],
  PREPARATEUR: [],
  CLIENT: [
    'dashboard:view', 'produits:read', 'commandes:read',
  ],
}

export const isSystemRole = (role: string): role is Role =>
  role in SYSTEM_ROLE_PERMISSIONS

export const getSystemPermissions = (role: Role): Permission[] =>
  SYSTEM_ROLE_PERMISSIONS[role] ?? []
