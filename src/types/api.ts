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
  firstName: string;
  lastName: string;
  createdAt: string;
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  userId: string;
  title: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  cvUrl: string | null;
  skills: string[];
  languages: string[];
  experiences: Experience[];
  educations: Education[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
}

// ─── Search Config ─────────────────────────────────────────────────────────────

export interface SearchConfig {
  id: string;
  userId: string;
  name: string;
  jobTitle: string;
  location: string | null;
  remote: 'FULL' | 'PARTIAL' | 'NO' | null;
  salaryMin: number | null;
  salaryMax: number | null;
  contractTypes: ContractType[];
  coverLetterTemplate: string | null;
  isActive: boolean;
  createdAt: string;
}

export type ContractType = 'CDI' | 'CDD' | 'FREELANCE' | 'ALTERNANCE' | 'STAGE';

// ─── Job Offer ─────────────────────────────────────────────────────────────────

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string | null;
  contractType: ContractType | null;
  salary: string | null;
  description: string;
  url: string;
  score: number;
  pros: string[];
  cons: string[];
  coverLetter: string | null;
  cvSuggestions: string[];
  status: JobOfferStatus;
  searchConfigId: string;
  discoveredAt: string;
}

export type JobOfferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ─── Application (Kanban) ──────────────────────────────────────────────────────

export interface Application {
  id: string;
  userId: string;
  jobOfferId: string;
  jobOffer: JobOffer;
  status: KanbanStatus;
  notes: string | null;
  rating: number | null;
  reminderAt: string | null;
  analysis: string | null;
  history: StatusTransition[];
  createdAt: string;
  updatedAt: string;
}

export type KanbanStatus =
  | 'INTERESTED'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface StatusTransition {
  from: KanbanStatus;
  to: KanbanStatus;
  at: string;
}

// ─── SSE Events ────────────────────────────────────────────────────────────────

export type SSEEventType =
  | 'job_discovered'
  | 'job_scored'
  | 'cv_parsed'
  | 'ping';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}
