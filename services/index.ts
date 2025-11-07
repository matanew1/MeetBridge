import {
  FirebaseUserProfileService,
  FirebaseDiscoveryService,
  FirebaseMatchingService,
  FirebaseChatService,
  FirebaseAuthService,
} from './firebase/firebaseServices';
import { IServiceContainer } from './interfaces';
import presenceService from './presenceService';

// [SECURITY FIX] Import secure storage service instead of direct AsyncStorage
import { secureStorageService } from './secureStorageService';

// Export service container with Firebase implementations
export const services: IServiceContainer = {
  userProfile: new FirebaseUserProfileService(),
  discovery: new FirebaseDiscoveryService(),
  matching: new FirebaseMatchingService(),
  chat: new FirebaseChatService(),
  auth: new FirebaseAuthService(),
  // [SECURITY FIX] Use secure storage service that auto-routes sensitive data to SecureStore
  storage: secureStorageService,
};

// Export individual services for direct access
export {
  FirebaseUserProfileService,
  FirebaseDiscoveryService,
  FirebaseMatchingService,
  FirebaseChatService,
  FirebaseAuthService,
};

// Export singleton instances for direct use
export const discoveryService = services.discovery;
export const matchingService = services.matching;
export const chatService = services.chat;
export const authService = services.auth;
export const userProfileService = services.userProfile;

// Export presence service
export { presenceService };

// Export icebreaker service
export { default as icebreakerService } from './icebreakerService';

// Export rate limiting service
export { default as rateLimitService } from './rateLimitService';

// Export block/report service
export { default as blockReportService } from './blockReportService';

// Export image compression service
export { default as imageCompressionService } from './imageCompressionService';

// Export storage service
export { default as storageService } from './storageService';

// Export location services (new smart location system)
export {
  smartLocationManager,
  geohashService,
  privacyService,
  firestoreGeoHelper,
  GEOHASH_PRECISION_LEVELS,
} from './location';

// Export location types
export type {
  LocationCoordinates,
  LocationUpdate,
  LocationServiceConfig,
  ProximitySearchOptions,
  ProximityResult,
  GeohashBounds,
  AdjacentGeohashes,
} from './location';

// Export Firebase config
export { db, auth, storage, realtimeDb } from './firebase/config';
