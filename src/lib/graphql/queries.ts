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
      firstName
      lastName
      createdAt
    }
  }
`;

// ─── Profile ───────────────────────────────────────────────────────────────────

export const GET_PROFILE_QUERY = /* GraphQL */ `
  query GetProfile {
    profile {
      id
      userId
      title
      bio
      location
      phone
      cvUrl
      skills
      languages
      experiences {
        id
        company
        position
        startDate
        endDate
        description
      }
      educations {
        id
        school
        degree
        field
        startDate
        endDate
      }
    }
  }
`;

// ─── Search Configs ────────────────────────────────────────────────────────────

export const GET_SEARCH_CONFIGS_QUERY = /* GraphQL */ `
  query GetSearchConfigs {
    searchConfigs {
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

// ─── Job Feed ──────────────────────────────────────────────────────────────────

export const GET_JOB_FEED_QUERY = /* GraphQL */ `
  query GetJobFeed($limit: Int, $offset: Int) {
    jobFeed(limit: $limit, offset: $offset) {
      id
      title
      company
      location
      contractType
      salary
      score
      status
      discoveredAt
    }
  }
`;

export const GET_JOB_OFFER_QUERY = /* GraphQL */ `
  query GetJobOffer($id: ID!) {
    jobOffer(id: $id) {
      id
      title
      company
      location
      contractType
      salary
      description
      url
      score
      pros
      cons
      coverLetter
      cvSuggestions
      status
      searchConfigId
      discoveredAt
    }
  }
`;

// ─── Applications (Kanban) ─────────────────────────────────────────────────────

export const GET_APPLICATIONS_QUERY = /* GraphQL */ `
  query GetApplications {
    applications {
      id
      status
      notes
      rating
      reminderAt
      analysis
      createdAt
      updatedAt
      jobOffer {
        id
        title
        company
        location
        score
      }
      history {
        from
        to
        at
      }
    }
  }
`;

export const GET_APPLICATION_QUERY = /* GraphQL */ `
  query GetApplication($id: ID!) {
    application(id: $id) {
      id
      status
      notes
      rating
      reminderAt
      analysis
      createdAt
      updatedAt
      jobOffer {
        id
        title
        company
        location
        contractType
        description
        url
        score
        pros
        cons
        coverLetter
        cvSuggestions
      }
      history {
        from
        to
        at
      }
    }
  }
`;
