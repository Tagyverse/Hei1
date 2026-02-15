/**
 * Traffic Tracking Middleware for Cloudflare Workers
 * Automatically tracks all incoming requests
 */

import { trackTrafficEvent, updateRealtimeMetrics, TrafficEvent } from '../utils/trafficTracker';

interface WorkerEnv {
  TRAFFIC_ANALYTICS: AnalyticsEngineDataset;
}

/**
 * Creates a middleware handler for automatic traffic tracking
 * Uses Analytics Engine + in-memory cache (no KV needed)
 */
export function createTrafficMiddleware(env: WorkerEnv) {
  return async (request: Request, handler: (request: Request) => Promise<Response>) => {
    const startTime = Date.now();

    try {
      // Call the next handler
      const response = await handler(request);
      const responseTime = Date.now() - startTime;

      // Extract request details
      const url = new URL(request.url);
      const event: TrafficEvent = {
        timestamp: startTime,
        method: request.method,
        path: url.pathname,
        statusCode: response.status,
        referer: request.headers.get('referer') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseTime,
        countryCode: request.headers.get('cf-ipcountry') || undefined,
        userId: extractUserId(request)
      };

      // Track to Analytics Engine (async, non-blocking)
      trackTrafficEvent(env.TRAFFIC_ANALYTICS, event);

      // Update in-memory cache (instant, no I/O)
      updateRealtimeMetrics(env.TRAFFIC_ANALYTICS, event);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const url = new URL(request.url);

      // Track errors too
      const errorEvent: TrafficEvent = {
        timestamp: startTime,
        method: request.method,
        path: url.pathname,
        statusCode: 500,
        referer: request.headers.get('referer') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseTime,
        countryCode: request.headers.get('cf-ipcountry') || undefined,
        userId: extractUserId(request)
      };

      trackTrafficEvent(env.TRAFFIC_ANALYTICS, errorEvent);
      updateRealtimeMetrics(env.TRAFFIC_ANALYTICS, errorEvent);

      throw error;
    }
  };
}

/**
 * Extract user ID from request (implement based on your auth system)
 */
function extractUserId(request: Request): string | undefined {
  try {
    // Option 1: From Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Option 2: From cookie (customize cookie name as needed)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Adjust cookie name to match your auth system
      if (cookies['user-id']) return cookies['user-id'];
      if (cookies['session-id']) return cookies['session-id'];
    }

    // Option 3: From custom headers
    const userId = request.headers.get('x-user-id');
    if (userId) return userId;

    return undefined;
  } catch (error) {
    console.error('[v0] Error extracting user ID:', error);
    return undefined;
  }
}

/**
 * API endpoint to get current traffic metrics
 * Example: GET /api/traffic/metrics
 */
export async function handleTrafficMetricsRequest(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { getTrafficMetrics, getRouteTraffic, getUserTraffic } = await import(
      '../utils/trafficTracker'
    );

    // Get overall metrics
    const metrics = await getTrafficMetrics(env.ANALYTICS_KV);

    // Get top routes
    const url = new URL(request.url);
    const route = url.searchParams.get('route');
    const userId = url.searchParams.get('userId');

    if (route) {
      const routeMetrics = await getRouteTraffic(env.ANALYTICS_KV, route);
      return new Response(
        JSON.stringify({
          success: true,
          data: { route, ...routeMetrics }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    if (userId) {
      const userMetrics = await getUserTraffic(env.ANALYTICS_KV, userId);
      return new Response(
        JSON.stringify({
          success: true,
          data: { userId, ...userMetrics }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    return new Response(JSON.stringify({ success: true, data: metrics }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('[v0] Error getting traffic metrics:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
