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
   * Get current location coordinates with intelligent caching
   */
  async getCurrentLocation(
    forceRefresh: boolean = false
  ): Promise<LocationCoordinates | null> {
    try {
      // Return cached location if recent enough and not forcing refresh
      if (!forceRefresh && this.lastKnownLocation) {
        const age = Date.now() - this.lastKnownLocation.timestamp;
        if (age < this.LOCATION_CACHE_TTL) {
          console.log(
            '📍 Using cached location (age:',
            Math.round(age / 1000),
            'seconds)'
          );
          return this.lastKnownLocation;
        }
      }

      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        try {
          const permissionResult = await this.requestLocationPermissions();
          if (!permissionResult.granted) {
            return this.lastKnownLocation; // Return last known if available
          }
        } catch (permError) {
          console.log('Location permissions not available:', permError);
          return this.lastKnownLocation;
        }
      }

      // Use optimized accuracy based on requirements
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Better battery, still accurate
        maximumAge: 10000, // Accept location up to 10 seconds old
        timeout: 15000, // 15 second timeout
      });

      const locationData: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Cache the location
      this.lastKnownLocation = locationData;

      console.log('📍 Fresh location obtained:', {
        lat: locationData.latitude.toFixed(6),
        lon: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy
          ? `±${Math.round(locationData.accuracy)}m`
          : 'unknown',
      });

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.lastKnownLocation; // Return last known location on error
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
   * Start watching location changes with optimized battery and accuracy balance
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

      console.log('📍 Starting optimized location watcher...');

      this.locationWatcher = await Location.watchPositionAsync(
        {
          // Balanced accuracy provides good results with better battery life
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          // Update every 2 minutes for better battery (can still detect significant moves)
          timeInterval: options?.timeInterval || 120000,
          // Update every 50 meters (catches meaningful location changes)
          distanceInterval: options?.distanceInterval || 50,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'MeetBridge is active',
            notificationBody: 'Updating your location to show nearby matches',
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

          console.log('📍 Location updated:', {
            lat: location.coords.latitude.toFixed(6),
            lon: location.coords.longitude.toFixed(6),
            accuracy: location.coords.accuracy
              ? `±${Math.round(location.coords.accuracy)}m`
              : 'unknown',
          });

          callback(locationData);
        }
      );

      console.log('✅ Location watcher started successfully');
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
   * Calculate distance between two coordinates in METERS using optimized Haversine formula
   * This is more accurate than geofire-common for precise distance calculations
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Use geofire-common which uses Haversine formula
    // distanceBetween returns kilometers, convert to meters
    const distanceKm = distanceBetween([lat1, lon1], [lat2, lon2]);
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
   * Generate geohash with adaptive precision based on use case
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param precision - Geohash precision (default: 9 for HIGH PRECISION)
   */
  generateGeohash(
    latitude: number,
    longitude: number,
    precision: number = 9
  ): string {
    // Precision 9 (~4.8m accuracy) is optimal for close-proximity dating apps
    // - Perfect for 5-500m range matching
    // - High accuracy essential for nearby user discovery
    // - Excellent granularity for location-based features
    const geohash = geohashForLocation([latitude, longitude], precision);

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
   * Get optimized query bounds for searching within a radius (in KM)
   * Uses intelligent bound reduction to minimize queries
   *
   * IMPORTANT: Uses precision 6 for queries to cast VERY wide net for 500m range!
   * Storage: Precision 9 (±4.8m) for accurate positions
   * Queries: Precision 6 (±610m) to reliably catch ALL nearby users within 500m
   * Then filter by actual distance in post-processing
   */
  getQueryBounds(center: Coordinates, radiusInKm: number): [string, string][] {
    // For small radiuses (<= 500m), use precision 6 to ensure we catch everyone
    // For larger radiuses, use precision 7 or let geofire-common decide
    const queryPrecision = radiusInKm <= 0.5 ? 6 : radiusInKm < 1 ? 7 : 8;

    // Get bounds from geofire-common
    const rawBounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm
    );

    // Truncate all bounds to our chosen precision
    const boundsSet = new Set<string>();
    const bounds: [string, string][] = [];

    rawBounds.forEach(([start, end]) => {
      // Truncate to query precision
      const startTrunc = start.substring(0, queryPrecision);
      const endTrunc = end.substring(0, queryPrecision);

      // Create a unique key for this bound
      const key = `${startTrunc}-${endTrunc}`;

      if (!boundsSet.has(key)) {
        boundsSet.add(key);
        // Add bounds without further expansion
        bounds.push([startTrunc, endTrunc + '~']);
      }
    });

    // If no bounds or too many, create a simple wide bound
    if (bounds.length === 0 || bounds.length > 20) {
      const centerGeohash = geohashForLocation(
        [center.latitude, center.longitude],
        queryPrecision
      );
      const prefix = centerGeohash.substring(
        0,
        Math.max(5, queryPrecision - 2)
      );
      bounds.length = 0;
      bounds.push([prefix, prefix + '~']);
    }

    console.log(
      `🔍 Optimized query bounds (precision ${queryPrecision} for queries):`,
      {
        center: {
          lat: center.latitude.toFixed(6),
          lon: center.longitude.toFixed(6),
        },
        radiusKm: radiusInKm,
        radiusMeters: Math.round(radiusInKm * 1000),
        boundsCount: bounds.length,
        boundsSample: bounds[0],
        estimatedCoverage: this.estimateBoundCoverage(radiusInKm),
        queryPrecision,
        storagePrecision: 9,
        note: `Query at p${queryPrecision}, filter by distance post-query`,
      }
    );

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
   * Format distance for display (meters)
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
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
