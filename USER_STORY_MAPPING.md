# User Story Mapping — Système de Gestion de Pharmacie (RDC)

> **Contexte** : API NestJS pour la gestion complète d'une pharmacie en RDC.
> Support double devise (CDF / USD), alertes temps réel, gestion des ordonnances, et ventes atomiques.

---

## Personas

| Persona | Rôle | Objectif principal |
|---------|------|-------------------|
| **PHARMACIEN** | Responsable pharmacie | Superviser les opérations, gérer le personnel |
| **Pharmacien** | Pharmacien diplômé | Valider ordonnances, surveiller stock, gérer catalogue |
| **Préparateur** | Préparateur en pharmacie | Préparer et servir les médicaments |
| **Caissier** | Caissier | Enregistrer les ventes et encaisser |
| **Client** | Patient / Client | Commander des médicaments, suivre ses ordonnances |

---

## Vue Backbone (Activités Principales)

```
AUTHENTIFICATION → GESTION PERSONNEL → GESTION PATIENTS → CATALOGUE MÉDICAMENTS
      → GESTION STOCK → VENTES & ENCAISSEMENT → ORDONNANCES → COMMANDES CLIENTS
      → FOURNISSEURS → ALERTES & RAPPORTS
```

---

## 1. AUTHENTIFICATION & SÉCURITÉ

**Activité** : Accéder et sécuriser le système

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Se connecter | Obtenir un accès sécurisé au système |
| Gérer sa session | Maintenir et renouveler sa session active |
| Gérer son mot de passe | Modifier ses identifiants de connexion |
| Se déconnecter | Terminer sa session proprement |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| AUTH-01 | Tout utilisateur | Me connecter avec email + mot de passe | Accéder aux fonctions selon mon rôle | `POST /auth/login` → cookie HTTP-only access_token (15min) + refresh_token (7j) |
| AUTH-02 | Tout utilisateur connecté | Que ma session se renouvelle automatiquement | Ne pas être déconnecté en cours de travail | `POST /auth/refresh` → nouveau access_token via refresh_token |
| AUTH-03 | Tout utilisateur connecté | Me déconnecter | Sécuriser mon compte à la fin du service | `POST /auth/logout` → cookies effacés, refresh_token invalidé en base |
| AUTH-04 | Tout utilisateur connecté | Voir mon profil | Vérifier mes informations personnelles | `GET /auth/me` → données sans mot de passe ni refresh token |
| AUTH-05 | Tout utilisateur connecté | Changer mon mot de passe | Mettre à jour mes identifiants | `PATCH /auth/change-password` → mot de passe haché (bcrypt 12 rounds) |
| AUTH-06 | Nouveau client | Créer mon compte | Passer des commandes en ligne | `POST /auth/register` → compte créé avec rôle CLIENT |

---

## 2. GESTION DU PERSONNEL

**Activité** : Gérer les comptes du personnel de la pharmacie

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Créer un compte staff | Intégrer un nouvel employé |
| Consulter le personnel | Voir la liste et les détails du personnel |
| Modifier un compte | Mettre à jour les informations d'un employé |
| Désactiver un compte | Retirer les accès d'un employé |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| USER-01 | PHARMACIEN | Créer un compte pour un nouvel employé | Lui donner accès au système | `POST /users` → génère mot de passe aléatoire (12 car.), envoie email avec identifiants |
| USER-02 | PHARMACIEN | Voir la liste de tout le personnel | Gérer mon équipe | `GET /users` → liste sans mots de passe ni refresh tokens |
| USER-03 | PHARMACIEN | Voir le profil d'un employé | Vérifier ses informations | `GET /users/:id` → détails complets (sauf données sensibles) |
| USER-04 | PHARMACIEN | Modifier les informations d'un employé | Maintenir les données à jour | `PATCH /users/:id` → email, nom, prénom, rôle modifiables |
| USER-05 | PHARMACIEN | Supprimer un compte employé | Retirer les accès en cas de départ | `DELETE /users/:id` → compte supprimé définitivement |

---

## 3. GESTION DES PATIENTS

**Activité** : Gérer le dossier des patients de la pharmacie

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Enregistrer un patient | Créer un dossier patient |
| Consulter un dossier patient | Voir l'historique complet d'un patient |
| Mettre à jour un dossier | Corriger ou compléter les informations |
| Consulter l'historique | Voir ordonnances et achats passés |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| PAT-01 | Caissier / Pharmacien | Enregistrer un nouveau patient | Associer ses achats à son dossier | `POST /patients` → numéro de téléphone unique, informations de base |
| PAT-02 | Caissier / Pharmacien | Retrouver un patient existant | Accéder rapidement à son dossier | `GET /patients` → liste triée par date de création |
| PAT-03 | Pharmacien | Voir le dossier complet d'un patient | Consulter son historique médical | `GET /patients/:id` → inclut 10 dernières ordonnances + 10 dernières ventes |
| PAT-04 | PHARMACIEN | Mettre à jour les données d'un patient | Corriger des erreurs de saisie | `PATCH /patients/:id` → modification téléphone, adresse, nom, prénom |
| PAT-05 | PHARMACIEN | Supprimer un dossier patient | Gérer les doublons | `DELETE /patients/:id` → échec si le patient a des ventes associées |

---

## 4. CATALOGUE DES MÉDICAMENTS

**Activité** : Gérer le catalogue de médicaments disponibles

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Ajouter un médicament | Enrichir le catalogue |
| Consulter le catalogue | Voir les médicaments disponibles et leurs prix |
| Mettre à jour un médicament | Modifier prix, description, seuil de stock |
| Retirer un médicament | Supprimer un produit du catalogue |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| MED-01 | Pharmacien / PHARMACIEN | Ajouter un médicament au catalogue | Le rendre disponible à la vente | `POST /medicaments` → crée médicament + stock initial en transaction atomique |
| MED-02 | Tout utilisateur connecté | Voir la liste de tous les médicaments | Consulter le catalogue avec les stocks | `GET /medicaments` → inclut niveau de stock actuel par médicament |
| MED-03 | Tout utilisateur connecté | Voir les détails d'un médicament | Consulter prix CDF/USD, catégorie, stock | `GET /medicaments/:id` → données complètes + stock |
| MED-04 | Pharmacien / PHARMACIEN | Modifier un médicament | Mettre à jour prix ou seuil d'alerte | `PATCH /medicaments/:id` → prix, description, seuilMinimum modifiables |
| MED-05 | PHARMACIEN | Supprimer un médicament | Nettoyer le catalogue | `DELETE /medicaments/:id` → supprime médicament et toutes données liées (stock, ventes) |

---

## 5. GESTION DU STOCK (INVENTAIRE)

**Activité** : Surveiller et ajuster les niveaux de stock

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Consulter le stock global | Vue d'ensemble de l'inventaire |
| Surveiller les alertes de stock | Identifier les ruptures imminentes |
| Ajuster le stock manuellement | Corriger après inventaire physique |
| Générer un rapport de commande | Préparer les réapprovisionnements |
| Envoyer une commande fournisseur | Commander les produits manquants |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| STK-01 | Pharmacien / PHARMACIEN | Voir le stock de tous les médicaments | Avoir une vue d'ensemble de l'inventaire | `GET /stock` → tous les médicaments avec quantités actuelles |
| STK-02 | Pharmacien / PHARMACIEN | Voir uniquement les produits en alerte | Prioriser les réapprovisionnements urgents | `GET /stock/alertes` → produits avec quantite <= seuilMinimum |
| STK-03 | Pharmacien / PHARMACIEN | Consulter le stock d'un médicament précis | Vérifier sa disponibilité | `GET /stock/medicament/:id` → quantité, seuil, dernière mise à jour |
| STK-04 | PHARMACIEN | Mettre à jour manuellement le stock | Corriger après inventaire physique | `PATCH /stock/medicament/:id` → quantite, seuilMinimum modifiables |

#### Release 2 — Rapports & Automatisation
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| STK-05 | Pharmacien / PHARMACIEN | Générer un rapport des produits à commander | Avoir une liste structurée des besoins | `GET /stock/rapport` → liste avec quantités suggérées (seuil × 2 - stock actuel) |
| STK-06 | Pharmacien / PHARMACIEN | Envoyer le rapport à un fournisseur | Déclencher une commande de réapprovisionnement | `POST /stock/envoyer-rapport` → email avec PDF et Excel joints au fournisseur |
| STK-07 | Pharmacien / PHARMACIEN | Recevoir une alerte temps réel quand un stock est critique | Réagir immédiatement sans polling | WebSocket `stock-alerte` → payload : medicamentId, nom, quantite, seuilMinimum |

---

## 6. VENTES & ENCAISSEMENT

**Activité** : Enregistrer et gérer les transactions de vente

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Créer une vente | Enregistrer une transaction |
| Vente avec ordonnance | Vente soumise à prescription médicale |
| Vente anonyme | Vente sans patient enregistré |
| Générer un ticket | Émettre un reçu au client |
| Annuler une vente | Corriger une erreur de caisse |
| Consulter l'historique | Suivre les transactions passées |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| VNT-01 | Caissier | Créer une vente avec plusieurs lignes de produits | Encaisser un client | `POST /ventes` → transaction atomique : vérif stock → création vente → décrémentation stock → QR code |
| VNT-02 | Caissier | Créer une vente liée à une ordonnance | Respecter la prescription médicale | Vente refusée si ordonnance non VALIDEE ou déjà utilisée |
| VNT-03 | Caissier | Créer une vente sans associer un patient | Encaisser un client anonyme | `POST /ventes` sans patientId → vente FINALISEE |
| VNT-04 | Caissier | Obtenir un ticket PDF de la vente | Remettre un reçu au client | `GET /ventes/:id/ticket` → PDF format A6 avec QR code, détails, total CDF/USD |
| VNT-05 | Tout utilisateur connecté | Voir l'historique de toutes les ventes | Consulter les transactions | `GET /ventes` → liste avec détails lignes |
| VNT-06 | Tout utilisateur connecté | Voir le détail d'une vente | Vérifier une transaction précise | `GET /ventes/:id` → données complètes de la vente |
| VNT-07 | PHARMACIEN | Annuler une vente | Corriger une erreur d'encaissement | `POST /ventes/:id/annuler` → stock restauré atomiquement, ordonnance libérée, statut ANNULEE |

#### Règles métier critiques
- Vérification stock AVANT création (tout ou rien)
- Décrémentation atomique (anti race condition)
- Devise par ligne (CDF ou USD)
- QR code généré post-transaction et sauvegardé

---

## 7. ORDONNANCES (PRESCRIPTIONS MÉDICALES)

**Activité** : Gérer le cycle de vie des ordonnances médicales

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Enregistrer une ordonnance | Saisir une prescription reçue |
| Valider une ordonnance | Approuver une prescription médicale |
| Refuser une ordonnance | Rejeter une prescription invalide |
| Consulter les ordonnances en attente | Prioriser le travail de validation |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| ORD-01 | Caissier / Pharmacien | Enregistrer une ordonnance pour un patient | Démarrer le processus de validation | `POST /ordonnances` → statut initial EN_ATTENTE, lien patient obligatoire |
| ORD-02 | Pharmacien / PHARMACIEN | Voir toutes les ordonnances en attente | Gérer la file de validation | `GET /ordonnances` → liste avec infos patient |
| ORD-03 | Pharmacien / PHARMACIEN | Voir le détail d'une ordonnance | Vérifier la prescription et la vente liée | `GET /ordonnances/:id` → inclut vente associée si elle existe |
| ORD-04 | Pharmacien | Valider une ordonnance | Autoriser la délivrance des médicaments | `POST /ordonnances/:id/valider` → statut passe à VALIDEE |
| ORD-05 | Pharmacien | Refuser une ordonnance | Bloquer une prescription invalide | `POST /ordonnances/:id/refuser` → statut passe à REFUSEE |
| ORD-06 | PHARMACIEN | Modifier une ordonnance | Corriger une URL d'image ou des informations | `PATCH /ordonnances/:id` → imageUrl, prescripteur modifiables |

#### Workflow ordonnance
```
EN_ATTENTE ──(Pharmacien valide)──→ VALIDEE ──(utilisée dans vente)──→ liée à la vente
           ──(Pharmacien refuse)──→ REFUSEE
```

---

## 8. COMMANDES CLIENTS (CATALOGUE EN LIGNE)

**Activité** : Permettre aux clients de passer des commandes depuis le catalogue

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Parcourir le catalogue | Voir les médicaments disponibles |
| Passer une commande | Commander des médicaments |
| Suivre sa commande | Vérifier le statut de sa commande |
| Valider / Refuser une commande | Traiter les commandes clients (PHARMACIEN) |

### User Stories

#### Release 2 — Catalogue Client
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| CMD-01 | Client | Voir la liste des médicaments disponibles | Choisir ce que je veux commander | `GET /medicaments` → catalogue complet avec prix CDF/USD |
| CMD-02 | Client | Passer une commande en ligne | Réserver des médicaments | `POST /commandes` → statut EN_ATTENTE, lignes avec quantités souhaitées |
| CMD-03 | Client | Voir uniquement mes commandes | Suivre mes achats | `GET /commandes/mes-commandes` → filtre automatique par clientId |
| CMD-04 | Client | Voir le détail d'une ma commande | Vérifier les articles commandés | `GET /commandes/:id` → accès refusé si commande d'un autre client |
| CMD-05 | PHARMACIEN / Pharmacien | Voir toutes les commandes clients | Gérer les demandes en attente | `GET /commandes` → liste complète toutes commandes |
| CMD-06 | PHARMACIEN | Valider une commande | Confirmer la disponibilité et la préparation | `POST /commandes/:id/valider` → statut VALIDEE |
| CMD-07 | PHARMACIEN | Refuser une commande | Informer le client d'une indisponibilité | `POST /commandes/:id/refuser` → statut REFUSEE |

---

## 9. GESTION DES FOURNISSEURS

**Activité** : Gérer le répertoire des fournisseurs de médicaments

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Référencer un fournisseur | Ajouter un fournisseur au répertoire |
| Consulter les fournisseurs | Voir les coordonnées disponibles |
| Mettre à jour un fournisseur | Maintenir les contacts à jour |
| Supprimer un fournisseur | Retirer un fournisseur inactif |

### User Stories

#### Release 1 — Fondations
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| FRN-01 | PHARMACIEN / Pharmacien | Ajouter un fournisseur | Le rendre disponible pour les commandes de stock | `POST /fournisseurs` → téléphone et email uniques, email requis pour envoi rapports |
| FRN-02 | PHARMACIEN / Pharmacien | Voir tous les fournisseurs | Trouver rapidement le bon contact | `GET /fournisseurs` → liste triée alphabétiquement |
| FRN-03 | PHARMACIEN / Pharmacien | Voir les détails d'un fournisseur | Consulter adresse, téléphone, email | `GET /fournisseurs/:id` |
| FRN-04 | PHARMACIEN / Pharmacien | Mettre à jour les coordonnées d'un fournisseur | Maintenir les informations à jour | `PATCH /fournisseurs/:id` → nom, téléphone, email, adresse modifiables |
| FRN-05 | PHARMACIEN | Supprimer un fournisseur | Retirer un fournisseur inactif | `DELETE /fournisseurs/:id` |

---

## 10. NOTIFICATIONS & ALERTES TEMPS RÉEL

**Activité** : Surveiller les événements critiques en temps réel

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Recevoir des alertes stock | Être notifié immédiatement des ruptures imminentes |
| Surveiller le tableau de bord | Vue en temps réel de l'état du stock |

### User Stories

#### Release 2 — Temps Réel
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| NOTIF-01 | Pharmacien / PHARMACIEN | Recevoir une alerte instantanée quand un stock passe sous le seuil | Réagir immédiatement sans surveiller manuellement | WebSocket event `stock-alerte` → payload : `{ medicamentId, nom, quantite, seuilMinimum, message, timestamp }` |
| NOTIF-02 | Pharmacien / PHARMACIEN | Être alerté après chaque vente si elle crée une rupture | Traiter les alertes au fil des ventes | Déclenchement automatique post-vente si stock <= seuilMinimum |
| NOTIF-03 | Pharmacien / PHARMACIEN | Être alerté après annulation si le stock restauré repasse au-dessus | Avoir une vue cohérente | Déclenchement possible post-annulation si restockage important |

---

## 11. GÉNÉRATION DE DOCUMENTS

**Activité** : Générer des documents officiels (tickets, rapports, QR codes)

### Tâches utilisateur

| Tâche | Description |
|-------|-------------|
| Générer un ticket de caisse | Émettre un reçu officiel avec QR code |
| Générer un rapport de stock PDF | Produire un document de réapprovisionnement |
| Générer un rapport Excel | Exporter les données stock pour traitement |

### User Stories

#### Release 1 — Documents Essentiels
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| DOC-01 | Caissier | Générer un ticket PDF pour une vente | Remettre un justificatif au client | PDF A6 : en-tête pharmacie, ID vente, date, caissier, patient, lignes, total, QR code |
| DOC-02 | Système | Générer un QR code pour chaque vente | Permettre la vérification de l'authenticité | QR code base64 PNG encodant `PHARMACIE-VENTE:<venteId>`, correction erreur niveau H |

#### Release 2 — Rapports Stock
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| DOC-03 | Pharmacien / PHARMACIEN | Générer un rapport PDF des produits à commander | Avoir un document officiel à envoyer | PDF avec en-tête, tableau produits, quantités suggérées, date |
| DOC-04 | Pharmacien / PHARMACIEN | Générer un rapport Excel des produits à commander | Exporter pour traitement ultérieur | Excel avec couleurs alternées, mise en forme conditionnelle pour stock épuisé |

---

## 12. NOTIFICATIONS EMAIL

**Activité** : Communiquer automatiquement par email avec le personnel et les fournisseurs

### User Stories

#### Release 1 — Emails Essentiels
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| MAIL-01 | Système | Envoyer les identifiants par email au nouvel employé | Lui permettre de se connecter | Email de bienvenue + mot de passe temporaire généré (12 caractères) |
| MAIL-02 | Pharmacien / PHARMACIEN | Envoyer le rapport de commande au fournisseur par email | Déclencher le réapprovisionnement | Email avec PDF + Excel en pièces jointes, via `POST /stock/envoyer-rapport` |

#### Release 2 — Emails Complémentaires
| ID | En tant que | Je veux | Afin de | Critères d'acceptation |
|----|-------------|---------|---------|------------------------|
| MAIL-03 | Système | Envoyer une alerte email en cas de stock critique | Double canal de notification | Email de synthèse avec tableau des produits en alerte |
| MAIL-04 | Système | Envoyer un ticket de vente par email | Offrir une preuve d'achat dématérialisée | Email avec récapitulatif de la transaction |

---

## Récapitulatif par Release

### Release 1 — Fondations Opérationnelles
> **Objectif** : Système fonctionnel en production pour les opérations quotidiennes

| Module | Stories incluses |
|--------|-----------------|
| Authentification | AUTH-01 à AUTH-06 |
| Personnel | USER-01 à USER-05 |
| Patients | PAT-01 à PAT-05 |
| Médicaments | MED-01 à MED-05 |
| Stock (base) | STK-01 à STK-04 |
| Ventes | VNT-01 à VNT-07 |
| Ordonnances | ORD-01 à ORD-06 |
| Fournisseurs | FRN-01 à FRN-05 |
| Documents (base) | DOC-01, DOC-02 |
| Emails (essentiels) | MAIL-01 |

### Release 2 — Automatisation & Catalogue
> **Objectif** : Alertes intelligentes, commandes en ligne, rapports automatisés

| Module | Stories incluses |
|--------|-----------------|
| Stock (avancé) | STK-05 à STK-07 |
| Commandes clients | CMD-01 à CMD-07 |
| Notifications temps réel | NOTIF-01 à NOTIF-03 |
| Documents (rapports) | DOC-03, DOC-04 |
| Emails (complets) | MAIL-02 à MAIL-04 |

---

## Matrice des Permissions par Rôle

| Fonctionnalité | PHARMACIEN | PREPARATEUR | CAISSIER | CLIENT |
|---------------|------------|-------------|----------|--------|
| Gestion personnel | ✅ | ❌ | ❌ | ❌ |
| Gestion patients | ✅ | ❌ | ✅ | ❌ |
| Catalogue médicaments (lecture) | ✅ | ✅ | ✅ | ✅ |
| Catalogue médicaments (écriture) | ✅ | ❌ | ❌ | ❌ |
| Gestion stock | ✅ | ✅ | ❌ | ❌ |
| Créer vente | ✅ | ❌ | ✅ | ❌ |
| Annuler vente | ✅ | ❌ | ❌ | ❌ |
| Valider ordonnance | ✅ | ❌ | ❌ | ❌ |
| Gérer fournisseurs | ✅ | ❌ | ❌ | ❌ |
| Voir toutes les commandes | ✅ | ✅ | ✅ | ❌ |
| Passer une commande | ❌ | ❌ | ❌ | ✅ |
| Voir ses propres commandes | ❌ | ❌ | ❌ | ✅ |
| Valider/Refuser commande | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rapports & alertes stock | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Endpoints API — Récapitulatif

```
AUTH
  POST   /api/auth/register          # Inscription client
  POST   /api/auth/login             # Connexion
  POST   /api/auth/refresh           # Renouvellement token
  POST   /api/auth/logout            # Déconnexion
  GET    /api/auth/me                # Profil courant
  PATCH  /api/auth/change-password   # Changer mot de passe

USERS
  POST   /api/users                  # Créer personnel (PHARMACIEN)
  GET    /api/users                  # Lister personnel (PHARMACIEN)
  GET    /api/users/:id              # Détail personnel (PHARMACIEN)
  PATCH  /api/users/:id              # Modifier personnel (PHARMACIEN)
  DELETE /api/users/:id              # Supprimer personnel (PHARMACIEN)

PATIENTS
  POST   /api/patients               # Créer patient
  GET    /api/patients               # Lister patients
  GET    /api/patients/:id           # Détail + historique patient
  PATCH  /api/patients/:id           # Modifier patient
  DELETE /api/patients/:id           # Supprimer patient (si sans ventes)

MEDICAMENTS
  POST   /api/medicaments            # Créer médicament + stock (PHARMACIEN)
  GET    /api/medicaments            # Lister catalogue + stocks
  GET    /api/medicaments/:id        # Détail médicament
  PATCH  /api/medicaments/:id        # Modifier médicament (PHARMACIEN)
  DELETE /api/medicaments/:id        # Supprimer médicament (PHARMACIEN)

STOCK
  GET    /api/stock                  # Tous les stocks
  GET    /api/stock/alertes          # Produits sous seuil
  GET    /api/stock/medicament/:id   # Stock d'un médicament
  PATCH  /api/stock/medicament/:id   # Ajuster stock manuellement
  GET    /api/stock/rapport          # Rapport de réapprovisionnement
  POST   /api/stock/envoyer-rapport  # Envoyer rapport par email (PDF + Excel)

VENTES
  POST   /api/ventes                 # Créer vente (atomique)
  GET    /api/ventes                 # Lister ventes
  GET    /api/ventes/:id             # Détail vente
  GET    /api/ventes/:id/ticket      # Télécharger ticket PDF
  POST   /api/ventes/:id/annuler     # Annuler vente + restaurer stock (PHARMACIEN)

ORDONNANCES
  POST   /api/ordonnances            # Enregistrer ordonnance
  GET    /api/ordonnances            # Lister ordonnances
  GET    /api/ordonnances/:id        # Détail ordonnance
  PATCH  /api/ordonnances/:id        # Modifier ordonnance
  POST   /api/ordonnances/:id/valider # Valider (PHARMACIEN)
  POST   /api/ordonnances/:id/refuser # Refuser (PHARMACIEN)

FOURNISSEURS
  POST   /api/fournisseurs           # Créer fournisseur
  GET    /api/fournisseurs           # Lister fournisseurs
  GET    /api/fournisseurs/:id       # Détail fournisseur
  PATCH  /api/fournisseurs/:id       # Modifier fournisseur
  DELETE /api/fournisseurs/:id       # Supprimer fournisseur

COMMANDES
  POST   /api/commandes                  # Passer commande (CLIENT)
  GET    /api/commandes                  # Toutes les commandes (PHARMACIEN)
  GET    /api/commandes/mes-commandes    # Mes commandes (CLIENT)
  GET    /api/commandes/:id             # Détail commande
  POST   /api/commandes/:id/valider     # Valider commande (PHARMACIEN)
  POST   /api/commandes/:id/refuser     # Refuser commande (PHARMACIEN)

WEBSOCKET
  ws://host/notifications
  event: stock-alerte  # { medicamentId, nom, quantite, seuilMinimum, message, timestamp }
```

---

*Généré le 2026-05-22 — Pharmacie Backend NestJS (RDC)*
