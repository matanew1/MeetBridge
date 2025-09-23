// App Configuration Constants
export const APP_CONFIG = {
  // Dating app specific settings
  MAX_PROFILE_DISTANCE: 100, // km
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
  NETWORK_ERROR: 'בעיה בחיבור לאינטרנט',
  PROFILE_NOT_FOUND: 'פרופיל לא נמצא',
  UNAUTHORIZED: 'אין הרשאה לפעולה זו',
  VALIDATION_ERROR: 'נתונים לא תקינים',
  GENERIC_ERROR: 'אירעה שגיאה, נסה שוב',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'הפרופיל עודכן בהצלחה',
  MATCH_CREATED: 'יש התאמה חדשה!',
  MESSAGE_SENT: 'ההודעה נשלחה',
  PROFILE_LIKED: 'הפרופיל נוסף למועדפים',
  UNMATCH_SUCCESS: 'ההתאמה בוטלה',
} as const;

// UI Text Constants
export const UI_TEXT = {
  LOADING: 'טוען...',
  SEARCH_PLACEHOLDER: 'חפש...',
  NO_RESULTS: 'לא נמצאו תוצאות',
  TRY_AGAIN: 'נסה שוב',
  CANCEL: 'ביטול',
  CONFIRM: 'אישור',
  SAVE: 'שמור',
  DELETE: 'מחק',
} as const;

export type Gender = (typeof DATING_CONSTANTS.GENDERS)[number];
export type RelationshipPreference =
  (typeof DATING_CONSTANTS.RELATIONSHIP_PREFERENCES)[number];
