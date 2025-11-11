// services/performanceMonitor.ts
/**
 * Performance monitoring service for MeetBridge
 * Tracks query performance, cache hit rates, and system metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface DiscoveryMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  boundsCount: number;
  userId: string;
  filters: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  private discoveryQueries = 0;
  private cacheHits = 0;
  private totalQueryTime = 0;

  /**
   * Track discovery query performance
   */
  async trackDiscoveryPerformance(metrics: DiscoveryMetrics): Promise<void> {
    const { queryTime, resultCount, cacheHit, boundsCount, userId, filters } =
      metrics;

    // Update counters
    this.discoveryQueries++;
    this.totalQueryTime += queryTime;
    if (cacheHit) this.cacheHits++;

    // Store detailed metric
    this.addMetric('discovery_query', queryTime, {
      resultCount,
      cacheHit,
      boundsCount,
      userId: userId.substring(0, 8) + '...', // Anonymize user ID
      filters: {
        gender: filters.gender,
        ageRange: filters.ageRange,
        maxDistance: filters.maxDistance,
        interestsCount: filters.interests?.length || 0,
      },
    });

    // Log performance warnings
    if (queryTime > 1000) {
      console.warn(
        `🐌 Slow discovery query: ${queryTime}ms for ${resultCount} results`
      );
    } else if (queryTime > 2000) {
      console.error(
        `🚨 Very slow discovery query: ${queryTime}ms for ${resultCount} results`
      );
    }

    // Log cache performance
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < 0.5 && this.discoveryQueries > 10) {
      console.warn(
        `📉 Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`
      );
    }
  }

  /**
   * Track cache operation
   */
  async trackCacheOperation(
    operation: 'get' | 'set' | 'delete',
    key: string,
    hit: boolean = false
  ): Promise<void> {
    this.addMetric(`cache_${operation}`, hit ? 1 : 0, {
      key: key.substring(0, 20) + (key.length > 20 ? '...' : ''),
      hit,
    });
  }

  /**
   * Track Firestore query performance
   */
  async trackFirestoreQuery(
    collection: string,
    operation: string,
    queryTime: number,
    docCount: number
  ): Promise<void> {
    this.addMetric('firestore_query', queryTime, {
      collection,
      operation,
      docCount,
    });

    if (queryTime > 500) {
      console.warn(
        `🐌 Slow Firestore query: ${collection}.${operation} took ${queryTime}ms`
      );
    }
  }

  /**
   * Track real-time connection metrics
   */
  async trackRealtimeConnections(activeConnections: number): Promise<void> {
    this.addMetric('realtime_connections', activeConnections);

    if (activeConnections > 1000) {
      console.warn(`📈 High real-time connections: ${activeConnections}`);
    }
  }

  /**
   * Track user interaction performance
   */
  async trackUserInteraction(
    action: 'like' | 'dislike' | 'match',
    responseTime: number
  ): Promise<void> {
    this.addMetric(`user_${action}`, responseTime);

    if (responseTime > 1000) {
      console.warn(`🐌 Slow ${action} response: ${responseTime}ms`);
    }
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    return this.discoveryQueries > 0
      ? this.cacheHits / this.discoveryQueries
      : 0;
  }

  /**
   * Get average discovery query time
   */
  getAverageDiscoveryTime(): number {
    return this.discoveryQueries > 0
      ? this.totalQueryTime / this.discoveryQueries
      : 0;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    discoveryQueries: number;
    averageQueryTime: number;
    cacheHitRate: number;
    totalMetrics: number;
    recentMetrics: PerformanceMetric[];
  } {
    return {
      discoveryQueries: this.discoveryQueries,
      averageQueryTime: this.getAverageDiscoveryTime(),
      cacheHitRate: this.getCacheHitRate(),
      totalMetrics: this.metrics.length,
      recentMetrics: this.metrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string, limit: number = 50): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name).slice(-limit);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear old metrics to prevent memory issues
   */
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    // 24 hours
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter((metric) => metric.timestamp > cutoff);
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics = [];
    this.discoveryQueries = 0;
    this.cacheHits = 0;
    this.totalQueryTime = 0;
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Maintain max metrics limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log important metrics
    if (name === 'discovery_query' && value > 1000) {
      console.log(`📊 Performance metric: ${name} = ${value}ms`, metadata);
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup old metrics every hour
if (typeof global !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldMetrics();
  }, 60 * 60 * 1000); // 1 hour
}

export default performanceMonitor;
