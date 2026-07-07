/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Données mock partagées entre handlers
 * ─────────────────────────────────────────────────────────────────────────────
 *  Stockage en mémoire pour la durée de la session. Toute modification
 *  (création/suppression d'un user, validation d'une commande…) est répercutée
 *  ici de sorte que les listes ultérieures reflètent l'état réel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Commande, Medicament, User } from '../types'

// ─── Utilisateur courant (session simulée) ───────────────────────────────────

let currentUser: User | null = null

export const getCurrentUser = () => currentUser
export const setCurrentUser = (u: User | null) => { currentUser = u }

// ─── Staff (renvoyé par GET /users) ──────────────────────────────────────────

export const users: User[] = [
  {
    id: 'u-admin-01',
    nom: 'Kabila',
    prenom: 'Joseph',
    email: 'admin@pharmacie.cd',
    role: 'ADMIN',
    createdAt: '2026-01-12T08:00:00.000Z',
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'u-pharma-01',
    nom: 'Mukeba',
    prenom: 'Marie',
    email: 'pharma@pharmacie.cd',
    role: 'PHARMACIEN',
    createdAt: '2026-02-03T08:00:00.000Z',
    updatedAt: '2026-02-03T08:00:00.000Z',
  },
  {
    id: 'u-prep-01',
    nom: 'Tshibanda',
    prenom: 'Pierre',
    email: 'prepa@pharmacie.cd',
    role: 'PREPARATEUR',
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'u-caissier-01',
    nom: 'Ngandu',
    prenom: 'Bernadette',
    email: 'caissier@pharmacie.cd',
    role: 'CAISSIER',
    createdAt: '2026-03-08T08:00:00.000Z',
    updatedAt: '2026-03-08T08:00:00.000Z',
  },
]

// ─── Clients (utilisés comme expéditeurs des commandes) ───────────────────────

export const clients: User[] = [
  {
    id: 'c-001',
    nom: 'Lumumba',
    prenom: 'Patrice',
    email: 'client@email.com',
    role: 'CLIENT',
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-04-02T10:00:00.000Z',
  },
  {
    id: 'c-002',
    nom: 'Mobutu',
    prenom: 'Suzanne',
    email: 'suzanne.m@email.com',
    role: 'CLIENT',
    createdAt: '2026-04-15T11:30:00.000Z',
    updatedAt: '2026-04-15T11:30:00.000Z',
  },
]

// ─── Médicaments (catalogue minimal utilisé dans les lignes de commande) ──────

export const medicaments: Medicament[] = [
  {
    id: 'm-001',
    nom: 'Paracétamol 500mg',
    description: 'Analgésique et antipyrétique',
    categorie: 'Analgésiques',
    unite: 'comprimé',
    prixCDF: '500.00',
    prixUSD: '0.25',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    stock: { id: 's-001', medicamentId: 'm-001', quantite: 220, seuilMinimum: 40, updatedAt: '2026-07-01T08:00:00.000Z' },
  },
  {
    id: 'm-002',
    nom: 'Amoxicilline 250mg',
    description: 'Antibiotique à large spectre',
    categorie: 'Antibiotiques',
    unite: 'gélule',
    prixCDF: '1200.00',
    prixUSD: '0.60',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    stock: { id: 's-002', medicamentId: 'm-002', quantite: 84, seuilMinimum: 30, updatedAt: '2026-07-02T08:00:00.000Z' },
  },
  {
    id: 'm-003',
    nom: 'Ibuprofène 400mg',
    description: 'Anti-inflammatoire non stéroïdien',
    categorie: 'AINS',
    unite: 'comprimé',
    prixCDF: '800.00',
    prixUSD: '0.40',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    stock: { id: 's-003', medicamentId: 'm-003', quantite: 150, seuilMinimum: 35, updatedAt: '2026-07-02T08:00:00.000Z' },
  },
  {
    id: 'm-004',
    nom: 'Vitamine C 1000mg',
    description: 'Complément vitaminique',
    categorie: 'Vitamines',
    unite: 'comprimé',
    prixCDF: '300.00',
    prixUSD: '0.15',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
    stock: { id: 's-004', medicamentId: 'm-004', quantite: 410, seuilMinimum: 80, updatedAt: '2026-07-03T08:00:00.000Z' },
  },
]

// ─── Commandes ───────────────────────────────────────────────────────────────

export const commandes: Commande[] = [
  {
    id: 'cmd-001',
    clientId: 'c-001',
    statut: 'EN_ATTENTE',
    note: 'Médicaments urgents, merci de préparer rapidement.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    client: { id: clients[0].id, nom: clients[0].nom, prenom: clients[0].prenom, email: clients[0].email },
    lignes: [
      { id: 'l-001', commandeId: 'cmd-001', medicamentId: 'm-001', quantite: 2, medicament: medicaments[0] },
      { id: 'l-002', commandeId: 'cmd-001', medicamentId: 'm-002', quantite: 1, medicament: medicaments[1] },
    ],
  },
  {
    id: 'cmd-002',
    clientId: 'c-002',
    statut: 'VALIDEE',
    note: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    client: { id: clients[1].id, nom: clients[1].nom, prenom: clients[1].prenom, email: clients[1].email },
    lignes: [
      { id: 'l-003', commandeId: 'cmd-002', medicamentId: 'm-003', quantite: 1, medicament: medicaments[2] },
      { id: 'l-004', commandeId: 'cmd-002', medicamentId: 'm-004', quantite: 3, medicament: medicaments[3] },
    ],
  },
  {
    id: 'cmd-003',
    clientId: 'c-001',
    statut: 'REFUSEE',
    note: 'Quantités trop importantes pour usage personnel.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
    client: { id: clients[0].id, nom: clients[0].nom, prenom: clients[0].prenom, email: clients[0].email },
    lignes: [
      { id: 'l-005', commandeId: 'cmd-003', medicamentId: 'm-002', quantite: 50, medicament: medicaments[1] },
    ],
  },
]

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export const uid = (prefix = 'id'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const nowIso = (): string => new Date().toISOString()
