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

class LocationService {
  private static instance: LocationService;
  private locationWatcher: Location.LocationSubscription | null = null;

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
   * Get current location coordinates
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        try {
          const permissionResult = await this.requestLocationPermissions();
          if (!permissionResult.granted) {
            return null;
          }
        } catch (permError) {
          // Permission request failed (e.g., Info.plist not configured)
          console.log('Location permissions not available:', permError);
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
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
   * Start watching location changes with continuous updates
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

      console.log('📍 Starting location watcher with continuous tracking...');

      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          timeInterval: options?.timeInterval || 60000, // Update every 60 seconds
          distanceInterval: options?.distanceInterval || 100, // Update every 100 meters
          showsBackgroundLocationIndicator: true, // Show indicator on iOS
          foregroundService: {
            notificationTitle: 'MeetBridge is active',
            notificationBody: 'Updating your location to show nearby matches',
            notificationColor: '#8E44AD',
          },
        },
        (location) => {
          console.log('📍 Location updated:', {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });

          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
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
   * Calculate distance between two coordinates in METERS using geofire-common
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // distanceBetween returns kilometers, convert to meters
    const distanceKm = distanceBetween([lat1, lon1], [lat2, lon2]);
    const distanceMeters = Math.round(distanceKm * 1000);

    console.log(`📏 Distance calculation:`, {
      from: { lat: lat1.toFixed(6), lon: lon1.toFixed(6) },
      to: { lat: lat2.toFixed(6), lon: lon2.toFixed(6) },
      distanceMeters: distanceMeters,
    });

    return distanceMeters;
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
   * Generate geohash from coordinates with maximum accuracy
   */
  generateGeohash(
    latitude: number,
    longitude: number,
    precision: number = 9
  ): string {
    // Use precision 9 (~4.8m accuracy) for most accurate location
    // This is the optimal balance for dating app matching
    const geohash = geohashForLocation([latitude, longitude], precision);

    console.log(`🔷 Geohash generated:`, {
      coords: { lat: latitude.toFixed(6), lon: longitude.toFixed(6) },
      geohash,
      precision,
      accuracy: this.getGeohashAccuracy(precision),
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
   * Get query bounds for searching within a radius
   */
  getQueryBounds(center: Coordinates, radiusInKm: number): [string, string][] {
    const bounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm
    );

    console.log(`🔍 Geohash query bounds:`, {
      center: {
        lat: center.latitude.toFixed(6),
        lon: center.longitude.toFixed(6),
      },
      radiusKm: radiusInKm,
      radiusMeters: Math.round(radiusInKm * 1000),
      boundsCount: bounds.length,
      bounds: bounds.map(([start, end]) => `${start}-${end}`),
    });

    return bounds;
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
   * Sort locations by distance from center
   */
  sortByDistance<T extends { coordinates?: Coordinates; distance?: number }>(
    locations: T[],
    center: Coordinates
  ): T[] {
    return locations
      .map((location) => {
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
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
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
  async updateUserLocation(): Promise<{
    coordinates: LocationCoordinates;
    address: string;
  } | null> {
    try {
      const coordinates = await this.getCurrentLocation();
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
}

export default LocationService.getInstance();
