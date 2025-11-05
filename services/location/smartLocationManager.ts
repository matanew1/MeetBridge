/**
 * Smart Location Manager
 *
 * Intelligent location tracking with:
 * - Adaptive caching with TTL
 * - Movement detection and thresholds
 * - Battery optimization
 * - Predictive location estimation
 * - Fallback strategies
 * - Offline support
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
// [SECURITY FIX] Import secure storage service instead of direct AsyncStorage
import { secureStorageService } from '../secureStorageService';
import { Platform } from 'react-native';
import {
  LocationCoordinates,
  LocationCache,
  MovementData,
  LocationUpdate,
  LocationServiceConfig,
  LocationAccuracy,
  LocationPermissions,
  PredictedLocation,
  LocationServiceMetrics,
} from './types';
import geohashService from './geohashService';

// Background location task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Check if we're on web platform (background location not supported)
const isWeb = Platform.OS === 'web';

// Define background location task
TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }: any) => {
    if (error) {
      console.error('❌ Background location error:', error);
      return;
    }
    if (data) {
      const { locations } = data;
      if (locations && locations.length > 0) {
        const location = locations[0];
        console.log('📍 Background location update:', {
          lat: location.coords.latitude.toFixed(9),
          lon: location.coords.longitude.toFixed(9),
          accuracy: `±${Math.round(location.coords.accuracy)}m`,
        });

        // Update location in Firebase
        try {
          // [SECURITY FIX] Use secure storage service for user ID
          const userId = await secureStorageService.getItem<string>(
            '@current_user_id'
          );
          if (userId) {
            const { doc, updateDoc } = require('firebase/firestore');
            const { db } = require('../firebase/config');
            const geohash = geohashService.encode(
              location.coords.latitude,
              location.coords.longitude,
              9
            );

            // [SECURITY] Validate coordinates before updating
            if (
              !isNaN(location.coords.latitude) &&
              !isNaN(location.coords.longitude) &&
              location.coords.latitude >= -90 &&
              location.coords.latitude <= 90 &&
              location.coords.longitude >= -180 &&
              location.coords.longitude <= 180
            ) {
              await updateDoc(doc(db, 'users', userId), {
                coordinates: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
                geohash,
                lastLocationUpdate: new Date(),
              });

              console.log('✅ Background location updated in Firebase');
            } else {
              console.error('❌ Invalid coordinates, skipping update');
            }
          }
        } catch (err) {
          console.error('❌ Error updating background location:', err);
        }
      }
    }
  }
);

const DEFAULT_CONFIG: LocationServiceConfig = {
  cacheEnabled: true,
  cacheTTL: 10000, // 10 seconds
  minAccuracy: 20, // meters
  idealAccuracy: 10, // meters
  movementThreshold: 5, // meters
  significantMovementThreshold: 50, // meters
  updateInterval: 15000, // 15 seconds
  backgroundUpdateInterval: 60000, // 1 minute
  defaultPrecision: 9,
  adaptivePrecision: true,
  batteryOptimization: true,
  powerSaveMode: false,
  privacyMode: false,
  obfuscationRadius: 0,
};

const STORAGE_KEYS = {
  LAST_LOCATION: '@location_cache',
  LOCATION_HISTORY: '@location_history',
  METRICS: '@location_metrics',
};

class SmartLocationManager {
  private static instance: SmartLocationManager;

  private config: LocationServiceConfig = DEFAULT_CONFIG;
  private locationWatcher: Location.LocationSubscription | null = null;
  private currentLocation: LocationCoordinates | null = null;
  private previousLocation: LocationCoordinates | null = null;
  private locationCache: LocationCache | null = null;
  private locationHistory: LocationCoordinates[] = [];
  private maxHistorySize = 10;

  private metrics: LocationServiceMetrics = {
    totalUpdates: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageAccuracy: 0,
    lastUpdateTimestamp: 0,
    batteryImpact: 'low',
  };

  private updateCallbacks: Set<(update: LocationUpdate) => void> = new Set();

  private constructor() {
    this.loadPersistedData();
  }

  static getInstance(): SmartLocationManager {
    if (!SmartLocationManager.instance) {
      SmartLocationManager.instance = new SmartLocationManager();
    }
    return SmartLocationManager.instance;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LocationServiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📍 Location manager configured:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): LocationServiceConfig {
    return { ...this.config };
  }

  /**
   * Load persisted location data
   */
  private async loadPersistedData(): Promise<void> {
    try {
      // [SECURITY FIX] Use secure storage service (location data is non-sensitive, routes to AsyncStorage)
      const [cachedLocation, history, metrics] = await Promise.all([
        secureStorageService.getItem<string>(STORAGE_KEYS.LAST_LOCATION),
        secureStorageService.getItem<string>(STORAGE_KEYS.LOCATION_HISTORY),
        secureStorageService.getItem<string>(STORAGE_KEYS.METRICS),
      ]);

      if (cachedLocation) {
        this.locationCache =
          typeof cachedLocation === 'string'
            ? JSON.parse(cachedLocation)
            : cachedLocation;

        // Check if cache is still valid
        if (this.locationCache && Date.now() < this.locationCache.expiresAt) {
          this.currentLocation = this.locationCache.location;
          console.log('📍 Loaded cached location from storage');
        } else {
          this.locationCache = null;
        }
      }

      if (history) {
        this.locationHistory =
          typeof history === 'string' ? JSON.parse(history) : history;
      }

      if (metrics) {
        this.metrics =
          typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
      }
    } catch (error) {
      console.error('Error loading persisted location data:', error);
    }
  }

  /**
   * Persist location data
   */
  private async persistData(): Promise<void> {
    try {
      // [SECURITY FIX] Use secure storage service
      const promises: Promise<boolean>[] = [];

      if (this.locationCache) {
        promises.push(
          secureStorageService.setItem(
            STORAGE_KEYS.LAST_LOCATION,
            this.locationCache
          )
        );
      }

      if (this.locationHistory.length > 0) {
        promises.push(
          secureStorageService.setItem(
            STORAGE_KEYS.LOCATION_HISTORY,
            this.locationHistory
          )
        );
      }

      promises.push(
        secureStorageService.setItem(STORAGE_KEYS.METRICS, this.metrics)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error persisting location data:', error);
    }
  }

  /**
   * Check location permissions
   */
  async checkPermissions(): Promise<LocationPermissions> {
    try {
      const [foreground, background] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);

      return {
        foreground: foreground.status as any,
        background: background.status as any,
        canAskAgain: foreground.canAskAgain,
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        foreground: 'denied',
        background: 'denied',
        canAskAgain: false,
      };
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(
    includeBackground: boolean = false
  ): Promise<LocationPermissions> {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();

      let background = { status: 'denied' as any, canAskAgain: false };

      if (includeBackground && foreground.status === 'granted') {
        background = await Location.requestBackgroundPermissionsAsync();
      }

      return {
        foreground: foreground.status as any,
        background: background.status as any,
        canAskAgain: foreground.canAskAgain,
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return {
        foreground: 'denied',
        background: 'denied',
        canAskAgain: false,
      };
    }
  }

  /**
   * Get current location with intelligent caching
   */
  async getCurrentLocation(
    forceRefresh: boolean = false
  ): Promise<LocationCoordinates | null> {
    try {
      // Check cache first
      if (!forceRefresh && this.config.cacheEnabled && this.locationCache) {
        const age = Date.now() - this.locationCache.timestamp;

        if (
          age < this.config.cacheTTL &&
          Date.now() < this.locationCache.expiresAt
        ) {
          this.metrics.cacheHits++;
          console.log(`📍 Cache hit (${Math.round(age / 1000)}s old)`);
          return this.locationCache.location;
        }
      }

      this.metrics.cacheMisses++;

      // Check permissions
      const permissions = await this.checkPermissions();
      if (permissions.foreground !== 'granted') {
        console.warn('⚠️ Location permissions not granted');
        return this.currentLocation; // Return last known location
      }

      // Determine accuracy level based on config
      const accuracy = this.config.powerSaveMode
        ? Location.Accuracy.Balanced
        : Location.Accuracy.BestForNavigation;

      // Get fresh location
      const location = await Location.getCurrentPositionAsync({
        accuracy,
        maximumAge: 0,
        timeout: 30000,
      });

      // Validate accuracy
      if (
        location.coords.accuracy &&
        location.coords.accuracy > this.config.minAccuracy &&
        !this.config.powerSaveMode
      ) {
        console.warn(
          `⚠️ Low accuracy: ±${Math.round(
            location.coords.accuracy
          )}m (threshold: ${this.config.minAccuracy}m)`
        );

        // Return cached location if it's better
        if (
          this.currentLocation &&
          this.currentLocation.accuracy &&
          this.currentLocation.accuracy < location.coords.accuracy
        ) {
          return this.currentLocation;
        }
      }

      const locationData: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      // Update cache
      this.updateLocationData(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.currentLocation; // Return last known location as fallback
    }
  }

  /**
   * Update location data and cache
   */
  private updateLocationData(location: LocationCoordinates): void {
    this.previousLocation = this.currentLocation;
    this.currentLocation = location;

    // Update cache
    if (this.config.cacheEnabled) {
      const geohash = geohashService.encode(
        location.latitude,
        location.longitude,
        this.config.defaultPrecision
      );

      this.locationCache = {
        location,
        geohash,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.cacheTTL,
      };
    }

    // Update history
    this.locationHistory.unshift(location);
    if (this.locationHistory.length > this.maxHistorySize) {
      this.locationHistory = this.locationHistory.slice(0, this.maxHistorySize);
    }

    // Update metrics
    this.metrics.totalUpdates++;
    this.metrics.lastUpdateTimestamp = Date.now();

    if (location.accuracy) {
      const totalAccuracy =
        this.metrics.averageAccuracy * (this.metrics.totalUpdates - 1);
      this.metrics.averageAccuracy =
        (totalAccuracy + location.accuracy) / this.metrics.totalUpdates;
    }

    // Persist data
    this.persistData();

    console.log('📍 Location updated:', {
      lat: location.latitude.toFixed(7),
      lon: location.longitude.toFixed(7),
      accuracy: location.accuracy
        ? `±${Math.round(location.accuracy)}m`
        : 'unknown',
    });
  }

  /**
   * Calculate movement between two locations
   */
  private calculateMovement(
    current: LocationCoordinates,
    previous: LocationCoordinates
  ): MovementData {
    const distance = geohashService.calculateDistance(current, previous);

    const timeDiff = (current.timestamp - previous.timestamp) / 1000; // seconds
    const speed = timeDiff > 0 ? distance / timeDiff : 0;

    // Calculate bearing/direction
    const direction = this.calculateBearing(previous, current);

    const isSignificant = distance >= this.config.significantMovementThreshold;

    return {
      distance,
      speed,
      direction,
      isSignificant,
    };
  }

  /**
   * Calculate bearing between two points (in degrees)
   */
  private calculateBearing(
    from: LocationCoordinates,
    to: LocationCoordinates
  ): number {
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const lon1 = (from.longitude * Math.PI) / 180;
    const lon2 = (to.longitude * Math.PI) / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  /**
   * Start continuous location tracking
   */
  async startTracking(
    callback?: (update: LocationUpdate) => void
  ): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();

      if (permissions.foreground !== 'granted') {
        console.warn('⚠️ Location permissions not granted');
        return false;
      }

      if (this.locationWatcher) {
        await this.stopTracking();
      }

      if (callback) {
        this.updateCallbacks.add(callback);
      }

      const accuracy = this.config.powerSaveMode
        ? Location.Accuracy.Balanced
        : Location.Accuracy.BestForNavigation;

      const timeInterval = this.config.batteryOptimization
        ? this.config.updateInterval * 2
        : this.config.updateInterval;

      console.log('📍 Starting location tracking...');

      this.locationWatcher = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval: this.config.movementThreshold,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'MeetBridge',
            notificationBody: 'Tracking your location',
            notificationColor: '#8E44AD',
          },
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Handle location update from watcher
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    const locationData: LocationCoordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };

    // Check if movement is significant enough
    if (this.currentLocation) {
      const distance = geohashService.calculateDistance(
        this.currentLocation,
        locationData
      );

      if (distance < this.config.movementThreshold) {
        console.log(
          `📍 Ignoring minor movement (${Math.round(distance)}m < ${
            this.config.movementThreshold
          }m)`
        );
        return;
      }
    }

    const previous = this.currentLocation;
    this.updateLocationData(locationData);

    // Calculate movement
    const movement = previous
      ? this.calculateMovement(locationData, previous)
      : null;

    // Generate geohash
    const precision = this.config.adaptivePrecision
      ? geohashService.getAdaptivePrecision(this.config.movementThreshold)
      : this.config.defaultPrecision;

    const geohash = geohashService.encode(
      locationData.latitude,
      locationData.longitude,
      precision
    );

    // Create update object
    const update: LocationUpdate = {
      current: locationData,
      previous,
      movement,
      geohash,
      timestamp: Date.now(),
    };

    // Notify callbacks
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in location update callback:', error);
      }
    });
  }

  /**
   * Start background location tracking (continues even when app is closed)
   */
  async startBackgroundTracking(userId: string): Promise<boolean> {
    try {
      // Background location is not supported on web
      if (isWeb) {
        console.log(
          '⚠️ Background location tracking not supported on web platform'
        );
        return false;
      }

      // Check if background location is already running
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

      if (hasStarted) {
        console.log('📍 Background location tracking already running');
        return true;
      }

      // [SECURITY FIX] Store user ID securely for background task
      await secureStorageService.setItem('@current_user_id', userId);

      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 1 minute
        distanceInterval: 100, // 100 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'MeetBridge Active',
          notificationBody: 'Updating your location to find nearby matches',
          notificationColor: '#FF69B4',
        },
        deferredUpdatesInterval: 120000, // 2 minutes
        deferredUpdatesDistance: 200, // 200 meters
      });

      console.log('✅ Background location tracking started');
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('UIBackgroundModes') ||
        errorMessage.includes('not been configured')
      ) {
        console.warn(
          '⚠️ Background location not available - need standalone build with proper configuration'
        );
        console.warn('📱 Foreground location tracking will continue to work');
      } else {
        console.error('❌ Error starting background location tracking:', error);
      }
      return false;
    }
  }

  /**
   * Stop background location tracking
   */
  async stopBackgroundTracking(): Promise<void> {
    try {
      // Background location is not supported on web
      if (isWeb) {
        return;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('✅ Background location tracking stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping background location tracking:', error);
    }
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    if (this.locationWatcher) {
      try {
        // Check if remove method exists (native platforms)
        if (typeof this.locationWatcher.remove === 'function') {
          this.locationWatcher.remove();
        }
        console.log('✅ Location tracking stopped');
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      } finally {
        this.locationWatcher = null;
      }
    }

    // Also stop background tracking
    await this.stopBackgroundTracking();
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: (update: LocationUpdate) => void): () => void {
    this.updateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Get location with geohash
   */
  async getLocationWithGeohash(
    forceRefresh: boolean = false,
    precision?: number
  ): Promise<{ location: LocationCoordinates; geohash: string } | null> {
    const location = await this.getCurrentLocation(forceRefresh);

    if (!location) return null;

    const geohash = geohashService.encode(
      location.latitude,
      location.longitude,
      precision || this.config.defaultPrecision
    );

    return { location, geohash };
  }

  /**
   * Predict next location based on movement history
   */
  predictNextLocation(timeAheadMs: number = 5000): PredictedLocation | null {
    if (this.locationHistory.length < 2) return null;

    const recent = this.locationHistory.slice(0, 3);

    // Calculate average speed and direction
    let totalDistance = 0;
    let totalTime = 0;
    let bearings: number[] = [];

    for (let i = 0; i < recent.length - 1; i++) {
      const distance = geohashService.calculateDistance(
        recent[i],
        recent[i + 1]
      );
      const timeDiff = (recent[i].timestamp - recent[i + 1].timestamp) / 1000;

      totalDistance += distance;
      totalTime += timeDiff;

      bearings.push(this.calculateBearing(recent[i + 1], recent[i]));
    }

    if (totalTime === 0) return null;

    const averageSpeed = totalDistance / totalTime; // m/s
    const averageBearing =
      bearings.reduce((a, b) => a + b, 0) / bearings.length;

    // Calculate predicted position
    const distanceAhead = (averageSpeed * timeAheadMs) / 1000;
    const predicted = this.projectLocation(
      this.currentLocation!,
      distanceAhead,
      averageBearing
    );

    const confidence = Math.min(0.95, 0.5 + recent.length / 10);

    const geohash = geohashService.encode(
      predicted.latitude,
      predicted.longitude,
      this.config.defaultPrecision
    );

    return {
      coordinates: predicted,
      geohash,
      confidence,
      estimatedTimeMs: timeAheadMs,
    };
  }

  /**
   * Project location along bearing
   */
  private projectLocation(
    from: LocationCoordinates,
    distanceMeters: number,
    bearingDegrees: number
  ): LocationCoordinates {
    const R = 6371000; // Earth radius in meters
    const bearing = (bearingDegrees * Math.PI) / 180;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lon1 = (from.longitude * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceMeters / R) +
        Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(bearing)
    );

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distanceMeters / R) * Math.cos(lat1),
        Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
      );

    return {
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lon2 * 180) / Math.PI,
      timestamp: Date.now() + (distanceMeters / (from.speed || 1)) * 1000,
    };
  }

  /**
   * Get location accuracy assessment
   */
  getAccuracyLevel(location: LocationCoordinates): LocationAccuracy {
    const accuracy = location.accuracy || 999;

    if (accuracy <= 10) {
      return {
        level: 'high',
        meters: accuracy,
        message: 'Excellent accuracy for precise operations',
      };
    } else if (accuracy <= 50) {
      return {
        level: 'medium',
        meters: accuracy,
        message: 'Good accuracy for most operations',
      };
    } else if (accuracy <= 200) {
      return {
        level: 'low',
        meters: accuracy,
        message: 'Low accuracy, results may be imprecise',
      };
    } else {
      return {
        level: 'unknown',
        meters: accuracy,
        message: 'Very low accuracy or unavailable',
      };
    }
  }

  /**
   * Get service metrics
   */
  getMetrics(): LocationServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    this.locationCache = null;
    this.currentLocation = null;
    this.previousLocation = null;
    this.locationHistory = [];

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.LAST_LOCATION,
      STORAGE_KEYS.LOCATION_HISTORY,
    ]);

    console.log('📍 Location cache cleared');
  }

  /**
   * Get last known location (from cache or memory)
   */
  getLastKnownLocation(): LocationCoordinates | null {
    return this.currentLocation;
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationCoordinates[] {
    return [...this.locationHistory];
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch {
      return false;
    }
  }
}

export default SmartLocationManager.getInstance();
