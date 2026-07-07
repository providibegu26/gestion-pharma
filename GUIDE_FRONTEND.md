# Guide Frontend — Intégration complète Pharmacie Backend RDC

Document de référence pour les développeurs frontend : **toutes les fonctionnalités**, **tous les boutons par rôle**, **appels API** et **WebSocket**.

> **⚠️ URLs API :** lire en premier [§2 Local vs Loophole](#2-local-vs-loophole--choisir-les-bonnes-urls) — le front doit pointer vers `localhost` ou `loophole.site` selon que le backend a été lancé avec `npm run start:dev` ou `npm run start:tunnel`. Fichier modèle : **`.env.frontend.example`**.

> **Swagger interactif :** `http://localhost:3000/api/docs` (local) · `https://pharmacie.loophole.site/api/docs` (tunnel)  
> **Doc API détaillée :** `DOCUMENTATION.md`

---

## Table des matières

1. [Configuration](#1-configuration)
2. [Local vs Loophole — choisir les bonnes URLs](#2-local-vs-loophole--choisir-les-bonnes-urls)
3. [Authentification](#3-authentification)
4. [Routing par rôle](#4-routing-par-rôle)
5. [Matrice boutons → API](#5-matrice-boutons--api-par-rôle)
6. [Module AUTH](#6-module-auth)
7. [Module ADMIN — gestion comptes](#7-module-admin--gestion-comptes)
8. [Module PHARMACIEN](#8-module-pharmacien)
9. [Module CAISSIER](#9-module-caissier)
10. [Module CLIENT](#10-module-client)
11. [Commandes en ligne + QR unique](#11-commandes-en-ligne--qr-unique)
12. [Codes QR ventes (unitaires)](#12-codes-qr-ventes-unitaires)
13. [File d'attente automatique](#13-file-dattente-automatique)
14. [WebSocket temps réel](#14-websocket-temps-réel)
15. [Catalogue public](#15-catalogue-public)
16. [Comptes de test](#16-comptes-de-test)
17. [Checklist intégration](#17-checklist-intégration)

---

## 1. Configuration

### Fichier `.env` frontend

Copier `.env.frontend.example` vers `.env` dans le projet frontend :

```bash
cp .env.frontend.example .env
```

> **Règle d'or :** l'URL du frontend doit correspondre au **mode de démarrage du backend**. Voir [§2 Local vs Loophole](#2-local-vs-loophole--choisir-les-bonnes-urls).

### Client HTTP (obligatoire)

```javascript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // OBLIGATOIRE — cookies JWT HTTP-only
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur 401 → refresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await api.post('/auth/refresh');
      return api(error.config);
    }
    return Promise.reject(error);
  },
);
```

### Format de réponse

**Succès :**
```json
{ "success": true, "data": { }, "message": "..." }
```

**Erreur :**
```json
{ "success": false, "statusCode": 400, "message": "...", "timestamp": "...", "path": "/api/..." }
```

### Rôles disponibles

| Rôle | Interface | Description |
|------|-----------|-------------|
| `ADMIN` | Admin panel | Création/gestion des comptes staff uniquement |
| `PHARMACIEN` | Dashboard pharmacie | Médicaments, stock, ordonnances, commandes, file pharmacie |
| `CAISSIER` | Interface caisse | Ventes, patients, scan QR ventes, file caisse |
| `CLIENT` | Boutique en ligne | Catalogue, commandes, QR retrait, file d'attente |

> Le rôle `PREPARATEUR` n'existe plus — ne pas l'afficher dans le front.

---

## 2. Local vs Loophole — choisir les bonnes URLs

Le backend peut démarrer de **deux façons**. Le frontend **doit utiliser les URLs correspondantes** — sinon les requêtes échouent (404, CORS, cookies non envoyés).

### Tableau de correspondance

| Mode backend | Commande (dans `pharmacie-backend/`) | `VITE_API_URL` | `VITE_WS_URL` | Swagger |
|--------------|----------------------------------------|----------------|---------------|---------|
| **Local** | `npm run start:dev` | `http://localhost:3000/api` | `http://localhost:3000` | `http://localhost:3000/api/docs` |
| **Tunnel Loophole** | `npm run start:tunnel` | `https://pharmacie.loophole.site/api` | `https://pharmacie.loophole.site` | `https://pharmacie.loophole.site/api/docs` |

Le hostname tunnel par défaut est `pharmacie` → `https://pharmacie.loophole.site`.  
Personnalisable côté backend via `TUNNEL_HOSTNAME` dans `.env`.

### Comment savoir quel mode est actif ?

Au démarrage du backend, la console affiche :

```
Serveur local   : http://localhost:3000/api
Swagger local   : http://localhost:3000/api/docs
----------------------------------------
Tunnel URL      : https://pharmacie.loophole.site/api   ← présent seulement avec start:tunnel
```

**Demandez toujours à l'équipe backend** quel mode tourne avant de configurer le front.

---

### Mode 1 — Local (recommandé pour le développement frontend)

**Backend :**
```bash
cd pharmacie-backend
npm run start:dev
```

**Frontend `.env` :**
```env
VITE_API_MODE=local
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

**Quand l'utiliser :**
- Développement quotidien front + back sur la même machine
- Les cookies JWT fonctionnent (front `localhost:5173` → API `localhost:3000`)
- Pas besoin d'Internet pour l'API

**Option recommandée — proxy Vite** (évite les soucis CORS) :

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Avec le proxy, le `.env` frontend devient :
```env
VITE_API_URL=/api
VITE_WS_URL=http://localhost:3000
```

Les appels `api.get('/auth/me')` passent par Vite → `localhost:3000` automatiquement.

---

### Mode 2 — Tunnel Loophole (démo distante / test mobile)

**Backend :**
```bash
cd pharmacie-backend
npm run start:tunnel
```

Ce script lance **NestJS + Loophole en parallèle** et expose le port 3000 sur Internet.

**Frontend `.env` :**
```env
VITE_API_MODE=tunnel
VITE_API_URL=https://pharmacie.loophole.site/api
VITE_WS_URL=https://pharmacie.loophole.site
```

**Quand l'utiliser :**
- Tester l'app depuis un téléphone ou un autre réseau
- Démo à distance sans déployer
- Partager l'API avec un collègue éloigné

**⚠️ Attention cookies :**  
Si le front tourne en local (`http://localhost:5173`) mais pointe vers l'API tunnel (`https://pharmacie.loophole.site`), les cookies JWT peuvent **ne pas être transmis** (origines différentes + `SameSite: strict`).

**Solutions :**
1. Servir aussi le front via le tunnel (même domaine)
2. Utiliser le **mode local** pour le dev authentifié
3. Utiliser le tunnel uniquement pour tester le **catalogue public** (`GET /medicaments` sans login)

---

### Bascule rapide entre les deux modes

Créer deux fichiers et copier celui qu'il faut :

```bash
# .env.local
VITE_API_MODE=local
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000

# .env.tunnel
VITE_API_MODE=tunnel
VITE_API_URL=https://pharmacie.loophole.site/api
VITE_WS_URL=https://pharmacie.loophole.site
```

```bash
# Passer en local
cp .env.local .env

# Passer en tunnel
cp .env.tunnel .env
```

Ou avec un script `package.json` frontend :
```json
{
  "scripts": {
    "dev": "vite",
    "dev:local": "cp .env.local .env && vite",
    "dev:tunnel": "cp .env.tunnel .env && vite"
  }
}
```

---

### Config centralisée dans le code frontend

```javascript
// src/config/api.js

const MODES = {
  local: {
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'http://localhost:3000',
  },
  tunnel: {
    apiUrl: 'https://pharmacie.loophole.site/api',
    wsUrl: 'https://pharmacie.loophole.site',
  },
};

const mode = import.meta.env.VITE_API_MODE ?? 'local';
const config = MODES[mode] ?? MODES.local;

export const API_URL = import.meta.env.VITE_API_URL ?? config.apiUrl;
export const WS_URL  = import.meta.env.VITE_WS_URL  ?? config.wsUrl;

// Afficher en dev pour vérifier
if (import.meta.env.DEV) {
  console.log(`[API] Mode: ${mode} → ${API_URL}`);
}
```

---

### WebSocket — même règle que l'API

```javascript
import { io } from 'socket.io-client';
import { WS_URL } from './config/api';

const socket = io(WS_URL, { transports: ['websocket'] });
```

| Mode | `WS_URL` |
|------|----------|
| Local | `http://localhost:3000` |
| Tunnel | `https://pharmacie.loophole.site` |

Ne jamais mélanger : API en tunnel + WebSocket en local (ou l'inverse).

---

### CORS — origines frontend autorisées

Le backend autorise par défaut (sans `ALLOWED_ORIGINS` dans `.env`) :
- `http://localhost:5173` (Vite)
- `http://localhost:5174`
- `http://localhost:3000` (Next.js)
- `https://pharmacie.loophole.site`

Si le front tourne sur un autre port, ajouter côté **backend** dans `.env` :
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4200
```

---

### Récapitulatif pour l'équipe front

```
Backend start:dev     →  Front .env : localhost:3000
Backend start:tunnel  →  Front .env : pharmacie.loophole.site

Toujours :
  ✅ withCredentials: true
  ✅ VITE_API_URL et VITE_WS_URL du même mode
  ✅ Redémarrer le serveur Vite après changement de .env
```

---

## 3. Authentification

### Flux au démarrage de l'app

```
1. GET /api/auth/me
   → 200 : utilisateur connecté → router selon role
   → 401 : afficher page login

2. Après login :
   POST /api/auth/login { email, motDePasse }
   → cookies posés automatiquement
   → GET /api/auth/me → rediriger vers le dashboard du rôle
```

### Router recommandé

```javascript
const DASHBOARD_BY_ROLE = {
  ADMIN:      '/admin/utilisateurs',
  PHARMACIEN: '/pharmacien/dashboard',
  CAISSIER:   '/caisse/ventes',
  CLIENT:     '/boutique',
};

function redirectAfterLogin(user) {
  window.location.href = DASHBOARD_BY_ROLE[user.role] ?? '/';
}
```

---

## 4. Routing par rôle

Chaque rôle a **sa propre interface** — ne pas mélanger les écrans.

```
/admin/*          → ADMIN seulement
/pharmacien/*     → PHARMACIEN seulement
/caisse/*         → CAISSIER seulement
/boutique/*       → CLIENT (catalogue public accessible sans login)
/login, /register → Public
/file-attente     → Public (borne) ou CLIENT
```

**Protection côté front :**
```javascript
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/unauthorized" />;
  return children;
}
```

---

## 5. Matrice boutons → API par rôle

### ADMIN

| Bouton / Action | Méthode | Route | Body |
|-----------------|---------|-------|------|
| Créer un compte | `POST` | `/users` | `{ nom, prenom, email, role }` |
| Lister les comptes | `GET` | `/users` | — |
| Voir un compte | `GET` | `/users/:id` | — |
| Modifier un compte | `PATCH` | `/users/:id` | `{ nom?, prenom?, email?, role? }` |
| Supprimer un compte | `DELETE` | `/users/:id` | — |
| Changer mot de passe | `PATCH` | `/auth/change-password` | `{ ancienMotDePasse, nouveauMotDePasse }` |
| Déconnexion | `POST` | `/auth/logout` | — |

`role` accepté à la création : `PHARMACIEN` | `CAISSIER` uniquement.

---

### PHARMACIEN

| Bouton / Action | Méthode | Route | Body |
|-----------------|---------|-------|------|
| **Médicaments** | | | |
| Ajouter médicament | `POST` | `/medicaments` | voir §7 |
| Modifier médicament | `PATCH` | `/medicaments/:id` | `{ nom?, prixCDF?, ... }` |
| Supprimer médicament | `DELETE` | `/medicaments/:id` | — |
| **Stock** | | | |
| Voir tous les stocks | `GET` | `/stock` | — |
| Voir alertes rupture | `GET` | `/stock/alertes` | — |
| Augmenter/réduire stock | `PATCH` | `/stock/:medicamentId` | `{ quantite, seuilMinimum? }` |
| Prévisualiser bon commande | `GET` | `/stock/rapport-commande` | — |
| Envoyer bon fournisseur | `POST` | `/stock/rapport-commande/envoyer` | `{ fournisseurId, format?, quantitesPersonnalisees? }` |
| **Ordonnances** | | | |
| Lister ordonnances | `GET` | `/ordonnances` | — |
| Valider ordonnance | `PATCH` | `/ordonnances/:id/valider` | — |
| Refuser ordonnance | `PATCH` | `/ordonnances/:id/refuser` | — |
| **Commandes** | | | |
| Lister commandes | `GET` | `/commandes` | — |
| Valider commande | `PATCH` | `/commandes/:id/valider` | — |
| Refuser commande | `PATCH` | `/commandes/:id/refuser` | `{ motifRefus }` |
| Marquer prête | `PATCH` | `/commandes/:id/prete` | — |
| Scanner QR commande | `POST` | `/commandes/code/consulter` | `{ code }` |
| Confirmer retrait QR | `POST` | `/commandes/code/retirer` | `{ code }` |
| **Ventes** | | | |
| Annuler vente | `PATCH` | `/ventes/:id/annuler` | — |
| **Fournisseurs** | | | |
| CRUD fournisseurs | | `/fournisseurs` | — |
| **Patients** | | | |
| CRUD patients | | `/patients` | — |
| **File d'attente** | | | |
| Voir la file | `GET` | `/file-attente?typeService=PHARMACIE` | — |
| Stats file | `GET` | `/file-attente/stats` | — |
| Appeler suivant | `POST` | `/file-attente/appeler-suivant` | `{ typeService: "PHARMACIE" }` |
| Démarrer service | `PATCH` | `/file-attente/:id/demarrer` | — |
| Terminer service | `PATCH` | `/file-attente/:id/terminer` | — |
| Annuler ticket | `PATCH` | `/file-attente/:id/annuler` | — |

---

### CAISSIER

| Bouton / Action | Méthode | Route | Body |
|-----------------|---------|-------|------|
| **Ventes** | | | |
| Nouvelle vente | `POST` | `/ventes` | voir §8 |
| Lister ventes | `GET` | `/ventes` | — |
| Détail vente | `GET` | `/ventes/:id` | — |
| Télécharger ticket PDF | `GET` | `/ventes/:id/ticket` | — (blob) |
| Codes QR de la vente | `GET` | `/ventes/:id/codes-qr` | — |
| **Scan QR vente** | | | |
| Consulter code | `POST` | `/codes-qr/consulter` | `{ code }` |
| Valider code | `POST` | `/codes-qr/utiliser` | `{ code }` |
| **Patients** | | | |
| Créer patient | `POST` | `/patients` | `{ nom, prenom, telephone, adresse? }` |
| Modifier patient | `PATCH` | `/patients/:id` | — |
| **Ordonnances** | | | |
| Enregistrer ordonnance | `POST` | `/ordonnances` | `{ patientId, prescripteur, imageUrl? }` |
| **Commandes** | | | |
| Lister commandes | `GET` | `/commandes` | — |
| Scanner QR commande | `POST` | `/commandes/code/consulter` | `{ code }` |
| **File d'attente** | | | |
| Voir file caisse | `GET` | `/file-attente?typeService=CAISSE` | — |
| Appeler suivant | `POST` | `/file-attente/appeler-suivant` | `{ typeService: "CAISSE" }` |
| Démarrer / Terminer | `PATCH` | `/file-attente/:id/demarrer` ou `/terminer` | — |

---

### CLIENT

| Bouton / Action | Méthode | Route | Body |
|-----------------|---------|-------|------|
| S'inscrire | `POST` | `/auth/register` | `{ nom, prenom, email, motDePasse }` |
| Se connecter | `POST` | `/auth/login` | `{ email, motDePasse }` |
| Voir catalogue | `GET` | `/medicaments` | Public, sans login |
| Passer commande | `POST` | `/commandes` | `{ lignes: [{ medicamentId, quantite }], note? }` |
| Mes commandes | `GET` | `/commandes/mes-commandes` | — |
| Détail commande + QR | `GET` | `/commandes/:id` | — |
| Annuler commande | `PATCH` | `/commandes/:id/annuler` | — (si EN_ATTENTE) |
| Rejoindre file | `POST` | `/file-attente/rejoindre` | `{ typeService }` |
| Ma position file | `GET` | `/file-attente/ma-position` | — |
| Changer mot de passe | `PATCH` | `/auth/change-password` | — |

---

## 6. Module AUTH

### Inscription client (public)

```javascript
await api.post('/auth/register', {
  nom: 'Lumumba',
  prenom: 'Patrice',
  email: 'client@example.com',
  motDePasse: 'MonMotDePasse123',
});
```

### Login

```javascript
const { data } = await api.post('/auth/login', {
  email: 'marie.mukeba@pharmacie-centrale.cd',
  motDePasse: 'pharma2026',
});
// data.data = { id, nom, prenom, email, role }
```

### Profil connecté

```javascript
const { data } = await api.get('/auth/me');
// { id, nom, prenom, email, role }
```

### Changer mot de passe

```javascript
await api.patch('/auth/change-password', {
  ancienMotDePasse: 'ancien',
  nouveauMotDePasse: 'nouveau123',
});
```

---

## 7. Module ADMIN — gestion comptes

L'ADMIN **ne peut rien faire d'autre** que gérer les comptes. Toute autre route renvoie `403`.

### Écran : Liste des utilisateurs

```
┌─────────────────────────────────────────────────────┐
│  Gestion du personnel                    [+ Créer]  │
├─────────────────────────────────────────────────────┤
│  Marie Mukeba    PHARMACIEN   marie@...   [✏][🗑]  │
│  Grace Tshilombo CAISSIER    grace@...   [✏][🗑]  │
└─────────────────────────────────────────────────────┘
```

### Bouton « Créer un compte »

```javascript
await api.post('/users', {
  nom: 'Mukeba',
  prenom: 'Marie',
  email: 'marie.mukeba@pharmacie.cd',
  role: 'PHARMACIEN', // ou 'CAISSIER'
});
// Un email avec mot de passe temporaire est envoyé automatiquement
```

### Bouton « Supprimer »

```javascript
await api.delete(`/users/${userId}`);
```

---

## 8. Module PHARMACIEN

### Écran Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard Pharmacien                                     │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Commandes    │ Stock alerte │ Ordonnances  │ File attente │
│ en attente   │ 3 ruptures   │ 2 à valider  │ 5 en attente │
│ [Voir →]     │ [Voir →]     │ [Voir →]     │ [Gérer →]    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Au chargement :
```javascript
const [commandes, alertes, ordonnances, stats] = await Promise.all([
  api.get('/commandes'),
  api.get('/stock/alertes'),
  api.get('/ordonnances'),
  api.get('/file-attente/stats'),
]);
```

### Écran Médicaments — CRUD complet

**Bouton « Ajouter » :**
```javascript
await api.post('/medicaments', {
  nom: 'Paracétamol 500mg',
  description: 'Analgésique',
  prixCDF: 3500,
  prixUSD: 1.5,
  categorie: 'Analgésiques',
  unite: 'comprimé',
  quantiteInitiale: 100,
  seuilMinimum: 20,
});
```

**Bouton « Modifier » :**
```javascript
await api.patch(`/medicaments/${id}`, { prixCDF: 4000, seuilMinimum: 15 });
```

**Bouton « Supprimer » :**
```javascript
await api.delete(`/medicaments/${id}`);
```

### Écran Stock

**Badge alerte** (écouter aussi WebSocket `stock-alerte`) :
```javascript
const { data } = await api.get('/stock/alertes');
// Afficher dialog/modal quand data.data.length > 0
```

**Bouton « Réapprovisionner » :**
```javascript
await api.patch(`/stock/${medicamentId}`, {
  quantite: 150,        // nouvelle quantité totale
  seuilMinimum: 20,     // optionnel
});
```

**Bouton « Envoyer bon au fournisseur » :**
```javascript
// 1. Prévisualiser
const preview = await api.get('/stock/rapport-commande');

// 2. Envoyer
await api.post('/stock/rapport-commande/envoyer', {
  fournisseurId: 'uuid-fournisseur',
  format: 'PDF', // ou 'EXCEL'
  commentaire: 'Urgent — rupture imminente',
  quantitesPersonnalisees: [
    { medicamentId: 'uuid', quantiteACommander: 50 },
  ],
});
```

### Écran Commandes — tous les boutons

```
┌────────────────────────────────────────────────────────────────┐
│  Commande #CMD-... — Patrice Lumumba — EN_ATTENTE              │
│  • Paracétamol x3 — Oméprazole x1                              │
│  Total : 15 500 CDF                                            │
│                                                                │
│  [✅ Valider]  [❌ Refuser]                                    │
└────────────────────────────────────────────────────────────────┘
```

**Bouton « Valider » :**
```javascript
const res = await api.patch(`/commandes/${id}/valider`);

// Cas 1 : succès → statut PRETE, stock déduit
if (res.data.data.statut === 'PRETE') {
  toast.success('Commande validée — prête pour retrait');
}

// Cas 2 : refus automatique stock insuffisant
if (res.data.data.statut === 'REFUSEE' && res.data.data.refuseAutomatique) {
  alert(res.data.data.motifRefus);
  // Ex: "Stock insuffisant — Ibuprofène (demandé : 10, disponible : 3)"
}
```

**Bouton « Refuser »** → ouvrir modal avec champ texte :
```javascript
await api.patch(`/commandes/${id}/refuser`, {
  motifRefus: 'Ordonnance obligatoire pour ce médicament.',
});
```

**Écran scan QR retrait :**
```
┌──────────────────────────────────────┐
│  [📷 Scanner QR client]              │
│                                      │
│  Commande CMD-A3F2-9B1C              │
│  Client : Patrice Lumumba            │
│  3 produits — PRETE                  │
│                                      │
│  [Confirmer le retrait]              │
└──────────────────────────────────────┘
```

```javascript
// Étape 1 : après scan caméra
const scan = 'PHARMACIE-COMMANDE:CMD-A3F2-9B1C'; // ou juste 'CMD-A3F2-9B1C'
const { data } = await api.post('/commandes/code/consulter', { code: scan });

// Étape 2 : confirmer
await api.post('/commandes/code/retirer', { code: scan });
// → statut RETIREE, tous les produits validés d'un coup
```

### Écran Ordonnances

```javascript
// Valider
await api.patch(`/ordonnances/${id}/valider`);

// Refuser
await api.patch(`/ordonnances/${id}/refuser`);
```

### Écran File d'attente (PHARMACIE)

```
┌─────────────────────────────────────────────────────────┐
│  File Pharmacie — 5 en attente — ~40 min estimé         │
│  En cours : Ticket #12 — Mme Kabongo                    │
│                                                         │
│  #13  Patrice L.    EN_ATTENTE   ~8 min   [Appeler]     │
│  #14  (visiteur)    EN_ATTENTE   ~16 min                │
│                                                         │
│  [Appeler le suivant]                                   │
└─────────────────────────────────────────────────────────┘
```

```javascript
// Appeler automatiquement le prochain
await api.post('/file-attente/appeler-suivant', { typeService: 'PHARMACIE' });

// Quand le client se présente
await api.patch(`/file-attente/${ticketId}/demarrer`);

// Quand terminé → appelle automatiquement le suivant si file chargée
await api.patch(`/file-attente/${ticketId}/terminer`);
```

---

## 9. Module CAISSIER

### Écran Caisse — Nouvelle vente

```
┌─────────────────────────────────────────────────────────┐
│  Nouvelle vente                                         │
│  Patient : [Rechercher / Créer]                         │
│  Ordonnance : [Optionnel]                               │
│                                                         │
│  + Paracétamol 500mg  x2  CDF  [🗑]                    │
│  + Doliprane 1000mg   x1  CDF  [🗑]                    │
│  [+ Ajouter médicament]                                 │
│                                                         │
│  Total : 19 500 CDF                                     │
│  [Finaliser la vente]                                   │
└─────────────────────────────────────────────────────────┘
```

```javascript
await api.post('/ventes', {
  patientId: 'uuid-patient',      // optionnel
  ordonnanceId: 'uuid-ordonnance', // optionnel
  devise: 'CDF',
  lignes: [
    { medicamentId: 'uuid-med', quantite: 2, devise: 'CDF' },
    { medicamentId: 'uuid-med2', quantite: 1, devise: 'CDF' },
  ],
});
// → vente créée, codes QR unitaires générés, ticket PDF disponible
```

**Bouton « Télécharger ticket » :**
```javascript
const response = await api.get(`/ventes/${id}/ticket`, { responseType: 'blob' });
const url = URL.createObjectURL(response.data);
window.open(url);
```

### Écran Scan QR vente (authentification produit)

> Distinct du QR commande — ici 1 code = 1 unité d'1 produit.

```javascript
// Prévisualiser
const { data } = await api.post('/codes-qr/consulter', { code: scannedCode });
// data.data.utilisable = true/false
// data.data.medicament, data.data.patient, data.data.vente

// Valider (usage unique)
await api.post('/codes-qr/utiliser', { code: scannedCode });
```

---

## 10. Module CLIENT

### Écran Boutique (catalogue public)

```javascript
// Accessible SANS login
const { data } = await fetch(`${API_URL}/medicaments`).then(r => r.json());
// Afficher grille produits avec prix CDF/USD et stock disponible
```

### Écran Panier / Commander

```
┌─────────────────────────────────────────────────────────┐
│  Mon panier                                             │
│  Paracétamol x3                              10 500 CDF │
│  Oméprazole x1                                8 000 CDF │
│  Note : [Appeler avant livraison]                       │
│                                                         │
│  Total : 18 500 CDF                                     │
│  [Passer la commande]                                   │
└─────────────────────────────────────────────────────────┘
```

```javascript
const { data } = await api.post('/commandes', {
  lignes: [
    { medicamentId: 'uuid', quantite: 3 },
    { medicamentId: 'uuid2', quantite: 1 },
  ],
  note: 'Appeler avant',
});

// Réponse contient IMMÉDIATEMENT le QR unique pour toute la commande :
const { codeRetrait, qrImage, payloadQr, montantTotal } = data.data;
```

### Écran Mes commandes + QR

```
┌─────────────────────────────────────────────────────────┐
│  Commande du 07/07/2026 — PRETE                          │
│  3 produits — 18 500 CDF                                │
│                                                         │
│  ┌─────────────┐                                        │
│  │  [QR CODE]  │  CMD-A3F2-9B1C                         │
│  └─────────────┘                                        │
│  Présentez ce code en pharmacie                         │
│                                                         │
│  [Annuler]  ← seulement si EN_ATTENTE                   │
└─────────────────────────────────────────────────────────┘
```

```javascript
const { data } = await api.get('/commandes/mes-commandes');

data.data.forEach((cmd) => {
  // Afficher badge selon statut
  const badges = {
    EN_ATTENTE: { color: 'orange', label: 'En attente de validation' },
    PRETE:      { color: 'green',  label: 'Prête — venez récupérer' },
    RETIREE:    { color: 'gray',   label: 'Retirée' },
    REFUSEE:    { color: 'red',    label: 'Refusée' },
  };

  // Si REFUSEE → afficher cmd.motifRefus
  if (cmd.statut === 'REFUSEE') {
    showAlert(cmd.motifRefus, cmd.refuseAutomatique ? 'Système' : 'Pharmacien');
  }

  // Afficher QR si pas REFUSEE
  if (cmd.qrImage) {
    renderQrImage(cmd.qrImage); // base64 data URL
  }
});
```

**Bouton « Annuler » (EN_ATTENTE uniquement) :**
```javascript
await api.patch(`/commandes/${id}/annuler`);
```

### Écran File d'attente client

```javascript
// Rejoindre
const { data } = await api.post('/file-attente/rejoindre', {
  typeService: 'PHARMACIE', // ou 'CAISSE'
});
// → { numeroTicket: 15, position: 4, estimeeMinutes: 32 }

// Suivre sa position (polling ou WebSocket)
const pos = await api.get('/file-attente/ma-position');
// → { positionActuelle, estimeeMinutes, statut }
```

### Borne d'accueil (sans compte — public)

```javascript
await fetch(`${API_URL}/file-attente/rejoindre-public`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    typeService: 'PHARMACIE',
    nomAffiche: 'Mme Kabongo',
  }),
});
```

---

## 11. Commandes en ligne + QR unique

### Règle fondamentale

> **1 commande = 1 code QR**, même si le client commande 20 produits différents.  
> Quand le pharmacien scanne et confirme le retrait, **les 20 produits sont validés ensemble**.

### Cycle de vie d'une commande

```
CLIENT passe commande
    ↓
EN_ATTENTE  (+ codeRetrait + qrImage générés immédiatement)
    ↓
PHARMACIEN clique "Valider"
    ├── Stock OK  → PRETE (stock déduit)
    └── Stock KO  → REFUSEE automatique (motifRefus système)
    ↓
PHARMACIEN scanne QR + "Confirmer retrait"
    ↓
RETIREE
```

**Refus manuel par pharmacien :**
```
EN_ATTENTE → PHARMACIEN "Refuser" + motif → REFUSEE
```

### Statuts et affichage UI

| Statut | Badge | Actions disponibles |
|--------|-------|---------------------|
| `EN_ATTENTE` | 🟠 En attente | Client: Annuler — Pharmacien: Valider, Refuser |
| `PRETE` | 🟢 Prête | Pharmacien: Scanner QR, Retirer |
| `RETIREE` | ⚫ Retirée | Lecture seule |
| `REFUSEE` | 🔴 Refusée | Afficher `motifRefus` + `refuseAutomatique` |

### Structure data commande

```json
{
  "id": "uuid",
  "statut": "PRETE",
  "note": "Note du client",
  "motifRefus": null,
  "refuseAutomatique": false,
  "montantTotal": "18500.00",
  "codeRetrait": "CMD-A3F2-9B1C",
  "qrImage": "data:image/png;base64,...",
  "payloadQr": "PHARMACIE-COMMANDE:CMD-A3F2-9B1C",
  "retraitAt": null,
  "client": { "nom": "Lumumba", "prenom": "Patrice" },
  "lignes": [
    {
      "quantite": 3,
      "medicament": { "nom": "Paracétamol", "prixCDF": "3500" }
    }
  ]
}
```

---

## 12. Codes QR ventes (unitaires)

> **Système distinct** du QR commande. Utilisé en caisse pour authentifier chaque unité vendue.

| | QR Commande | QR Vente |
|--|-------------|----------|
| Quand | À la commande en ligne | À la vente en caisse |
| Combien | **1 par commande** | **1 par unité** vendue |
| Payload | `PHARMACIE-COMMANDE:CMD-...` | `PHARMACIE-CODE:PHARM-...` |
| Route scan | `/commandes/code/*` | `/codes-qr/*` |
| Rôle | PHARMACIEN (retrait) | PHARMACIEN, CAISSIER |

```javascript
// Lister les codes d'une vente
const { data } = await api.get(`/ventes/${venteId}/codes-qr`);
// data.data = [{ code, statut, medicament, qrImage, payload }]
```

---

## 13. File d'attente automatique

### Types de service

| `typeService` | Géré par | Temps moyen/personne |
|---------------|----------|----------------------|
| `PHARMACIE` | PHARMACIEN | ~8 min |
| `CAISSE` | CAISSIER | ~5 min |

### Statuts ticket

| Statut | Signification |
|--------|---------------|
| `EN_ATTENTE` | Dans la file |
| `APPELE` | Appelé — client doit se présenter |
| `EN_COURS` | En train d'être servi |
| `TERMINE` | Service fini |
| `ANNULE` | Annulé |

### Logique automatique

1. **Rejoindre** → numéro de ticket + position + temps estimé calculés automatiquement
2. **Terminer un service** → si d'autres personnes attendent, le **suivant est appelé automatiquement**
3. **Positions recalculées** après chaque appel/annulation/terminaison
4. **WebSocket** notifie tous les écrans en temps réel

### Composant React recommandé

```jsx
function FileAttenteBoard({ typeService }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/file-attente?typeService=${typeService}`).then(r => setTickets(r.data.data));
    api.get('/file-attente/stats').then(r => setStats(r.data.data));

    const socket = io(import.meta.env.VITE_WS_URL);
    socket.on('file-attente', () => refresh());
    socket.on('file-attente-stats', (s) => setStats(s));
    return () => socket.disconnect();
  }, [typeService]);

  return (
    <div>
      <p>{stats?.pharmacie?.enAttente} en attente — ~{stats?.pharmacie?.estimeeProchaine} min</p>
      <button onClick={() => api.post('/file-attente/appeler-suivant', { typeService })}>
        Appeler le suivant
      </button>
      {tickets.map(t => (
        <TicketRow key={t.id} ticket={t} onTerminer={(id) => api.patch(`/file-attente/${id}/terminer`)} />
      ))}
    </div>
  );
}
```

---

## 14. WebSocket temps réel

### Connexion

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL, {
  transports: ['websocket'],
});
```

### Événements à écouter

#### `stock-alerte` — rupture / stock critique

**Qui écoute :** PHARMACIEN (dialog obligatoire)

```javascript
socket.on('stock-alerte', (data) => {
  // { medicamentId, nom, quantite, seuilMinimum, message, timestamp }
  showStockAlertDialog({
    title: '⚠️ Alerte stock',
    message: data.message,
    medicamentId: data.medicamentId,
  });
});
```

#### `commande-notification` — statut commande

**Qui écoute :** CLIENT (toast/badge), PHARMACIEN (dashboard)

```javascript
socket.on('commande-notification', (data) => {
  // { commandeId, clientId, type: 'validee'|'refusee'|'prete', motifRefus?, automatique?, message }
  if (data.type === 'refusee') {
    showNotification(data.message, { type: 'error' });
    if (data.automatique) {
      // Refus système (stock insuffisant)
    }
  } else {
    showNotification(data.message, { type: 'success' });
  }
});
```

#### `file-attente` — mouvement dans la file

```javascript
socket.on('file-attente', (data) => {
  // { type: 'rejoint'|'appele'|'termine'|'annule'|'mise-a-jour', numeroTicket, position, ... }
  if (data.type === 'appele' && isMyTicket(data)) {
    playSound('ding');
    showFullscreenAlert(`Ticket n°${data.numeroTicket} — présentez-vous !`);
  }
  refreshFileAttente();
});
```

#### `file-attente-stats` — compteurs globaux

```javascript
socket.on('file-attente-stats', (stats) => {
  // { pharmacie: { enAttente, enCours, estimeeProchaine }, caisse: { ... } }
  updateDashboardBadges(stats);
});
```

### Doc WebSocket via API

```javascript
const doc = await api.get('/notifications/events');
// Retourne le contrat complet des événements
```

---

## 15. Catalogue public

```javascript
// Sans authentification
const meds = await fetch(`${API_URL}/medicaments`).then(r => r.json());

// Chaque médicament contient :
// { id, nom, prixCDF, prixUSD, categorie, unite, stock: { quantite, seuilMinimum } }

// Afficher "Rupture" si stock.quantite === 0
// Afficher "Stock faible" si stock.quantite <= stock.seuilMinimum
```

---

## 16. Comptes de test

Mot de passe pour tous : **`pharma2026`**

| Rôle | Email | Interface |
|------|-------|-----------|
| ADMIN | `admin@pharmacie-centrale.cd` | `/admin` |
| PHARMACIEN | `marie.mukeba@pharmacie-centrale.cd` | `/pharmacien` |
| CAISSIER | `grace.tshilombo@pharmacie-centrale.cd` | `/caisse` |
| CLIENT | `p.lumumba@gmail.com` | `/boutique` |

Recréer les données :
```bash
SEED_FORCE=true npx prisma db seed
```

---

## 17. Checklist intégration

### Auth & routing
- [ ] `withCredentials: true` sur toutes les requêtes
- [ ] `.env` aligné sur le mode backend (`start:dev` → local, `start:tunnel` → loophole)
- [ ] `VITE_API_URL` et `VITE_WS_URL` du **même** mode (ne pas mélanger)
- [ ] Redémarrer Vite après changement de `.env`
- [ ] `GET /auth/me` au démarrage
- [ ] Router par rôle après login
- [ ] Refresh token sur 401
- [ ] Page login + register client

### ADMIN
- [ ] Liste utilisateurs
- [ ] Bouton créer (PHARMACIEN / CAISSIER)
- [ ] Bouton modifier / supprimer
- [ ] Aucun accès aux routes métier

### PHARMACIEN
- [ ] CRUD médicaments (ajouter, modifier, supprimer)
- [ ] Gestion stock + alertes (dialog WebSocket)
- [ ] Bon de commande fournisseur (preview + envoi)
- [ ] Liste commandes + Valider / Refuser (modal motif)
- [ ] Scanner QR commande + confirmer retrait
- [ ] Valider / refuser ordonnances
- [ ] File d'attente pharmacie (appeler suivant, démarrer, terminer)
- [ ] Annuler vente

### CAISSIER
- [ ] Nouvelle vente (panier + finaliser)
- [ ] Ticket PDF
- [ ] Scan QR vente (consulter + utiliser)
- [ ] CRUD patients
- [ ] Enregistrer ordonnance
- [ ] File d'attente caisse

### CLIENT
- [ ] Catalogue public (sans login)
- [ ] Panier + passer commande
- [ ] Afficher QR unique après commande
- [ ] Mes commandes (statuts + motifRefus)
- [ ] Annuler si EN_ATTENTE
- [ ] Rejoindre file d'attente + suivre position
- [ ] Écouter `commande-notification` WebSocket

### WebSocket global
- [ ] Connexion Socket.IO au login
- [ ] `stock-alerte` → dialog pharmacien
- [ ] `commande-notification` → toast client
- [ ] `file-attente` + `file-attente-stats` → écrans file

### UX critique
- [ ] Ne jamais afficher le rôle PREPARATEUR
- [ ] Distinguer QR commande (`CMD-`) vs QR vente (`PHARM-`)
- [ ] Afficher `motifRefus` sur commandes refusées
- [ ] Indiquer si refus automatique (`refuseAutomatique: true`)
- [ ] Désactiver bouton "Valider commande" si déjà traitée
- [ ] Désactiver "Annuler" si statut ≠ EN_ATTENTE

---

*Dernière mise à jour : juillet 2026 — backend v1.0*
