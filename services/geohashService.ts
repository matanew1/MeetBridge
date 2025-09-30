// services/geohashService.ts
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoData {
  geohash: string;
  coordinates: Coordinates;
}

class GeohashService {
  /**
   * Generate geohash from coordinates
   */
  generateGeohash(latitude: number, longitude: number): string {
    return geohashForLocation([latitude, longitude]);
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    return (
      distanceBetween(
        [coord1.latitude, coord1.longitude],
        [coord2.latitude, coord2.longitude]
      ) * 1000
    ); // Convert km to meters
  }

  /**
   * Get query bounds for searching within a radius
   * @param center Center coordinates
   * @param radiusInMeters Search radius in meters
   * @returns Array of [start, end] geohash bounds
   */
  getQueryBounds(
    center: Coordinates,
    radiusInMeters: number
  ): [string, string][] {
    const radiusInKm = radiusInMeters / 1000;
    return geohashQueryBounds([center.latitude, center.longitude], radiusInKm);
  }

  /**
   * Check if a location is within radius
   */
  isWithinRadius(
    center: Coordinates,
    target: Coordinates,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateDistance(center, target);
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
          const distance = this.calculateDistance(center, location.coordinates);
          return { ...location, distance };
        }
        return location;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export default new GeohashService();
