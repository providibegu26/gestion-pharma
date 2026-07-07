/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TYPES MÉTIER — Framework-agnostic
 * ─────────────────────────────────────────────────────────────────────────────
 *  Aucun import React/Angular/Vue ici. Ces types représentent uniquement les
 *  contrats avec le backend et le domaine métier.
 *  Réutilisables tels quels dans une migration Angular / Vue.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Enums / unions ─────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'PHARMACIEN' | 'PREPARATEUR' | 'CAISSIER' | 'CLIENT'

/** Rôle staff (excluant CLIENT), attribuable par admin via POST /users */
export type StaffRole = 'ADMIN' | 'PHARMACIEN' | 'PREPARATEUR' | 'CAISSIER'

export type StatutCommande = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'

// ─── Wrappers API ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface ApiErrorPayload {
  success: false
  statusCode: number
  message: string
  timestamp: string
  path: string
}

// ─── Auth / Users ────────────────────────────────────────────────────────────

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  email: string
  motDePasse: string
}

/** Inscription publique CLIENT (rôle attribué automatiquement) */
export interface RegisterClientPayload {
  nom: string
  prenom: string
  email: string
  motDePasse: string
}

/** Création d'un compte staff par l'ADMIN — pas de mot de passe (généré + envoyé par email) */
export interface CreateStaffUserPayload {
  nom: string
  prenom: string
  email: string
  role: StaffRole
}

export interface UpdateUserPayload {
  nom?: string
  prenom?: string
  email?: string
  role?: StaffRole
}

export interface ChangePasswordPayload {
  ancienMotDePasse: string
  nouveauMotDePasse: string
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export interface MedicamentLite {
  id: string
  nom: string
  categorie?: string
  unite?: string
  prixCDF?: string
  prixUSD?: string
}

export interface LigneCommande {
  id: string
  commandeId: string
  medicamentId: string
  quantite: number
  medicament?: MedicamentLite
}

export interface Commande {
  id: string
  clientId: string
  statut: StatutCommande
  note?: string | null
  motifRefus?: string | null
  validatedAt?: string | null
  refusedAt?: string | null
  createdAt: string
  updatedAt: string
  client?: Pick<User, 'id' | 'nom' | 'prenom' | 'email'>
  lignes: LigneCommande[]
}

export interface LigneCommandePayload {
  medicamentId: string
  quantite: number
}

export interface CreateCommandePayload {
  lignes: LigneCommandePayload[]
  note?: string
}

export interface RefuserCommandePayload {
  motifRefus: string
}

export interface CreateMedicamentPayload {
  nom: string
  description?: string
  prixCDF: number
  prixUSD: number
  categorie: string
  unite: string
  quantiteInitiale?: number
  seuilMinimum?: number
}

export interface UpdateMedicamentPayload {
  nom?: string
  description?: string
  prixCDF?: number
  prixUSD?: number
  categorie?: string
  unite?: string
}

// ─── Médicaments (catalogue public) ─────────────────────────────────────────

export interface StockLite {
  id: string
  medicamentId: string
  quantite: number
  seuilMinimum: number
  updatedAt: string
}

export interface Medicament extends MedicamentLite {
  description?: string
  createdAt: string
  updatedAt: string
  stock?: StockLite
}

// ─── Patients ────────────────────────────────────────────────────────────────

export interface Patient {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePatientPayload {
  nom: string
  prenom: string
  telephone: string
  adresse?: string
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export interface Fournisseur {
  id: string
  nom: string
  telephone: string
  email?: string | null
  adresse?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateFournisseurPayload {
  nom: string
  telephone: string
  email?: string
  adresse?: string
}

export type UpdateFournisseurPayload = Partial<CreateFournisseurPayload>

// ─── Stock / rapport commande ───────────────────────────────────────────────

export interface Stock {
  id: string
  medicamentId: string
  quantite: number
  seuilMinimum: number
  updatedAt: string
  medicament?: MedicamentLite
}

export interface UpdateStockPayload {
  quantite: number
  seuilMinimum?: number
}

export interface RapportCommandeLigne {
  medicamentId: string
  nom: string
  categorie: string
  unite: string
  quantiteActuelle: number
  seuilMinimum: number
  quantiteACommander: number
}

export interface RapportCommande {
  genereLe: string
  nombreProduits: number
  lignes: RapportCommandeLigne[]
}

export type FormatRapport = 'pdf' | 'excel'

export interface EnvoyerRapportPayload {
  fournisseurId: string
  format?: FormatRapport
  commentaire?: string
  quantitesPersonnalisees?: Array<{
    medicamentId: string
    quantiteACommander: number
  }>
}

export interface EnvoyerRapportResult {
  fournisseur: { id: string; nom: string; email: string }
  nombreProduits: number
  format: FormatRapport
  fichier: string
}

// ─── Ordonnances ─────────────────────────────────────────────────────────────

export type StatutOrdonnance = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'

export interface Ordonnance {
  id: string
  patientId: string
  prescripteur: string
  statut: StatutOrdonnance
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
  patient?: Pick<Patient, 'id' | 'nom' | 'prenom' | 'telephone'>
}

export interface CreateOrdonnancePayload {
  patientId: string
  prescripteur: string
  imageUrl?: string
}

export type UpdateOrdonnancePayload = Partial<CreateOrdonnancePayload>

// ─── Ventes ──────────────────────────────────────────────────────────────────

export type Devise = 'CDF' | 'USD'
export type StatutVente = 'EN_COURS' | 'FINALISEE' | 'ANNULEE'

export interface LigneVentePayload {
  medicamentId: string
  quantite: number
  devise: Devise
}

export interface CreateVentePayload {
  patientId?: string
  ordonnanceId?: string
  devise: Devise
  lignes: LigneVentePayload[]
}

export interface Vente {
  id: string
  patientId?: string | null
  userId: string
  ordonnanceId?: string | null
  montantTotal: string
  devise: Devise
  statut: StatutVente
  qrCode?: string | null
  ticketUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface LigneVente {
  id: string
  venteId: string
  medicamentId: string
  quantite: number
  prixUnitaire: string
  devise: Devise
  medicament?: MedicamentLite
}

export interface VenteDetail extends Vente {
  lignes: LigneVente[]
  patient?: Pick<Patient, 'id' | 'nom' | 'prenom'>
  user?: Pick<User, 'id' | 'nom' | 'prenom'>
  ordonnance?: Ordonnance
}

// ─── Notifications WebSocket ────────────────────────────────────────────────

export interface StockAlerteEvent {
  medicamentId: string
  nom: string
  quantite: number
  seuilMinimum: number
  message: string
  timestamp: string
}

