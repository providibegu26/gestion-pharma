# Pharmacie Backend RDC — Documentation API

Backend NestJS pour la gestion d'une pharmacie digitale en République Démocratique du Congo.  
Double devise **CDF / USD**, authentification par **cookies HTTP-only JWT**, documentation Swagger interactive.

> **Intégration frontend (boutons, écrans, WebSocket) :** voir **[GUIDE_FRONTEND.md](./GUIDE_FRONTEND.md)** — document de référence pour les dev front avec la matrice complète bouton → API par rôle.

---

## Table des matières

1. [Prérequis et configuration](#1-prérequis-et-configuration)
2. [Lancement du serveur](#2-lancement-du-serveur)
3. [Peuplement de la base (seed)](#3-peuplement-de-la-base-seed)
4. [Comptes de démonstration](#4-comptes-de-démonstration)
5. [Conventions générales](#5-conventions-générales)
6. [Authentification](#6-authentification)
7. [Rôles et permissions](#7-rôles-et-permissions)
8. [API — Auth](#8-api--auth)
9. [API — Utilisateurs (personnel)](#9-api--utilisateurs-personnel)
10. [API — Patients](#10-api--patients)
11. [API — Médicaments](#11-api--médicaments)
12. [API — Stock](#12-api--stock)
13. [API — Ordonnances](#13-api--ordonnances)
14. [API — Ventes](#14-api--ventes)
15. [API — Fournisseurs](#15-api--fournisseurs)
16. [API — Commandes clients](#16-api--commandes-clients)
17. [API — File d'attente](#17-api--file-dattente)
18. [API — Notifications (WebSocket)](#18-api--notifications-websocket)
19. [Récapitulatif des routes](#19-récapitulatif-des-routes)

---

## 1. Prérequis et configuration

### Installation

```bash
cd pharmacie-backend
npm install
cp .env.example .env
# Éditer .env avec vos vraies valeurs (DATABASE_URL, JWT, Gmail…)
npx prisma migrate dev
SEED_FORCE=true npx prisma db seed
```

### Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | Connexion PostgreSQL |
| `JWT_SECRET` | Oui | Secret JWT access (min. 32 car.) |
| `JWT_REFRESH_SECRET` | Oui | Secret JWT refresh (min. 32 car.) |
| `JWT_EXPIRES_IN` | Non | Durée access token (défaut : `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Non | Durée refresh token (défaut : `7d`) |
| `PORT` | Non | Port HTTP (défaut : `3000`) |
| `NODE_ENV` | Non | `development` \| `production` \| `test` |
| `PHARMACIE_NOM` | Non | Nom affiché sur les tickets PDF |
| `TUNNEL_HOSTNAME` | Non | Sous-domaine Loophole (défaut : `pharmacie`) |
| `ALLOWED_ORIGINS` | Non | Origines CORS séparées par virgule |
| `GMAIL_USER` | Oui | Compte Gmail pour l'envoi d'emails |
| `GMAIL_APP_PASSWORD` | Oui | Mot de passe d'application Gmail |
| `SEED_DEFAULT_PASSWORD` | Non | Mot de passe des comptes seed (défaut : `pharma2026`) |
| `SEED_FORCE` | Non | `true` = supprime et recrée les données de démo |

---

## 2. Lancement du serveur

> **Équipe frontend :** selon le mode choisi ci-dessous, configurez les URLs dans votre `.env` — voir **[GUIDE_FRONTEND.md §2 — Local vs Loophole](./GUIDE_FRONTEND.md#2-local-vs-loophole--choisir-les-bonnes-urls)** et le fichier **`.env.frontend.example`**.

### Mode classique (local)

```bash
npm run start:dev
```

| Ressource | URL | Variable frontend |
|-----------|-----|-------------------|
| API | `http://localhost:3000/api` | `VITE_API_URL` |
| Swagger | `http://localhost:3000/api/docs` | — |
| WebSocket | `http://localhost:3000` | `VITE_WS_URL` |

Le serveur écoute sur le port défini par `PORT` (défaut **3000**).

### Mode tunnel (Loophole)

Expose l'API locale sur Internet via un tunnel public.

```bash
npm run start:tunnel
```

Ce script lance **en parallèle** :
- NestJS en mode watch (`nest start --watch`)
- Loophole : `.\loophole http 3000 --hostname pharmacie`

| Ressource | URL | Variable frontend |
|-----------|-----|-------------------|
| API tunnel | `https://pharmacie.loophole.site/api` | `VITE_API_URL` |
| Swagger tunnel | `https://pharmacie.loophole.site/api/docs` | — |
| WebSocket tunnel | `https://pharmacie.loophole.site` | `VITE_WS_URL` |

> Le hostname peut être personnalisé via `TUNNEL_HOSTNAME` dans `.env`.  
> L'exécutable `loophole` doit être présent à la racine du projet.

**Frontend :** utiliser les URLs tunnel **uniquement** si le backend tourne avec `start:tunnel`.  
Pour le dev authentifié (login/cookies), préférer le **mode local** — voir les limitations cookies dans le guide frontend.

### Mode production

```bash
npm run build
npm run start:prod
```

---

## 3. Peuplement de la base (seed)

```bash
# Première installation ou reset complet
SEED_FORCE=true npx prisma db seed

# Si la base est vide uniquement
npx prisma db seed
```

Le seed crée : 7 utilisateurs, 4 patients, 3 fournisseurs, 10 médicaments + stocks, 4 ordonnances, 3 ventes, 3 commandes.

Si des utilisateurs existent déjà et `SEED_FORCE` n'est pas `true`, le seed est ignoré.

---

## 4. Comptes de démonstration

**Mot de passe commun : `pharma2026`**

### Personnel

| Rôle | Nom complet | Email |
|------|-------------|-------|
| PHARMACIEN | Marie Mukeba | `marie.mukeba@pharmacie-centrale.cd` |
| PHARMACIEN | Marie Mukeba | `marie.mukeba@pharmacie-centrale.cd` |
| PREPARATEUR | Patrick Ilunga | `patrick.ilunga@pharmacie-centrale.cd` |
| CAISSIER | Grace Tshilombo | `grace.tshilombo@pharmacie-centrale.cd` |

### Clients (commandes en ligne)

| Nom complet | Email |
|-------------|-------|
| Patrice Lumumba | `p.lumumba@gmail.com` |
| Amina Kabongo | `a.kabongo@yahoo.fr` |
| David Mbuyi | `d.mbuyi@outlook.com` |

### Patients (fiches sans compte)

| Nom | Téléphone |
|-----|-----------|
| Emmanuel Kazadi | `+243812345678` |
| Claudine Nsimba | `+243823456789` |
| Joseph Mukendi | `+243834567890` |
| Béatrice Tshisekedi | `+243845678901` |

---

## 5. Conventions générales

### Préfixe global

Toutes les routes REST sont préfixées par **`/api`**.

Exemple : `GET /api/patients`

### Format des réponses — Succès

Toutes les réponses JSON réussies (sauf PDF et exceptions) sont enveloppées ainsi :

```json
{
  "success": true,
  "data": { },
  "message": "Description lisible de l'opération"
}
```

- `data` : payload métier (objet, tableau ou `null`)
- `message` : texte explicatif en français

### Format des réponses — Erreur

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description de l'erreur",
  "timestamp": "2026-07-07T10:00:00.000Z",
  "path": "/api/patients"
}
```

`message` peut être une **chaîne** ou un **tableau de chaînes** (erreurs de validation).

### Codes HTTP courants

| Code | Signification |
|------|---------------|
| 200 | Succès (lecture, mise à jour, suppression) |
| 201 | Ressource créée |
| 400 | Données invalides ou règle métier violée |
| 401 | Non authentifié (cookie absent ou expiré) |
| 403 | Authentifié mais rôle insuffisant |
| 404 | Ressource introuvable |
| 409 | Conflit (email/téléphone déjà utilisé) |

### Authentification des requêtes

L'API utilise des **cookies HTTP-only** (pas de Bearer token dans les headers) :

| Cookie | Durée | Usage |
|--------|-------|-------|
| `access_token` | 15 min | Authentification des routes protégées |
| `refresh_token` | 7 jours | Renouvellement via `POST /api/auth/refresh` |

**Frontend (obligatoire)** :

```javascript
// fetch
fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });

// axios
axios.defaults.withCredentials = true;
```

### Routes publiques (sans cookie)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/medicaments`
- `GET /api/medicaments/:id`

Toutes les autres routes nécessitent un cookie `access_token` valide.

### Validation des body

Les champs non déclarés dans le DTO sont **rejetés** (`forbidNonWhitelisted: true`).  
Les types sont **convertis automatiquement** (ex. `"3"` → `3` pour les nombres).

### Exceptions au format JSON

| Route | Comportement |
|-------|--------------|
| `GET /api/ventes/:id/ticket` | Retourne un fichier **PDF binaire** (pas de JSON) |

---

## 6. Authentification

### Flux complet

```
1. POST /api/auth/login        → cookies posés
2. Requêtes API                → cookie access_token envoyé automatiquement
3. POST /api/auth/refresh      → renouvelle les cookies (avant expiration 15 min)
4. POST /api/auth/logout       → cookies effacés + refresh invalidé en base
```

---

## 7. Rôles et permissions

| Rôle | Description |
|------|-------------|
| `PHARMACIEN` | Accès total |
| `PHARMACIEN` | Médicaments, stock, ordonnances, commandes, fournisseurs |
| `PREPARATEUR` | Consultation stock, rapport de commande |
| `CAISSIER` | Ventes, patients, ordonnances (création) |
| `CLIENT` | Commandes en ligne, auto-inscription |

**Règle** : si une route n'a pas de décorateur `@Roles()`, tout utilisateur **authentifié** y a accès.

---

## 8. API — Auth

Base : `/api/auth`

### `POST /register` — Inscription client (PUBLIC)

Crée un compte avec le rôle `CLIENT`.

**Body :**
```json
{
  "nom": "Lumumba",
  "prenom": "Patrice",
  "email": "p.lumumba@gmail.com",
  "motDePasse": "pharma2026"
}
```

| Champ | Règles |
|-------|--------|
| `nom`, `prenom` | Obligatoires, string |
| `email` | Email valide, unique |
| `motDePasse` | Min. 8 caractères |

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Lumumba",
    "prenom": "Patrice",
    "email": "p.lumumba@gmail.com",
    "role": "CLIENT",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Compte client créé avec succès."
}
```

**Erreurs :** `409` si email déjà utilisé.

---

### `POST /login` — Connexion (PUBLIC)

**Body :**
```json
{
  "email": "marie.mukeba@pharmacie-centrale.cd",
  "motDePasse": "pharma2026"
}
```

**Réponse `200` :** même structure `data` utilisateur + **cookies posés** dans les headers `Set-Cookie`.

**Erreurs :** `401` email ou mot de passe incorrect.

---

### `POST /refresh` — Renouveler les tokens (PUBLIC, cookie refresh requis)

Nécessite le cookie `refresh_token`.

**Réponse `200` :** utilisateur + nouveaux cookies.

**Erreurs :** `401` refresh token invalide ou expiré.

---

### `POST /logout` — Déconnexion (AUTH)

Invalide le refresh token en base et efface les cookies.

**Réponse `200` :**
```json
{
  "success": true,
  "data": null,
  "message": "Déconnexion réussie."
}
```

---

### `GET /me` — Profil connecté (AUTH)

**Réponse `200` :** objet utilisateur (sans `motDePasse` ni `refreshToken`).

---

### `PATCH /change-password` — Changer son mot de passe (AUTH)

**Body :**
```json
{
  "ancienMotDePasse": "pharma2026",
  "nouveauMotDePasse": "nouveauMotDePasse8"
}
```

**Réponse `200` :** `data: null`, message de confirmation.

**Erreurs :** `400` ancien mot de passe incorrect.

---

## 9. API — Utilisateurs (personnel)

Base : `/api/users` — **PHARMACIEN uniquement**

> La création via API génère un mot de passe **aléatoire** envoyé par email (différent du seed).

### `POST /` — Créer un membre du personnel

**Body :**
```json
{
  "nom": "Mukeba",
  "prenom": "Marie",
  "email": "marie.mukeba@pharmacie-centrale.cd",
  "role": "PHARMACIEN"
}
```

Rôles acceptés : `PHARMACIEN`, `PREPARATEUR`, `CAISSIER` (pas `CLIENT`).

**Réponse `201` :** utilisateur créé (sans mot de passe). Un email avec identifiants est envoyé.

---

### `GET /` — Lister tout le personnel

**Réponse `200` :** tableau d'utilisateurs.

---

### `GET /:id` — Détail d'un utilisateur

**Réponse `200` :** un utilisateur.

**Erreurs :** `404` introuvable.

---

### `PATCH /:id` — Modifier un utilisateur

**Body (tous optionnels) :** `nom`, `prenom`, `email`, `role`

> Le mot de passe ne se change **pas** ici — utiliser `PATCH /api/auth/change-password`.

**Réponse `200` :** utilisateur mis à jour.

**Erreurs :** `404`, `409` email déjà pris.

---

### `DELETE /:id` — Supprimer un utilisateur

**Réponse `200` :** `data: null`.

**Erreurs :** `404`.

---

## 10. API — Patients

Base : `/api/patients`

Les patients sont des **fiches physiques** (sans compte login). Identifiés par un **téléphone unique**.

### `POST /` — Créer — PHARMACIEN, CAISSIER

**Body :**
```json
{
  "nom": "Kazadi",
  "prenom": "Emmanuel",
  "telephone": "+243812345678",
  "adresse": "Av. du Commerce, Gombe"
}
```

| Champ | Règles |
|-------|--------|
| `telephone` | Unique, format `+243XXXXXXXXX` ou `0XXXXXXXXX` |
| `adresse` | Optionnel |

**Réponse `201` :** fiche patient complète.

**Erreurs :** `409` téléphone déjà enregistré.

---

### `GET /` — Lister — AUTH (tous rôles)

**Réponse `200` :** tableau de patients, triés par date décroissante.

---

### `GET /:id` — Détail avec historique — AUTH

**Réponse `200` :** patient + 10 dernières ordonnances + 10 dernières ventes (avec lignes).

---

### `PATCH /:id` — Modifier — PHARMACIEN, CAISSIER

**Body :** champs partiels (`nom`, `prenom`, `telephone`, `adresse`).

**Réponse `200` :** patient mis à jour.

---

### `DELETE /:id` — Supprimer — PHARMACIEN

**Réponse `200` :** `data: null`.

**Erreurs :** `409` si le patient a des ventes associées (suppression interdite).

---

## 11. API — Médicaments

Base : `/api/medicaments`

### `POST /` — Créer — PHARMACIEN

Crée le médicament **et** son stock initial en transaction atomique.

**Body :**
```json
{
  "nom": "Paracétamol 500mg",
  "description": "Antalgique",
  "prixCDF": 3500,
  "prixUSD": 1.25,
  "categorie": "Antalgique",
  "unite": "boîte",
  "quantiteInitiale": 100,
  "seuilMinimum": 20
}
```

| Champ | Défaut |
|-------|--------|
| `quantiteInitiale` | `0` |
| `seuilMinimum` | `10` |

**Réponse `201` :** médicament avec objet `stock` inclus.

---

### `GET /` — Lister — PUBLIC

**Réponse `200` :** tous les médicaments avec leurs stocks.

---

### `GET /:id` — Détail — PUBLIC

**Réponse `200` :** médicament + stock.

---

### `PATCH /:id` — Modifier — PHARMACIEN

**Body :** champs partiels (nom, description, prixCDF, prixUSD, categorie, unite).

> Ne modifie pas le stock directement — utiliser `PATCH /api/stock/:medicamentId`.

**Réponse `200` :** médicament mis à jour.

---

### `DELETE /:id` — Supprimer — PHARMACIEN

**Réponse `200` :** `data: null`.

---

## 12. API — Stock

Base : `/api/stock` — AUTH (tous rôles pour lecture)

### `GET /` — Vue d'ensemble

**Réponse `200` :** toutes les lignes de stock avec infos médicament (nom, catégorie, prix).

---

### `GET /alertes` — Stocks critiques

Retourne les médicaments dont `quantite <= seuilMinimum`.

**Réponse `200` :** tableau de stocks en alerte.

---

### `GET /rapport-commande` — Prévisualiser bon de commande — PHARMACIEN, PREPARATEUR

**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "genereLe": "2026-07-07T10:00:00.000Z",
    "nombreProduits": 3,
    "lignes": [
      {
        "medicamentId": "uuid",
        "nom": "Ibuprofène 400mg",
        "categorie": "Anti-inflammatoire",
        "unite": "boîte",
        "quantiteActuelle": 8,
        "seuilMinimum": 15,
        "quantiteACommander": 22
      }
    ]
  },
  "message": "3 produit(s) à commander. Rapport prêt à envoyer."
}
```

> Quantité suggérée = `seuilMinimum × 2 − quantiteActuelle`

---

### `POST /rapport-commande/envoyer` — Envoyer au fournisseur — PHARMACIEN

Génère un PDF ou Excel et l'envoie par email au fournisseur.

**Body :**
```json
{
  "fournisseurId": "uuid-fournisseur",
  "format": "pdf",
  "commentaire": "Livraison souhaitée avant vendredi.",
  "quantitesPersonnalisees": [
    { "medicamentId": "uuid", "quantiteACommander": 50 }
  ]
}
```

| Champ | Défaut |
|-------|--------|
| `format` | `"pdf"` (`"excel"` possible) |
| `quantitesPersonnalisees` | Suggestion automatique si absent |

**Réponse `200` :** confirmation d'envoi.

**Erreurs :** `400` fournisseur sans email ou aucun produit sous seuil, `404` fournisseur introuvable.

---

### `GET /:medicamentId` — Stock d'un médicament

**Réponse `200` :** ligne de stock avec médicament.

---

### `PATCH /:medicamentId` — Réapprovisionner — PHARMACIEN, PREPARATEUR

**Body :**
```json
{
  "quantite": 150,
  "seuilMinimum": 20
}
```

Remplace la quantité actuelle (pas d'incrément). Déclenche une alerte WebSocket si `quantite <= seuilMinimum`.

**Réponse `200` :** stock mis à jour.

---

## 13. API — Ordonnances

Base : `/api/ordonnances`

Cycle de vie : `EN_ATTENTE` → `VALIDEE` ou `REFUSEE`

### `POST /` — Enregistrer — PHARMACIEN, CAISSIER

**Body :**
```json
{
  "patientId": "uuid-patient",
  "prescripteur": "Dr. Mukamba — Clinique Gombe",
  "imageUrl": "https://example.com/scan.jpg"
}
```

**Réponse `201` :** ordonnance avec statut `EN_ATTENTE` + infos patient.

**Erreurs :** `404` patient introuvable.

---

### `GET /` — Lister — AUTH

**Réponse `200` :** toutes les ordonnances avec patient et vente liée (si existe).

---

### `GET /:id` — Détail — AUTH

**Réponse `200` :** ordonnance complète.

---

### `PATCH /:id/valider` — Valider — PHARMACIEN

Passe `EN_ATTENTE` → `VALIDEE`. Nécessaire avant d'utiliser l'ordonnance dans une vente.

**Réponse `200` :** ordonnance validée.

**Erreurs :** `400` si statut ≠ `EN_ATTENTE`.

---

### `PATCH /:id/refuser` — Refuser — PHARMACIEN

Passe `EN_ATTENTE` → `REFUSEE`.

---

### `PATCH /:id` — Mettre à jour — PHARMACIEN

**Body :** champs partiels (`patientId`, `prescripteur`, `imageUrl`).

Utile pour ajouter l'URL du scan après création.

---

## 14. API — Ventes

Base : `/api/ventes`

### `POST /` — Créer une vente — PHARMACIEN, CAISSIER

Processus **atomique** :
1. Vérifie les stocks
2. Vérifie l'ordonnance (si fournie : doit être `VALIDEE` et non utilisée)
3. Crée la vente + lignes
4. Décrémente les stocks
5. Génère le QR code
6. Émet une alerte WebSocket si stock ≤ seuil

**Body :**
```json
{
  "patientId": "uuid-patient",
  "ordonnanceId": "uuid-ordonnance",
  "devise": "CDF",
  "lignes": [
    {
      "medicamentId": "uuid-medicament",
      "quantite": 2,
      "devise": "CDF"
    }
  ]
}
```

| Champ | Règles |
|-------|--------|
| `patientId` | Optionnel (vente comptoir) |
| `ordonnanceId` | Optionnel, doit être `VALIDEE` |
| `lignes` | Min. 1 ligne |
| `devise` (ligne) | `CDF` ou `USD` — détermine le prix appliqué |

Le prix unitaire est lu automatiquement depuis le catalogue (`prixCDF` ou `prixUSD`).  
La vente est créée avec statut **`FINALISEE`** immédiatement.

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "montantTotal": "19500",
    "devise": "CDF",
    "statut": "FINALISEE",
    "qrCode": "data:image/png;base64,...",
    "lignes": [ ],
    "patient": { },
    "user": { }
  },
  "message": "Vente créée avec succès. Ticket disponible via GET /ventes/:id/ticket"
}
```

**Erreurs :**
- `400` stock insuffisant
- `400` ordonnance non validée ou déjà utilisée
- `404` médicament introuvable

---

### `GET /` — Lister — AUTH

**Réponse `200` :** toutes les ventes avec lignes, patient, caissier.

---

### `GET /:id` — Détail — AUTH

**Réponse `200` :** vente complète + ordonnance liée.

---

### `GET /:id/ticket` — Télécharger le ticket PDF — AUTH

**Réponse :** fichier PDF binaire (pas de JSON).

Headers :
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="ticket-xxxxxxxx.pdf"`

---

### `PATCH /:id/annuler` — Annuler — PHARMACIEN

Passe la vente à `ANNULEE` et **restitue les stocks**.

**Erreurs :** `400` si déjà annulée.

---

## 15. API — Fournisseurs

Base : `/api/fournisseurs` — AUTH

### `POST /` — Créer — PHARMACIEN

**Body :**
```json
{
  "nom": "PharmaDistrib RDC",
  "telephone": "+243998001122",
  "email": "contact@pharmadistrib.cd",
  "adresse": "Kinshasa"
}
```

**Réponse `201` :** fournisseur créé.

---

### `GET /` — Lister — AUTH

### `GET /:id` — Détail — AUTH

### `PATCH /:id` — Modifier — PHARMACIEN

### `DELETE /:id` — Supprimer — PHARMACIEN

---

## 16. API — Commandes clients

Base : `/api/commandes`

**1 commande = 1 code QR** (`codeRetrait`) généré à la création, valable pour tous les produits de la commande.

Cycle de vie : `EN_ATTENTE` → `PRETE` (validation) → `RETIREE` (scan QR) | `REFUSEE` (manuel ou stock insuffisant)

### `POST /` — Passer une commande — CLIENT

**Body :**
```json
{
  "lignes": [{ "medicamentId": "uuid", "quantite": 3 }],
  "note": "Retrait en pharmacie"
}
```

**Réponse `201` :** commande + `codeRetrait`, `qrImage`, `payloadQr`, `montantTotal`.

### `GET /mes-commandes` — CLIENT

### `GET /` — PHARMACIEN, CAISSIER

### `GET /:id` — AUTH (CLIENT : ses commandes uniquement)

### `POST /code/consulter` — PHARMACIEN, CAISSIER

Body : `{ "code": "CMD-..." }` ou payload `PHARMACIE-COMMANDE:...`

### `POST /code/retirer` — PHARMACIEN

Confirme le retrait de tous les produits. Body : `{ "code": "..." }`

### `PATCH /:id/valider` — PHARMACIEN

Vérifie le stock. Si OK → `PRETE` + déduction stock. Si KO → `REFUSEE` automatique avec `motifRefus`.

### `PATCH /:id/refuser` — PHARMACIEN

Body : `{ "motifRefus": "..." }` (min. 5 caractères)

### `PATCH /:id/prete` — PHARMACIEN

### `PATCH /:id/annuler` — CLIENT (si `EN_ATTENTE`)

> Détail boutons et écrans : **GUIDE_FRONTEND.md §10**

---

## 17. API — File d'attente

Base : `/api/file-attente`

| Méthode | Route | Rôle | Action |
|---------|-------|------|--------|
| POST | `/rejoindre` | CLIENT | Rejoindre la file |
| POST | `/rejoindre-public` | Public | Borne sans compte |
| GET | `/ma-position` | CLIENT | Position actuelle |
| GET | `/stats` | PHARMACIEN, CAISSIER | Compteurs temps réel |
| GET | `/` | PHARMACIEN, CAISSIER | Liste file du jour |
| POST | `/appeler-suivant` | PHARMACIEN, CAISSIER | Appel auto suivant |
| PATCH | `/:id/demarrer` | Staff | Démarrer service |
| PATCH | `/:id/terminer` | Staff | Terminer (+ appel auto suivant) |
| PATCH | `/:id/annuler` | Client ou staff | Annuler ticket |

`typeService` : `PHARMACIE` (pharmacien) | `CAISSE` (caissier)

> Détail intégration : **GUIDE_FRONTEND.md §12**

---

## 18. API — Notifications (WebSocket)

### `GET /api/notifications/events` — Contrat WebSocket

### Événements Socket.IO

| Événement | Écouteurs | Description |
|-----------|-----------|-------------|
| `stock-alerte` | PHARMACIEN | Rupture / stock sous seuil |
| `commande-notification` | CLIENT, PHARMACIEN | Validée, refusée, prête |
| `file-attente` | Tous | Mouvement dans la file |
| `file-attente-stats` | PHARMACIEN, CAISSIER | Compteurs files |

```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
socket.on('stock-alerte', (data) => { /* dialog */ });
socket.on('commande-notification', (data) => { /* toast */ });
socket.on('file-attente', (data) => { /* refresh */ });
```

---

## 19. Récapitulatif des routes

| Méthode | Route | Auth | Rôles | Action |
|---------|-------|------|-------|--------|
| POST | `/api/auth/register` | Public | — | Inscription client |
| POST | `/api/auth/login` | Public | — | Connexion |
| POST | `/api/auth/refresh` | Cookie | — | Renouveler tokens |
| POST | `/api/auth/logout` | Oui | Tous | Déconnexion |
| GET | `/api/auth/me` | Oui | Tous | Mon profil |
| PATCH | `/api/auth/change-password` | Oui | Tous | Changer mot de passe |
| POST | `/api/users` | Oui | ADMIN | Créer personnel |
| GET | `/api/users` | Oui | ADMIN | Lister personnel |
| GET | `/api/users/:id` | Oui | ADMIN | Détail |
| PATCH | `/api/users/:id` | Oui | ADMIN | Modifier |
| DELETE | `/api/users/:id` | Oui | ADMIN | Supprimer |
| POST | `/api/patients` | Oui | PHARMACIEN, CAISSIER | Créer patient |
| GET | `/api/patients` | Oui | Tous | Lister |
| GET | `/api/patients/:id` | Oui | Tous | Détail |
| PATCH | `/api/patients/:id` | Oui | PHARMACIEN, CAISSIER | Modifier |
| DELETE | `/api/patients/:id` | Oui | PHARMACIEN | Supprimer |
| POST | `/api/medicaments` | Oui | PHARMACIEN | Créer |
| GET | `/api/medicaments` | Public | — | Lister |
| GET | `/api/medicaments/:id` | Public | — | Détail |
| PATCH | `/api/medicaments/:id` | Oui | PHARMACIEN | Modifier |
| DELETE | `/api/medicaments/:id` | Oui | PHARMACIEN | Supprimer |
| GET | `/api/stock` | Oui | Tous | Lister stocks |
| GET | `/api/stock/alertes` | Oui | Tous | Alertes |
| GET | `/api/stock/rapport-commande` | Oui | PHARMACIEN | Prévisualiser bon |
| POST | `/api/stock/rapport-commande/envoyer` | Oui | PHARMACIEN | Envoyer bon |
| PATCH | `/api/stock/:medicamentId` | Oui | PHARMACIEN | Mettre à jour stock |
| POST | `/api/ordonnances` | Oui | PHARMACIEN, CAISSIER | Créer |
| PATCH | `/api/ordonnances/:id/valider` | Oui | PHARMACIEN | Valider |
| PATCH | `/api/ordonnances/:id/refuser` | Oui | PHARMACIEN | Refuser |
| POST | `/api/ventes` | Oui | CAISSIER | Créer vente |
| GET | `/api/ventes/:id/codes-qr` | Oui | Tous | QR unitaires vente |
| POST | `/api/codes-qr/consulter` | Oui | PHARMACIEN, CAISSIER | Scanner QR vente |
| POST | `/api/codes-qr/utiliser` | Oui | PHARMACIEN, CAISSIER | Valider QR vente |
| POST | `/api/commandes` | Oui | CLIENT | Passer commande |
| POST | `/api/commandes/code/consulter` | Oui | PHARMACIEN, CAISSIER | Scanner QR commande |
| POST | `/api/commandes/code/retirer` | Oui | PHARMACIEN | Retrait commande |
| PATCH | `/api/commandes/:id/valider` | Oui | PHARMACIEN | Valider |
| PATCH | `/api/commandes/:id/refuser` | Oui | PHARMACIEN | Refuser |
| PATCH | `/api/commandes/:id/annuler` | Oui | CLIENT | Annuler |
| POST | `/api/file-attente/rejoindre` | Oui | CLIENT | Rejoindre file |
| POST | `/api/file-attente/appeler-suivant` | Oui | Staff | Appeler suivant |
| GET | `/api/notifications/events` | Oui | Tous | Doc WebSocket |

> Table complète avec maquettes d'écrans : **GUIDE_FRONTEND.md**

---

## Swagger interactif

Une fois le serveur lancé, testez toutes les routes depuis :

- Local : **http://localhost:3000/api/docs**
- Tunnel : **https://pharmacie.loophole.site/api/docs**

Activez **« withCredentials »** dans Swagger pour que les cookies soient envoyés après login.

---

*Documentation générée pour pharmacie-backend v0.0.1 — NestJS 11 + Prisma 7 + PostgreSQL*
