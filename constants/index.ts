// App Configuration Constants
export const APP_CONFIG = {
  // Dating app specific settings
  MAX_PROFILE_DISTANCE: 5000, // meters (5 km default)
  MIN_USER_AGE: 18,
  MAX_USER_AGE: 80,
  DEFAULT_AGE_RANGE: [20, 35] as [number, number],
  MAX_INTERESTS_COUNT: 10,
  MIN_BIO_LENGTH: 10,
  MAX_BIO_LENGTH: 500,

  // UI/UX Constants
  ANIMATION_DURATION: 2000,
  SEARCH_ANIMATION_DELAY: 100,
  PROFILE_CARD_ASPECT_RATIO: 1,
  MAX_PROFILE_IMAGE_SIZE: 300, // width in pixels

  // API Constants (for future backend integration)
  API_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  PAGINATION_LIMIT: 20,

  // Storage Keys
  STORAGE_KEYS: {
    USER_PROFILE: 'user_profile',
    LIKED_PROFILES: 'liked_profiles',
    SEARCH_FILTERS: 'search_filters',
    CONVERSATIONS: 'conversations',
  },

  // Feature Flags
  FEATURES: {
    ENABLE_CHAT: true,
    ENABLE_VIDEO_CALL: false,
    ENABLE_LOCATION_SERVICES: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
  },
} as const;

// Dating App Specific Constants
export const DATING_CONSTANTS = {
  GENDERS: ['male', 'female', 'other'] as const,
  RELATIONSHIP_PREFERENCES: ['male', 'female', 'both'] as const,
  MATCH_SCORE_THRESHOLD: 0.7,
  SUPER_LIKE_LIMIT: 5, // per day
  LIKE_LIMIT: 100, // per day
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection problem',
  PROFILE_NOT_FOUND: 'Profile not found',
  UNAUTHORIZED: 'Unauthorized action',
  VALIDATION_ERROR: 'Invalid data',
  GENERIC_ERROR: 'An error occurred, please try again',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  MATCH_CREATED: 'New match found!',
  MESSAGE_SENT: 'Message sent',
  PROFILE_LIKED: 'Profile added to favorites',
  UNMATCH_SUCCESS: 'Match removed',
} as const;

// UI Text Constants
export const UI_TEXT = {
  LOADING: 'Loading...',
  SEARCH_PLACEHOLDER: 'Search...',
  NO_RESULTS: 'No results found',
  TRY_AGAIN: 'Try again',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  SAVE: 'Save',
  DELETE: 'Delete',
} as const;

export type Gender = (typeof DATING_CONSTANTS.GENDERS)[number];
export type RelationshipPreference =
  (typeof DATING_CONSTANTS.RELATIONSHIP_PREFERENCES)[number];
