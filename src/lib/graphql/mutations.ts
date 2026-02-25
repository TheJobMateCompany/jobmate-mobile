/**
 * Mutations GraphQL — à compléter au fil des phases
 * Référence : docs/API_DOCUMENTATION.md
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
        createdAt
      }
    }
  }
`;

export const REGISTER_MUTATION = /* GraphQL */ `
  mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    register(email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
      token
      user {
        id
        email
        firstName
        lastName
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
      title
      bio
      location
      phone
      skills
      languages
    }
  }
`;

export const UPLOAD_CV_MUTATION = /* GraphQL */ `
  mutation UploadCV($file: Upload!) {
    uploadCV(file: $file) {
      cvUrl
    }
  }
`;

// ─── Search Config ─────────────────────────────────────────────────────────────

export const CREATE_SEARCH_CONFIG_MUTATION = /* GraphQL */ `
  mutation CreateSearchConfig($input: SearchConfigInput!) {
    createSearchConfig(input: $input) {
      id
      name
      jobTitle
      location
      remote
      salaryMin
      salaryMax
      contractTypes
      coverLetterTemplate
      isActive
      createdAt
    }
  }
`;

export const UPDATE_SEARCH_CONFIG_MUTATION = /* GraphQL */ `
  mutation UpdateSearchConfig($id: ID!, $input: SearchConfigInput!) {
    updateSearchConfig(id: $id, input: $input) {
      id
      name
      jobTitle
      location
      remote
      salaryMin
      salaryMax
      contractTypes
      coverLetterTemplate
      isActive
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
  mutation ApproveJob($id: ID!) {
    approveJob(id: $id) {
      id
      status
    }
  }
`;

export const REJECT_JOB_MUTATION = /* GraphQL */ `
  mutation RejectJob($id: ID!) {
    rejectJob(id: $id) {
      id
      status
    }
  }
`;

// ─── Application (Kanban) ──────────────────────────────────────────────────────

export const MOVE_APPLICATION_MUTATION = /* GraphQL */ `
  mutation MoveApplication($id: ID!, $status: KanbanStatus!) {
    moveApplication(id: $id, status: $status) {
      id
      status
      history {
        from
        to
        at
      }
    }
  }
`;

export const UPDATE_APPLICATION_NOTES_MUTATION = /* GraphQL */ `
  mutation UpdateApplicationNotes($id: ID!, $notes: String, $rating: Int, $reminderAt: String) {
    updateApplicationNotes(id: $id, notes: $notes, rating: $rating, reminderAt: $reminderAt) {
      id
      notes
      rating
      reminderAt
    }
  }
`;
