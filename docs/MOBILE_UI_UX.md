# 📱 UI/UX Mobile — JobMate

> **Scope :** Ce document définit les spécifications complètes de l'interface et de l'expérience utilisateur de l'application mobile **JobMate** (React Native / Expo). Il est la référence unique pour les développeurs et designers avant toute implémentation.
>
> **Plateforme cible :** iOS 16+ · Android 11+  
> **Stack :** React Native (Expo SDK 54+) · TypeScript · Expo Router v3

---

## Table des matières

1. [Design System & Thèmes](#1-design-system--thèmes)
2. [Internationalisation (i18n)](#2-internationalisation-i18n)
3. [Splash Screen & App Icon](#3-splash-screen--app-icon)
4. [Onboarding](#4-onboarding)
5. [Architecture de Navigation](#5-architecture-de-navigation)
6. [Écrans — Authentification](#6-écrans--authentification)
7. [Écrans — Profil & CV](#7-écrans--profil--cv)
8. [Écrans — Configuration Recherche](#8-écrans--configuration-recherche)
9. [Écrans — Inbox (Job Feed)](#9-écrans--inbox-job-feed)
10. [Écrans — Kanban (Suivi)](#10-écrans--kanban-suivi)
11. [Écrans — Paramètres](#11-écrans--paramètres)
12. [Système de Notifications](#12-système-de-notifications)
13. [APIs Natives du Téléphone](#13-apis-natives-du-téléphone)
14. [Gestion des Erreurs & États Limites](#14-gestion-des-erreurs--états-limites)
15. [Partage de Lien d'Offre (Deep Link / URL Scheme)](#15-partage-de-lien-doffre-deep-link--url-scheme)
16. [Accessibilité](#16-accessibilité)

---

## 1. Design System & Thèmes

### 1.1 Système de couleurs

L'application supporte nativement un **thème sombre** et un **thème clair**, basculé automatiquement selon la préférence système ou manuellement dans les paramètres.

#### Palette — Thème Clair

| Token | Valeur hex | Usage |
|---|---|---|
| `color.background` | `#F5F7FA` | Fond d'écran principal |
| `color.surface` | `#FFFFFF` | Cards, modals, inputs |
| `color.surfaceVariant` | `#EEF1F5` | Fond des tags, badges |
| `color.primary` | `#4F46E5` | Bouton principal, onglet actif, accent |
| `color.primaryDark` | `#3730A3` | État pressed du bouton primaire |
| `color.primaryLight` | `#EDE9FE` | Fond d'un badge/tag primaire |
| `color.success` | `#10B981` | Score élevé (>75), statut HIRED |
| `color.warning` | `#F59E0B` | Score moyen (50-75), relance |
| `color.danger` | `#EF4444` | Red flags, erreurs, REJECTED |
| `color.textPrimary` | `#111827` | Texte principal |
| `color.textSecondary` | `#6B7280` | Sous-titres, méta-données |
| `color.textDisabled` | `#D1D5DB` | Texte inactif |
| `color.border` | `#E5E7EB` | Séparateurs, bordures |
| `color.overlay` | `rgba(0,0,0,0.4)` | Fond des modals |

#### Palette — Thème Sombre

| Token | Valeur hex | Usage |
|---|---|---|
| `color.background` | `#0F0F14` | Fond d'écran principal |
| `color.surface` | `#1A1A24` | Cards, modals, inputs |
| `color.surfaceVariant` | `#252535` | Fond des tags, badges |
| `color.primary` | `#6D63FF` | Bouton principal, onglet actif |
| `color.primaryDark` | `#5A51D9` | État pressed |
| `color.primaryLight` | `#1E1B3D` | Fond badge/tag primaire |
| `color.success` | `#34D399` | Score élevé, HIRED |
| `color.warning` | `#FBBF24` | Score moyen, relance |
| `color.danger` | `#F87171` | Red flags, erreurs |
| `color.textPrimary` | `#F9FAFB` | Texte principal |
| `color.textSecondary` | `#9CA3AF` | Sous-titres, méta |
| `color.textDisabled` | `#4B5563` | Inactif |
| `color.border` | `#2D2D3F` | Séparateurs |
| `color.overlay` | `rgba(0,0,0,0.65)` | Fond modals |

### 1.2 Typographie

| Token | Police | Taille | Graisse | Usage |
|---|---|---|---|---|
| `text.displayLarge` | Inter | 32sp | 700 | Titres onboarding |
| `text.displayMedium` | Inter | 26sp | 700 | Titre de page |
| `text.headingLarge` | Inter | 22sp | 600 | Section header |
| `text.headingMedium` | Inter | 18sp | 600 | Card title, modal title |
| `text.bodyLarge` | Inter | 16sp | 400 | Corps principal |
| `text.bodyMedium` | Inter | 14sp | 400 | Descriptions, labels |
| `text.bodySmall` | Inter | 12sp | 400 | Méta-données, timestamps |
| `text.label` | Inter | 13sp | 500 | Labels bouton, tabs |
| `text.caption` | Inter | 11sp | 400 | Légendes |

Police principale : **Inter** (disponible via `@expo-google-fonts/inter`).

### 1.3 Espacement (grille 4pt)

```
spacing.xs   =  4
spacing.sm   =  8
spacing.md   = 16
spacing.lg   = 24
spacing.xl   = 32
spacing.xxl  = 48
```

### 1.4 Border radius

```
radius.xs  =  4   (badges)
radius.sm  =  8   (inputs, boutons)
radius.md  = 12   (cards)
radius.lg  = 16   (modals bottom sheet)
radius.xl  = 24   (onboarding cards)
radius.full = 9999 (avatars, tags pills)
```

### 1.5 Ombres

| Token | Usage |
|---|---|
| `shadow.card` | Élévation 2 — cards standard |
| `shadow.modal` | Élévation 8 — bottom sheets |
| `shadow.fab` | Élévation 6 — bouton flottant |

### 1.6 Icônes

Bibliothèque : **Lucide Icons** via `lucide-react-native`. Taille standard : **20px** (nav), **24px** (in-screen). Trait stroke uniforme pour cohérence thème clair/sombre.

### 1.7 Animations & Transitions

| Interaction | Durée | Easing |
|---|---|---|
| Tab switch | 200ms | `ease-in-out` |
| Card press feedback | 100ms | `spring(mass:1, damping:20)` |
| Modal slide-up | 300ms | `spring(mass:1, damping:25)` |
| Skeleton shimmer | 1200ms loop | `linear` |
| Score ring fill | 800ms | `ease-out` |

Librairie d'animation : **Reanimated 3** + **Moti**.

---

## 2. Internationalisation (i18n)

### 2.1 Langues supportées

| Code | Langue | Statut |
|---|---|---|
| `fr` | Français | Principal (langue par défaut) |
| `en` | Anglais | Secondaire |

### 2.2 Détection automatique

Au premier lancement, la langue est déduite du `locale` système du téléphone (`Localization.getLocales()` via `expo-localization`). Si le locale système est différent de `fr` ou `en`, l'application se replie sur **l'anglais** (`en`).

### 2.3 Changement manuel

Dans **Paramètres → Langue**, l'utilisateur peut forcer `fr` ou `en`. Le choix est persisté en `AsyncStorage` et prend effet immédiatement (rechargement du contexte i18n, pas de redémarrage requis).

### 2.4 Structure des fichiers de traduction

```
src/
  i18n/
    fr.json    ← langue par défaut
    en.json
    index.ts   ← expo-localization + i18next
```

Librairie recommandée : **i18next** + **react-i18next**.

### 2.5 Conventions de clés

```json
{
  "common": {
    "loading": "Chargement...",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Sauvegarder",
    "delete": "Supprimer",
    "yes": "Oui",
    "no": "Non",
    "error.generic": "Une erreur est survenue.",
    "error.offline": "Pas de connexion internet.",
    "error.timeout": "Le serveur met trop de temps à répondre."
  },
  "auth": { ... },
  "profile": { ... },
  "feed": { ... },
  "kanban": { ... },
  "settings": { ... },
  "onboarding": { ... },
  "notifications": { ... }
}
```

Toutes les chaînes visibles utilisateur passent par le système i18n. **Aucune chaîne codée en dur dans les composants.**

---

## 3. Splash Screen & App Icon

### 3.1 Splash Screen

- **Technologie :** `expo-splash-screen` (natif, pas de JS).
- **Durée d'affichage :** Maintenu jusqu'à la fin du chargement initial (vérification JWT, fetch profil) — puis `SplashScreen.hideAsync()` appelé une seule fois.
- **Design :**
  - Fond : `#4F46E5` (violet primaire, indépendant du thème car natif).
  - Centre : Logo JobMate (icon + wordmark) en blanc.
  - Taille icône : 120×120 dp.
  - Pas de texte de chargement (barre de progression ou spinner au niveau natif interdit — géré par l'app après hide).
- **Comportement thème :** Le splash screen est identique en clair et en sombre (natif, ne peut pas lire la préférence système avant JS).

### 3.2 App Icon

Les assets d'icônes sont disponibles dans le dossier **`images/AppIcons/`** du dépôt.

#### Android — `images/AppIcons/android/`

| Dossier | Résolution | Densité |
|---|---|---|
| `mipmap-mdpi/` | 48×48 px | ~160 dpi |
| `mipmap-hdpi/` | 72×72 px | ~240 dpi |
| `mipmap-xhdpi/` | 96×96 px | ~320 dpi |
| `mipmap-xxhdpi/` | 144×144 px | ~480 dpi |
| `mipmap-xxxhdpi/` | 192×192 px | ~640 dpi |

#### iOS — `images/AppIcons/Assets.xcassets/AppIcon.appiconset/`

Contient le catalogue `Contents.json` et les variantes définies pour Xcode. L'icône maître (`1024×1024 px`) est référencée dans `Contents.json`.

#### Expo (`app.json`)

```json
{
  "icon": "./images/AppIcons/Assets.xcassets/AppIcon.appiconset/icon-1024.png",
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./images/AppIcons/android/mipmap-xxxhdpi/ic_launcher_foreground.png",
      "backgroundColor": "#4F46E5"
    }
  }
}
```

- Fond de l'icône adaptive Android : `#4F46E5`.
- L'icône représente le logo JobMate — un « J » stylisé avec une orbite/trajectoire évoquant la recherche d'emploi.

---

## 4. Onboarding

L'onboarding s'affiche **uniquement au premier lancement** (flag `onboardingCompleted` en `AsyncStorage`). Il peut être revu depuis **Paramètres → Revoir le tutoriel**.

### 4.1 Structure globale

```
Onboarding (5 slides) → Écran Auth (Login / Register)
```

Navigation : PagerView horizontal avec dots indicator. Le bouton "Passer" (skip) est toujours visible en haut à droite (saute directement à la slide d'inscription).

### 4.2 Slides

#### Slide 1 — Bienvenue
- **Illustration :** Animation Lottie d'un candidat entouré de cards job en orbite.
- **Titre :** « Votre assistant de candidature IA »
- **Corps :** « JobMate trouve, trie et enrichit automatiquement les offres d'emploi qui correspondent à votre profil. »

#### Slide 2 — Discovery (Le Chasseur)
- **Illustration :** Lottie — radar/sonar détectant des offres.
- **Titre :** « Un chasseur de postes automatique »
- **Corps :** « Configurez vos critères une fois. JobMate surveille les plateformes en continu et vous livre uniquement les offres pertinentes dans votre Inbox. »

#### Slide 3 — AI Coach
- **Illustration :** Lottie — cerveau/circuit imprimé qui analyse un document.
- **Titre :** « L'IA qui prépare vos candidatures »
- **Corps :** « Pour chaque offre approuvée, JobMate génère un score de matching, une lettre de motivation personnalisée et des suggestions d'optimisation de CV. »

#### Slide 4 — Kanban Suivi
- **Illustration :** Lottie — tableau kanban animé avec des cards qui bougent.
- **Titre :** « Suivez chaque candidature »
- **Corps :** « Un CRM personnel : gérez vos candidatures de "À postuler" jusqu'à "Embauché", avec notes, rappels et historique. »

#### Slide 5 — Call to Action
- **Illustration :** Illustration statique — ligne d'arrivée / podium.
- **Titre :** « Prêt à décrocher votre prochain poste ? »
- **Corps :** « Créez votre compte en 30 secondes. »
- **Boutons :**
  - **Primaire :** « Créer un compte » → écran Register
  - **Secondaire :** « J'ai déjà un compte » → écran Login

### 4.3 Interactions & Feedback Haptique

À chaque changement de slide (swipe ou tap dot), une légère **vibration haptique sélective** (`Haptics.selectionAsync()` via `expo-haptics`) est déclenchée pour confirmer la navigation.

---

## 5. Architecture de Navigation

```
RootNavigator (Expo Router)
├── (auth)/                  ← Groupe non authentifié
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
│
└── (app)/                   ← Groupe authentifié (tab navigator)
    ├── _layout.tsx           ← Bottom Tab Bar
    ├── feed/                 ← Onglet Inbox
    │   ├── index.tsx         ← Liste des offres
    │   └── [id].tsx          ← Détail d'une offre
    ├── kanban/               ← Onglet Suivi
    │   ├── index.tsx         ← Board Kanban
    │   └── [id].tsx          ← Détail application
    ├── profile/              ← Onglet Profil
    │   ├── index.tsx
    │   ├── edit.tsx
    │   └── search-config/
    │       ├── index.tsx     ← Liste des configs
    │       ├── new.tsx
    │       └── [id].tsx
    └── settings/             ← Onglet Paramètres
        └── index.tsx
```

### 5.1 Bottom Tab Bar

| Onglet | Icône | Badge |
|---|---|---|
| **Inbox** | `Inbox` (Lucide) | Nombre offres PENDING (si > 0) |
| **Suivi** | `LayoutKanban` | Nombre rappels du jour (si > 0) |
| **Profil** | `User` | Indicateur si profil incomplet |
| **Paramètres** | `Settings` | — |

La Tab Bar utilise `color.primary` pour l'onglet actif, `color.textSecondary` pour les inactifs. En thème sombre, fond `color.surface` avec une fine bordure supérieure `color.border`.

### 5.2 Gestion de l'authentification

À chaque montage de `(app)/_layout.tsx` :
1. Vérification du JWT en `SecureStore` (`expo-secure-store`).
2. Si absent ou expiré (décodage côté client du `exp`) → redirect vers `/(auth)/login`.
3. Si valide → montage du Tab Navigator et fetch du profil en background.

---

## 6. Écrans — Authentification

### 6.1 Écran Login

**Layout :**
- Logo JobMate centré en haut.
- Champ email (keyboard `email-address`, autocomplete `email`).
- Champ mot de passe (secureTextEntry, bouton œil pour révéler).
- Bouton primaire : « Se connecter ».
- Lien secondaire : « Pas encore de compte ? Créer le mien ».
- Lien tertiaire : « Mot de passe oublié ? » *(Phase 2 — affiche une modale "fonctionnalité à venir")*.

**Validation (locale avant envoi) :**
- Email : format valide (regex basique).
- Mot de passe : non vide.

**États :**
- Idle → Chargement (spinner dans le bouton, inputs désactivés) → Succès (redirect) → Erreur (message inline sous le formulaire, vibration d'erreur).

**Feedback haptique :**
- Succès : `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.
- Erreur : `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`.

---

### 6.2 Écran Register

**Layout :**
- Champ email.
- Champ mot de passe + indicateur de force (barre colorée : rouge < 8 chars, orange = 8+ chars basique, vert = 8+ chars avec mix).
- Bouton primaire : « Créer mon compte ».
- Lien : « Déjà un compte ? Se connecter ».

**Post-inscription :**
Redirect vers la première étape de setup profil (modal bottom sheet : « Complétez votre profil pour de meilleurs résultats »).

---

## 7. Écrans — Profil & CV

### 7.1 Écran Profil Principal

**Header :**
- Avatar circulaire (initiales si pas de photo) + statut professionnel badge (ex: `JUNIOR`, `SENIOR`).
- Nom complet.
- Bouton « ✏️ Modifier ».

**Section Complétion du profil :**
- Barre de progression (0–100%) calculée selon les champs remplis (nom, compétences, expérience, CV uploadé, etc.).
- Si < 80% : banière d'encouragement « Votre profil est incomplet — les résultats IA seront moins précis ».

**Sections scrollables :**
- Compétences (chips horizontaux scrollables).
- Expériences (timeline verticale).
- Formation.
- Projets.
- Certifications.
- CV uploadé (chip avec icône PDF + bouton « Remplacer »).

### 7.2 Écran Modification Profil

Formulaire scrollable avec sections collapsibles.

Champs editables :
- Nom complet (TextInput).
- Statut (Picker/BottomSheet de sélection : STUDENT / JUNIOR / MID / SENIOR / OPEN_TO_WORK).
- Compétences (tag input avec autocomplete basic + bouton ➕).
- Expériences (liste éditable — chaque item ouvre un mini-formulaire modal : poste, entreprise, dates, description).
- Formation (idem).
- Projets (idem).
- Certifications (idem).

**Sauvegarde :** Bouton « Sauvegarder » en haut à droite (header). Confirmation haptique au succès.

### 7.3 Upload & Parsing CV

**Upload :**
- Bouton « Importer mon CV (PDF) » → `expo-document-picker` (filtré `application/pdf`, taille max 10 Mo).
- Progress bar d'upload inline (streaming gRPC → profile-service).
- Après upload : chip PDF remplace le bouton, statut « En cours d'analyse IA... » avec spinner.

**Après parsing (EVENT_CV_PARSED via SSE/WebSocket) :**
- Push notification locale + popup in-app : « Votre profil a été enrichi ! X compétences, Y expériences détectées. »
- Vibration haptique : `Haptics.notificationAsync(Success)`.
- Le profil se recharge automatiquement.

### 7.4 Configurations de Recherche

#### Liste des configs

Cards avec :
- Job titles (chips).
- Localisation + remote policy badge.
- Statut actif/inactif (toggle switch inline).
- Bouton « ✏️ » et « 🗑️ ».

FAB (bouton flottant `+`) pour créer une nouvelle config.

#### Formulaire Création / Édition

Sections :
1. **Postes ciblés** — Tag input (ex: "Software Engineer", "DevOps").
2. **Localisations** — Tag input + API de géolocalisation optionnelle (voir §13.2).
3. **Télétravail** — Segmented control : `REMOTE` / `HYBRID` / `ON_SITE`.
4. **Mots-clés tech** — Tag input (ex: "React", "Go").
5. **Red flags** — Tag input avec chips rouge (ex: "ESN", "Stage"). Tooltip explicatif.
6. **Salaire** — Range slider double (min / max), affichage en k€.
7. **Modèle de lettre (optionnel)** — TextArea multi-lignes collapsible, placeholder « Collez ici votre lettre template... ».

---

## 8. Écrans — Configuration Recherche

*(Détaillé en §7.4)*

---

## 9. Écrans — Inbox (Job Feed)

### 9.1 Liste des offres (Inbox)

**Header :**
- Titre « Inbox » + badge nombre d'offres PENDING.
- Icône filtre (filtrer par statut PENDING / ALL / APPROVED / REJECTED).

**Liste :**
- FlatList performante avec `windowSize` optimisé.
- Chaque card affiche :
  - Titre du poste (bold).
  - Nom de l'entreprise + icône domaine.
  - Localisation + badge remote policy.
  - Date de découverte (relative : « il y a 2h »).
  - Badge statut coloré (PENDING = grey, APPROVED = green, REJECTED = red).

**Actions rapides (swipe to action) :**
- Swipe gauche → ❌ Rejeter (fond rouge).
- Swipe droite → ✅ Approuver (fond vert).
- Feedback haptique `Impact.Medium` sur chaque swipe confirmatoire.

**Skeleton loader :**
- 5 cards skeleton animées (shimmer) pendant le chargement initial.

**État vide :**
- Illustration + texte : « Votre Inbox est vide. Le chasseur scrape les offres en continu. Revenez dans quelques instants ! »
- Bouton : « Ajouter une offre manuellement ».

### 9.2 Détail d'une offre

**Layout :**
- Header : titre + entreprise + boutons Approuver / Rejeter.
- Score de matching si déjà analysé (ring circulaire animé + couleur succès/warning/danger).
- Description complète scrollable.
- « Pourquoi cette offre vous correspond » (pros — chips verts).
- « Points d'attention » (cons — chips oranges).
- Lettre de motivation générée (bloc collapsible + bouton copier).
- Suggestions CV (liste puces).
- URL source + bouton « Voir l'offre originale » (ouvre le navigateur in-app).

**Partage :** Bouton share natif (voir §15).

### 9.3 Ajout manuel d'offre

Modal bottom sheet avec champs :
- URL de l'offre *OU* formulaire libre (titre, entreprise, description, localisation).
- Bouton « Analyser ».

---

## 10. Écrans — Kanban (Suivi)

### 10.1 Board Kanban

**Layout :**
- ScrollView horizontal avec colonnes fixes :
  - `TO_APPLY` → `APPLIED` → `INTERVIEW` → `OFFER` → `REJECTED` → `HIRED`
- Chaque colonne : header nom + badge count + ScrollView vertical de cards.

**Card candidature :**
- Titre + entreprise.
- Score de matching (si disponible) — cercle coloré.
- Date du dernier mouvement.
- Icône rappel 🔔 si `relanceReminderAt` < 48h.

**Déplacement de card :**
- **Tap card** → Détail (écran §10.2).
- **Long press + drag** → Drag-and-drop natif avec animation (Reanimated + `react-native-gesture-handler`).
- Sur drop → feedback haptique `Impact.Heavy` + appel `moveCard` gRPC.

**FAB :** Bouton « + » pour créer une candidature manuelle.

### 10.2 Détail d'une candidature

**Sections :**
- Statut actuel + historique des transitions (timeline).
- Offre associée (lien vers détail si provient du feed).
- Analyse IA : score, pros, cons, lettre de motivation, suggestions CV.
- Notes personnelles (TextArea éditable inline).
- Rating personnel (étoiles 1-5, tap pour noter).
- Rappel relance : DateTimePicker natif pour définir une date + notification locale programmée.

**Actions header :**
- Bouton « Déplacer » → Bottom sheet de sélection du nouveau statut (liste avec couleurs).

---

## 11. Écrans — Paramètres

**Sections :**

### Compte
- Email affiché (non éditable).
- « Changer le mot de passe » *(Phase 2)*.
- « Supprimer mon compte » → confirmation double (alerte destructive + vibration warning).
- « Se déconnecter » → confirmation + clear SecureStore.

### Apparence
- Toggle Thème : Auto (système) / Clair / Sombre.

### Langue
- Sélecteur : Français / English.

### Notifications
- Toggle notifications push (activé/désactivé).
- Sous-options (si activées) :
  - Nouvelles offres découvertes ✓
  - Analyse IA complétée ✓
  - Rappels de relance ✓
  - CV parsé ✓

### Application
- Version de l'application.
- « Voir les nouveautés ».
- « Revoir le tutoriel » → relance l'onboarding.
- « Politique de confidentialité » → WebView.
- « Conditions d'utilisation » → WebView.

---

## 12. Système de Notifications

JobMate utilise un système de notifications à **deux niveaux** :

### 12.1 Notifications Push (distantes)

**Déclencheurs :**

| Événement | Payload Redis | Titre notif | Corps |
|---|---|---|---|
| Nouvelle offre détectée | `EVENT_JOB_DISCOVERED` | 💼 Nouvelle offre | « *{job_title}* chez *{company}* — dans votre Inbox ! » |
| Analyse IA complète | `EVENT_ANALYSIS_DONE` | 🤖 Analyse terminée | « Score de matching : *{score}*/100 pour *{job_title}* » |
| CV parsé | `EVENT_CV_PARSED` | 📄 Profil enrichi | « *{X}* compétences et *{Y}* expériences détectées dans votre CV. » |
| Card Kanban déplacée | `EVENT_CARD_MOVED` | 🗂️ Candidature mise à jour | « *{job_title}* est passée en *{new_status}* » |

**Implémentation :**
- Service utilisé : **Expo Push Notification Service** (EPNS) — gratuit, cross-platform.
- Token Expo enregistré sur le backend (nouveau champ `expo_push_token` dans `users` table, envoyé par la mobile app après permission).
- Le backend (gateway) — déclenché par les événements Redis — publie vers l'API EPNS.

**Permission :**
- Demandée une seule fois, après l'onboarding, sur un écran dédié : « Restez informé en temps réel » + explication claire + bouton « Activer » / « Plus tard ».
- Si refusé, une bannière rappel apparaît dans les paramètres uniquement (pas de re-demande systématique).

### 12.2 Notifications locales (in-app & programmées)

**In-app toast (foreground) :**
- Bannière en haut de l'écran (2s) pour les événements SSE reçus pendant que l'app est ouverte.
- Tap sur la bannière → navigation directe vers l'entité concernée.
- Implémentation recommandée : `react-native-toast-notifications` ou composant custom.

**Notifications programmées locales (rappels Relance) :**
- Quand l'utilisateur définit un `relanceReminderAt`, une notification locale est programmée via `expo-notifications` avec `scheduleNotificationAsync`.
- Format : « 🔔 Relance à prévoir — *{job_title}* chez *{company}* ».
- La notification est annulée si la candidature est déplacée en REJECTED ou HIRED.

### 12.3 Badge d'icône d'application

- Nombre total d'offres `PENDING` (inbox non traitées).
- Mis à jour à chaque EVENT_JOB_DISCOVERED ou action utilisateur.
- Reset à 0 si l'utilisateur ouvre l'Inbox.
- API : `expo-notifications` → `setBadgeCountAsync()`.

---

## 13. APIs Natives du Téléphone

### 13.1 Retour haptique (Vibration)

**Technologie :** `expo-haptics`

Mapping standardisé :

| Contexte | Type d'haptic |
|---|---|
| Tap bouton primaire | `ImpactFeedbackStyle.Light` |
| Swipe confirmatoire (approve/reject) | `ImpactFeedbackStyle.Medium` |
| Drop card kanban | `ImpactFeedbackStyle.Heavy` |
| Succès (login, save, upload) | `NotificationFeedbackType.Success` |
| Erreur (auth failed, réseau) | `NotificationFeedbackType.Error` |
| Avertissement (champ manquant) | `NotificationFeedbackType.Warning` |
| Navigation onboarding (slide) | `selectionAsync()` |

**Règle :** Le feedback haptique est **toujours conditionnel** au setting utilisateur (`Haptics.isAvailableAsync()` + préférence système "Vibrations").

---

### 13.2 Géolocalisation (Aide à la saisie)

**Technologie :** `expo-location`

**Usage :** Dans le formulaire de configuration de recherche, section « Localisations » :
- Bouton « 📍 Utiliser ma position actuelle ».
- Appel à `Location.getCurrentPositionAsync()` → reverse geocoding pour obtenir la ville.
- La ville est automatiquement ajoutée comme tag de localisation.
- La permission est demandée uniquement au tap du bouton (pas au démarrage).

**Permission :** `Location.requestForegroundPermissionsAsync()`. Si refusée, le bouton est désactivé avec le message « Permission de localisation non accordée ».

**Note :** La position n'est **jamais** envoyée au backend ni stockée. Elle sert uniquement à pré-remplir le champ en local.

---

### 13.3 Clipboard

**Usage :** Dans le détail d'une offre, bouton « 📋 Copier » sur la lettre de motivation générée.
- `Clipboard.setStringAsync(text)` via `expo-clipboard`.
- Feedback : toast « Copié dans le presse-papier ! » + haptic `Selection`.

---

## 14. Gestion des Erreurs & États Limites

### 14.1 Stratégie générale

Toute erreur est traitée à trois niveaux :
1. **Prévention (validation locale)** — avant l'appel réseau.
2. **Récupération gracieuse** — après un échec réseau/serveur.
3. **Feedback utilisateur clair** — jamais de message technique brut.

---

### 14.2 Perte de connexion (mode hors-ligne)

**Détection :** `NetInfo` via `@react-native-community/netinfo` — listener permanent.

**Comportement :**
- **Bannière persistante** (top de l'écran, couleur `color.warning`) : « ⚠️ Pas de connexion internet. Certaines fonctionnalités sont indisponibles. »
- Les boutons d'action (Approuver, Rejeter, Uploader, etc.) sont **désactivés** (opacity 0.4) avec tooltip : « Cette action nécessite une connexion. »
- Les données affichées restent **visible en cache** (les listes déjà chargées restent affichées).
- À la reconnexion : bannière disparaît avec animation slide-up + toast « ✅ Connexion rétablie » + refresh automatique silencieux.

**Cache :** `AsyncStorage` pour les données consultées récemment (profil, search configs, applications). Validité : 5 minutes (stale-while-revalidate).

---

### 14.3 Erreurs serveur

| Code erreur | Affichage |
|---|---|
| `UNAUTHENTICATED` (401) | Déconnexion forcée + redirect Login + toast « Session expirée. Reconnectez-vous. » |
| `BAD_USER_INPUT` (400) | Message inline sous le champ concerné (validation feedback). |
| `NOT_FOUND` (404) | Toast + retour écran précédent. |
| `INTERNAL_SERVER_ERROR` (500) | Toast générique : « Une erreur inattendue est survenue. Réessayez. » + bouton Réessayer. |
| Timeout (>10s) | Toast : « Le serveur met trop de temps à répondre. Vérifiez votre connexion. » |

---

### 14.4 Indicateurs de chargement

**Règle d'or : toujours montrer que quelque chose se passe, ne jamais bloquer sans feedback.**

| Contexte | Composant |
|---|---|
| Chargement initial d'une liste | Skeleton shimmer (5 items) |
| Action bouton (save, upload) | Spinner inline dans le bouton + label « En cours... » |
| Chargement d'un écran entier | Full-screen ActivityIndicator (centré, couleur primaire) |
| Pull-to-refresh | RefreshControl natif |
| Upload fichier | ProgressBar linéaire avec pourcentage |
| Analyse IA en cours | Skeleton dans la carte + badge « IA en cours » clignotant |

---

### 14.5 États vides

Chaque liste a son propre état vide (illustration + texte + action suggérée) :

| Écran | Illustration | Texte | CTA |
|---|---|---|---|
| Inbox (PENDING) | Loupe cherchant | « Le chasseur est à l'œuvre. Revenez bientôt ! » | « Ajouter une offre manuellement » |
| Kanban | Tableau vide | « Approuvez des offres pour commencer le suivi. » | « Voir l'Inbox » |
| Search Configs | Réglages | « Configurez votre premier chasseur. » | « Créer une configuration » |
| Profil (skills) | Engrenage | « Ajoutez vos compétences pour un meilleur matching. » | « Modifier le profil » |

---

### 14.6 Confirmation des actions destructives

Tout `delete` ou action irréversible déclenche :
1. Alert native (ActionSheet sur iOS, Dialog sur Android) avec message explicite.
2. Bouton de confirmation : texte en `color.danger`.
3. Vibration haptic `Warning` avant d'afficher l'alert.

---

## 15. Partage de Lien d'Offre (Deep Link / URL Scheme)

> 🔮 **Phase 3 — Futures fonctionnalités.** Cette fonctionnalité est spécifiée ici à titre de référence mais **n'est pas à implémenter avant la phase 3**. Elle sera traitée après la livraison complète de la Phase 2.

### 15.1 Partager une offre depuis l'app

Dans l'écran détail d'une offre (job feed), bouton **« Partager »** (icône Share2 Lucide) en haut à droite.

Contenu partagé :
```
[JobMate] 💼 {job_title} chez {company}

Ouvrir dans JobMate : jobmate://job/{jobFeedId}

Offre originale : {source_url}
```

Implémentation : `Share.share()` natif React Native → ouvre la feuille de partage système (SMS, email, WhatsApp, etc.).

---

### 15.2 Recevoir un lien partagé (Deep Link entrant)

L'utilisateur reçoit un lien (ex: WhatsApp) et tape dessus → l'app s'ouvre directement sur le bon écran.

**Schéma d'URL custom :**
```
jobmate://job/{jobFeedId}       → Détail d'une offre existante
jobmate://add-job?url={encoded} → Ajouter une offre depuis une URL externe
```

**Universal Links (iOS) / App Links (Android) :**
```
https://app.meelkyway.com/job/{jobFeedId}
https://app.meelkyway.com/add?url={encoded}
```
*(Fallback web : page de redirection vers les stores si l'app n'est pas installée.)*

**Implémentation :** `expo-linking` + Expo Router deep link handling.

**Flux `add-job?url=` :**
1. L'app s'ouvre (ou return au foreground).
2. Si non authentifié → redirect Login, URL mise en file d'attente.
3. Si authentifié → bottom sheet s'ouvre automatiquement avec l'URL pré-remplie.
4. Un appel gRPC `AddJobByUrl` est lancé.
5. Toast : « Offre ajoutée à votre Inbox ! » + navigation vers l'Inbox.
6. Haptic : `Success`.

**Cas d'usage principal :** L'utilisateur voit une offre intéressante sur LinkedIn sur son téléphone → appuie sur « Partager » → sélectionne JobMate → l'offre atterrit dans son Inbox et est analysée par l'IA.

---

### 15.3 Partager depuis le navigateur mobile (Share Target — Android)

Sur Android, JobMate peut s'enregistrer comme **cible de partage** (Share Target) pour recevoir des URLs directement depuis le navigateur Chrome via le menu « Partager ».

Configuration dans `app.json` :
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [{ "scheme": "https" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

*(iOS gère cela via les Universal Links et les App Extensions — Phase 2.)*

---

## 16. Accessibilité

### 16.1 Principes généraux

- **Ratio de contraste :** Minimum WCAG AA (4.5:1 pour le texte normal, 3:1 pour les éléments UI) dans les deux thèmes.
- **Taille de cible minimale :** 44×44 dp pour tous les éléments interactifs.
- **VoiceOver / TalkBack :** Tous les éléments interactifs ont un `accessibilityLabel` et `accessibilityRole` corrects.

### 16.2 Taille de police dynamique

L'application respecte les préférences de taille de police système (`accessibilityLargerText` sur iOS). Les composants utilisent `sp` (density-independent) plutôt que `px`.

### 16.3 Animations réduites

Si `AccessibilityInfo.isReduceMotionEnabled()` retourne `true` :
- Toutes les animations Lottie sont remplacées par des illustrations statiques.
- Les transitions de navigation passent à `duration: 0`.
- Le shimmer skeleton est remplacé par un fond statique `color.surfaceVariant`.

---

## Annexe — Écrans à implémenter par priorité

### Phase 1 — MVP (à livrer en premier)

| # | Écran | Complexité |
|---|---|---|
| 1 | Splash Screen | Faible |
| 2 | Onboarding (5 slides) | Moyenne |
| 3 | Login / Register | Faible |
| 4 | Profil (affichage) | Moyenne |
| 5 | Modifier Profil | Haute |
| 6 | Upload CV | Moyenne |
| 7 | Inbox (liste + swipe) | Haute |
| 8 | Détail offre | Haute |
| 9 | Kanban (board) | Haute |
| 10 | Paramètres (thème, langue, logout) | Faible |
| 11 | Notifications (permission + toasts) | Moyenne |

### Phase 2 — Post-MVP

| # | Écran / Feature | Complexité |
|---|---|---|
| 12 | Création Search Config complète | Haute |
| 13 | Détail candidature (kanban) | Haute |
| 14 | Drag & Drop Kanban | Très haute |
| 15 | Notifications push (EPNS) | Haute |
| 16 | Mode hors-ligne (cache AsyncStorage) | Haute |
| 17 | Géolocalisation (auto-fill) | Faible |
| 18 | Mot de passe oublié | Moyenne |

### Phase 3 — Futures fonctionnalités

| # | Écran / Feature | Complexité |
|---|---|---|
| 19 | Deep link entrant / sortant (URL scheme, Universal Links) | Moyenne |
| 20 | Share Target Android (partage depuis le navigateur) | Moyenne |
