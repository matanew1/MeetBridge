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

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoData {
  geohash: string;
  coordinates: Coordinates;
}

// Optimized for 5-500m range with precision 9 (~4.8m accuracy)
const OPTIMAL_PRECISION = 9;
const OPTIMAL_ACCURACY = '±4.8m';

class LocationService {
  private static instance: LocationService;
  private locationWatcher: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationCoordinates | null = null;
  private readonly CACHE_TTL = 10000; // 10 seconds for high precision

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
  }> {
    try {
      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus.status !== 'granted') {
        return {
          granted: false,
          canAskAgain: foregroundStatus.canAskAgain,
        };
      }

      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();

      return {
        granted: foregroundStatus.status === 'granted',
        canAskAgain: foregroundStatus.canAskAgain,
      };
    } catch (error) {
      console.log('Location permissions unavailable');
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
      return false;
    }
  }

  /**
   * Get current location with maximum accuracy
   */
  async getCurrentLocation(
    forceRefresh: boolean = false
  ): Promise<LocationCoordinates | null> {
    try {
      // Use cache for recent high-accuracy locations
      if (!forceRefresh && this.lastKnownLocation) {
        const age = Date.now() - this.lastKnownLocation.timestamp;
        const isHighAccuracy = (this.lastKnownLocation.accuracy || 999) <= 10;

        if (age < this.CACHE_TTL && isHighAccuracy) {
          console.log(
            `📍 Using cached location (${Math.round(
              age / 1000
            )}s old, ±${Math.round(this.lastKnownLocation.accuracy || 0)}m)`
          );
          return this.lastKnownLocation;
        }
      }

      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.granted) {
          return this.lastKnownLocation;
        }
      }

      // Try up to 3 times to get accurate location
      let locationData: LocationCoordinates | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
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

        // Accept if accuracy is good enough (≤20m)
        if (locationData.accuracy && locationData.accuracy <= 20) {
          break;
        }

        if (attempt < 3) await new Promise((res) => setTimeout(res, 1000));
      }

      if (!locationData) throw new Error('Could not get location');

      this.lastKnownLocation = locationData;

      console.log('📍 Location obtained:', {
        lat: locationData.latitude.toFixed(7),
        lon: locationData.longitude.toFixed(7),
        accuracy: locationData.accuracy
          ? `±${Math.round(locationData.accuracy)}m`
          : 'unknown',
      });

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return this.lastKnownLocation;
    }
  }

  /**
   * Start location watcher with maximum accuracy
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
          return false;
        }
      }

      if (this.locationWatcher) {
        await this.stopLocationWatcher();
      }

      console.log('📍 Starting location watcher (5-500m optimized)...');

      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.BestForNavigation,
          timeInterval: options?.timeInterval || 15000, // 15 seconds
          distanceInterval: options?.distanceInterval || 5, // 5 meters
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'MeetBridge is active',
            notificationBody: 'Tracking your location with high precision',
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

          this.lastKnownLocation = locationData;

          console.log('📍 Location updated:', {
            lat: location.coords.latitude.toFixed(7),
            lon: location.coords.longitude.toFixed(7),
            accuracy: location.coords.accuracy
              ? `±${Math.round(location.coords.accuracy)}m`
              : 'unknown',
          });

          callback(locationData);
        }
      );

      console.log('✅ Location watcher started');
      return true;
    } catch (error) {
      console.error('Error starting location watcher:', error);
      return false;
    }
  }

  /**
   * Stop location watcher
   */
  async stopLocationWatcher(): Promise<void> {
    if (this.locationWatcher) {
      try {
        if (typeof this.locationWatcher.remove === 'function') {
          this.locationWatcher.remove();
          console.log('✅ Location watcher stopped');
        }
      } catch (error) {
        console.warn('⚠️ Error stopping location watcher:', error);
      } finally {
        this.locationWatcher = null;
      }
    }
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
    return distanceKm * 1000;
  }


  /**
   * Generate geohash with precision 9 for 5-500m range
   */
  generateGeohash(
    latitude: number,
    longitude: number,
    precision: number = OPTIMAL_PRECISION
  ): string {
    const geohash = geohashForLocation([latitude, longitude], precision);

    console.log('🔷 Generated geohash:', {
      coords: { lat: latitude.toFixed(7), lon: longitude.toFixed(7) },
      precision,
      accuracy: OPTIMAL_ACCURACY,
      geohash,
    });

    return geohash;
  }

  /**
   * Get query bounds optimized for 5-500m range
   */
  getQueryBounds(center: Coordinates, radiusInKm: number): [string, string][] {
    // For small radius (≤0.5km), use precision 6 to avoid too many bounds
    // This covers the entire area efficiently
    const effectivePrecision = radiusInKm <= 0.5 ? 6 : 5;

    const centerGeohash = geohashForLocation(
      [center.latitude, center.longitude],
      effectivePrecision
    );

    // Use single bound with prefix for efficient querying
    const bounds: [string, string][] = [[centerGeohash, centerGeohash + '~']];

    console.log('🔍 Query bounds (optimized):', {
      center: {
        lat: center.latitude.toFixed(7),
        lon: center.longitude.toFixed(7),
      },
      radiusKm: radiusInKm,
      radiusMeters: Math.round(radiusInKm * 1000),
      boundsCount: bounds.length,
      precision: effectivePrecision,
      storagePrecision: OPTIMAL_PRECISION,
      strategy: 'Single bound + post-filter for accuracy',
    });

    return bounds;
  }

  /**
   * Get query bounds with input in METERS
   */
  getQueryBoundsMeters(
    center: Coordinates,
    radiusInMeters: number
  ): [string, string][] {
    const radiusInKm = radiusInMeters / 1000;
    return this.getQueryBounds(center, radiusInKm);
  }

  /**
   * Check if location is within radius (in meters)
   */
  isWithinRadius(
    center: Coordinates,
    target: Coordinates,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateDistancePrecise(
      center.latitude,
      center.longitude,
      target.latitude,
      target.longitude
    );
    return distance <= radiusInMeters;
  }

  /**
   * Sort locations by distance from center
   */
  sortByDistance<T extends { coordinates?: Coordinates; distance?: number }>(
    locations: T[],
    center: Coordinates
  ): T[] {
    const withDistances = locations.map((location) => {
      if (location.distance !== undefined) {
        return location;
      }
      if (location.coordinates) {
        const distance = this.calculateDistancePrecise(
          center.latitude,
          center.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        return { ...location, distance };
      }
      return location;
    });

    withDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return withDistances;
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
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
      const geocodedLocations = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (geocodedLocations && geocodedLocations.length > 0) {
        const location = geocodedLocations[0];
        const addressParts = [
          location.name,
          location.street,
          location.city,
          location.region,
          location.country,
        ].filter(Boolean);

        // Return the most specific address available
        return addressParts.length > 0 ? addressParts.join(', ') : null;
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get current location with address
   */
  async getCurrentLocationWithAddress(): Promise<{
    coordinates: LocationCoordinates;
    address: string | null;
  } | null> {
    try {
      const coordinates = await this.getCurrentLocation();
      if (!coordinates) return null;

      const address = await this.reverseGeocode({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      return {
        coordinates,
        address,
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      return null;
    }
  }
}

export default LocationService.getInstance();
