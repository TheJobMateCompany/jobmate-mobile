/**
 * Types de navigation — Expo Router v3 (typed routes)
 * À compléter au fil des phases
 */

export type RootStackParamList = {
  '(auth)': undefined;
  '(app)': undefined;
};

export type AuthStackParamList = {
  onboarding: undefined;
  login: undefined;
  register: undefined;
};

export type AppTabParamList = {
  feed: undefined;
  kanban: undefined;
  profile: undefined;
  settings: undefined;
};

export type FeedStackParamList = {
  index: undefined;
  '[id]': { id: string };
};

export type KanbanStackParamList = {
  index: undefined;
  '[id]': { id: string };
};

export type ProfileStackParamList = {
  index: undefined;
  edit: undefined;
  'search-config/index': undefined;
  'search-config/new': undefined;
  'search-config/[id]': { id: string };
};
