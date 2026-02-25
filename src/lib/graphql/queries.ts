/**
 * Queries GraphQL — à compléter au fil des phases
 * Référence : docs/API_DOCUMENTATION.md
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const ME_QUERY = /* GraphQL */ `
  query Me {
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
`;

// ─── Profile ───────────────────────────────────────────────────────────────────

/**
 * Retourne le profil via gRPC → profile-service (champ `myProfile`).
 * Alternative à me { profile } — résultat identique, source gRPC directe.
 */
export const MY_PROFILE_QUERY = /* GraphQL */ `
  query MyProfile {
    myProfile {
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
`;

// ─── Search Configs ────────────────────────────────────────────────────────────

/** Liste les configs de recherche actives de l'utilisateur courant */
export const MY_SEARCH_CONFIGS_QUERY = /* GraphQL */ `
  query MySearchConfigs {
    mySearchConfigs {
      id
      jobTitles
      locations
      remotePolicy
      keywords
      redFlags
      salaryMin
      salaryMax
      startDate
      duration
      coverLetterTemplate
      isActive
      createdAt
      updatedAt
    }
  }
`;

// ─── Job Feed ──────────────────────────────────────────────────────────────────

/**
 * Liste les offres scrapées pour l'utilisateur.
 * rawData contient le payload JSON brut du scraper (title, company, location, etc.)
 * Utilisé par useJobFeed (Phase 4.1).
 */
export const JOB_FEED_QUERY = /* GraphQL */ `
  query JobFeed($status: JobStatus) {
    jobFeed(status: $status) {
      id
      rawData
      sourceUrl
      status
      createdAt
    }
  }
`;

// ─── Applications (Kanban) ─────────────────────────────────────────────────────

/**
 * Liste les candidatures Kanban de l'utilisateur.
 * Utilisé par useApplications (Phase 5.1).
 * relanceReminderAt = alias GraphQL de la colonne applications.relance_reminder_at
 */
export const MY_APPLICATIONS_QUERY = /* GraphQL */ `
  query MyApplications($status: ApplicationStatus) {
    myApplications(status: $status) {
      id
      currentStatus
      aiAnalysis
      generatedCoverLetter
      userNotes
      userRating
      relanceReminderAt
      jobFeedId
      historyLog
      createdAt
      updatedAt
    }
  }
`;
