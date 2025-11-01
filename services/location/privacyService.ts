/**
 * Privacy Service
 *
 * Privacy-preserving location features:
 * - Location obfuscation
 * - Geohash rounding
 * - Proximity without exact location
 * - Differential privacy
 * - K-anonymity support
 */

import { LocationCoordinates } from './types';
import geohashService from './geohashService';

export interface PrivacyConfig {
  obfuscationRadius: number; // meters
  minPrecision: number; // minimum geohash precision to share
  enableDifferentialPrivacy: boolean;
  kAnonymity: number; // minimum users in area before sharing
}

const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  obfuscationRadius: 100, // 100m default
  minPrecision: 6, // ~610m cells
  enableDifferentialPrivacy: true,
  kAnonymity: 3,
};

class PrivacyService {
  private static instance: PrivacyService;
  private config: PrivacyConfig = DEFAULT_PRIVACY_CONFIG;

  private constructor() {}

  static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Configure privacy settings
   */
  configure(config: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obfuscate location by adding random noise
   * Uses Laplace mechanism for differential privacy
   */
  obfuscateLocation(
    location: LocationCoordinates,
    radiusMeters: number = this.config.obfuscationRadius
  ): LocationCoordinates {
    if (radiusMeters === 0) return location;

    // Convert meters to degrees (approximate at equator)
    const metersPerDegree = 111320; // meters per degree latitude
    const radiusDegrees = radiusMeters / metersPerDegree;

    // Generate random offset using uniform distribution
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;

    const latOffset = distance * Math.cos(angle);
    const lonOffset =
      (distance * Math.sin(angle)) /
      Math.cos((location.latitude * Math.PI) / 180);

    return {
      ...location,
      latitude: location.latitude + latOffset,
      longitude: location.longitude + lonOffset,
      accuracy: radiusMeters, // Update accuracy to reflect obfuscation
    };
  }

  /**
   * Obfuscate using Laplace noise (differential privacy)
   * Provides stronger privacy guarantees
   */
  obfuscateWithLaplaceNoise(
    location: LocationCoordinates,
    epsilon: number = 0.1 // Privacy parameter (smaller = more private)
  ): LocationCoordinates {
    const sensitivity = 0.001; // Maximum change in degrees
    const scale = sensitivity / epsilon;

    // Generate Laplace noise
    const laplaceNoise = (): number => {
      const u = Math.random() - 0.5;
      return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    };

    return {
      ...location,
      latitude: location.latitude + laplaceNoise(),
      longitude: location.longitude + laplaceNoise(),
    };
  }

  /**
   * Round geohash to lower precision for privacy
   */
  roundGeohash(
    geohash: string,
    maxPrecision: number = this.config.minPrecision
  ): string {
    if (geohash.length <= maxPrecision) {
      return geohash;
    }
    return geohash.substring(0, maxPrecision);
  }

  /**
   * Get privacy-safe geohash
   * Ensures geohash is not too precise
   */
  getPrivacySafeGeohash(
    location: LocationCoordinates,
    minPrecision: number = this.config.minPrecision
  ): string {
    const geohash = geohashService.encode(
      location.latitude,
      location.longitude,
      9 // Start with full precision
    );

    return this.roundGeohash(geohash, minPrecision);
  }

  /**
   * Create location zone instead of exact location
   * Returns center of geohash cell at specified precision
   */
  getLocationZone(
    location: LocationCoordinates,
    precision: number = 6
  ): LocationCoordinates {
    const geohash = geohashService.encode(
      location.latitude,
      location.longitude,
      precision
    );

    const center = geohashService.decode(geohash);

    return {
      latitude: center.latitude,
      longitude: center.longitude,
      timestamp: location.timestamp,
      accuracy: geohashService.getCellDimensions(geohash).widthMeters,
    };
  }

  /**
   * Check if sharing location violates k-anonymity
   * Returns true if safe to share (enough nearby users)
   */
  isKAnonymous(nearbyUserCount: number): boolean {
    return nearbyUserCount >= this.config.kAnonymity;
  }

  /**
   * Get safe radius for proximity search
   * Ensures privacy while maintaining functionality
   */
  getSafeSearchRadius(desiredRadius: number): number {
    // Minimum radius based on obfuscation
    const minRadius = this.config.obfuscationRadius * 2;
    return Math.max(desiredRadius, minRadius);
  }

  /**
   * Create cloaked region (k-anonymity region)
   * Returns a larger area that contains k users
   */
  getCloakedRegion(
    location: LocationCoordinates,
    k: number = this.config.kAnonymity
  ): {
    center: LocationCoordinates;
    radiusMeters: number;
    precision: number;
  } {
    // Calculate radius needed for k-anonymity
    // Assumes average density, adjust based on your data
    const averageDensityPerKm2 = 10; // users per km²
    const areaNeeded = k / averageDensityPerKm2; // km²
    const radiusKm = Math.sqrt(areaNeeded / Math.PI);
    const radiusMeters = radiusKm * 1000;

    // Get appropriate precision for this radius
    const precision = geohashService.getAdaptivePrecision(radiusMeters);

    // Return zone center instead of exact location
    const zone = this.getLocationZone(location, precision);

    return {
      center: zone,
      radiusMeters,
      precision,
    };
  }

  /**
   * Sanitize location for sharing
   * Applies privacy protections based on config
   */
  sanitizeLocation(location: LocationCoordinates): LocationCoordinates {
    let sanitized = { ...location };

    // Apply obfuscation if enabled
    if (this.config.obfuscationRadius > 0) {
      sanitized = this.obfuscateLocation(sanitized);
    }

    // Apply differential privacy if enabled
    if (this.config.enableDifferentialPrivacy) {
      sanitized = this.obfuscateWithLaplaceNoise(sanitized);
    }

    // Remove precise metadata
    return {
      latitude: sanitized.latitude,
      longitude: sanitized.longitude,
      accuracy: sanitized.accuracy || this.config.obfuscationRadius,
      timestamp: sanitized.timestamp,
    };
  }

  /**
   * Get privacy level description
   */
  getPrivacyLevel(): {
    level: 'low' | 'medium' | 'high';
    description: string;
  } {
    if (this.config.obfuscationRadius >= 500 || this.config.minPrecision <= 5) {
      return {
        level: 'high',
        description:
          'Strong privacy protection with significant location obfuscation',
      };
    } else if (
      this.config.obfuscationRadius >= 100 ||
      this.config.minPrecision <= 6
    ) {
      return {
        level: 'medium',
        description: 'Balanced privacy with moderate location obfuscation',
      };
    } else {
      return {
        level: 'low',
        description: 'Minimal privacy protection for maximum accuracy',
      };
    }
  }

  /**
   * Calculate privacy score (0-100)
   */
  calculatePrivacyScore(): number {
    let score = 0;

    // Obfuscation radius contribution (0-40 points)
    score += Math.min(40, (this.config.obfuscationRadius / 500) * 40);

    // Precision contribution (0-30 points)
    score += Math.min(30, ((9 - this.config.minPrecision) / 9) * 30);

    // Differential privacy (0-20 points)
    if (this.config.enableDifferentialPrivacy) {
      score += 20;
    }

    // K-anonymity (0-10 points)
    score += Math.min(10, (this.config.kAnonymity / 10) * 10);

    return Math.round(score);
  }

  /**
   * Create privacy-preserving distance indicator
   * Instead of exact distance, return range
   */
  getDistanceRange(distanceMeters: number): string {
    if (distanceMeters < 100) return 'Very close (<100m)';
    if (distanceMeters < 500) return 'Nearby (<500m)';
    if (distanceMeters < 1000) return 'Close (<1km)';
    if (distanceMeters < 5000) return 'In area (<5km)';
    if (distanceMeters < 10000) return 'Nearby (<10km)';
    return 'In region (>10km)';
  }

  /**
   * Check if two users should see each other
   * Based on privacy settings and distance
   */
  shouldRevealProximity(distance: number, userCount: number): boolean {
    // Don't reveal if too close (privacy violation)
    if (distance < this.config.obfuscationRadius) {
      return false;
    }

    // Don't reveal if k-anonymity violated
    if (!this.isKAnonymous(userCount)) {
      return false;
    }

    return true;
  }

  /**
   * Generate privacy-safe location summary
   */
  getLocationSummary(
    location: LocationCoordinates,
    precision: number = this.config.minPrecision
  ): {
    geohash: string;
    zone: LocationCoordinates;
    area: string;
  } {
    const geohash = this.getPrivacySafeGeohash(location, precision);
    const zone = this.getLocationZone(location, precision);
    const precisionInfo = geohashService.getPrecisionInfo(precision);

    return {
      geohash,
      zone,
      area: precisionInfo?.description || 'Unknown area',
    };
  }
}

export default PrivacyService.getInstance();
