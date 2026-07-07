# API Documentation — Pharmacie Backend RDC

**Base URL :** `https://pharmacie.loophole.site/api`
**Documentation interactive :** `https://pharmacie.loophole.site/api/docs`
**Version :** 1.0

---

## Sommaire

1. [Authentification](#1-authentification)
2. [Format des réponses](#2-format-des-réponses)
3. [Gestion des erreurs](#3-gestion-des-erreurs)
4. [Rôles et permissions](#4-rôles-et-permissions)
5. [Module Auth](#5-module-auth)
6. [Module Users](#6-module-users)
7. [Module Patients](#7-module-patients)
8. [Module Médicaments](#8-module-médicaments)
9. [Module Stock](#9-module-stock)
10. [Module Ordonnances](#10-module-ordonnances)
11. [Module Ventes](#11-module-ventes)
12. [Module Fournisseurs](#12-module-fournisseurs)
13. [Module Commandes](#13-module-commandes)
14. [Notifications email](#14-notifications-email)
15. [Notifications temps réel (WebSocket)](#15-notifications-temps-réel-websocket)
16. [Enums de référence](#16-enums-de-référence)

---

## 1. Authentification

L'API utilise des **cookies HTTP-only**. Après le login, le serveur pose automatiquement deux cookies dans le navigateur :

| Cookie | Durée | Rôle |
|--------|-------|------|
| `access_token` | 15 minutes | Authentifier chaque requête |
| `refresh_token` | 7 jours | Renouveler l'access token silencieusement |

### Règle obligatoire côté frontend

Toutes les requêtes doivent inclure les credentials pour que les cookies soient transmis.

**Avec `fetch` :**
```js
fetch('https://pharmacie.loophole.site/api/patients', {
  credentials: 'include', // OBLIGATOIRE
})
```

**Avec `axios` :**
```js
const api = axios.create({
  baseURL: 'https://pharmacie.loophole.site/api',
  withCredentials: true, // OBLIGATOIRE
})
```

### Flux d'authentification complet

```
1. POST /auth/login        → reçoit access_token + refresh_token (cookies)
2. Requêtes normales       → cookies envoyés automatiquement
3. access_token expiré     → POST /auth/refresh → nouveaux cookies
4. POST /auth/logout       → cookies effacés
```

---

## 2. Format des réponses

Toutes les réponses succès suivent ce format :

```json
{
  "success": true,
  "data": { ... },
  "message": "Description de l'opération"
}
```

---

## 3. Gestion des erreurs

Toutes les erreurs suivent ce format :

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description de l'erreur",
  "timestamp": "2026-05-22T01:00:00.000Z",
  "path": "/api/ventes"
}
```

| Code | Signification |
|------|---------------|
| `400` | Données invalides (validation échouée) |
| `401` | Non authentifié (token absent ou expiré) |
| `403` | Accès refusé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `409` | Conflit (email ou téléphone déjà utilisé) |
| `500` | Erreur serveur interne |

---

## 4. Rôles et permissions

| Rôle | Créé par | Description |
|------|----------|-------------|
| `PHARMACIEN` | Seed ou `POST /users` par un pharmacien | Gestion complète : personnel, médicaments, stock, ordonnances, commandes |
| `PREPARATEUR` | PHARMACIEN via `POST /users` | Stock (lecture/mise à jour), rapport de commande |
| `CAISSIER` | PHARMACIEN via `POST /users` | Patients, ventes, scan QR |
| `CLIENT` | Auto-inscription via `POST /auth/register` | Catalogue, commandes en ligne |

> Les routes sans mention de rôle sont accessibles à **tout utilisateur authentifié**.
>
> ⚠️ Le rôle `CLIENT` est **attribué automatiquement** à l'inscription — il ne peut pas être choisi par l'utilisateur ni être assigné par le PHARMACIEN via `/users`.
>
> ℹ️ **Premier compte personnel :** `POST /users` exige un PHARMACIEN connecté et `POST /auth/register` force le rôle CLIENT — le premier PHARMACIEN est injecté via le seed : `npx prisma db seed`. Voir `SEED_DEFAULT_PASSWORD` dans `.env.example`.

---

## 5. Module Auth

### POST `/auth/register`
> Créer un compte **client**. **Route publique.** Le rôle `CLIENT` est attribué automatiquement — aucun champ `role` accepté.

**Body :**
```json
{
  "nom": "Lumumba",
  "prenom": "Patrice",
  "email": "p.lumumba@email.com",
  "motDePasse": "MotDePasse123!"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ✅ | - |
| `prenom` | string | ✅ | - |
| `email` | string | ✅ | Format email valide — unique |
| `motDePasse` | string | ✅ | Min 8 caractères |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Lumumba",
    "prenom": "Patrice",
    "email": "p.lumumba@email.com",
    "role": "CLIENT",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Compte client créé avec succès."
}
```

> ℹ️ Pour créer un compte **staff** (PHARMACIEN, CAISSIER, etc.), utiliser `POST /users` — réservé au PHARMACIEN.

---

### POST `/auth/login`
> Se connecter. **Route publique.** Pose les cookies JWT.

**Body :**
```json
{
  "email": "j.kabila@pharmacie.cd",
  "motDePasse": "MotDePasse123!"
}
```

**Réponse `200` :** (+ cookies `access_token` et `refresh_token` posés)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Kabila",
    "prenom": "Joseph",
    "email": "j.kabila@pharmacie.cd",
    "role": "CAISSIER",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Connexion réussie."
}
```

---

### POST `/auth/refresh`
> Renouveler l'access token. **Route publique.** Utilise le cookie `refresh_token`.

**Body :** aucun

**Réponse `200` :** (+ nouveaux cookies posés)
```json
{
  "success": true,
  "data": { ...utilisateur },
  "message": "Tokens renouvelés avec succès."
}
```

---

### POST `/auth/logout`
> Se déconnecter. Efface les cookies.

**Body :** aucun

**Réponse `200` :**
```json
{
  "success": true,
  "data": null,
  "message": "Déconnexion réussie."
}
```

---

### GET `/auth/me`
> Récupérer le profil de l'utilisateur connecté.

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Kabila",
    "prenom": "Joseph",
    "email": "j.kabila@pharmacie.cd",
    "role": "CAISSIER",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Profil récupéré avec succès."
}
```

---

### PATCH `/auth/change-password`
> Changer son propre mot de passe. **Tout utilisateur authentifié** (staff et client).
>
> Obligatoire pour le **staff** après réception du mot de passe temporaire envoyé par email lors de la création de compte.

**Body :**
```json
{
  "ancienMotDePasse": "MotDePasseTemp123!",
  "nouveauMotDePasse": "MonNouveauMotDePasse456!"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `ancienMotDePasse` | string | ✅ | Doit correspondre au mot de passe actuel |
| `nouveauMotDePasse` | string | ✅ | Min 8 caractères |

**Réponse `200` :**
```json
{
  "success": true,
  "data": null,
  "message": "Mot de passe mis à jour avec succès."
}
```

> ⚠️ Erreur `400` si `ancienMotDePasse` est incorrect.

---

## 6. Module Users

> Gestion du personnel. **Réservé à `PHARMACIEN`.**

### POST `/users`
> Créer un compte pour un membre du personnel. **Rôle : `PHARMACIEN`**
>
> L'PHARMACIEN fournit uniquement les informations — **pas de mot de passe**. Le système génère automatiquement un mot de passe temporaire sécurisé et l'envoie à l'adresse email de l'employé. L'employé devra le changer via `PATCH /auth/change-password` dès sa première connexion.

**Body :**
```json
{
  "nom": "Mukeba",
  "prenom": "Marie",
  "email": "marie.mukeba@pharmacie.cd",
  "role": "PHARMACIEN"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ✅ | - |
| `prenom` | string | ✅ | - |
| `email` | string | ✅ | Format email valide — unique |
| `role` | string | ✅ | `PHARMACIEN` `PHARMACIEN` `PREPARATEUR` `CAISSIER` — le rôle `CLIENT` est exclu |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Mukeba",
    "prenom": "Marie",
    "email": "marie.mukeba@pharmacie.cd",
    "role": "PHARMACIEN",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Compte créé. Les identifiants ont été envoyés à marie.mukeba@pharmacie.cd."
}
```

> ℹ️ L'email reçu par l'employé contient : son email, son mot de passe temporaire et son rôle.

---

### GET `/users`
> Lister tous les membres du personnel.

**Réponse `200` :**
```json
{
  "success": true,
  "data": [ ...tableau d'utilisateurs ],
  "message": "5 utilisateur(s) trouvé(s)."
}
```

---

### GET `/users/:id`
> Détail d'un utilisateur.

**Paramètre :** `id` — UUID de l'utilisateur

---

### PATCH `/users/:id`
> Modifier les informations d'un utilisateur. **Rôle : `PHARMACIEN`**
>
> Permet de changer le nom, prénom, email ou rôle. **Le mot de passe ne se modifie pas ici** — l'utilisateur le change lui-même via `PATCH /auth/change-password`.

**Body :**
```json
{
  "nom": "Nouveau nom",
  "role": "PREPARATEUR"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ❌ | - |
| `prenom` | string | ❌ | - |
| `email` | string | ❌ | Format email valide — unique |
| `role` | string | ❌ | `PHARMACIEN` `PHARMACIEN` `PREPARATEUR` `CAISSIER` |

---

### DELETE `/users/:id`
> Supprimer un utilisateur.

**Réponse `200` :**
```json
{
  "success": true,
  "data": null,
  "message": "Utilisateur supprimé."
}
```

---

## 7. Module Patients

### POST `/patients`
> Enregistrer un nouveau patient. **Rôles : `PHARMACIEN` `PHARMACIEN` `CAISSIER`**

**Body :**
```json
{
  "nom": "Lumumba",
  "prenom": "Patrice",
  "telephone": "+243812345678",
  "adresse": "Avenue Kasavubu, Kinshasa-Gombe"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ✅ | - |
| `prenom` | string | ✅ | - |
| `telephone` | string | ✅ | Format RDC : `+243XXXXXXXXX` ou `0XXXXXXXXX` — **unique** |
| `adresse` | string | ❌ | - |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Lumumba",
    "prenom": "Patrice",
    "telephone": "+243812345678",
    "adresse": "Avenue Kasavubu, Kinshasa-Gombe",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Patient enregistré avec succès."
}
```

---

### GET `/patients`
> Lister tous les patients.

---

### GET `/patients/:id`
> Détail d'un patient avec ses 10 dernières ordonnances et ventes.

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Lumumba",
    "prenom": "Patrice",
    "telephone": "+243812345678",
    "adresse": "...",
    "ordonnances": [ ...10 dernières ordonnances ],
    "ventes": [ ...10 dernières ventes avec lignes ]
  },
  "message": "Patient récupéré."
}
```

---

### PATCH `/patients/:id`
> Modifier un patient. **Rôles : `PHARMACIEN` `CAISSIER`**

**Body :** tous les champs de création sont optionnels.

---

### DELETE `/patients/:id`
> Supprimer un patient. **Rôle : `PHARMACIEN`**

> ⚠️ Échoue si le patient a des ventes associées (`409`).

---

## 8. Module Médicaments

### POST `/medicaments`
> Créer un médicament avec son stock initial. **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :**
```json
{
  "nom": "Paracétamol 500mg",
  "description": "Analgésique et antipyrétique",
  "prixCDF": 500,
  "prixUSD": 0.25,
  "categorie": "Analgésiques",
  "unite": "comprimé",
  "quantiteInitiale": 100,
  "seuilMinimum": 20
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ✅ | - |
| `description` | string | ❌ | - |
| `prixCDF` | number | ✅ | Positif |
| `prixUSD` | number | ✅ | Positif |
| `categorie` | string | ✅ | - |
| `unite` | string | ✅ | Ex : `comprimé`, `flacon`, `boîte` |
| `quantiteInitiale` | number | ❌ | Défaut : `0` |
| `seuilMinimum` | number | ❌ | Défaut : `10` |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Paracétamol 500mg",
    "description": "Analgésique et antipyrétique",
    "prixCDF": "500.00",
    "prixUSD": "0.25",
    "categorie": "Analgésiques",
    "unite": "comprimé",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z",
    "stock": {
      "id": "uuid",
      "medicamentId": "uuid",
      "quantite": 100,
      "seuilMinimum": 20,
      "updatedAt": "2026-05-22T01:00:00.000Z"
    }
  },
  "message": "Médicament créé avec son stock initial."
}
```

---

### GET `/medicaments`
> Lister tous les médicaments avec leur niveau de stock. **Route publique** — aucun token requis.

---

### GET `/medicaments/:id`
> Détail d'un médicament avec son stock. **Route publique** — aucun token requis.

---

### PATCH `/medicaments/:id`
> Modifier un médicament. **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :** tous les champs de création sont optionnels.

---

### DELETE `/medicaments/:id`
> Supprimer un médicament. **Rôle : `PHARMACIEN`**

---

## 9. Module Stock

### GET `/stock`
> Vue d'ensemble de tous les stocks.

**Réponse `200` :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "medicamentId": "uuid",
      "quantite": 100,
      "seuilMinimum": 20,
      "updatedAt": "2026-05-22T01:00:00.000Z",
      "medicament": {
        "id": "uuid",
        "nom": "Paracétamol 500mg",
        "categorie": "Analgésiques",
        "unite": "comprimé",
        "prixCDF": "500.00",
        "prixUSD": "0.25"
      }
    }
  ],
  "message": "12 ligne(s) de stock."
}
```

---

### GET `/stock/alertes`
> Médicaments dont le stock est **≤ seuil minimum**. Utile pour afficher des alertes dans l'UI.

**Réponse `200` :** même format que `/stock`, uniquement les médicaments en rupture.

---

### GET `/stock/rapport-commande`
> Prévisualiser le bon de commande. **Rôles : `PHARMACIEN` `PHARMACIEN` `PREPARATEUR`**
>
> Retourne la liste de tous les médicaments sous seuil avec les quantités suggérées à commander. Ne génère pas de fichier — c'est la prévisualisation avant d'envoyer au fournisseur. L'utilisateur peut consulter, modifier les quantités puis déclencher l'envoi.

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "genereLe": "2026-05-22T10:00:00.000Z",
    "nombreProduits": 3,
    "lignes": [
      {
        "medicamentId": "uuid",
        "nom": "Paracétamol 500mg",
        "categorie": "Analgésiques",
        "unite": "comprimé",
        "quantiteActuelle": 5,
        "seuilMinimum": 20,
        "quantiteACommander": 35
      }
    ]
  },
  "message": "3 produit(s) à commander. Rapport prêt à envoyer."
}
```

> ℹ️ **Formule de suggestion :** `quantiteACommander = max(seuil × 2 − stockActuel, seuil)`. Exemple : stock = 5, seuil = 20 → suggestion = max(35, 20) = **35** unités.

---

### POST `/stock/rapport-commande/envoyer`
> Générer et envoyer le bon de commande au fournisseur. **Rôles : `PHARMACIEN` `PHARMACIEN`**
>
> Génère un fichier PDF ou Excel avec les produits à commander, et l'envoie directement par email à l'adresse du fournisseur sélectionné. Les quantités peuvent être personnalisées par médicament.

**Body :**
```json
{
  "fournisseurId": "uuid-du-fournisseur",
  "format": "pdf",
  "commentaire": "Livraison souhaitée avant le 30 mai.",
  "quantitesPersonnalisees": [
    { "medicamentId": "uuid-medicament", "quantiteACommander": 50 }
  ]
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `fournisseurId` | string | ✅ | UUID d'un fournisseur existant avec email |
| `format` | string | ❌ | `pdf` (défaut) ou `excel` |
| `commentaire` | string | ❌ | Note incluse dans le corps de l'email |
| `quantitesPersonnalisees` | array | ❌ | Permet d'ajuster les quantités par médicament |
| `quantitesPersonnalisees[].medicamentId` | string | ✅ si présent | UUID du médicament |
| `quantitesPersonnalisees[].quantiteACommander` | number | ✅ si présent | Entier ≥ 1 |

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "fournisseur": {
      "id": "uuid",
      "nom": "Pharma Distribution SARL",
      "email": "contact@pharmadist.cd"
    },
    "nombreProduits": 3,
    "format": "pdf",
    "fichier": "bon-commande-1716372000000.pdf"
  },
  "message": "Bon de commande (3 produit(s)) envoyé à contact@pharmadist.cd."
}
```

> ⚠️ Erreur `400` si le fournisseur n'a pas d'email enregistré → utiliser `PATCH /fournisseurs/:id` pour en ajouter un.
> ⚠️ Erreur `400` si aucun produit n'est sous le seuil → aucun envoi effectué.
> ⚠️ Erreur `404` si le fournisseur n'existe pas.

**Format PDF :** document A4 avec tableau coloré (bleu/blanc), pied de page automatique, saut de page si nécessaire.

**Format Excel :** feuille "Bon de commande", colonnes formatées, lignes alternées, quantités urgentes (stock = 0) en jaune.

---

### GET `/stock/:medicamentId`
> Stock d'un médicament spécifique.

**Paramètre :** `medicamentId` — UUID du médicament

---

### PATCH `/stock/:medicamentId`
> Ajuster le stock manuellement (réapprovisionnement). **Rôles : `PHARMACIEN` `PHARMACIEN` `PREPARATEUR`**

**Body :**
```json
{
  "quantite": 150,
  "seuilMinimum": 25
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `quantite` | number | ✅ | Entier ≥ 0 — **remplace** la valeur actuelle |
| `seuilMinimum` | number | ❌ | Entier ≥ 0 |

---

## 10. Module Ordonnances

### POST `/ordonnances`
> Enregistrer une ordonnance (statut initial : `EN_ATTENTE`). **Rôles : `PHARMACIEN` `PHARMACIEN` `CAISSIER`**

**Body :**
```json
{
  "patientId": "uuid-du-patient",
  "prescripteur": "Dr. Mobutu Sese Seko",
  "imageUrl": "https://storage.example.com/ordonnances/ord-001.jpg"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `patientId` | string | ✅ | UUID valide d'un patient existant |
| `prescripteur` | string | ✅ | Nom du médecin |
| `imageUrl` | string | ❌ | URL de l'image scannée |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "prescripteur": "Dr. Mobutu Sese Seko",
    "statut": "EN_ATTENTE",
    "imageUrl": "https://...",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z",
    "patient": {
      "id": "uuid",
      "nom": "Lumumba",
      "prenom": "Patrice",
      "telephone": "+243812345678"
    },
    "vente": null
  },
  "message": "Ordonnance enregistrée, en attente de validation."
}
```

---

### GET `/ordonnances`
> Lister toutes les ordonnances.

---

### GET `/ordonnances/:id`
> Détail d'une ordonnance.

---

### PATCH `/ordonnances/:id/valider`
> Valider une ordonnance `EN_ATTENTE`. **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :** aucun

**Réponse `200` :** ordonnance avec `statut: "VALIDEE"`

> ⚠️ Erreur `400` si l'ordonnance n'est pas en statut `EN_ATTENTE`.

---

### PATCH `/ordonnances/:id/refuser`
> Refuser une ordonnance `EN_ATTENTE`. **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :** aucun

**Réponse `200` :** ordonnance avec `statut: "REFUSEE"`

---

### PATCH `/ordonnances/:id`
> Mettre à jour une ordonnance (ex: ajouter l'URL de l'image). **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :** tous les champs de création sont optionnels.

---

## 11. Module Ventes

### POST `/ventes`
> Créer une vente. Vérifie les stocks, les décrémente, génère le QR code. **Rôles : `PHARMACIEN` `CAISSIER`**

**Body :**
```json
{
  "patientId": "uuid-du-patient",
  "ordonnanceId": "uuid-de-lordonnance",
  "devise": "CDF",
  "lignes": [
    {
      "medicamentId": "uuid-du-medicament",
      "quantite": 3,
      "devise": "CDF"
    },
    {
      "medicamentId": "uuid-autre-medicament",
      "quantite": 1,
      "devise": "USD"
    }
  ]
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `patientId` | string | ❌ | UUID d'un patient (vente anonyme si absent) |
| `ordonnanceId` | string | ❌ | UUID d'une ordonnance **validée** |
| `devise` | string | ✅ | `CDF` ou `USD` |
| `lignes` | array | ✅ | Min 1 ligne |
| `lignes[].medicamentId` | string | ✅ | UUID d'un médicament existant |
| `lignes[].quantite` | number | ✅ | Entier positif ≤ stock disponible |
| `lignes[].devise` | string | ✅ | `CDF` ou `USD` (détermine le prix utilisé) |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-vente",
    "patientId": "uuid",
    "userId": "uuid-du-caissier",
    "ordonnanceId": "uuid",
    "montantTotal": "1500.00",
    "devise": "CDF",
    "statut": "FINALISEE",
    "qrCode": "data:image/png;base64,iVBOR...",
    "ticketUrl": null,
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z",
    "lignes": [
      {
        "id": "uuid",
        "venteId": "uuid",
        "medicamentId": "uuid",
        "quantite": 3,
        "prixUnitaire": "500.00",
        "devise": "CDF",
        "medicament": { "id": "uuid", "nom": "Paracétamol 500mg", ... }
      }
    ],
    "patient": { "id": "uuid", "nom": "Lumumba", "prenom": "Patrice" },
    "user": { "id": "uuid", "nom": "Kabila", "prenom": "Joseph" }
  },
  "message": "Vente créée avec succès. Ticket disponible via GET /ventes/:id/ticket"
}
```

> ⚠️ Erreur `400` si le stock est insuffisant pour l'un des médicaments.
> ⚠️ Erreur `400` si l'ordonnance fournie n'est pas au statut `VALIDEE`.

---

### GET `/ventes`
> Lister toutes les ventes.

---

### GET `/ventes/:id`
> Détail complet d'une vente avec lignes, patient, caissier et ordonnance.

---

### GET `/ventes/:id/ticket`
> **Télécharger le ticket de caisse en PDF.**

**Réponse :** fichier PDF (`Content-Type: application/pdf`)

Le ticket contient :
- Nom de la pharmacie
- Date et heure
- Nom du caissier et du patient
- Liste des médicaments (nom, quantité, prix unitaire, sous-total)
- Montant total + devise
- QR code (encodant l'ID de la vente pour vérification)

**Usage côté frontend :**
```js
// Ouvre le PDF dans un nouvel onglet
window.open('https://pharmacie.loophole.site/api/ventes/UUID/ticket', '_blank')

// Ou téléchargement direct
const response = await fetch('https://pharmacie.loophole.site/api/ventes/UUID/ticket', {
  credentials: 'include',
})
const blob = await response.blob()
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'ticket.pdf'
a.click()
```

---

### PATCH `/ventes/:id/annuler`
> Annuler une vente et **restituer les stocks**. **Rôle : `PHARMACIEN`**

**Body :** aucun

**Réponse `200` :** vente avec `statut: "ANNULEE"`

> ⚠️ Erreur `400` si la vente est déjà annulée.

---

## 12. Module Fournisseurs

### POST `/fournisseurs`
> Créer un fournisseur. **Rôles : `PHARMACIEN` `PHARMACIEN`**

**Body :**
```json
{
  "nom": "Pharma Distribution SARL",
  "telephone": "+243812345678",
  "email": "contact@pharmadist.cd",
  "adresse": "Avenue du Commerce, Kinshasa-Gombe"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `nom` | string | ✅ | - |
| `telephone` | string | ✅ | **Unique** |
| `email` | string | ❌ | Format email valide — **unique** |
| `adresse` | string | ❌ | - |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Pharma Distribution SARL",
    "telephone": "+243812345678",
    "email": "contact@pharmadist.cd",
    "adresse": "Avenue du Commerce, Kinshasa-Gombe",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z"
  },
  "message": "Fournisseur créé avec succès."
}
```

---

### GET `/fournisseurs`
> Lister tous les fournisseurs (ordre alphabétique).

**Réponse `200` :**
```json
{
  "success": true,
  "data": [ ...tableau de fournisseurs ],
  "message": "3 fournisseur(s) trouvé(s)."
}
```

---

### GET `/fournisseurs/:id`
> Détail d'un fournisseur.

**Paramètre :** `id` — UUID du fournisseur

---

### PATCH `/fournisseurs/:id`
> Modifier un fournisseur. **Rôles : `PHARMACIEN` `PHARMACIEN`** — Tous les champs optionnels.

**Body :**
```json
{
  "telephone": "+243898765432",
  "adresse": "Nouvelle adresse"
}
```

> ⚠️ Erreur `409` si le nouveau `telephone` ou `email` est déjà utilisé par un autre fournisseur.

---

### DELETE `/fournisseurs/:id`
> Supprimer un fournisseur. **Rôle : `PHARMACIEN`**

**Réponse `200` :**
```json
{
  "success": true,
  "data": null,
  "message": "Fournisseur supprimé."
}
```

---

## 13. Module Commandes

> Permet aux **clients** de passer des commandes en ligne. Le personnel valide ou refuse les commandes depuis leur interface.

### POST `/commandes`
> Passer une commande. **Rôle : `CLIENT`**
>
> Le client soumet la liste des médicaments souhaités avec les quantités. La commande est créée avec le statut `EN_ATTENTE`. Aucune déduction de stock à ce stade — le stock n'est décrémenté que lors d'une vente physique (`POST /ventes`).

**Body :**
```json
{
  "lignes": [
    { "medicamentId": "uuid-medicament-1", "quantite": 2 },
    { "medicamentId": "uuid-medicament-2", "quantite": 1 }
  ],
  "note": "Médicaments urgents, merci de préparer rapidement"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `lignes` | array | ✅ | Min 1 ligne |
| `lignes[].medicamentId` | string | ✅ | UUID d'un médicament existant |
| `lignes[].quantite` | number | ✅ | Entier ≥ 1 |
| `note` | string | ❌ | Remarque libre |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-commande",
    "clientId": "uuid-client",
    "statut": "EN_ATTENTE",
    "note": "Médicaments urgents...",
    "createdAt": "2026-05-22T01:00:00.000Z",
    "updatedAt": "2026-05-22T01:00:00.000Z",
    "client": {
      "id": "uuid",
      "nom": "Lumumba",
      "prenom": "Patrice",
      "email": "p.lumumba@email.com"
    },
    "lignes": [
      {
        "id": "uuid-ligne",
        "commandeId": "uuid-commande",
        "medicamentId": "uuid-medicament",
        "quantite": 2,
        "medicament": {
          "id": "uuid",
          "nom": "Paracétamol 500mg",
          "unite": "comprimé",
          "prixCDF": "500.00",
          "prixUSD": "0.25"
        }
      }
    ]
  },
  "message": "Commande créée. Elle sera traitée par notre équipe."
}
```

> ⚠️ Erreur `404` si un ou plusieurs `medicamentId` n'existent pas.

---

### GET `/commandes`
> Lister toutes les commandes. **Rôles : `PHARMACIEN` `PHARMACIEN` `CAISSIER` `PREPARATEUR`**

**Réponse `200` :**
```json
{
  "success": true,
  "data": [ ...tableau de commandes avec lignes et infos client ],
  "message": "12 commande(s) trouvée(s)."
}
```

---

### GET `/commandes/mes-commandes`
> Le client consulte uniquement **ses propres commandes**. **Rôle : `CLIENT`**

**Réponse `200` :** même format que ci-dessus, filtré sur le client connecté.

---

### GET `/commandes/:id`
> Détail d'une commande. **Tout utilisateur authentifié.**
>
> Le `CLIENT` ne peut accéder qu'à ses propres commandes (erreur `403` sinon). Le personnel peut accéder à toute commande.

**Paramètre :** `id` — UUID de la commande

**Réponse `200` :** commande complète avec lignes et infos client.

> ⚠️ Erreur `403` si un CLIENT tente d'accéder à la commande d'un autre client.
> ⚠️ Erreur `404` si la commande n'existe pas.

---

### PATCH `/commandes/:id/valider`
> Valider une commande en attente. **Rôles : `PHARMACIEN` `PHARMACIEN`**
>
> Passe le statut de `EN_ATTENTE` à `VALIDEE`. Erreur `400` si la commande est déjà traitée (VALIDEE ou REFUSEE).

**Body :** aucun

**Réponse `200` :**
```json
{
  "success": true,
  "data": { ...commande avec "statut": "VALIDEE" },
  "message": "Commande validée."
}
```

---

### PATCH `/commandes/:id/refuser`
> Refuser une commande en attente. **Rôles : `PHARMACIEN` `PHARMACIEN`**
>
> Passe le statut de `EN_ATTENTE` à `REFUSEE`. Erreur `400` si la commande est déjà traitée.

**Body :** aucun

**Réponse `200` :**
```json
{
  "success": true,
  "data": { ...commande avec "statut": "REFUSEE" },
  "message": "Commande refusée."
}
```

---

## 14. Notifications email

Le backend envoie automatiquement des emails via **Gmail SMTP** dans les situations suivantes. Aucun endpoint à appeler depuis le frontend — c'est entièrement côté serveur.

| Événement | Méthode interne | Destinataire | Contenu | Déclenché automatiquement ? |
|---|---|---|---|---|
| Création de compte staff (`POST /users`) | `sendCredentiels(email, prenom, role, mdpTemp)` | Nouvel employé | Email, mot de passe temporaire, rôle | ✅ Oui |
| Réapprovisionnement stock sous seuil (`PATCH /stock/:id`) | `sendAlerteStock(email, medicaments[])` | PHARMACIEN | Tableau des médicaments en rupture | ❌ Disponible, non branché |
| Création de vente (`POST /ventes`) | `sendTicketVente(email, venteId, montant, devise)` | Patient (si email disponible) | Reçu de vente avec montant et référence | ❌ Disponible, non branché |
| Bienvenue générique | `sendBienvenue(email, nom)` | N'importe quel utilisateur | Message de bienvenue | ❌ Disponible, non branché |

> **Note :** `sendCredentiels` est la seule méthode automatiquement appelée à ce stade. Les autres méthodes du `MailService` sont prêtes et exportées — pour les brancher, injecter `MailModule` dans le module concerné et appeler la méthode au bon endroit.

### Exemple d'intégration dans UsersService

```typescript
// users.module.ts → ajouter MailModule aux imports
import { MailModule } from '../mail/mail.module';

// users.service.ts → injecter MailService
constructor(
  private readonly prisma: PrismaService,
  private readonly mail: MailService,
) {}

async create(dto: CreateUserDto) {
  const user = await this.prisma.user.create({ ... });
  await this.mail.sendBienvenue(user.email, user.prenom);
  return user;
}
```

---

## 15. Notifications temps réel (WebSocket)

Le serveur implémente un **WebSocket temps réel via Socket.IO**. Contrairement aux routes HTTP, le serveur **pousse** les événements aux clients connectés sans qu'ils aient à interroger l'API.

### Connexion

```
URL : ws://<host>:<port>   ← même host et port que l'API REST
Protocole : Socket.IO (pas un WebSocket brut)
Auth : aucune (connexion ouverte, lecture seule)
```

**Installation côté front :**
```bash
npm install socket.io-client
```

**Connexion minimale :**
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('WebSocket connecté');
});
```

---

### GET `/notifications/events`
> Retourne la documentation complète du contrat WebSocket (connexion, événements, payloads). Accessible dans Swagger.

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "description": "WebSocket temps réel via Socket.IO...",
    "connexion": {
      "url": "ws://<host>:<port>",
      "bibliotheque": "socket.io-client",
      "exemple_js": "..."
    },
    "evenements": [ ... ]
  },
  "message": "Opération réussie"
}
```

---

### Événements émis par le serveur

#### `stock-alerte`

Émis automatiquement quand le stock d'un médicament **atteint ou descend sous son `seuilMinimum`**.

**Déclencheurs :**
- Après une vente finalisée (`POST /ventes`) — chaque médicament dont le stock restant ≤ son seuil
- Après une mise à jour manuelle du stock (`PATCH /stock/:medicamentId`) — si la nouvelle quantité ≤ seuil

**Payload reçu par le client :**
```json
{
  "medicamentId": "550e8400-e29b-41d4-a716-446655440000",
  "nom": "Paracétamol 500mg",
  "quantite": 5,
  "seuilMinimum": 10,
  "message": "Stock critique : Paracétamol 500mg — 5 unité(s) restante(s) (seuil : 10)",
  "timestamp": "2026-05-22T10:30:00.000Z"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `medicamentId` | string (UUID) | Identifiant du médicament concerné |
| `nom` | string | Nom du médicament |
| `quantite` | number | Stock restant **après** l'opération qui a déclenché l'alerte |
| `seuilMinimum` | number | Seuil configuré pour ce médicament (alerte si `quantite ≤ seuilMinimum`) |
| `message` | string | Message lisible prêt à afficher dans l'UI |
| `timestamp` | string (ISO 8601) | Date et heure de l'émission de l'alerte |

**Exemple d'intégration React :**
```js
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

useEffect(() => {
  socket.on('stock-alerte', (data) => {
    // Afficher une notification dans l'UI
    toast.warning(data.message);
    // Ou mettre à jour l'état global du stock
    refreshStockData(data.medicamentId);
  });

  return () => {
    socket.off('stock-alerte');
  };
}, []);
```

> ⚠️ Un même médicament peut déclencher **plusieurs alertes** si plusieurs ventes successives font descendre son stock. Côté front, prévoir un dédoublonnage ou une limitation d'affichage si nécessaire.

---

## 16. Enums de référence

### `Role`
```
PHARMACIEN        (créé par un PHARMACIEN via POST /users)
PHARMACIEN   (créé par un PHARMACIEN via POST /users)
PREPARATEUR  (créé par un PHARMACIEN via POST /users)
CAISSIER     (créé par un PHARMACIEN via POST /users)
CLIENT       (auto-inscription via POST /auth/register — attribué automatiquement)
```

### `Devise`
```
CDF   (Franc Congolais)
USD   (Dollar Américain)
```

### `StatutOrdonnance`
```
EN_ATTENTE   (vient d'être enregistrée)
VALIDEE      (approuvée par le pharmacien → peut être utilisée dans une vente)
REFUSEE      (rejetée par le pharmacien)
```

### `StatutCommande`
```
EN_ATTENTE   (commande soumise par le client, en attente de traitement)
VALIDEE      (acceptée par le pharmacien ou l'PHARMACIEN)
REFUSEE      (refusée par le pharmacien ou l'PHARMACIEN)
```

### `StatutVente`
```
EN_COURS     (non utilisé à la création, réservé pour usage futur)
FINALISEE    (vente créée et payée)
ANNULEE      (annulée par un PHARMACIEN, stocks restitués)
```

---

## Récapitulatif de toutes les routes

| Méthode | Route | Rôles requis | Description |
|---------|-------|-------------|-------------|
| POST | `/auth/register` | Public | Créer un compte **client** (rôle CLIENT auto) |
| POST | `/auth/login` | Public | Se connecter |
| POST | `/auth/refresh` | Public | Renouveler les tokens |
| POST | `/auth/logout` | Authentifié | Se déconnecter |
| GET | `/auth/me` | Authentifié | Profil connecté |
| PATCH | `/auth/change-password` | Authentifié | Changer son mot de passe |
| POST | `/users` | PHARMACIEN | Créer un compte staff (mot de passe envoyé par email) |
| GET | `/users` | PHARMACIEN | Lister le personnel |
| GET | `/users/:id` | PHARMACIEN | Détail d'un employé |
| PATCH | `/users/:id` | PHARMACIEN | Modifier nom/prénom/email/rôle d'un employé |
| DELETE | `/users/:id` | PHARMACIEN | Supprimer un employé |
| POST | `/patients` | PHARMACIEN, CAISSIER | Créer patient |
| GET | `/patients` | Authentifié | Lister patients |
| GET | `/patients/:id` | Authentifié | Détail patient |
| PATCH | `/patients/:id` | PHARMACIEN, CAISSIER | Modifier patient |
| DELETE | `/patients/:id` | PHARMACIEN | Supprimer patient |
| POST | `/medicaments` | PHARMACIEN | Créer médicament |
| GET | `/medicaments` | **Public** | Lister médicaments (catalogue public) |
| GET | `/medicaments/:id` | **Public** | Détail médicament (catalogue public) |
| PATCH | `/medicaments/:id` | PHARMACIEN | Modifier médicament |
| DELETE | `/medicaments/:id` | PHARMACIEN | Supprimer médicament |
| GET | `/stock` | Authentifié | Tous les stocks |
| GET | `/stock/alertes` | Authentifié | Stocks sous seuil |
| GET | `/stock/rapport-commande` | PHARMACIEN, PREPARATEUR | Prévisualiser le bon de commande |
| POST | `/stock/rapport-commande/envoyer` | PHARMACIEN | Générer (PDF/Excel) et envoyer au fournisseur |
| GET | `/stock/:medicamentId` | Authentifié | Stock d'un médicament |
| PATCH | `/stock/:medicamentId` | PHARMACIEN, PREPARATEUR | Réapprovisionner |
| POST | `/ordonnances` | PHARMACIEN, CAISSIER | Créer ordonnance |
| GET | `/ordonnances` | Authentifié | Lister ordonnances |
| GET | `/ordonnances/:id` | Authentifié | Détail ordonnance |
| PATCH | `/ordonnances/:id/valider` | PHARMACIEN | Valider ordonnance |
| PATCH | `/ordonnances/:id/refuser` | PHARMACIEN | Refuser ordonnance |
| PATCH | `/ordonnances/:id` | PHARMACIEN | Modifier ordonnance |
| POST | `/ventes` | PHARMACIEN, CAISSIER | Créer vente |
| GET | `/ventes` | Authentifié | Lister ventes |
| GET | `/ventes/:id` | Authentifié | Détail vente |
| GET | `/ventes/:id/ticket` | Authentifié | Ticket PDF |
| PATCH | `/ventes/:id/annuler` | PHARMACIEN | Annuler vente |
| POST | `/fournisseurs` | PHARMACIEN | Créer fournisseur |
| GET | `/fournisseurs` | Authentifié | Lister fournisseurs |
| GET | `/fournisseurs/:id` | Authentifié | Détail fournisseur |
| PATCH | `/fournisseurs/:id` | PHARMACIEN | Modifier fournisseur |
| DELETE | `/fournisseurs/:id` | PHARMACIEN | Supprimer fournisseur |
| POST | `/commandes` | CLIENT | Passer une commande |
| GET | `/commandes` | PHARMACIEN, CAISSIER, PREPARATEUR | Toutes les commandes |
| GET | `/commandes/mes-commandes` | CLIENT | Mes propres commandes |
| GET | `/commandes/:id` | Authentifié | Détail d'une commande (CLIENT = ses propres seulement) |
| PATCH | `/commandes/:id/valider` | PHARMACIEN | Valider une commande |
| PATCH | `/commandes/:id/refuser` | PHARMACIEN | Refuser une commande |
| GET | `/notifications/events` | Authentifié | Documentation du contrat WebSocket |
