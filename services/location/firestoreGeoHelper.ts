/**
 * Firestore Integration Helper
 *
 * Efficient geohash-based queries for Firestore:
 * - Optimized proximity searches
 * - Batch operations
 * - Real-time subscriptions
 * - Query optimization
 */

import {
  collection,
  query,
  where,
  getDocs,
  Query,
  DocumentData,
  orderBy,
  limit as firestoreLimit,
  startAt,
  endAt,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  LocationCoordinates,
  ProximitySearchOptions,
  ProximityResult,
  GeohashBounds,
} from './types';
import geohashService from './geohashService';

export interface FirestoreGeoDocument {
  id: string;
  geohash: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any;
}

export interface NearbySearchOptions extends ProximitySearchOptions {
  collectionName: string;
  whereConditions?: Array<{
    field: string;
    operator: any;
    value: any;
  }>;
  orderByField?: string;
}

class FirestoreGeoHelper {
  private static instance: FirestoreGeoHelper;

  private constructor() {}

  static getInstance(): FirestoreGeoHelper {
    if (!FirestoreGeoHelper.instance) {
      FirestoreGeoHelper.instance = new FirestoreGeoHelper();
    }
    return FirestoreGeoHelper.instance;
  }

  /**
   * Find nearby documents in Firestore using geohash queries
   */
  async findNearby<T extends FirestoreGeoDocument>(
    options: NearbySearchOptions
  ): Promise<ProximityResult<T>> {
    const {
      center,
      radiusInMeters,
      precision,
      limit,
      sortByDistance = true,
      collectionName,
      whereConditions = [],
    } = options;

    // Get geohash bounds for the search area
    const bounds = geohashService.getGeohashesInBounds(center, radiusInMeters);

    if (!bounds || !Array.isArray(bounds) || bounds.length === 0) {
      console.error(
        'Invalid bounds returned from getGeohashesInBounds:',
        bounds
      );
      return { items: [], bounds: [], searchRadius: radiusInMeters };
    }

    console.log('🔍 Firestore proximity search:', {
      center: {
        lat: center.latitude.toFixed(6),
        lon: center.longitude.toFixed(6),
      },
      radius: `${radiusInMeters}m`,
      boundsCount: bounds.length,
    });

    // Execute queries for each bound in parallel
    const queryPromises = bounds.map((bound) =>
      this.queryGeohashRange(collectionName, bound, whereConditions)
    );

    const results = await Promise.all(queryPromises);

    // Flatten results and remove duplicates
    const allDocs = new Map<string, T>();
    results.forEach((docs) => {
      docs.forEach((doc) => {
        if (!allDocs.has(doc.id)) {
          allDocs.set(doc.id, doc as T);
        }
      });
    });

    // Filter by actual distance and add distance property
    const items: T[] = [];
    allDocs.forEach((doc) => {
      if (!doc.coordinates) return;

      const distance = geohashService.calculateDistance(
        center,
        doc.coordinates as LocationCoordinates
      );

      // Only include if within actual radius
      if (distance <= radiusInMeters) {
        items.push({
          ...doc,
          distance,
        } as T);
      }
    });

    // Sort by distance if requested
    if (sortByDistance) {
      items.sort((a: any, b: any) => a.distance - b.distance);
    }

    // Apply limit if specified
    const limitedItems = limit ? items.slice(0, limit) : items;

    console.log('✅ Found nearby:', {
      total: limitedItems.length,
      queriesExecuted: bounds.length,
    });

    return {
      items: limitedItems,
      bounds,
      searchRadius: radiusInMeters,
      totalFound: limitedItems.length,
    };
  }

  /**
   * Query Firestore for documents within a geohash range
   */
  private async queryGeohashRange(
    collectionName: string,
    bound: GeohashBounds,
    additionalConditions: Array<{
      field: string;
      operator: any;
      value: any;
    }> = []
  ): Promise<FirestoreGeoDocument[]> {
    try {
      const collectionRef = collection(db, collectionName);

      // Build query with geohash bounds
      let q: Query<DocumentData> = query(
        collectionRef,
        orderBy('geohash'),
        startAt(bound.lower),
        endAt(bound.upper)
      );

      // Add additional where conditions
      // Note: Firestore has limitations on compound queries
      // You may need to filter some conditions in-memory
      additionalConditions.forEach((condition) => {
        q = query(
          q,
          where(condition.field, condition.operator, condition.value)
        );
      });

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreGeoDocument[];
    } catch (error) {
      console.error('Error querying geohash range:', error);
      return [];
    }
  }

  /**
   * Subscribe to nearby documents with real-time updates
   */
  subscribeToNearby<T extends FirestoreGeoDocument>(
    options: NearbySearchOptions,
    callback: (result: ProximityResult<T>) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const {
      center,
      radiusInMeters,
      collectionName,
      whereConditions = [],
      sortByDistance = true,
    } = options;

    const bounds = geohashService.getGeohashesInBounds(center, radiusInMeters);

    if (!bounds || !Array.isArray(bounds) || bounds.length === 0) {
      console.error('Invalid bounds in subscribeToNearby:', bounds);
      return () => {}; // Return empty unsubscribe function
    }

    // Create subscriptions for each bound
    const unsubscribers: Unsubscribe[] = [];
    const documentCache = new Map<string, T>();

    const updateCallback = () => {
      // Filter and sort all cached documents
      const items: T[] = [];

      documentCache.forEach((doc) => {
        if (!doc.coordinates) return;

        const distance = geohashService.calculateDistance(
          center,
          doc.coordinates as LocationCoordinates
        );

        if (distance <= radiusInMeters) {
          items.push({
            ...doc,
            distance,
          } as T);
        }
      });

      if (sortByDistance) {
        items.sort((a: any, b: any) => a.distance - b.distance);
      }

      callback({
        items,
        bounds,
        searchRadius: radiusInMeters,
        totalFound: items.length,
      });
    };

    bounds.forEach((bound) => {
      try {
        const collectionRef = collection(db, collectionName);

        let q: Query<DocumentData> = query(
          collectionRef,
          orderBy('geohash'),
          startAt(bound.lower),
          endAt(bound.upper)
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const doc = {
                id: change.doc.id,
                ...change.doc.data(),
              } as T;

              if (change.type === 'added' || change.type === 'modified') {
                documentCache.set(doc.id, doc);
              } else if (change.type === 'removed') {
                documentCache.delete(doc.id);
              }
            });

            updateCallback();
          },
          (error) => {
            console.error('Subscription error:', error);
            onError?.(error);
          }
        );

        unsubscribers.push(unsubscribe);
      } catch (error) {
        console.error('Error creating subscription:', error);
      }
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Optimized expanding search - finds nearest items efficiently
   * Searches in expanding radii until enough results found
   */
  async findNearest<T extends FirestoreGeoDocument>(
    center: LocationCoordinates,
    collectionName: string,
    minResults: number = 10,
    maxRadiusMeters: number = 50000, // 50km max
    whereConditions?: Array<{ field: string; operator: any; value: any }>
  ): Promise<ProximityResult<T>> {
    const radii = geohashService.getExpandingSearchRadii(maxRadiusMeters);

    console.log('🎯 Expanding search for nearest items:', {
      minResults,
      maxRadius: `${maxRadiusMeters / 1000}km`,
      steps: radii.length,
    });

    for (const radius of radii) {
      const result = await this.findNearby<T>({
        center,
        radiusInMeters: radius,
        collectionName,
        whereConditions,
        sortByDistance: true,
        limit: minResults,
      });

      if (result.items.length >= minResults) {
        console.log(
          `✅ Found ${result.items.length} items at ${radius}m radius`
        );
        return result;
      }
    }

    // Return whatever we found
    const finalResult = await this.findNearby<T>({
      center,
      radiusInMeters: maxRadiusMeters,
      collectionName,
      whereConditions,
      sortByDistance: true,
    });

    console.log(
      `⚠️ Only found ${finalResult.items.length} items (wanted ${minResults})`
    );
    return finalResult;
  }

  /**
   * Count nearby items without fetching all data
   */
  async countNearby(
    center: LocationCoordinates,
    radiusInMeters: number,
    collectionName: string,
    whereConditions?: Array<{ field: string; operator: any; value: any }>
  ): Promise<number> {
    const result = await this.findNearby({
      center,
      radiusInMeters,
      collectionName,
      whereConditions,
      sortByDistance: false,
    });

    return result.totalFound;
  }

  /**
   * Batch update geohashes for existing documents
   * Useful for migrating data or updating location indexes
   */
  async batchUpdateGeohashes(
    collectionName: string,
    precision: number = 9
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      console.log(`🔄 Updating geohashes for ${snapshot.size} documents...`);

      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();

          if (data.coordinates?.latitude && data.coordinates?.longitude) {
            const geohash = geohashService.encode(
              data.coordinates.latitude,
              data.coordinates.longitude,
              precision
            );

            // Update document with geohash
            await doc.ref.update({ geohash });
            updated++;
          }
        } catch (error) {
          console.error(`Failed to update ${doc.id}:`, error);
          failed++;
        }
      }

      console.log(
        `✅ Batch update complete: ${updated} updated, ${failed} failed`
      );
    } catch (error) {
      console.error('Batch update error:', error);
    }

    return { updated, failed };
  }

  /**
   * Get density map (users per geohash at given precision)
   */
  async getDensityMap(
    center: LocationCoordinates,
    radiusInMeters: number,
    collectionName: string,
    precision: number = 6
  ): Promise<Map<string, number>> {
    const result = await this.findNearby({
      center,
      radiusInMeters,
      collectionName,
      sortByDistance: false,
    });

    const densityMap = new Map<string, number>();

    result.items.forEach((item) => {
      if (item.geohash) {
        const roundedGeohash = item.geohash.substring(0, precision);
        densityMap.set(
          roundedGeohash,
          (densityMap.get(roundedGeohash) || 0) + 1
        );
      }
    });

    return densityMap;
  }

  /**
   * Find clusters of nearby items
   */
  async findClusters<T extends FirestoreGeoDocument>(
    center: LocationCoordinates,
    radiusInMeters: number,
    collectionName: string,
    clusterRadius: number = 100, // meters
    minClusterSize: number = 3
  ): Promise<Array<{ center: LocationCoordinates; items: T[]; size: number }>> {
    const result = await this.findNearby<T>({
      center,
      radiusInMeters,
      collectionName,
      sortByDistance: false,
    });

    const clusters: Array<{
      center: LocationCoordinates;
      items: T[];
      size: number;
    }> = [];
    const processed = new Set<string>();

    result.items.forEach((item) => {
      if (processed.has(item.id) || !item.coordinates) return;

      // Find all items within cluster radius
      const clusterItems = result.items.filter((other) => {
        if (processed.has(other.id) || !other.coordinates) return false;

        const distance = geohashService.calculateDistance(
          item.coordinates as LocationCoordinates,
          other.coordinates as LocationCoordinates
        );

        return distance <= clusterRadius;
      });

      if (clusterItems.length >= minClusterSize) {
        // Mark items as processed
        clusterItems.forEach((clusterItem) => processed.add(clusterItem.id));

        // Calculate cluster center (centroid)
        let sumLat = 0;
        let sumLon = 0;
        clusterItems.forEach((clusterItem) => {
          sumLat += clusterItem.coordinates!.latitude;
          sumLon += clusterItem.coordinates!.longitude;
        });

        clusters.push({
          center: {
            latitude: sumLat / clusterItems.length,
            longitude: sumLon / clusterItems.length,
            timestamp: Date.now(),
          },
          items: clusterItems,
          size: clusterItems.length,
        });
      }
    });

    return clusters.sort((a, b) => b.size - a.size);
  }

  /**
   * Optimize query by estimating result size
   */
  async estimateResultSize(
    center: LocationCoordinates,
    radiusInMeters: number,
    collectionName: string
  ): Promise<{
    estimatedCount: number;
    queriesNeeded: number;
    recommendedPrecision: number;
  }> {
    const precision = geohashService.getAdaptivePrecision(radiusInMeters);
    const bounds = geohashService.getGeohashesInBounds(center, radiusInMeters);

    if (!bounds || !Array.isArray(bounds)) {
      return {
        estimatedCount: 0,
        queriesNeeded: 0,
        recommendedPrecision: precision,
      };
    }

    const cellCount = geohashService.estimateCellCount(
      radiusInMeters,
      precision
    );

    // Rough estimate: assume average distribution
    // In production, you'd sample or use analytics
    const estimatedCount = cellCount * 5; // Assume 5 users per cell

    return {
      estimatedCount,
      queriesNeeded: bounds.length,
      recommendedPrecision: precision,
    };
  }
}

export default FirestoreGeoHelper.getInstance();
