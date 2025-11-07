/**
 * Advanced Geohash Service
 *
 * Production-ready geohash utilities with:
 * - Adaptive precision based on density
 * - Efficient neighbor calculations
 * - Boundary overlap handling
 * - Distance-based optimization
 * - Privacy-preserving features
 */

import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';
import {
  LocationCoordinates,
  AdjacentGeohashes,
  GeohashPrecisionLevel,
  GeohashBounds,
  GeohashWithDistance,
} from './types';

/**
 * Geohash precision levels with their characteristics
 * Based on real-world use cases and accuracy requirements
 */
export const GEOHASH_PRECISION_LEVELS: GeohashPrecisionLevel[] = [
  {
    precision: 1,
    cellWidth: 5000000,
    cellHeight: 5000000,
    description: '±2500km',
    useCase: 'Continental regions',
  },
  {
    precision: 2,
    cellWidth: 625000,
    cellHeight: 1250000,
    description: '±630km',
    useCase: 'Countries',
  },
  {
    precision: 3,
    cellWidth: 156000,
    cellHeight: 156000,
    description: '±78km',
    useCase: 'Large cities',
  },
  {
    precision: 4,
    cellWidth: 19500,
    cellHeight: 39100,
    description: '±20km',
    useCase: 'City districts',
  },
  {
    precision: 5,
    cellWidth: 4900,
    cellHeight: 4900,
    description: '±2.4km',
    useCase: 'Neighborhoods',
  },
  {
    precision: 6,
    cellWidth: 610,
    cellHeight: 1220,
    description: '±610m',
    useCase: 'Streets/Blocks',
  },
  {
    precision: 7,
    cellWidth: 153,
    cellHeight: 153,
    description: '±76m',
    useCase: 'Buildings',
  },
  {
    precision: 8,
    cellWidth: 19,
    cellHeight: 38,
    description: '±19m',
    useCase: 'Precise locations',
  },
  {
    precision: 9,
    cellWidth: 4.8,
    cellHeight: 4.8,
    description: '±2.4m',
    useCase: 'Room-level accuracy',
  },
];

class GeohashService {
  private static instance: GeohashService;

  // Base32 encoding for geohash
  private readonly BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

  // Neighbor and border lookups for adjacent geohash calculation
  private readonly NEIGHBORS = {
    right: {
      even: 'bc01fg45238967deuvhjyznpkmstqrwx',
      odd: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
    },
    left: {
      even: '238967debc01fg45kmstqrwxuvhjyznp',
      odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
    },
    top: {
      even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
      odd: 'bc01fg45238967deuvhjyznpkmstqrwx',
    },
    bottom: {
      even: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
      odd: '238967debc01fg45kmstqrwxuvhjyznp',
    },
  };

  private readonly BORDERS = {
    right: { even: 'bcfguvyz', odd: 'prxz' },
    left: { even: '0145hjnp', odd: '028b' },
    top: { even: 'prxz', odd: 'bcfguvyz' },
    bottom: { even: '028b', odd: '0145hjnp' },
  };

  private constructor() {}

  static getInstance(): GeohashService {
    if (!GeohashService.instance) {
      GeohashService.instance = new GeohashService();
    }
    return GeohashService.instance;
  }

  /**
   * Encode coordinates to geohash with specified precision
   */
  encode(latitude: number, longitude: number, precision: number = 9): string {
    return geohashForLocation([latitude, longitude], precision);
  }

  /**
   * Decode geohash to approximate coordinates
   * Returns center point of the geohash cell
   */
  decode(geohash: string): { latitude: number; longitude: number } {
    let evenBit = true;
    let latMin = -90,
      latMax = 90;
    let lonMin = -180,
      lonMax = 180;

    for (let i = 0; i < geohash.length; i++) {
      const chr = geohash.charAt(i);
      const idx = this.BASE32.indexOf(chr);

      if (idx === -1) {
        throw new Error('Invalid geohash');
      }

      for (let n = 4; n >= 0; n--) {
        const bitN = (idx >> n) & 1;
        if (evenBit) {
          // longitude
          const lonMid = (lonMin + lonMax) / 2;
          if (bitN === 1) {
            lonMin = lonMid;
          } else {
            lonMax = lonMid;
          }
        } else {
          // latitude
          const latMid = (latMin + latMax) / 2;
          if (bitN === 1) {
            latMin = latMid;
          } else {
            latMax = latMid;
          }
        }
        evenBit = !evenBit;
      }
    }

    return {
      latitude: (latMin + latMax) / 2,
      longitude: (lonMin + lonMax) / 2,
    };
  }

  /**
   * Get adjacent geohash in a specific direction
   */
  private getAdjacent(
    geohash: string,
    direction: 'right' | 'left' | 'top' | 'bottom'
  ): string {
    if (!geohash || geohash.length === 0) {
      throw new Error('Invalid geohash');
    }

    const lastChar = geohash.charAt(geohash.length - 1);
    let parent = geohash.slice(0, -1);
    const type = geohash.length % 2 === 0 ? 'even' : 'odd';

    // Check if we're at a border
    if (this.BORDERS[direction][type].indexOf(lastChar) !== -1 && parent) {
      parent = this.getAdjacent(parent, direction);
    }

    // Return parent + neighbor
    const neighborChars = this.NEIGHBORS[direction][type];
    const neighborIndex = this.BASE32.indexOf(lastChar);
    return parent + neighborChars.charAt(neighborIndex);
  }

  /**
   * Get all 8 adjacent geohashes plus the center
   */
  getAllAdjacent(geohash: string): AdjacentGeohashes {
    const north = this.getAdjacent(geohash, 'top');
    const south = this.getAdjacent(geohash, 'bottom');
    const east = this.getAdjacent(geohash, 'right');
    const west = this.getAdjacent(geohash, 'left');

    return {
      center: geohash,
      north,
      south,
      east,
      west,
      northeast: this.getAdjacent(north, 'right'),
      northwest: this.getAdjacent(north, 'left'),
      southeast: this.getAdjacent(south, 'right'),
      southwest: this.getAdjacent(south, 'left'),
    };
  }

  /**
   * Get geohashes within a bounding box
   */
  getGeohashesInBounds(
    center: LocationCoordinates,
    radiusInMeters: number
  ): GeohashBounds[] {
    const radiusInKm = radiusInMeters / 1000;
    const bounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm * 1000
    );

    return bounds.map(([lower, upper]) => ({
      lower,
      upper,
      center: this.encode(center.latitude, center.longitude),
    }));
  }

  /**
   * Calculate adaptive precision based on search radius
   * Optimizes query performance by using appropriate cell sizes
   */
  getAdaptivePrecision(radiusInMeters: number): number {
    // For very small radii (< 5m), use maximum precision
    if (radiusInMeters < 5) return 9;

    // For small areas (5-50m), use precision 8
    if (radiusInMeters < 50) return 8;

    // For moderate areas (50-500m), use precision 7
    if (radiusInMeters < 500) return 7;

    // For larger areas (0.5-5km), use precision 6
    if (radiusInMeters < 5000) return 6;

    // For city-scale (5-20km), use precision 5
    if (radiusInMeters < 20000) return 5;

    // For regional scale, use precision 4
    return 4;
  }

  /**
   * Calculate precision based on population density
   * Urban areas need higher precision for accuracy
   */
  getDensityAwarePrecision(
    baseRadiusInMeters: number,
    isUrban: boolean = true
  ): number {
    let precision = this.getAdaptivePrecision(baseRadiusInMeters);

    // Increase precision in urban areas for better accuracy
    if (isUrban && precision < 9) {
      precision += 1;
    }

    return Math.min(precision, 9);
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const distanceKm = distanceBetween(
      [coord1.latitude, coord1.longitude],
      [coord2.latitude, coord2.longitude]
    );
    return distanceKm * 1000; // Convert to meters for accurate distance display
  }

  /**
   * Check if a location is within radius
   */
  isWithinRadius(
    center: LocationCoordinates,
    target: LocationCoordinates,
    radiusInMeters: number
  ): boolean {
    const distance = this.calculateDistance(center, target);
    return distance <= radiusInMeters;
  }

  /**
   * Get precision level information
   */
  getPrecisionInfo(precision: number): GeohashPrecisionLevel | undefined {
    return GEOHASH_PRECISION_LEVELS.find(
      (level) => level.precision === precision
    );
  }

  /**
   * Estimate number of geohash cells needed for a radius
   * Helps optimize query planning
   */
  estimateCellCount(radiusInMeters: number, precision: number): number {
    const precisionInfo = this.getPrecisionInfo(precision);
    if (!precisionInfo) return 1;

    const cellArea = precisionInfo.cellWidth * precisionInfo.cellHeight;
    const searchArea = Math.PI * radiusInMeters * radiusInMeters;

    // Add buffer for edge cases and overlaps
    return Math.ceil((searchArea / cellArea) * 1.5);
  }

  /**
   * Get expanding search radius strategy
   * Useful for "find nearest" queries
   */
  getExpandingSearchRadii(maxRadiusInMeters: number): number[] {
    const radii: number[] = [];
    let currentRadius = 100; // Start with 100m

    while (currentRadius <= maxRadiusInMeters) {
      radii.push(currentRadius);
      currentRadius *= 2; // Double each time
    }

    if (radii[radii.length - 1] < maxRadiusInMeters) {
      radii.push(maxRadiusInMeters);
    }

    return radii;
  }

  /**
   * Sort geohashes by distance from center
   */
  sortByDistance(
    centerGeohash: string,
    targetGeohashes: string[]
  ): GeohashWithDistance[] {
    if (!centerGeohash || !targetGeohashes || !Array.isArray(targetGeohashes)) {
      console.error('Invalid parameters for sortByDistance:', {
        centerGeohash,
        targetGeohashes,
      });
      return [];
    }

    const centerCoords = this.decode(centerGeohash);

    return targetGeohashes
      .map((geohash) => {
        const coords = this.decode(geohash);
        const distance = this.calculateDistance(
          centerCoords as LocationCoordinates,
          coords as LocationCoordinates
        );

        return {
          geohash,
          distance,
          coordinates: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: Date.now(),
          },
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get common prefix of two geohashes
   * Useful for understanding spatial relationship
   */
  getCommonPrefix(geohash1: string, geohash2: string): string {
    let i = 0;
    while (
      i < Math.min(geohash1.length, geohash2.length) &&
      geohash1.charAt(i) === geohash2.charAt(i)
    ) {
      i++;
    }
    return geohash1.substring(0, i);
  }

  /**
   * Check if two geohashes are neighbors
   */
  areNeighbors(geohash1: string, geohash2: string): boolean {
    if (geohash1.length !== geohash2.length) {
      return false;
    }

    const adjacent = this.getAllAdjacent(geohash1);
    const adjacentValues = Object.values(adjacent);

    return adjacentValues.includes(geohash2);
  }

  /**
   * Get geohash bounds box (min/max lat/lon)
   */
  getBounds(geohash: string): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } {
    let evenBit = true;
    let latMin = -90,
      latMax = 90;
    let lonMin = -180,
      lonMax = 180;

    for (let i = 0; i < geohash.length; i++) {
      const chr = geohash.charAt(i);
      const idx = this.BASE32.indexOf(chr);

      for (let n = 4; n >= 0; n--) {
        const bitN = (idx >> n) & 1;
        if (evenBit) {
          const lonMid = (lonMin + lonMax) / 2;
          if (bitN === 1) {
            lonMin = lonMid;
          } else {
            lonMax = lonMid;
          }
        } else {
          const latMid = (latMin + latMax) / 2;
          if (bitN === 1) {
            latMin = latMid;
          } else {
            latMax = latMid;
          }
        }
        evenBit = !evenBit;
      }
    }

    return {
      minLat: latMin,
      maxLat: latMax,
      minLon: lonMin,
      maxLon: lonMax,
    };
  }

  /**
   * Validate geohash format
   */
  isValidGeohash(geohash: string): boolean {
    if (!geohash || geohash.length === 0 || geohash.length > 12) {
      return false;
    }

    for (let i = 0; i < geohash.length; i++) {
      if (this.BASE32.indexOf(geohash.charAt(i)) === -1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cell dimensions for a geohash
   */
  getCellDimensions(geohash: string): {
    widthMeters: number;
    heightMeters: number;
  } {
    const precisionInfo = this.getPrecisionInfo(geohash.length);

    if (!precisionInfo) {
      return { widthMeters: 0, heightMeters: 0 };
    }

    return {
      widthMeters: precisionInfo.cellWidth,
      heightMeters: precisionInfo.cellHeight,
    };
  }
}

export default GeohashService.getInstance();
