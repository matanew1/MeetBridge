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
  private readonly MINIMUM_ACCURACY = 20; // Maximum acceptable accuracy in meters

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
   * Get current location with maximum accuracy, averaging multiple high-precision readings
   */
  async getCurrentLocation(
    forceRefresh: boolean = false
  ): Promise<LocationCoordinates | null> {
    try {
      // Check cache for recent high-accuracy locations
      if (!forceRefresh && this.lastKnownLocation) {
        const age = Date.now() - this.lastKnownLocation.timestamp;
        const isHighAccuracy =
          (this.lastKnownLocation.accuracy || 999) <= this.MINIMUM_ACCURACY;

        if (age < this.CACHE_TTL && isHighAccuracy) {
          console.log(
            `📍 Using cached location (${Math.round(
              age / 1000
            )}s old, ±${Math.round(this.lastKnownLocation.accuracy || 0)}m)`
          );
          return this.lastKnownLocation;
        } else {
          console.warn(
            `⚠️ Invalid cache: accuracy (±${Math.round(
              this.lastKnownLocation.accuracy || 0
            )}m) exceeds threshold (${
              this.MINIMUM_ACCURACY
            }m) or too old (${Math.round(age / 1000)}s). Clearing cache.`
          );
          this.lastKnownLocation = null; // Clear invalid cache
        }
      }

      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.granted) {
          console.warn(
            '⚠️ Location permissions not granted. Cannot obtain location.'
          );
          return null;
        }
      }

      // Collect multiple high-accuracy locations for averaging
      const locations: Location.LocationObject[] = [];
      const maxAttempts = 10;
      const targetSamples = 3;
      const accuracyThreshold = 10; // Stricter threshold for better precision

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 0,
          timeout: 30000,
        });

        if (
          location.coords.accuracy &&
          location.coords.accuracy <= accuracyThreshold
        ) {
          locations.push(location);
          console.log(
            `📍 Collected sample ${
              locations.length
            }/${targetSamples} (±${Math.round(location.coords.accuracy)}m)`
          );
          if (locations.length >= targetSamples) break;
        } else {
          console.log(
            `📍 Discarding low-accuracy sample (±${Math.round(
              location.coords.accuracy || 0
            )}m)`
          );
        }

        if (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, 2000)); // 2s delay between attempts
        }
      }

      if (locations.length === 0) {
        console.warn(
          '⚠️ No high-accuracy locations obtained after max attempts. Possible emulator or low-quality GPS. Check device settings or use a physical device.'
        );
        return null;
      }

      // Average the coordinates and accuracies
      let sumLat = 0;
      let sumLon = 0;
      let sumAcc = 0;
      const count = locations.length;

      for (const loc of locations) {
        sumLat += loc.coords.latitude;
        sumLon += loc.coords.longitude;
        sumAcc += loc.coords.accuracy || accuracyThreshold; // Fallback to threshold if null
      }

      const avgLat = sumLat / count;
      const avgLon = sumLon / count;
      const avgAcc = sumAcc / count;

      // Validate final accuracy
      if (avgAcc > this.MINIMUM_ACCURACY) {
        console.warn(
          `⚠️ Averaged location accuracy (±${Math.round(
            avgAcc
          )}m) exceeds threshold (${
            this.MINIMUM_ACCURACY
          }m). Possible emulator or low-quality GPS. Check device settings or use a physical device.`
        );
        return null;
      }

      const locationData: LocationCoordinates = {
        latitude: avgLat,
        longitude: avgLon,
        accuracy: avgAcc,
        timestamp: Date.now(), // Use current time for averaged location
      };

      this.lastKnownLocation = locationData;

      console.log('📍 Averaged location obtained:', {
        lat: locationData.latitude.toFixed(7),
        lon: locationData.longitude.toFixed(7),
        accuracy: locationData.accuracy
          ? `±${Math.round(locationData.accuracy)}m`
          : 'unknown',
        samples: count,
      });

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
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
          console.warn(
            '⚠️ Location permissions not granted. Cannot start watcher.'
          );
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
          if (
            location.coords.accuracy &&
            location.coords.accuracy > this.MINIMUM_ACCURACY
          ) {
            console.warn(
              `⚠️ Location watcher received low-accuracy data (±${Math.round(
                location.coords.accuracy
              )}m). Discarding update. Possible emulator or low-quality GPS. Check device settings or use a physical device.`
            );
            return;
          }

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
    const bounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm * 1000
    );

    console.log('🔍 Query bounds (optimized):', {
      center: {
        lat: center.latitude.toFixed(7),
        lon: center.longitude.toFixed(7),
      },
      radiusKm: radiusInKm,
      radiusMeters: Math.round(radiusInKm * 1000),
      boundsCount: bounds.length,
      storagePrecision: OPTIMAL_PRECISION,
      strategy: 'Multi-bound precise coverage with post-filter',
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
    return this.getQueryBounds(center, radiusInMeters / 1000);
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
