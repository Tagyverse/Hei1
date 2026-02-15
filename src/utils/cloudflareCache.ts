/**
 * Cloudflare Cache Optimization Module
 * Uses Cloudflare Cache API instead of KV for better performance and cost efficiency
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  cacheControl?: string;
}

/**
 * Generate cache key with prefix to avoid collisions
 */
export function generateCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.filter(Boolean).join(':')}`;
}

/**
 * Set cache with automatic expiration
 * Uses Response headers for cache control
 */
export function createCachedResponse(
  data: any,
  options: { ttl?: number; key?: string } = {}
): Response {
  const ttl = options.ttl || 300; // Default 5 minutes
  const cacheControl = `public, max-age=${ttl}`;

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      'Expires': new Date(Date.now() + ttl * 1000).toUTCString(),
      'X-Cache-Key': options.key || 'unknown',
      'X-Cache-TTL': String(ttl)
    }
  });
}

/**
 * Cache metrics data with browser/edge caching
 */
export function cacheMetricsResponse(metrics: any, ttl: number = 60): Response {
  return createCachedResponse(metrics, {
    ttl,
    key: 'traffic-metrics'
  });
}

/**
 * Cache page content with longer TTL for static content
 */
export function cachePageResponse(html: string, ttl: number = 3600): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, max-age=${ttl}`,
      'Expires': new Date(Date.now() + ttl * 1000).toUTCString(),
      'X-Cache-TTL': String(ttl)
    }
  });
}

/**
 * Cache API data with smart TTL based on route
 */
export function getOptimalTTL(path: string): number {
  // Static assets - cache for 1 day
  if (path.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
    return 86400;
  }
  
  // API endpoints - cache for 1 minute
  if (path.startsWith('/api/')) {
    return 60;
  }
  
  // Pages - cache for 5 minutes
  if (path === '/' || path.match(/^\/\w+$/)) {
    return 300;
  }
  
  // Default - no cache
  return 0;
}

/**
 * Build cache key from request
 */
export function buildCacheKey(request: Request): string {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  
  // Include query params only for certain endpoints
  const includeQuery = path.startsWith('/api/');
  const queryPart = includeQuery ? url.search : '';
  
  return `${method}:${path}${queryPart}`;
}

/**
 * Check if request should be cached
 */
export function shouldCache(request: Request): boolean {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Don't cache admin or checkout pages
  if (path.includes('/admin') || path.includes('/checkout')) {
    return false;
  }
  
  // Don't cache if has auth token in URL
  if (url.searchParams.get('token')) {
    return false;
  }
  
  return true;
}

/**
 * Purge cache by pattern (calls Cloudflare API)
 */
export async function purgeCacheByPattern(
  pattern: string,
  accountId: string,
  token: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${accountId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: [pattern]
        })
      }
    );

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('[v0] Error purging cache:', error);
    return false;
  }
}

/**
 * Add cache headers to response
 */
export function withCacheHeaders(response: Response, ttl: number): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', `public, max-age=${ttl}`);
  newResponse.headers.set('Expires', new Date(Date.now() + ttl * 1000).toUTCString());
  newResponse.headers.set('X-Cache-TTL', String(ttl));
  return newResponse;
}

/**
 * Strip sensitive headers before caching
 */
export function stripSensitiveHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.delete('Set-Cookie');
  newResponse.headers.delete('Authorization');
  newResponse.headers.delete('X-Auth-Token');
  return newResponse;
}

/**
 * Get cache stats header for monitoring
 */
export function getCacheStatsHeader(
  cacheStatus?: string,
  ttl?: number,
  age?: number
): Record<string, string> {
  return {
    'X-Cache-Status': cacheStatus || 'UNKNOWN',
    'X-Cache-TTL': ttl ? String(ttl) : '0',
    'X-Cache-Age': age ? String(age) : '0'
  };
}
