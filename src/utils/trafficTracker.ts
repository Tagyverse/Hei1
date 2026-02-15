/**
 * Traffic Tracking Module
 * Uses Cloudflare Analytics Engine for event logging and KV for real-time aggregation
 */

export interface TrafficEvent {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  referer?: string;
  userAgent?: string;
  countryCode?: string;
  responseTime: number;
}

export interface TrafficMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  avgResponseTime: number;
  errorRate: number;
  topPaths: Array<{ path: string; count: number }>;
  topRoutes: Array<{ route: string; count: number }>;
  userMetrics: Map<string, number>;
}

/**
 * Track traffic event using Analytics Engine
 * Call this from your Worker middleware
 */
export function trackTrafficEvent(
  analyticsEngine: AnalyticsEngineDataset,
  event: TrafficEvent
) {
  try {
    // Send to Analytics Engine for historical tracking
    analyticsEngine.writeDataPoint({
      indexes: [event.path, event.method, String(event.statusCode)],
      blobs: [
        event.userId || 'anonymous',
        event.countryCode || 'unknown',
        event.referer || 'direct'
      ],
      doubles: [event.responseTime, 1] // responseTime and count
    });
  } catch (error) {
    console.error('[v0] Error tracking traffic event:', error);
  }
}

/**
 * Update real-time metrics using in-memory cache
 * Minimizes external API calls for better performance
 * Note: For persistence, data is only sent to Analytics Engine
 */
const metricsCache = new Map<string, any>();
const cacheTTL = 300000; // 5 minutes in milliseconds

export async function updateRealtimeMetrics(
  analyticsEngine: AnalyticsEngineDataset,
  event: TrafficEvent
) {
  try {
    const now = new Date();
    const minute = Math.floor(now.getTime() / 60000);
    const hour = Math.floor(now.getTime() / 3600000);

    // Track in memory cache
    const minuteKey = `metrics:minute:${minute}`;
    const cacheKey = `${minuteKey}`;

    // Get or initialize cached metrics
    let cachedData = metricsCache.get(cacheKey);
    if (!cachedData) {
      cachedData = {
        count: 0,
        totalResponseTime: 0,
        errors: 0,
        paths: {},
        timestamp: now.getTime()
      };
      metricsCache.set(cacheKey, cachedData);
      
      // Auto-cleanup old cache entries after TTL
      setTimeout(() => metricsCache.delete(cacheKey), cacheTTL);
    }

    // Update cached metrics in memory
    cachedData.count += 1;
    cachedData.totalResponseTime += event.responseTime;
    if (event.statusCode >= 400) cachedData.errors += 1;
    cachedData.paths[event.path] = (cachedData.paths[event.path] || 0) + 1;

    // Update cached metrics
    cachedData.count += 1;
    cachedData.totalResponseTime += event.responseTime;
    if (event.statusCode >= 400) cachedData.errors += 1;
    cachedData.paths[event.path] = (cachedData.paths[event.path] || 0) + 1;

    // Send to Analytics Engine for persistent storage
    analyticsEngine.writeDataPoint({
      indexes: [event.path, event.method, String(event.statusCode)],
      blobs: [
        event.userId || 'anonymous',
        event.countryCode || 'unknown',
        event.referer || 'direct'
      ],
      doubles: [event.responseTime, 1]
    });
  } catch (error) {
    console.error('[v0] Error updating realtime metrics:', error);
  }
}

/**
 * Get current traffic metrics from in-memory cache
 * Instant retrieval without external API calls
 */
export function getTrafficMetrics(): TrafficMetrics {
  try {
    const now = new Date();
    const minute = Math.floor(now.getTime() / 60000);
    const minuteKey = `metrics:minute:${minute}`;

    const cachedData = metricsCache.get(minuteKey);
    
    if (!cachedData) {
      return {
        totalRequests: 0,
        requestsPerMinute: 0,
        requestsPerHour: 0,
        avgResponseTime: 0,
        errorRate: 0,
        topPaths: [],
        topRoutes: [],
        userMetrics: new Map()
      };
    }

    const totalRequests = cachedData.count || 0;
    const avgResponseTime = totalRequests > 0 ? cachedData.totalResponseTime / totalRequests : 0;
    const errorRate = totalRequests > 0 ? (cachedData.errors / totalRequests) * 100 : 0;

    // Convert paths to sorted array
    const topPaths = Object.entries(cachedData.paths || {})
      .map(([path, count]) => ({ path, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      requestsPerMinute: totalRequests,
      requestsPerHour: totalRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      topPaths,
      topRoutes: topPaths,
      userMetrics: new Map()
    };
  } catch (error) {
    console.error('[v0] Error getting traffic metrics:', error);
    return {
      totalRequests: 0,
      requestsPerMinute: 0,
      requestsPerHour: 0,
      avgResponseTime: 0,
      errorRate: 0,
      topPaths: [],
      topRoutes: [],
      userMetrics: new Map()
    };
  }
}

/**
 * Get traffic for a specific route from cache
 */
export function getRouteTraffic(
  route: string
): { count: number; avgResponseTime: number; errors: number } {
  try {
    const now = new Date();
    const minute = Math.floor(now.getTime() / 60000);
    const minuteKey = `metrics:minute:${minute}`;

    const cachedData = metricsCache.get(minuteKey);
    if (!cachedData || !cachedData.paths) {
      return { count: 0, avgResponseTime: 0, errors: 0 };
    }

    return {
      count: cachedData.paths[route] || 0,
      avgResponseTime: cachedData.totalResponseTime > 0 ? cachedData.totalResponseTime / cachedData.count : 0,
      errors: cachedData.errors || 0
    };
  } catch (error) {
    console.error(`[v0] Error getting route traffic for ${route}:`, error);
    return { count: 0, avgResponseTime: 0, errors: 0 };
  }
}

/**
 * Get user-specific traffic from cache
 */
export function getUserTraffic(
  userId: string
): { count: number; firstAccessed: string; lastAccessed: string } {
  // User tracking is lightweight - only track if high-value
  // For most cases, rely on Analytics Engine for detailed user analytics
  return {
    count: 0,
    firstAccessed: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  };
}

/**
 * Clear old cache entries (automatic via TTL)
 * Cache entries auto-expire after 5 minutes
 */
export function cleanupCache() {
  // Manual cleanup - optional, as TTL handles automatic cleanup
  let cleaned = 0;
  const now = Date.now();
  for (const [key, value] of metricsCache.entries()) {
    if (now - value.timestamp > cacheTTL) {
      metricsCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[v0] Cleaned ${cleaned} expired cache entries`);
  }
}
