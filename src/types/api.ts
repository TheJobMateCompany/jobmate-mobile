/**
 * Types GraphQL — JobMate API
 * À compléter au fil des phases en suivant docs/API_DOCUMENTATION.md
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  user: User;
}

// ─── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string;
  profile: Profile | null;
}

// ─── Profile ───────────────────────────────────────────────────────────────────

/**
 * Les champs JSON (skills, experience, projects, education, certifications)
 * sont des tableaux d'objets arbitraires côté backend (JSON PostgreSQL).
 * On les type en `unknown[]` pour protéger TypeScript sans casser la flexibilité.
 */
export type ProfileStatus = 'STUDENT' | 'JUNIOR' | 'MID' | 'SENIOR' | 'OPEN_TO_WORK';

export interface Profile {
  id: string;
  fullName: string | null;
  status: ProfileStatus | null;
  skills: unknown[] | null;
  experience: unknown[] | null;
  projects: unknown[] | null;
  education: unknown[] | null;
  certifications: unknown[] | null;
  cvUrl: string | null;
}

export interface UpdateProfileInput {
  fullName?: string;
  status?: ProfileStatus;
  skills?: unknown[];
  experience?: unknown[];
  projects?: unknown[];
  education?: unknown[];
  certifications?: unknown[];
}

// ─── Search Config ─────────────────────────────────────────────────────────────

/**
 * RemotePolicy — enum GraphQL backend (remote_policy PostgreSQL)
 * REMOTE = full remote, HYBRID = partial, ON_SITE = in-office only
 */
export type RemotePolicy = 'REMOTE' | 'HYBRID' | 'ON_SITE';

/** Correspond exactement au type SearchConfig du schéma GraphQL backend */
export interface SearchConfig {
  id: string;
  jobTitles: string[];
  locations: string[];
  remotePolicy: RemotePolicy;
  keywords: string[];
  redFlags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  /** Date de début souhaitée pour le poste (format ISO date string, ex: "2026-06-01") */
  startDate: string | null;
  /** Type de contrat ou durée (ex: "CDI", "Stage 6 mois") */
  duration: string | null;
  coverLetterTemplate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSearchConfigInput {
  jobTitles: string[];
  locations: string[];
  remotePolicy?: RemotePolicy;
  keywords?: string[];
  redFlags?: string[];
  salaryMin?: number;
  salaryMax?: number;
  startDate?: string;
  duration?: string;
  coverLetterTemplate?: string;
}

export interface UpdateSearchConfigInput {
  jobTitles?: string[];
  locations?: string[];
  remotePolicy?: RemotePolicy;
  keywords?: string[];
  redFlags?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  startDate?: string | null;
  duration?: string | null;
  coverLetterTemplate?: string | null;
}

// ─── Job Feed ─────────────────────────────────────────────────────────────────

/** Statut d'une offre dans la file d'attente (job_status PostgreSQL) */
export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Réponse réelle de la query `jobFeed` — rawData est un JSON brut venant du scraper.
 * Contient généralement : title, company, location, description, salary, etc.
 */
export interface JobFeedItem {
  id: string;
  rawData: Record<string, unknown>;
  sourceUrl: string | null;
  status: JobStatus;
  createdAt: string;
}

/**
 * Réponse de addJobByUrl / addJobManually.
 * jobFeedId sert ensuite à appeler approveJob.
 */
export interface ManualJobResult {
  jobFeedId: string;
  message: string;
}

/**
 * Input pour addJobManually — correspond à ManualJobInput dans le schéma GraphQL.
 * companyName est le seul champ obligatoire.
 */
export interface ManualJobInput {
  searchConfigId?: string | null;
  companyName: string;
  companyDescription?: string | null;
  location?: string | null;
  profileWanted?: string | null;
  startDate?: string | null;
  duration?: string | null;
  whyUs?: string | null;
}

/**
 * Représentation enrichie d'une offre (parsée depuis rawData + données analysées
 * via l'IA dans applications.ai_analysis). Utilisé en affichage côté mobile.
 */
export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string;
  url: string | null;
  status: JobStatus;
  createdAt: string;
}

// ─── Application (Kanban) ──────────────────────────────────────────────────────

/**
 * Statuts Kanban — enum application_status PostgreSQL.
 * Machine à états : TO_APPLY → APPLIED → INTERVIEW → OFFER → HIRED
 *                                   ↓           ↓           ↓        ↓
 *                                REJECTED    REJECTED   REJECTED  REJECTED
 */
export type ApplicationStatus =
  | 'TO_APPLY'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'HIRED';

export interface StatusTransition {
  from: ApplicationStatus;
  to: ApplicationStatus;
  at: string;
}

/**
 * Candidature active post-approbation — données CRM Kanban.
 * Correspond au type ApplicationStatus & champs de la table `applications`.
 */
export interface Application {
  id: string;
  userId: string;
  /** Référence à job_feed.id — null pour les candidatures manuelles */
  jobFeedId: string | null;
  currentStatus: ApplicationStatus;
  /** JSON : { score, pros, cons, suggested_cv_content } — rempli par l'AI Coach */
  aiAnalysis: {
    score?: number;
    pros?: string[];
    cons?: string[];
    suggested_cv_content?: string;
  } | null;
  generatedCoverLetter: string | null;
  userNotes: string | null;
  userRating: number | null;
  /** Alias GraphQL de applications.relance_reminder_at */
  relanceReminderAt: string | null;
  historyLog: StatusTransition[];
  createdAt: string;
  updatedAt: string;
}

// ─── SSE Events ────────────────────────────────────────────────────────────────

/**
 * Types d'événements SSE émis par la Gateway (champ `type` du payload JSON).
 * Ces valeurs correspondent aux messages Redis transformés dans gateway/src/index.js.
 *
 * Redis channel → SSE type
 * EVENT_JOB_DISCOVERED → 'JOB_DISCOVERED'
 * EVENT_CV_PARSED      → 'CV_PARSED'
 * EVENT_ANALYSIS_DONE  → 'ANALYSIS_DONE'
 * EVENT_CARD_MOVED     → 'CARD_MOVED'
 */
export type SSEEventType = 'JOB_DISCOVERED' | 'CV_PARSED' | 'ANALYSIS_DONE' | 'CARD_MOVED';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}
