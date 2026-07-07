/**
 * Handlers mock pour le module Auth — voir API_DOC.md §5.
 */

import { HttpError } from '../http/HttpError'
import type {
  ApiResponse,
  ChangePasswordPayload,
  LoginPayload,
  RegisterClientPayload,
  User,
} from '../types'
import {
  clients,
  getCurrentUser,
  nowIso,
  setCurrentUser,
  uid,
  users,
} from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

/** Détecte le rôle d'après le préfixe email — pratique pour la démo */
const matchUserByEmail = (email: string): User | null => {
  const e = email.toLowerCase()
  if (e.startsWith('admin'))    return users.find((u) => u.role === 'ADMIN') ?? null
  if (e.startsWith('pharma'))   return users.find((u) => u.role === 'PHARMACIEN') ?? null
  if (e.startsWith('prepa'))    return users.find((u) => u.role === 'PREPARATEUR') ?? null
  if (e.startsWith('caissier')) return users.find((u) => u.role === 'CAISSIER') ?? null
  if (e.startsWith('client'))   return clients[0] ?? null
  // Match par email exact (utilisateur créé via /auth/register)
  return [...users, ...clients].find((u) => u.email.toLowerCase() === e) ?? null
}

export const registerAuthMocks = (register: RegisterMockFn): void => {
  // POST /auth/login
  register('POST', '/auth/login', ({ body }) => {
    const { email, motDePasse } = (body ?? {}) as LoginPayload
    if (!email || !motDePasse) {
      throw new HttpError({
        message: 'Email et mot de passe requis.',
        status: 400,
        url: '/auth/login',
        data: { success: false, statusCode: 400, message: 'Email et mot de passe requis.', timestamp: nowIso(), path: '/auth/login' },
      })
    }
    const user = matchUserByEmail(email)
    if (!user) {
      throw new HttpError({
        message: 'Identifiants incorrects.',
        status: 401,
        url: '/auth/login',
        data: { success: false, statusCode: 401, message: 'Identifiants incorrects.', timestamp: nowIso(), path: '/auth/login' },
      })
    }
    setCurrentUser(user)
    return ok(user, 'Connexion réussie.')
  })

  // POST /auth/register
  register('POST', '/auth/register', ({ body }) => {
    const payload = (body ?? {}) as RegisterClientPayload
    if (!payload.email || !payload.motDePasse || !payload.nom || !payload.prenom) {
      throw new HttpError({
        message: 'Tous les champs sont requis.',
        status: 400,
        url: '/auth/register',
        data: { success: false, statusCode: 400, message: 'Tous les champs sont requis.', timestamp: nowIso(), path: '/auth/register' },
      })
    }
    const exists = [...users, ...clients].some(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase(),
    )
    if (exists) {
      throw new HttpError({
        message: 'Cet email est déjà utilisé.',
        status: 409,
        url: '/auth/register',
        data: { success: false, statusCode: 409, message: 'Cet email est déjà utilisé.', timestamp: nowIso(), path: '/auth/register' },
      })
    }
    const newClient: User = {
      id: uid('c'),
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      role: 'CLIENT',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    clients.push(newClient)
    return ok(newClient, 'Compte client créé avec succès.')
  })

  // POST /auth/refresh
  register('POST', '/auth/refresh', () => {
    const user = getCurrentUser()
    if (!user) {
      throw new HttpError({
        message: 'Session expirée.',
        status: 401,
        url: '/auth/refresh',
      })
    }
    return ok(user, 'Tokens renouvelés avec succès.')
  })

  // POST /auth/logout
  register('POST', '/auth/logout', () => {
    setCurrentUser(null)
    return ok(null, 'Déconnexion réussie.')
  })

  // GET /auth/me
  register('GET', '/auth/me', () => {
    const user = getCurrentUser()
    if (!user) {
      throw new HttpError({
        message: 'Non authentifié.',
        status: 401,
        url: '/auth/me',
      })
    }
    return ok(user, 'Profil récupéré avec succès.')
  })

  // PATCH /auth/change-password
  register('PATCH', '/auth/change-password', ({ body }) => {
    const { ancienMotDePasse, nouveauMotDePasse } = (body ?? {}) as ChangePasswordPayload
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      throw new HttpError({
        message: 'Champs requis manquants.',
        status: 400,
        url: '/auth/change-password',
      })
    }
    if (nouveauMotDePasse.length < 8) {
      throw new HttpError({
        message: 'Le nouveau mot de passe doit faire au moins 8 caractères.',
        status: 400,
        url: '/auth/change-password',
      })
    }
    // Mock : aucune vérification réelle de l'ancien mot de passe
    return ok(null, 'Mot de passe mis à jour avec succès.')
  })
}
