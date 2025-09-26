import * as Location from 'expo-location';
import { User } from '../store/types';

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
   * Request location permissions from the user
   */
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      // Request foreground location permissions
      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();

      return {
        granted: foregroundStatus.status === 'granted',
        canAskAgain: foregroundStatus.canAskAgain,
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
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
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.granted) {
          throw new Error('Location permission denied');
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
   * Start watching location changes
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

      // Stop existing watcher
      if (this.locationWatcher) {
        await this.stopLocationWatcher();
      }

      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 30000, // 30 seconds
          distanceInterval: options?.distanceInterval || 50, // 50 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          });
        }
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
      this.locationWatcher.remove();
      this.locationWatcher = null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
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
