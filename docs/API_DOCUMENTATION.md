# JobMate — Documentation API

**URL de base (production) :** `https://api.meelkyway.com`  
**URL de base (développement local) :** `http://localhost:4000`

Tout le trafic public transite par le service **Gateway**. Le `profile-service` est strictement interne (réseau Docker) et n'est pas exposé via Traefik.

---

## Table des matières

1. [Authentification](#1-authentification)
2. [Endpoint GraphQL](#2-endpoint-graphql)
3. [REST — Santé & SSE](#3-rest--santé--sse)
4. [Requêtes GraphQL (Queries)](#4-requêtes-graphql-queries)
5. [Mutations GraphQL](#5-mutations-graphql)
6. [Types & Enums de Référence](#6-types--enums-de-référence)
7. [APIs gRPC Internes](#7-apis-grpc-internes)
8. [Gestion des Erreurs](#8-gestion-des-erreurs)
9. [Exemples de Flux Complets](#9-exemples-de-flux-complets)

---

## 1. Authentification

JobMate utilise des **tokens JWT Bearer**.

Après un `register` ou un `login`, incluez le token dans chaque requête sécurisée :

```
Authorization: Bearer <token>
```

Les tokens expirent après **7 jours** (configurable via la variable d'environnement `JWT_EXPIRES_IN`).

Les opérations GraphQL publiques (ex : `health`, `register`, `login`) ne nécessitent pas de header d'authentification. Toutes les autres opérations sont marquées 🔒 et retournent une erreur `UNAUTHENTICATED` si le token est absent ou invalide.

---

## 2. Endpoint GraphQL

| Méthode | Chemin | Authentification |
|---------|--------|-----------------|
| `POST` | `/graphql` | Optionnelle (obligatoire selon l'opération) |

**Content-Type :** `application/json`

**Corps de la requête :**
```json
{
  "query": "...",
  "variables": { }
}
```

---

## 3. REST — Santé & SSE

### `GET /health`

Vérification de santé publique. Retourne `200 OK` si la gateway est en ligne.

**Réponse :**
```json
{ "status": "ok", "service": "gateway", "version": "1.0.0" }
```

---

### `GET /events`

Flux SSE (Server-Sent Events). Envoie des notifications en temps réel au client authentifié (ex : fin d'analyse IA, nouvelle offre découverte).

**Authentification :** Le JWT est transmis via le paramètre de requête `token`.

```
GET /events?token=<jwt>
```

**Headers retournés :**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Format des événements :**
```
data: {"type":"JOB_DISCOVERED","userId":"...","jobFeedId":"...","title":"Senior React Developer","company":"Acme Corp"}
data: {"type":"ANALYSIS_DONE","userId":"...","applicationId":"...","matchScore":87}
data: {"type":"CV_PARSED","userId":"...","fieldsUpdated":{"skills":5,"experience":3,"education":2,"certifications":1,"projects":2}}
data: {"type":"CARD_MOVED","userId":"...","applicationId":"...","from":"TO_APPLY","to":"APPLIED"}
```

> **Note :** Le canal Redis conserve le préfixe `EVENT_` (ex: `EVENT_CV_PARSED`), mais la Gateway le supprime dans le payload SSE envoyé au client (ex: `CV_PARSED`). C'est la valeur sans préfixe qu'il faut utiliser dans les handlers frontend.

**Canaux Redis souscrits par la Gateway :**

| Canal Redis | Type événement SSE (`type` dans le payload) | Déclencheur |
|---|---|---|
| `EVENT_JOB_DISCOVERED` | `JOB_DISCOVERED` | Nouvelle offre scrapée ou ajoutée — en attente dans l'inbox |
| `EVENT_ANALYSIS_DONE` | `ANALYSIS_DONE` | L'AI Coach a terminé l'analyse d'une offre approuvée |
| `EVENT_CV_PARSED` | `CV_PARSED` | L'AI Coach a terminé l'enrichissement du profil depuis le CV |
| `EVENT_CARD_MOVED` | `CARD_MOVED` | Une candidature Kanban a changé de statut |

Un commentaire keepalive (`: ping`) est envoyé toutes les 25 secondes pour éviter les timeouts des proxys intermédiaires.

---

## 4. Requêtes GraphQL (Queries)

### `health` — Public

```graphql
query {
  health
}
```

**Réponse :** `"OK"`

---

### `me` — 🔒 Auth requise

Retourne l'utilisateur authentifié avec son profil complet.

```graphql
query {
  me {
    id
    email
    createdAt
    profile {
      id
      fullName
      status
      skills
      experience
      projects
      education
      certifications
      cvUrl
    }
  }
}
```

---

### `mySearchConfigs` — 🔒 Auth requise

Retourne toutes les configurations de recherche actives de l'utilisateur. Ces configs sont utilisées par le Discovery Service pour scraper les offres correspondantes. Les configs avec `isActive = false` (supprimées en soft-delete) ne sont **pas** retournées.

```graphql
query {
  mySearchConfigs {
    id
    jobTitles
    locations
    remotePolicy
    keywords
    redFlags
    salaryMin
    salaryMax
    coverLetterTemplate
    isActive
    createdAt
    updatedAt
  }
}
```

---

### `jobFeed` — 🔒 Auth requise

Retourne les offres d'emploi scrapées par le Discovery Service pour les configurations actives de l'utilisateur. Seules les offres non expirées (`expires_at > NOW()`) sont incluses.

```graphql
query {
  jobFeed(status: PENDING) {
    id
    rawData
    sourceUrl
    status
    title
    createdAt
  }
}
```

Le filtre `status` est optionnel. Sans filtre, toutes les offres sont retournées.

**Valeurs du filtre `status` :**
- `PENDING` — Offres en attente de décision dans l'inbox
- `APPROVED` — Offres approuvées (candidature créée dans le Kanban)
- `REJECTED` — Offres rejetées

**Champ `rawData` :** JSON brut retourné par le scraper. Contient `title`, `company`, `location`, `description`, `salary`, etc.

**Champ `title` :** Colonne dénormalisée disponible directement (sans extraire `rawData`). Correspond au titre du poste (offre scrapée) ou au nom de l'entreprise (ajout manuel).

---

### `myApplications` — 🔒 Auth requise *(Phase 4, non encore implémentée)*

```graphql
query {
  myApplications {
    id
    currentStatus
    aiAnalysis
    generatedCoverLetter
    userNotes
    userRating
    relanceAt
    historyLog
    createdAt
    updatedAt
  }
}
```

---

## 5. Mutations GraphQL

### `register` — Public

Crée un nouveau compte utilisateur et retourne un JWT. Un profil vide est automatiquement créé via le Profile Service.

**Contrainte :** Le mot de passe doit comporter **au moins 8 caractères**.

```graphql
mutation {
  register(email: "alice@example.com", password: "motdepasse123") {
    token
    user {
      id
      email
      createdAt
      profile {
        id
        status
      }
    }
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `BAD_USER_INPUT` | Un compte avec cet email existe déjà. |
| `BAD_USER_INPUT` | Le mot de passe doit comporter au moins 8 caractères. |

---

### `login` — Public

Authentifie un compte existant et retourne un JWT.

```graphql
mutation {
  login(email: "alice@example.com", password: "motdepasse123") {
    token
    user {
      id
      email
    }
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `UNAUTHENTICATED` | Email ou mot de passe invalide. |

---

### `updateProfile` — 🔒 Auth requise

Mise à jour **partielle** du profil — seuls les champs fournis sont modifiés. Les tableaux non fournis sont conservés en base via `COALESCE` SQL.

```graphql
mutation {
  updateProfile(input: {
    fullName: "Alice Dupont"
    status: JUNIOR
    skills: ["TypeScript", "React", "Node.js"]
    experience: [
      {
        company: "Acme Corp",
        role: "Frontend Developer",
        startDate: "2023-01",
        endDate: "2025-01",
        description: "Développement de tableaux de bord avec React."
      }
    ]
    projects: [
      {
        name: "JobMate",
        url: "https://github.com/...",
        description: "Copilote de carrière IA"
      }
    ]
    education: [
      {
        school: "Ynov Campus",
        degree: "Bachelor Informatique",
        startDate: "2022",
        endDate: "2025"
      }
    ]
    certifications: [
      {
        name: "AWS Solutions Architect",
        issuer: "Amazon",
        year: 2024
      }
    ]
  }) {
    id
    fullName
    status
    skills
  }
}
```

---

### `createSearchConfig` — 🔒 Auth requise

Crée une nouvelle configuration de recherche d'emploi. Le Discovery Service scrape les offres en continu en fonction de ces configs.

Le champ `coverLetterTemplate` est **optionnel** : si fourni, l'AI Coach injecte ce template dans le prompt de génération de la lettre de motivation pour personnaliser le style et le ton.

```graphql
mutation {
  createSearchConfig(input: {
    jobTitles: ["Software Engineer", "Fullstack Developer"]
    locations: ["Paris", "Lyon"]
    remotePolicy: HYBRID
    keywords: ["React", "Node.js"]
    redFlags: ["ESN", "Stage", "Déplacement"]
    salaryMin: 40000
    salaryMax: 60000
    coverLetterTemplate: "Je suis passionné par les produits qui ont un impact réel..."
  }) {
    id
    jobTitles
    locations
    remotePolicy
    keywords
    redFlags
    salaryMin
    salaryMax
    coverLetterTemplate
    isActive
    createdAt
  }
}
```

**Champ `coverLetterTemplate` :** Texte libre (modèle ou consignes de style) inclus dans le prompt IA lors de la génération de lettres de motivation. Permet de personnaliser le ton (formel, startup, technique) ou d'imposer une structure spécifique.

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `BAD_USER_INPUT` | Le champ `jobTitles[]` est obligatoire. |
| `BAD_USER_INPUT` | Le champ `locations[]` est obligatoire. |

---

### `updateSearchConfig` — 🔒 Auth requise

Mise à jour partielle d'une configuration — seuls les champs fournis sont modifiés.

```graphql
mutation {
  updateSearchConfig(
    id: "uuid-ici"
    input: {
      salaryMin: 45000
      remotePolicy: REMOTE
      coverLetterTemplate: "Template mis à jour..."
    }
  ) {
    id
    remotePolicy
    salaryMin
    coverLetterTemplate
    updatedAt
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `NOT_FOUND` | Configuration introuvable ou vous n'êtes pas propriétaire. |

---

### `deleteSearchConfig` — 🔒 Auth requise

Suppression logique (soft-delete) d'une configuration (`is_active = false`). La config n'est plus scrapée par le Discovery Service. Retourne `true` en cas de succès.

```graphql
mutation {
  deleteSearchConfig(id: "uuid-ici")
}
```

---

### `uploadCV` — 🔒 Auth requise

Téléversement d'un CV (PDF) via GraphQL multipart, conformément à la [graphql-multipart-request-spec](https://github.com/jaydenseric/graphql-multipart-request-spec). La gateway streame le buffer vers le **Profile Service via gRPC** (RPC `UploadCV`).

Après upload réussi, le Profile Service publie `CMD_PARSE_CV` sur Redis, déclenchant l'enrichissement asynchrone du profil par l'AI Coach. L'événement SSE `CV_PARSED` est ensuite diffusé au client.

```graphql
mutation UploadCV($file: Upload!) {
  uploadCV(file: $file) {
    cvUrl
    message
  }
}
```

**Exemple (curl) :**
```bash
curl -X POST https://api.meelkyway.com/graphql \
  -H "Authorization: Bearer TOKEN" \
  -F 'operations={"query":"mutation($file:Upload!){uploadCV(file:$file){cvUrl message}}","variables":{"file":null}}' \
  -F 'map={"0":["variables.file"]}' \
  -F '0=@/chemin/vers/cv.pdf;type=application/pdf'
```

**Réponse :**
```json
{
  "data": {
    "uploadCV": {
      "cvUrl": "/uploads/1708693200000-cv.pdf",
      "message": "CV uploadé avec succès. Enrichissement IA en cours."
    }
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `BAD_USER_INPUT` | Seuls les fichiers PDF sont acceptés. |
| `BAD_USER_INPUT` | Fichier trop volumineux (max 10 Mo). |
| `UNAUTHENTICATED` | JWT manquant ou invalide. |

---

### `approveJob` — 🔒 Auth requise

Approuve une offre depuis l'inbox. Crée un enregistrement `Application` dans le Tracker Service (statut initial : `TO_APPLY`) et publie `CMD_ANALYZE_JOB` sur Redis.

```graphql
mutation {
  approveJob(jobFeedId: "uuid-ici") {
    id
    currentStatus
  }
}
```

**Flux post-approbation :**
1. `job_feed.status` → `APPROVED`
2. Création d'une `Application` avec `currentStatus = TO_APPLY`
3. Publication Redis `CMD_ANALYZE_JOB` → AI Coach traite l'offre
4. L'AI Coach publie `EVENT_ANALYSIS_DONE` → diffusé au client via SSE

---

### `rejectJob` — 🔒 Auth requise

Rejette une offre depuis l'inbox. Passe `job_feed.status` à `REJECTED`.

```graphql
mutation {
  rejectJob(jobFeedId: "uuid-ici") {
    id
    status
  }
}
```

---

### `createApplication` — 🔒 Auth requise

Crée manuellement une candidature (pour des offres trouvées hors du flux Discovery).

```graphql
mutation {
  createApplication(input: {
    companyName: "Acme Corp"
    jobTitle: "Fullstack Developer"
    jobUrl: "https://example.com/job/123"
    notes: "Trouvée sur LinkedIn"
  }) {
    id
    currentStatus
    createdAt
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `BAD_USER_INPUT` | Le champ `companyName` est obligatoire. |
| `BAD_USER_INPUT` | Le champ `jobTitle` est obligatoire. |

---

### `moveCard` — 🔒 Auth requise

Déplace une candidature vers une nouvelle colonne du tableau Kanban. La transition est validée selon le graphe d'états autorisés (voir `tracker-service/internal/kanban/transitions.go`).

```graphql
mutation {
  moveCard(applicationId: "uuid-ici", newStatus: APPLIED) {
    id
    currentStatus
  }
}
```

**Transitions valides :**
```
TO_APPLY → APPLIED → INTERVIEW → OFFER → HIRED
    ↓           ↓          ↓        ↓
REJECTED    REJECTED   REJECTED REJECTED
```

---

### `addNote` — 🔒 Auth requise

Ajoute ou remplace une note personnelle sur une candidature.

```graphql
mutation {
  addNote(applicationId: "uuid-ici", note: "Relance prévue vendredi") {
    id
    userNotes
  }
}
```

---

### `setRelanceReminder` — 🔒 Auth requise

Définit (ou supprime) une date de rappel de relance. Passer `relanceAt: null` efface le rappel.

```graphql
mutation {
  setRelanceReminder(applicationId: "uuid-ici", relanceAt: "2025-03-01T09:00:00Z") {
    id
    relanceAt
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|---------|
| `NOT_FOUND` | Candidature introuvable ou vous n'êtes pas propriétaire. |

---

### `rateApplication` — 🔒 Auth requise

Attribue une note personnelle (1 à 5 étoiles) à une candidature.

```graphql
mutation {
  rateApplication(applicationId: "uuid-ici", rating: 4) {
    id
    userRating
  }
}
```

---

### `addJobByUrl` — 🔒 Auth requise

Scrape une URL d'offre d'emploi et l'ajoute dans l'inbox de l'utilisateur (`PENDING`). Le Discovery Service extrait automatiquement titre, description, entreprise, lieu, salaire. Publie `EVENT_JOB_DISCOVERED` pour notifier le client via SSE.

```graphql
mutation {
  addJobByUrl(url: "https://exemple.com/offre/123", searchConfigId: null) {
    jobFeedId
    message
  }
}
```

**Erreurs possibles :**
| Code | Message |
|------|--------|
| `BAD_USER_INPUT` | URL invalide ou inaccessible. |
| `FAILED_PRECONDITION` | L'offre contient des red flags. |
| `ALREADY_EXISTS` | Cette URL est déjà dans votre inbox. |

---

### `addJobManually` — 🔒 Auth requise

Ajoute une offre d'emploi manuellement via un formulaire. Utile pour des offres trouvées en dehors du flux Discovery (LinkedIn, bouche-à-oreille, email). Publie `EVENT_JOB_DISCOVERED`.

```graphql
mutation {
  addJobManually(input: {
    companyName: "Acme Corp"
    location: "Paris, France"
    profileWanted: "Fullstack senior, maîtrise React + Node.js"
    duration: "CDI"
    startDate: "2026-04-01"
    companyDescription: "Scale-up SaaS B2B en hyper-croissance"
    whyUs: "Produit ambitieux, stack moderne, équipe bienveillante"
    searchConfigId: null
  }) {
    jobFeedId
    message
  }
}
```

**Champs du formulaire (`ManualJobInput`) :**
| Champ | Type | Description |
|-------|------|-------------|
| `companyName` | `String!` | Nom de l'entreprise (obligatoire) |
| `location` | `String` | Lieu du poste (ville, "Remote", etc.) |
| `profileWanted` | `String` | Description du poste / profil recherché |
| `duration` | `String` | Type de contrat (ex : `"CDI"`, `"Stage 6 mois"`) |
| `startDate` | `String` | Date de début souhaitée (format `YYYY-MM-DD`) |
| `companyDescription` | `String` | Description de l'entreprise |
| `whyUs` | `String` | Raison de l'intérêt pour ce poste |
| `searchConfigId` | `ID` | Config de recherche associée (null si non liée) |

**Erreurs possibles :**
| Code | Message |
|------|--------|
| `BAD_USER_INPUT` | Le champ `companyName` est obligatoire. |
---

## 6. Types & Enums de R\u00e9f\u00e9rence
### `User`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | `ID!` | UUID de l'utilisateur |
| `email` | `String!` | Email unique, stocké en minuscules |
| `profile` | `Profile` | Peut être `null` sur les comptes nouvellement créés |
| `createdAt` | `String!` | Horodatage ISO 8601 |

### `Profile`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | `ID!` | UUID du profil |
| `fullName` | `String` | Nom complet affiché |
| `status` | `ProfileStatus` | Niveau de carrière |
| `skills` | `JSON` | Tableau de chaînes de compétences |
| `experience` | `JSON` | Tableau d'objets (`company`, `role`, `startDate`, `endDate`, `description`) |
| `projects` | `JSON` | Tableau d'objets (`name`, `url`, `description`) |
| `education` | `JSON` | Tableau d'objets (`school`, `degree`, `startDate`, `endDate`) |
| `certifications` | `JSON` | Tableau d'objets (`name`, `issuer`, `year`) |
| `cvUrl` | `String` | Chemin relatif vers le CV PDF uploadé |

### `SearchConfig`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | `ID!` | UUID |
| `jobTitles` | `[String!]!` | Titres de postes ciblés |
| `locations` | `[String!]!` | Villes ou régions ciblées |
| `remotePolicy` | `RemotePolicy!` | Valeur par défaut : `HYBRID` |
| `keywords` | `[String!]!` | Mots-clés techniques obligatoires |
| `redFlags` | `[String!]!` | Termes d'exclusion (ex : `["ESN", "Stage"]`) |
| `salaryMin` | `Int` | Salaire annuel minimum (€) |
| `salaryMax` | `Int` | Salaire annuel maximum (€) |
| `coverLetterTemplate` | `String` | Modèle de lettre injecté dans le prompt IA (optionnel) |
| `isActive` | `Boolean!` | `false` = supprimé logiquement |
| `createdAt` | `String!` | ISO 8601 |
| `updatedAt` | `String!` | ISO 8601 |

### `AuthPayload`
| Champ | Type |
|-------|------|
| `token` | `String!` |
| `user` | `User!` |

### `ProfileStatus`
| Valeur | Description |
|-------|-------------|
| `STUDENT` | En formation |
| `JUNIOR` | 0–2 ans d'expérience |
| `MID` | 2–5 ans d'expérience |
| `SENIOR` | 5+ ans d'expérience |
| `OPEN_TO_WORK` | En recherche active d'emploi |

### `RemotePolicy`
| Valeur | Description |
|-------|-------------|
| `REMOTE` | Télétravail complet |
| `HYBRID` | Hybride (présentiel + télétravail) |
| `ON_SITE` | Présentiel uniquement |

### `JobStatus`
| Valeur | Description |
|-------|-------------|
| `PENDING` | Offre en attente de décision dans l'inbox |
| `APPROVED` | Offre approuvée — candidature créée |
| `REJECTED` | Offre rejetée |

### `ApplicationStatus` (colonnes Kanban)
| Valeur | Description |
|-------|-------------|
| `TO_APPLY` | À postuler — offre approuvée, pas encore postulée |
| `APPLIED` | Candidature envoyée |
| `INTERVIEW` | Entretien en cours |
| `OFFER` | Offre d'emploi reçue |
| `REJECTED` | Candidature refusée |
| `HIRED` | Embauché 🎉 |

---

## 7. APIs gRPC Internes

> ⚠️ **Internes uniquement.** Ces APIs **ne sont pas exposées à Internet**. La communication s'effectue sur le réseau Docker interne via gRPC. La Gateway transmet l'identité de l'utilisateur via le champ de métadonnée `x-user-id` (positionné après vérification du JWT). Les contrats proto sont définis à la racine du dépôt dans `proto/`.

---

### ProfileService — `proto/user.proto` — `profile-service:9081`

| RPC | Requête | Réponse | Description |
|-----|---------|---------|-------------|
| `GetProfile` | `x-user-id` (metadata) | `ProfileProto` | Retourne le profil complet de l'utilisateur. |
| `UpdateProfile` | Champs partiels du profil | `ProfileProto` | Mise à jour partielle — arrays non fournis conservés via `COALESCE`. |
| `GetSearchConfigs` | `x-user-id` (metadata) | `SearchConfigProto[]` | Liste les configs de recherche actives. |
| `CreateSearchConfig` | Champs de SearchConfig | `SearchConfigProto` | Crée une nouvelle config de recherche. |
| `UpdateSearchConfig` | `id` + champs partiels | `SearchConfigProto` | Mise à jour partielle. |
| `DeleteSearchConfig` | `id` | `{ success: bool }` | Soft-delete (`is_active = false`). |
| `UploadCV` | `file_bytes`, `file_name`, `mime_type` | `{ cv_url, message }` | Persiste le PDF sur le volume `cv_uploads`, met à jour `profiles.cv_url`, publie `CMD_PARSE_CV`. |
| `ParseCV` | `x-user-id` (metadata) | `{ message }` | Publie `CMD_PARSE_CV` pour déclencher l'enrichissement IA sur le CV actuel. |

---

### DiscoveryService — `proto/discovery.proto` — `discovery-service:9083`

| RPC | Requête | Réponse | Description |
|-----|---------|---------|-------------|
| `GetJobFeed` | `x-user-id`, filtre `status` optionnel | `JobFeedItemProto[]` | Liste les offres scrapées pour les configs actives de l'utilisateur. |
| `SetJobStatus` | `job_feed_id`, `status` | `JobFeedItemProto` | Approuve ou rejette une offre. |
| `AddJobByUrl` | `x-user-id`, `url` | `{ message }` | Scrape une URL spécifique et l'ajoute en `PENDING`. Publie `EVENT_JOB_DISCOVERED`. |
| `AddJobManually` | `x-user-id`, champs de l'offre | `{ message }` | Ajout manuel d'une offre en `PENDING`. Publie `EVENT_JOB_DISCOVERED`. |

---

### TrackerService — `proto/tracker.proto` — `tracker-service:9082`

| RPC | Requête | Réponse | Description |
|-----|---------|---------|-------------|
| `ListApplications` | `x-user-id` (metadata), filtre `status` optionnel | `ApplicationProto[]` | Liste les candidatures Kanban de l'utilisateur. |
| `GetApplication` | `application_id` | `ApplicationProto` | Récupère une candidature par ID. |
| `CreateApplication` | `company_name`, `job_title`, `job_url`, `notes` | `ApplicationProto` | Crée manuellement une candidature. |
| `MoveCard` | `application_id`, `new_status` | `ApplicationProto` | Déplace la carte vers une nouvelle colonne (validé par le graphe de transitions). |
| `AddNote` | `application_id`, `note` | `ApplicationProto` | Ajoute une note personnelle. |
| `RateApplication` | `application_id`, `rating` (1-5) | `ApplicationProto` | Attribue une note personnelle. |
| `SetRelanceReminder` | `application_id`, `relance_at` (timestamp optionnel) | `ApplicationProto` | Définit ou efface une date de relance. |

> Les stubs Go du Tracker Service (`internal/pb/`) sont générés depuis `proto/tracker.proto` et committés dans le dépôt. La CI valide les fichiers proto avec `protoc` à chaque push.

---

## 8. Gestion des Erreurs

### Erreurs GraphQL

Toutes les erreurs GraphQL respectent le format standard :

```json
{
  "errors": [
    {
      "message": "Message lisible par un humain",
      "extensions": {
        "code": "CODE_ERREUR"
      }
    }
  ]
}
```

**Codes d'erreur :**

| Code | Équivalent HTTP | Description |
|------|----------------|-------------|
| `BAD_USER_INPUT` | 400 | Entrée invalide — échec de validation |
| `UNAUTHENTICATED` | 401 | JWT absent ou invalide |
| `FORBIDDEN` | 403 | Authentifié mais non autorisé |
| `NOT_FOUND` | 404 | Ressource inexistante ou inaccessible |
| `NOT_IMPLEMENTED` | 501 | Fonctionnalité non encore disponible (Phase 2+) |
| `INTERNAL_SERVER_ERROR` | 500 | Erreur serveur inattendue |

### Erreurs REST

```json
{ "error": "Message lisible par un humain" }
```

---

## 9. Exemples de Flux Complets

### Inscription → Connexion → Mise à jour du profil

```bash
# 1. Inscription
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { register(email: \"alice@example.com\", password: \"motdepasse123\") { token user { id email } } }"}'

# 2. Connexion
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"alice@example.com\", password: \"motdepasse123\") { token } }"}'

# 3. Mise à jour du profil (remplacer TOKEN)
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query":"mutation { updateProfile(input: { fullName: \"Alice\", status: JUNIOR, skills: [\"React\"] }) { id fullName } }"}'
```

---

### Créer une configuration de recherche avec template de lettre

```bash
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "query": "mutation CreateConfig($input: CreateSearchConfigInput!) { createSearchConfig(input: $input) { id jobTitles locations remotePolicy coverLetterTemplate } }",
    "variables": {
      "input": {
        "jobTitles": ["Fullstack Developer"],
        "locations": ["Paris"],
        "remotePolicy": "HYBRID",
        "keywords": ["React", "Node.js"],
        "salaryMin": 42000,
        "coverLetterTemplate": "Je suis passionné par les environnements startup agiles..."
      }
    }
  }'
```

---

### Uploader un CV et attendre l'enrichissement IA

```bash
# 1. Upload du CV
curl -X POST https://api.meelkyway.com/graphql \
  -H "Authorization: Bearer TOKEN" \
  -F 'operations={"query":"mutation($file:Upload!){uploadCV(file:$file){cvUrl message}}","variables":{"file":null}}' \
  -F 'map={"0":["variables.file"]}' \
  -F '0=@/chemin/vers/cv.pdf;type=application/pdf'

# 2. Écouter les événements SSE (EVENT_CV_PARSED arrive quand l'IA a terminé)
curl -N "https://api.meelkyway.com/events?token=TOKEN"
```

Sortie attendue après quelques secondes :
```
: ping
: ping
data: {"type":"CV_PARSED","userId":"uuid","fieldsUpdated":{"skills":8,"experience":3,"education":2,"certifications":1,"projects":4}}
```

---

### Approuver une offre et suivre l'analyse IA

```bash
# 1. Récupérer les offres en attente
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query":"query { jobFeed(status: PENDING) { id rawData sourceUrl } }"}'

# 2. Approuver une offre (remplacer JOB_FEED_ID)
curl -X POST https://api.meelkyway.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query":"mutation { approveJob(jobFeedId: \"JOB_FEED_ID\") { id currentStatus } }"}'

# 3. Écouter l'EVENT_ANALYSIS_DONE via SSE
curl -N "https://api.meelkyway.com/events?token=TOKEN"
```

Sortie attendue :
```
: ping
data: {"type":"ANALYSIS_DONE","userId":"uuid","applicationId":"uuid","matchScore":87}
```
