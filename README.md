# JobMate Mobile

JobMate Mobile is the pocket companion for the JobMate platform (React Native + Expo).  
It helps candidates stop manual job-board scrolling and run a full application pipeline: discover jobs, triage offers, launch AI analysis, and track every application in a Kanban CRM.

## Project Goal

The product goal is to improve job-search efficiency and quality at the same time:

- Discover relevant opportunities automatically from configured criteria.
- Reduce noise using red flags and approval/rejection triage.
- Generate AI support (match score, strengths/weaknesses, cover letter suggestions).
- Centralize follow-up in a single mobile workflow from "To apply" to "Hired".

## What Is Implemented Today

### 1) Authentication & Session

- Email/password register and login.
- Local form validation (email/password rules).
- Secure token storage via `expo-secure-store`.
- Session rehydration on app launch and guarded app routing.
- Logout flow from Settings.

### 2) Onboarding

- 5-slide onboarding with pager and animated dots.
- Haptic feedback on page changes.
- Persistent "completed" flag in AsyncStorage.
- Skip/CTA actions to Register or Login.

### 3) Profile & CV Pipeline

- Profile screen with completion progress and sections (skills, experience).
- Edit profile flow.
- CV upload (PDF, size/type validation).
- SSE-driven post-upload parsing feedback (`CV_PARSED`).
- Upload/analyzing UI states with timeout fallback.

### 4) Search Configuration (Discovery Setup)

- Create, list, edit, and delete search configurations.
- Criteria support: job titles, locations, remote policy, salary range, duration, keywords, red flags, cover letter template.
- Optimistic UI for CRUD operations.
- Auto trigger scan after creating a config (to reduce empty feed after setup).

### 5) Job Feed (Inbox)

- Feed list with status filters: `PENDING`, `APPROVED`, `REJECTED`.
- Pull-to-refresh and loading skeletons.
- Swipe actions (approve/reject) outside Expo Go.
- Offer details page with title/company/location/description/source link.
- "Approve" starts backend AI pipeline through application creation.
- SSE integration for new jobs and analysis updates.

### 6) Kanban (Application CRM)

- Horizontal Kanban board with pipeline states:
  - `TO_APPLY`
  - `APPLIED`
  - `INTERVIEW`
  - `OFFER`
  - `HIRED`
  - `REJECTED`
- Card movement and optimistic status updates.
- Application detail page with:
  - AI score visualization (when available)
  - Pros/cons display
  - Notes editing
  - Star rating
  - Reminder date selection
  - Status transition history
- Manual application entry flow via dedicated add-job screen.

### 7) Notifications & Real-time

- Push permission toggle in Settings.
- In-app local reminder scheduling for relance/follow-up.
- SSE client with reconnection strategy and network-aware pause/resume.
- Badge count updates for pending feed items.

### 8) Settings & Personalization

- Theme mode: system / light / dark.
- Language switching: French / English.
- Tutorial reset action.
- Account actions UI (logout, delete account flow placeholder).

### 9) UX Foundations

- Consistent design system (spacing, typography, color tokens).
- i18n support with centralized translation files.
- Haptic feedback for key actions.
- Empty/loading/error states across key screens.

## End-to-End User Flow (How It Works)

1. User creates an account and logs in.
2. User completes profile and uploads CV.
3. Backend parses CV and profile is enriched (SSE event updates UI).
4. User creates one or more search configurations.
5. Discovery service starts fetching offers.
6. New offers appear in Feed (`PENDING`).
7. User rejects irrelevant offers or approves relevant ones.
8. Approval creates an application and triggers AI analysis.
9. User tracks the application in Kanban, adds notes/rating/reminders, and moves status through the process.

## Mobile Architecture Overview

- Navigation: Expo Router (`app/(auth)` and `app/(app)` groups).
- State strategy: feature hooks + context providers.
- API communication:
  - GraphQL for queries/mutations
  - multipart GraphQL upload for CV
  - SSE for async backend events
- Storage:
  - `expo-secure-store` for auth token
  - AsyncStorage for preferences/flags

## Main Feature Hooks

- `useAuth`: authentication lifecycle.
- `useProfile`: profile fetch/update lifecycle.
- `useUploadCV`: picker/upload + `CV_PARSED` handling.
- `useSearchConfigs`: discovery config CRUD + scan trigger.
- `useJobFeed`: feed fetch/approve/reject + feed SSE updates.
- `useApplications`: kanban CRUD/move/note/rating/reminder + card SSE updates.
- `useSSE`: shared real-time event connection management.

## Project Structure

- `app/`: route-level screens (auth + app tabs).
- `src/components/`: reusable UI and feature components.
- `src/hooks/`: feature logic and side effects.
- `src/context/`: auth/theme context providers.
- `src/lib/`: API client, storage, validators, error mapping, SSE client.
- `src/i18n/`: localization files and setup.
- `__tests__/`: unit tests.

## Setup & Local Run

### Prerequisites

- Node.js 20+
- npm 10+
- Expo account (for EAS builds)

### Install

```bash
npm ci
```

### Run

```bash
npm run start
npm run android
npm run ios
npm run web
```

## Quality & Tests

### Available scripts

- `npm test`
- `npm run test:watch`
- `npm run test:coverage`

### Type-check

```bash
npx tsc --noEmit
```

### Lint (same strategy as CI)

```bash
npx --yes eslint@8 . --ext .ts,.tsx --quiet --rule "import/namespace: off" --rule "import/no-duplicates: off" --rule "import/order: off"
```

## CI/CD (GitHub Actions)

Workflows are in `jobmate-mobile/.github/workflows`.

### `mobile-ci.yml`

Triggers:

- push on `master`, `develop`
- pull request to `master`, `develop`

Pipeline:

1. install dependencies
2. TypeScript check
3. lint
4. unit tests + coverage upload

### `mobile-eas-build.yml`

Triggers:

- manual dispatch (platform/profile)
- tags `mobile-v*`

Build profiles are defined in `eas.json`:

- `preview` (internal distribution)
- `production`

Required GitHub secret:

- `EXPO_TOKEN`

## Current Known Gaps / Planned Enhancements

- Some account actions in Settings are UI-complete but still call placeholder backend logic (delete account final action).
- Lint strategy currently pins ESLint 8 in CI for compatibility with existing config.
- Product docs describe target scope beyond current implementation; this README reflects what is already shipped in this mobile repo.

## Related Project Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Architecture Technique](./docs/ARCHITECTURE_TECHNIQUE.md)
- [Database](./docs/DATABASE.md)
- [Infrastructure CI/CD](./docs/INFRASTRUCTURE_CI_CD.md)
- [Mobile UI/UX](./docs/MOBILE_UI_UX.md)
- [Docs README](./docs/README.md)
- [User Flow Example](./docs/USER_FLOW_EXAMPLE.md)
