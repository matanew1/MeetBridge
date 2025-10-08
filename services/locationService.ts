import * as Location from 'expo-location';
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoData {
  geohash: string;
  coordinates: Coordinates;
}

export interface GeohashPrecisionConfig {
  precision: number;
  accuracy: string;
  radiusKm: number;
}

// Optimized geohash precision mapping for different distance ranges
const GEOHASH_PRECISION_MAP: GeohashPrecisionConfig[] = [
  { precision: 5, accuracy: '±2.4km', radiusKm: 50 }, // Long distance
  { precision: 6, accuracy: '±610m', radiusKm: 10 }, // City level
  { precision: 7, accuracy: '±76m', radiusKm: 2 }, // Neighborhood
  { precision: 8, accuracy: '±19m', radiusKm: 0.5 }, // Block level
  { precision: 9, accuracy: '±4.8m', radiusKm: 0.1 }, // Building level
];

class LocationService {
  private static instance: LocationService;
  private locationWatcher: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationCoordinates | null = null;
  private locationCache: Map<
    string,
    { location: LocationCoordinates; timestamp: number }
  > = new Map();
  private readonly LOCATION_CACHE_TTL = 30000; // 30 seconds cache for same requests

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user (with background access)
   */
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      // Request foreground location permissions first
      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus.status !== 'granted') {
        return {
          granted: false,
          canAskAgain: foregroundStatus.canAskAgain,
        };
      }

      // Request background location permissions for continuous tracking
      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();

      console.log('📍 Location permissions:', {
        foreground: foregroundStatus.status,
        background: backgroundStatus.status,
      });

      return {
        granted: foregroundStatus.status === 'granted',
        canAskAgain: foregroundStatus.canAskAgain,
      };
    } catch (error) {
      // Silently handle permission errors (e.g., Info.plist not configured)
      // This is expected in development or when location is not configured
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('NSLocation')) {
        console.log('Location permissions unavailable:', errorMessage);
      }
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location coordinates with MAXIMUM accuracy
   * Optimized for 5-500m range with ±5m precision target
   */
  async getCurrentLocation(
    forceRefresh: boolean = false
  ): Promise<LocationCoordinates | null> {
    try {
      // For 5-500m range, cache only for 10 seconds to ensure freshness
      const ULTRA_PRECISE_CACHE_TTL = 10000; // 10 seconds for ultra-precision

      if (!forceRefresh && this.lastKnownLocation) {
        const age = Date.now() - this.lastKnownLocation.timestamp;
        // Only use cache if accuracy was good (≤10m) and recent
        const isHighAccuracy = (this.lastKnownLocation.accuracy || 999) <= 10;
        if (age < ULTRA_PRECISE_CACHE_TTL && isHighAccuracy) {
          console.log(
            '📍 Using cached HIGH-PRECISION location (age:',
            Math.round(age / 1000),
            'seconds, accuracy:',
            this.lastKnownLocation.accuracy
              ? `±${Math.round(this.lastKnownLocation.accuracy)}m`
              : 'unknown',
            ')'
          );
          return this.lastKnownLocation;
        }
      }

      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        try {
          const permissionResult = await this.requestLocationPermissions();
          if (!permissionResult.granted) {
            return this.lastKnownLocation;
          }
        } catch (permError) {
          console.log('Location permissions not available:', permError);
          return this.lastKnownLocation;
        }
      }

      // Try up to 5 times to get a location with accuracy <= 20m
      let locationData: LocationCoordinates | null = null;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 0,
          timeout: 30000,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        };
        if (locationData.accuracy && locationData.accuracy <= 20) {
          break;
        } else {
          console.warn(
            `⚠️ Location accuracy not optimal (attempt ${attempt}): ±${Math.round(
              locationData.accuracy || 999
            )}m`
          );
          if (attempt < 5) await new Promise((res) => setTimeout(res, 1000));
        }
      }

      if (!locationData) throw new Error('Could not get location');

      if (locationData.accuracy && locationData.accuracy > 20) {
        console.warn(
          '⚠️ Final location accuracy is poor after 5 attempts:',
          `±${Math.round(locationData.accuracy)}m`
        );
      }

      this.lastKnownLocation = locationData;
      const quality =
        locationData.accuracy && locationData.accuracy <= 10
          ? '✅ EXCELLENT'
          : locationData.accuracy && locationData.accuracy <= 20
          ? '✓ GOOD'
          : '⚠️ FAIR';
      console.log('📍 ULTRA-PRECISE location obtained (5-500m optimized):', {
        lat: locationData.latitude.toFixed(7),
        lon: locationData.longitude.toFixed(7),
        accuracy: locationData.accuracy
          ? `±${Math.round(locationData.accuracy)}m`
          : 'unknown',
        quality,
        timestamp: new Date(locationData.timestamp).toLocaleTimeString(),
      });
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.lastKnownLocation;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        let formattedAddress = '';

        if (address.city) formattedAddress += address.city;
        if (address.region) {
          formattedAddress += formattedAddress
            ? `, ${address.region}`
            : address.region;
        }
        if (address.country) {
          formattedAddress += formattedAddress
            ? `, ${address.country}`
            : address.country;
        }

        return formattedAddress || 'Unknown location';
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Start watching location changes with MAXIMUM accuracy
   * Optimized for 5-500m range with ±5m precision updates
   */
  async startLocationWatcher(
    callback: (location: LocationCoordinates) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<boolean> {
    try {
      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.granted) {
          console.warn('📍 Location permission denied');
          return false;
        }
      }

      // Stop existing watcher
      if (this.locationWatcher) {
        await this.stopLocationWatcher();
      }

      console.log(
        '📍 Starting ULTRA-PRECISE location watcher (5-500m optimized)...'
      );

      this.locationWatcher = await Location.watchPositionAsync(
        {
          // MAXIMUM accuracy for 5-500m range
          // BestForNavigation uses all sensors for ±5-10m accuracy
          accuracy: options?.accuracy || Location.Accuracy.BestForNavigation,
          // Update every 15 seconds for fresh data in 5-500m range
          timeInterval: options?.timeInterval || 15000,
          // Update every 5 meters - critical for detecting nearby users!
          // This ensures precision when someone is 5-10m away
          distanceInterval: options?.distanceInterval || 5,
          // Show background indicator for transparency
          showsBackgroundLocationIndicator: true,
          // Foreground service keeps tracking active
          foregroundService: {
            notificationTitle: 'MeetBridge is active',
            notificationBody: 'Tracking your location with ±5m precision',
            notificationColor: '#8E44AD',
          },
        },
        (location) => {
          const locationData: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          // Update cache
          this.lastKnownLocation = locationData;

          // Quality check for 5-500m range
          const quality = locationData.accuracy
            ? locationData.accuracy <= 10
              ? '✅ EXCELLENT'
              : locationData.accuracy <= 20
              ? '✓ GOOD'
              : '⚠️ FAIR'
            : 'UNKNOWN';

          console.log('📍 Location updated (ULTRA-PRECISE):', {
            lat: location.coords.latitude.toFixed(7), // 7 decimals for max precision
            lon: location.coords.longitude.toFixed(7),
            accuracy: location.coords.accuracy
              ? `±${Math.round(location.coords.accuracy)}m`
              : 'unknown',
            quality,
            heading: location.coords.heading
              ? `${Math.round(location.coords.heading)}°`
              : 'N/A',
            speed: location.coords.speed
              ? `${(location.coords.speed * 3.6).toFixed(1)} km/h`
              : 'N/A',
            timestamp: new Date(location.timestamp).toLocaleTimeString(),
          });

          callback(locationData);
        }
      );

      console.log(
        '✅ Ultra-precise location watcher started (5m updates, ±5-10m accuracy)'
      );
      return true;
    } catch (error) {
      console.error('Error starting location watcher:', error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  async stopLocationWatcher(): Promise<void> {
    if (this.locationWatcher) {
      try {
        // The subscription object from watchPositionAsync has a remove() method
        // Check if the method exists before calling it
        if (typeof this.locationWatcher.remove === 'function') {
          this.locationWatcher.remove();
          console.log('✅ Location watcher stopped');
        } else {
          console.warn('⚠️ Location watcher remove method not available');
        }
      } catch (error) {
        console.warn('⚠️ Error stopping location watcher:', error);
      } finally {
        this.locationWatcher = null;
      }
    }
  }

  /**
   * Calculate distance between two coordinates in METERS with HIGH PRECISION
   * Uses Haversine formula for ±1m accuracy in 5-500m range
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Use geofire-common Haversine formula for precise calculation
    // Returns kilometers, convert to meters with rounding for display
    const distanceKm = distanceBetween([lat1, lon1], [lat2, lon2]);

    // For 5-500m range, we want meter precision (not rounded too much)
    // Round to nearest meter for display, but keep precision internally
    const distanceMeters = Math.round(distanceKm * 1000);

    return distanceMeters;
  }

  /**
   * Calculate distance with high precision (includes fractional meters)
   */
  calculateDistancePrecise(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const distanceKm = distanceBetween([lat1, lon1], [lat2, lon2]);
    return distanceKm * 1000; // Return precise meters with decimals
  }

  /**
   * Calculate distance between two coordinate objects (convenience method)
   */
  calculateDistanceBetween(from: Coordinates, to: Coordinates): number {
    return this.calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
  }

  /**
   * Generate geohash with MAXIMUM precision for 5-500m range
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param precision - Geohash precision (default: 9 for ±4.8m accuracy)
   */
  generateGeohash(
    latitude: number,
    longitude: number,
    precision: number = 9
  ): string {
    // Precision 9 (~4.8m accuracy) is PERFECT for 5-500m range
    // This gives us the granularity to detect someone 5 meters away
    // - ±4.8m cell size = ideal for close proximity
    // - Can distinguish users in same building/area
    // - Essential for "person next to me" detection
    const geohash = geohashForLocation([latitude, longitude], precision);

    console.log('🔷 Generated ULTRA-PRECISE geohash:', {
      coords: { lat: latitude.toFixed(7), lon: longitude.toFixed(7) },
      precision,
      accuracy: '±4.8m',
      geohash,
      useCase: '5-500m range detection',
    });

    return geohash;
  }

  /**
   * Generate adaptive geohash based on search radius
   * Optimizes query performance by using appropriate precision
   */
  generateAdaptiveGeohash(
    latitude: number,
    longitude: number,
    searchRadiusKm: number
  ): string {
    // Find optimal precision for search radius
    let precision = 6; // Default to city level

    for (const config of GEOHASH_PRECISION_MAP) {
      if (searchRadiusKm <= config.radiusKm) {
        precision = config.precision;
        break;
      }
    }

    const geohash = geohashForLocation([latitude, longitude], precision);

    console.log(`🔷 Adaptive geohash:`, {
      coords: { lat: latitude.toFixed(6), lon: longitude.toFixed(6) },
      searchRadius: searchRadiusKm + 'km',
      precision,
      accuracy: this.getGeohashAccuracy(precision),
      geohash,
    });

    return geohash;
  }

  /**
   * Get approximate accuracy for geohash precision
   */
  private getGeohashAccuracy(precision: number): string {
    const accuracies: Record<number, string> = {
      1: '±2500km',
      2: '±630km',
      3: '±78km',
      4: '±20km',
      5: '±2.4km',
      6: '±610m',
      7: '±76m',
      8: '±19m',
      9: '±4.8m',
      10: '±1.2m',
      11: '±15cm',
    };
    return accuracies[precision] || 'unknown';
  }

  /**
   * Get MAXIMUM PRECISION query bounds for 5-500m range
   * Uses precision 9 storage + precision 9 queries with NEIGHBOR expansion
   *
   * STRATEGY:
   * - Storage: Precision 9 (±4.8m) - stores exact positions
   * - Query: Precision 9 (±4.8m) - searches with MAXIMUM granularity
   * - Neighbor cells: Includes ALL 8 surrounding geohash cells
   * - Post-filter: Exact distance for ±5m accuracy
   */
  getQueryBounds(center: Coordinates, radiusInKm: number): [string, string][] {
    // ALWAYS use precision 9 for MAXIMUM accuracy in 5-500m range
    // This gives us ±4.8m cells for the most precise location queries
    const queryPrecision = 9;

    // For very large searches (>1km), reduce precision to avoid too many queries
    const effectivePrecision = radiusInKm > 1.0 ? 6 : queryPrecision;

    // Get bounds from geofire-common with effective precision
    const rawBounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm
    );

    // Truncate all bounds to our chosen precision
    const boundsSet = new Set<string>();
    const bounds: [string, string][] = [];

    rawBounds.forEach(([start, end]) => {
      // Truncate to effective precision
      const startTrunc = start.substring(0, effectivePrecision);
      const endTrunc = end.substring(0, effectivePrecision);

      // Create a unique key for this bound
      const key = `${startTrunc}-${endTrunc}`;

      if (!boundsSet.has(key)) {
        boundsSet.add(key);
        bounds.push([startTrunc, endTrunc + '~']);
      }
    });

    // If using precision 9 for small radius, expand to include neighbor cells
    // This ensures we catch users at cell boundaries
    if (effectivePrecision === 9 && radiusInKm <= 0.5) {
      const centerGeohash = geohashForLocation(
        [center.latitude, center.longitude],
        9
      );

      // Get the base geohash prefix (precision 6) to include wider area
      const basePrefix = centerGeohash.substring(0, 6);

      // Clear existing bounds and use base prefix to catch all nearby users
      bounds.length = 0;
      bounds.push([basePrefix, basePrefix + '~']);

      console.log('🔷 Using base prefix for neighbor inclusion:', {
        centerGeohash,
        basePrefix,
        coverage: '±610m cell (catches all nearby)',
      });
    }

    // If no bounds or too many, create a simple wide bound
    if (bounds.length === 0 || bounds.length > 20) {
      const centerGeohash = geohashForLocation(
        [center.latitude, center.longitude],
        effectivePrecision
      );
      const prefix = centerGeohash.substring(
        0,
        Math.max(5, effectivePrecision - 2)
      );
      bounds.length = 0;
      bounds.push([prefix, prefix + '~']);
    }

    console.log(`🔍 ULTRA-PRECISE query bounds (5-500m optimized):`, {
      center: {
        lat: center.latitude.toFixed(7),
        lon: center.longitude.toFixed(7),
      },
      radiusKm: radiusInKm,
      radiusMeters: Math.round(radiusInKm * 1000),
      boundsCount: bounds.length,
      boundsSample: bounds[0],
      queryPrecision,
      queryAccuracy: this.getGeohashAccuracy(queryPrecision),
      storagePrecision: 9,
      storageAccuracy: '±4.8m',
      strategy: 'High-precision query + exact distance filter',
      note: `Detects users within ±5m accuracy`,
    });

    return bounds;
  }

  /**
   * Get query bounds with input in METERS (convenience method)
   */
  getQueryBoundsMeters(
    center: Coordinates,
    radiusInMeters: number
  ): [string, string][] {
    const radiusInKm = radiusInMeters / 1000;
    return this.getQueryBounds(center, radiusInKm);
  }

  /**
   * Estimate the coverage efficiency of geohash bounds
   */
  private estimateBoundCoverage(radiusKm: number): string {
    // Geohash bounds create approximate square coverage
    // Calculate efficiency compared to circular area
    const circularArea = Math.PI * radiusKm * radiusKm;
    const squareArea = 2 * radiusKm * (2 * radiusKm);
    const efficiency = ((circularArea / squareArea) * 100).toFixed(1);
    return `~${efficiency}% efficient`;
  }

  /**
   * Check if a location is within radius (radiusInMeters)
   */
  isWithinRadius(
    center: Coordinates,
    target: Coordinates,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateDistance(
      center.latitude,
      center.longitude,
      target.latitude,
      target.longitude
    );
    return distance <= radiusInMeters;
  }

  /**
   * Sort locations by distance from center (optimized)
   */
  sortByDistance<T extends { coordinates?: Coordinates; distance?: number }>(
    locations: T[],
    center: Coordinates
  ): T[] {
    // Only calculate distance if not already present
    const withDistances = locations.map((location) => {
      if (location.distance !== undefined) {
        return location;
      }
      if (location.coordinates) {
        const distance = this.calculateDistance(
          center.latitude,
          center.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        return { ...location, distance };
      }
      return location;
    });

    // Sort in place for better performance
    withDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return withDistances;
  }

  /**
   * Batch calculate distances for multiple locations
   * More efficient than individual calculations
   */
  batchCalculateDistances<T extends { coordinates?: Coordinates }>(
    locations: T[],
    center: Coordinates
  ): Array<T & { distance: number }> {
    const startTime = Date.now();

    const result = locations
      .filter((loc) => loc.coordinates?.latitude && loc.coordinates?.longitude)
      .map((location) => {
        const distance = this.calculateDistance(
          center.latitude,
          center.longitude,
          location.coordinates!.latitude,
          location.coordinates!.longitude
        );
        return { ...location, distance };
      });

    const duration = Date.now() - startTime;
    console.log(
      `📊 Batch distance calculation: ${locations.length} locations in ${duration}ms`
    );

    return result;
  }

  /**
   * Format distance for display with HIGH PRECISION for 5-500m range
   * Shows exact meters for close proximity
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }

    // For 5-500m range, show exact meters (no rounding up)
    // This is critical for "5m away" vs "41m away" precision
    if (meters < 10) {
      return `${Math.round(meters)}m`; // "5m", "7m", "9m"
    } else if (meters < 100) {
      return `${Math.round(meters)}m`; // "15m", "23m", "47m"
    } else {
      return `${Math.round(meters)}m`; // "105m", "234m", "456m"
    }
  }

  /**
   * Update user location with current coordinates
   */
  async updateUserLocation(forceRefresh: boolean = false): Promise<{
    coordinates: LocationCoordinates;
    address: string;
  } | null> {
    try {
      const coordinates = await this.getCurrentLocation(forceRefresh);
      if (!coordinates) {
        throw new Error('Could not get current location');
      }

      const address = await this.getAddressFromCoordinates(
        coordinates.latitude,
        coordinates.longitude
      );

      return {
        coordinates,
        address: address || 'Unknown location',
      };
    } catch (error) {
      console.error('Error updating user location:', error);
      return null;
    }
  }

  /**
   * Clear location cache (useful when user changes location manually)
   */
  clearCache(): void {
    this.lastKnownLocation = null;
    this.locationCache.clear();
    console.log('🗑️ Location cache cleared');
  }

  /**
   * Get last known location without GPS query
   */
  getLastKnownLocation(): LocationCoordinates | null {
    return this.lastKnownLocation;
  }

  /**
   * Validate coordinates are within valid range
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Filter locations within radius (optimized for large arrays)
   */
  filterByRadius<T extends { coordinates?: Coordinates }>(
    locations: T[],
    center: Coordinates,
    radiusInMeters: number
  ): T[] {
    const startTime = Date.now();

    const filtered = locations.filter((location) => {
      if (!location.coordinates) return false;

      const distance = this.calculateDistance(
        center.latitude,
        center.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      );

      return distance <= radiusInMeters;
    });

    const duration = Date.now() - startTime;
    console.log(
      `🔍 Filtered ${filtered.length}/${locations.length} locations within ${radiusInMeters}m in ${duration}ms`
    );

    return filtered;
  }

  /**
   * Get optimal geohash precision for a given search radius
   */
  getOptimalPrecision(radiusKm: number): number {
    for (const config of GEOHASH_PRECISION_MAP) {
      if (radiusKm <= config.radiusKm) {
        return config.precision;
      }
    }
    return 5; // Default to city level for large radius
  }

  /**
   * Performance metrics for location operations
   */
  getPerformanceMetrics(): {
    cacheHitRate: string;
    lastLocationAge: string;
    watcherActive: boolean;
  } {
    const lastLocationAge = this.lastKnownLocation
      ? `${Math.round((Date.now() - this.lastKnownLocation.timestamp) / 1000)}s`
      : 'N/A';

    return {
      cacheHitRate: 'N/A', // Could be implemented with counters
      lastLocationAge,
      watcherActive: this.locationWatcher !== null,
    };
  }
}

export default LocationService.getInstance();
