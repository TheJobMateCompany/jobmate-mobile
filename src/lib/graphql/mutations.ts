/**
 * Mutations GraphQL — JobMate Mobile
 * Référence : docs/API_DOCUMENTATION.md
 * Source de vérité : jobmate-backend/gateway/src/schema/typeDefs.js
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        createdAt
      }
    }
  }
`;

export const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user {
        id
        email
        createdAt
      }
    }
  }
`;

// ─── Profile ───────────────────────────────────────────────────────────────────

export const UPDATE_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
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

export const UPLOAD_CV_MUTATION = /* GraphQL */ `
  mutation UploadCV($file: Upload!) {
    uploadCV(file: $file) {
      cvUrl
      message
    }
  }
`;

// ─── Search Config ─────────────────────────────────────────────────────────────

export const CREATE_SEARCH_CONFIG_MUTATION = /* GraphQL */ `
  mutation CreateSearchConfig($input: CreateSearchConfigInput!) {
    createSearchConfig(input: $input) {
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

export const UPDATE_SEARCH_CONFIG_MUTATION = /* GraphQL */ `
  mutation UpdateSearchConfig($id: ID!, $input: UpdateSearchConfigInput!) {
    updateSearchConfig(id: $id, input: $input) {
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
      updatedAt
    }
  }
`;

export const DELETE_SEARCH_CONFIG_MUTATION = /* GraphQL */ `
  mutation DeleteSearchConfig($id: ID!) {
    deleteSearchConfig(id: $id)
  }
`;

// ─── Job Feed ──────────────────────────────────────────────────────────────────

export const APPROVE_JOB_MUTATION = /* GraphQL */ `
  mutation ApproveJob($jobFeedId: ID!) {
    approveJob(jobFeedId: $jobFeedId) {
      id
      currentStatus
    }
  }
`;

export const REJECT_JOB_MUTATION = /* GraphQL */ `
  mutation RejectJob($jobFeedId: ID!) {
    rejectJob(jobFeedId: $jobFeedId) {
      id
      status
    }
  }
`;

// ── Discovery (ajout manuel) ───────────────────────────────────────────────────

export const ADD_JOB_BY_URL_MUTATION = /* GraphQL */ `
  mutation AddJobByUrl($url: String!, $searchConfigId: ID) {
    addJobByUrl(url: $url, searchConfigId: $searchConfigId) {
      jobFeedId
      message
    }
  }
`;

export const ADD_JOB_MANUALLY_MUTATION = /* GraphQL */ `
  mutation AddJobManually($input: ManualJobInput!) {
    addJobManually(input: $input) {
      jobFeedId
      message
    }
  }
`;

// ─── Application (Kanban) ──────────────────────────────────────────────────────

export const MOVE_CARD_MUTATION = /* GraphQL */ `
  mutation MoveCard($applicationId: ID!, $newStatus: ApplicationStatus!) {
    moveCard(applicationId: $applicationId, newStatus: $newStatus) {
      id
      currentStatus
      historyLog
    }
  }
`;

export const ADD_NOTE_MUTATION = /* GraphQL */ `
  mutation AddNote($applicationId: ID!, $note: String!) {
    addNote(applicationId: $applicationId, note: $note) {
      id
      userNotes
    }
  }
`;

export const RATE_APPLICATION_MUTATION = /* GraphQL */ `
  mutation RateApplication($applicationId: ID!, $rating: Int!) {
    rateApplication(applicationId: $applicationId, rating: $rating) {
      id
      userRating
    }
  }
`;

export const SET_RELANCE_REMINDER_MUTATION = /* GraphQL */ `
  mutation SetRelanceReminder($applicationId: ID!, $remindAt: String!) {
    setRelanceReminder(applicationId: $applicationId, remindAt: $remindAt) {
      id
      relanceReminderAt
    }
  }
`;

export const CREATE_APPLICATION_MUTATION = /* GraphQL */ `
  mutation CreateApplication($jobFeedId: ID) {
    createApplication(jobFeedId: $jobFeedId) {
      id
      currentStatus
      jobFeedId
      userNotes
      userRating
      relanceReminderAt
      historyLog
      aiAnalysis
      generatedCoverLetter
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_APPLICATION_MUTATION = /* GraphQL */ `
  mutation DeleteApplication($applicationId: ID!) {
    deleteApplication(applicationId: $applicationId)
  }
`;
