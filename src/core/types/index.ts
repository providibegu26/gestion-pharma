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

/**
 * Cycle de vie backend : EN_ATTENTE → PRETE (validation, stock déduit)
 * → RETIREE (scan QR retrait) | REFUSEE (manuel ou auto si stock insuffisant).
 */
export type StatutCommande = 'EN_ATTENTE' | 'PRETE' | 'RETIREE' | 'REFUSEE'

// ─── Wrappers API ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface ApiErrorPayload {
  success: false
  statusCode: number
  message: string | string[]
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

// ─── Rôles gérés (endpoint /roles — préparé, pas encore exposé par le backend) ─

export interface ManagedRole {
  id: string
  /** Clé technique du rôle (ex. "PHARMACIEN"). */
  nom: string
  label?: string
  description?: string
  /** Permissions accordées (clés de `Permission`). */
  permissions?: string[]
  /** Rôle système : non supprimable / non éditable. */
  systeme?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateRolePayload {
  nom: string
  label?: string
  description?: string
  permissions?: string[]
}

export type UpdateRolePayload = Partial<CreateRolePayload>

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
  /** True si le refus a été déclenché automatiquement (stock insuffisant). */
  refuseAutomatique?: boolean
  /** Montant total calculé par le backend (chaîne décimale). */
  montantTotal?: string | null
  /** Code de retrait unique de la commande (ex. "CMD-A3F2-9B1C"). */
  codeRetrait?: string | null
  /** Image QR encodée en base64 (data URL) fournie par le backend. */
  qrImage?: string | null
  /** Contenu textuel du QR (ex. "PHARMACIE-COMMANDE:CMD-..."). */
  payloadQr?: string | null
  retraitAt?: string | null
  validatedAt?: string | null
  refusedAt?: string | null
  createdAt: string
  updatedAt: string
  client?: Pick<User, 'id' | 'nom' | 'prenom' | 'email'>
  lignes: LigneCommande[]
}

/** Payload de scan d'un QR commande (code brut ou payload complet). */
export interface CommandeCodePayload {
  code: string
}

/** Résultat de la consultation d'un QR commande avant retrait. */
export interface CommandeCodeInfo {
  commande: Commande
  utilisable?: boolean
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

// ─── File d'attente (endpoint /file-attente) ─────────────────────────────────

/** Guichet de service. */
export type TypeService = 'PHARMACIE' | 'CAISSE'

/** Statuts backend d'un ticket de file d'attente. */
export type QueueStatut = 'EN_ATTENTE' | 'APPELE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'

export interface QueueTicket {
  id: string
  /** Numéro d'ordre automatique affiché au client. */
  numeroTicket: number
  typeService: TypeService
  statut: QueueStatut
  /** Nom affiché (client connecté ou saisi à la borne). */
  nomAffiche?: string | null
  /** Position courante dans la file (recalculée par le backend). */
  position?: number | null
  /** Estimation d'attente en minutes. */
  estimeeMinutes?: number | null
  clientId?: string | null
  createdAt?: string
  updatedAt?: string
}

/** CLIENT connecté — rejoindre la file. */
export interface JoinQueuePayload {
  typeService: TypeService
}

/** Borne publique — rejoindre sans compte. */
export interface JoinQueuePublicPayload {
  typeService: TypeService
  nomAffiche: string
}

/** Position d'un client dans la file (GET /file-attente/ma-position). */
export interface QueuePosition {
  numeroTicket?: number
  positionActuelle: number
  estimeeMinutes: number
  statut: QueueStatut
}

/** Compteurs d'un guichet. */
export interface QueueServiceStats {
  enAttente: number
  enCours: number
  estimeeProchaine: number
}

/** Statistiques globales des deux files (GET /file-attente/stats). */
export interface QueueStats {
  pharmacie: QueueServiceStats
  caisse: QueueServiceStats
}

// ─── Codes QR ventes (unitaires — module /codes-qr) ──────────────────────────

export type CodeQrStatut = 'ACTIF' | 'UTILISE' | 'EXPIRE'

export interface VenteCodeQr {
  code: string
  statut: CodeQrStatut
  payload?: string
  qrImage?: string
  medicament?: MedicamentLite
}

/** Payload de scan d'un code QR vente. */
export interface CodeQrPayload {
  code: string
}

/** Résultat de la consultation d'un code QR vente. */
export interface CodeQrInfo {
  code: string
  utilisable: boolean
  statut: CodeQrStatut
  medicament?: MedicamentLite
  patient?: Pick<Patient, 'id' | 'nom' | 'prenom'>
  vente?: Pick<Vente, 'id' | 'montantTotal' | 'devise' | 'createdAt'>
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

