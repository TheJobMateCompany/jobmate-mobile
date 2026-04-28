# JobMate Mobile

Application mobile React Native / Expo pour JobMate (iOS + Android).

## Documentation projet

Pour la vue complète du produit et de l'architecture globale, consulter:

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Architecture Technique](./docs/ARCHITECTURE_TECHNIQUE.md)
- [Database](./docs/DATABASE.md)
- [Infrastructure CI/CD](./docs/INFRASTRUCTURE_CI_CD.md)
- [Mobile UI/UX](./docs/MOBILE_UI_UX.md)
- [Docs README](./docs/README.md)
- [User Flow Example](./docs/USER_FLOW_EXAMPLE.md)

## Prérequis

- Node.js 20+
- npm 10+
- Expo CLI (optionnel en global, sinon via `npx`)
- Compte Expo (nécessaire pour les builds EAS)

## Installation

```bash
npm ci
```

## Lancer l'app en local

```bash
npm run start
```

Raccourcis utiles:

```bash
npm run android
npm run ios
npm run web
```

## Scripts disponibles

- `npm run start` : démarre Expo
- `npm run android` : ouvre sur Android
- `npm run ios` : ouvre sur iOS
- `npm run web` : lance la version web
- `npm test` : lance les tests Jest (non watch)
- `npm run test:watch` : tests en mode watch
- `npm run test:coverage` : tests avec couverture

## Tests unitaires

Exécution rapide:

```bash
npm test
```

Exécution ciblée:

```bash
npx jest __tests__/validators.test.ts __tests__/storage.test.ts --runInBand
```

Exemples de modules testés:

- validation (`src/lib/validators.ts`)
- wrappers de stockage (`src/lib/storage.ts`)
- hooks (`useAuth`, `useTheme`, `useNetworkStatus`)

## CI GitHub Actions

Les workflows de ce repo sont dans `jobmate-mobile/.github/workflows`.

### 1) Qualité mobile

Fichier: `.github/workflows/mobile-ci.yml`

Déclencheurs:

- `push` sur `master`, `develop`
- `pull_request` vers `master`, `develop`

Étapes:

1. install (`npm ci`)
2. type-check (`npx tsc --noEmit`)
3. lint (`npx eslint . --ext .ts,.tsx --max-warnings=0`)
4. tests + couverture (`npm test -- --coverage --coverageReporters=lcov`)

### 2) Build EAS

Fichier: `.github/workflows/mobile-eas-build.yml`

Déclencheurs:

- manuel (`workflow_dispatch`) avec choix `platform` et `profile`
- push de tags `mobile-v*`

Ce workflow démarre un build EAS non interactif (`--no-wait`).

## Connecting to local backend

- If you're running the backend locally via Docker Compose (Gateway exposed on `localhost:4000`), the mobile app must point to the host IP for network requests.
- Android Emulator (default): use `http://10.0.2.2:4000` as the host URL.
- iOS Simulator: use `http://localhost:4000`.
- Physical device: find your machine IP (e.g., `192.168.1.100`) and use `http://<HOST_IP>:4000`.

When using SSE, the endpoint is `GET /events?token=<jwt>`; ensure the device/emulator can reach the host and that any local firewall allows incoming connections on port `4000`.

## Configuration EAS

Le fichier `eas.json` définit 2 profils:

- `preview` : distribution interne, Android en APK
- `production` : Android en AAB (iOS selon config EAS)

## Secret GitHub requis

Pour le workflow EAS, configurer dans les secrets du repo:

- `EXPO_TOKEN` : token Expo utilisé par `expo/expo-github-action`

## Commandes utiles CI/local

Type-check local:

```bash
npx tsc --noEmit
```

Lint local:

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0
```

## Structure (résumé)

- `app/` : routes Expo Router
- `src/components/` : composants UI/features
- `src/hooks/` : hooks métier
- `src/context/` : providers globaux
- `src/lib/` : utilitaires (graphql, storage, validators, errors)
- `__tests__/` : tests unitaires
