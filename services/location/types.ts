/**
 * Advanced Location Service Types
 * Production-ready types for geohash-based location system
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GeoData {
  geohash: string;
  coordinates: LocationCoordinates;
  precision: number;
}

export interface GeohashWithDistance {
  geohash: string;
  distance: number;
  coordinates?: LocationCoordinates;
}

export interface AdjacentGeohashes {
  center: string;
  north: string;
  south: string;
  east: string;
  west: string;
  northeast: string;
  northwest: string;
  southeast: string;
  southwest: string;
}

export interface LocationCache {
  location: LocationCoordinates;
  geohash: string;
  timestamp: number;
  expiresAt: number;
}

export interface MovementData {
  distance: number;
  speed: number; // m/s
  direction: number; // degrees
  isSignificant: boolean;
}

export interface LocationUpdate {
  current: LocationCoordinates;
  previous: LocationCoordinates | null;
  movement: MovementData | null;
  geohash: string;
  timestamp: number;
}

export interface ProximitySearchOptions {
  center: LocationCoordinates;
  radiusInMeters: number;
  precision?: number;
  includeAdjacent?: boolean;
  limit?: number;
  sortByDistance?: boolean;
}

export interface ProximityResult<T> {
  items: T[];
  bounds: GeohashBounds[];
  searchRadius: number;
  totalFound: number;
}

export interface GeohashBounds {
  lower: string;
  upper: string;
  center: string;
}

export interface LocationAccuracy {
  level: 'high' | 'medium' | 'low' | 'unknown';
  meters: number;
  message: string;
}

export interface LocationServiceConfig {
  // Cache settings
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds

  // Accuracy thresholds
  minAccuracy: number; // meters
  idealAccuracy: number; // meters

  // Movement detection
  movementThreshold: number; // meters
  significantMovementThreshold: number; // meters

  // Update intervals
  updateInterval: number; // milliseconds
  backgroundUpdateInterval: number; // milliseconds

  // Geohash settings
  defaultPrecision: number;
  adaptivePrecision: boolean;

  // Battery optimization
  batteryOptimization: boolean;
  powerSaveMode: boolean;

  // Privacy
  privacyMode: boolean;
  obfuscationRadius: number; // meters
}

export interface GeohashPrecisionLevel {
  precision: number;
  cellWidth: number; // meters
  cellHeight: number; // meters
  description: string;
  useCase: string;
}

export interface PredictedLocation {
  coordinates: LocationCoordinates;
  geohash: string;
  confidence: number; // 0-1
  estimatedTimeMs: number;
}

export interface LocationServiceMetrics {
  totalUpdates: number;
  cacheHits: number;
  cacheMisses: number;
  averageAccuracy: number;
  lastUpdateTimestamp: number;
  batteryImpact: 'low' | 'medium' | 'high';
}

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'undetermined';

export interface LocationPermissions {
  foreground: LocationPermissionStatus;
  background: LocationPermissionStatus;
  canAskAgain: boolean;
}

export interface GeohashQuery {
  bounds: GeohashBounds[];
  center: LocationCoordinates;
  radius: number;
  precision: number;
  estimatedResults: number;
}
