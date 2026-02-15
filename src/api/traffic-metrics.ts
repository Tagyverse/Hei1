/**
 * API Route: GET /api/traffic-metrics
 * Returns current traffic analytics from in-memory cache
 * 
 * Query Parameters:
 * - route: Get metrics for a specific route
 * - period: 'minute', 'hour' (default: 'current')
 */

import { getTrafficMetrics, getRouteTraffic } from '../utils/trafficTracker';
import { cacheMetricsResponse } from '../utils/cloudflareCache';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const route = url.searchParams.get('route');

    let metrics;
    
    if (route) {
      // Get metrics for specific route
      metrics = getRouteTraffic(route);
    } else {
      // Get overall metrics
      metrics = getTrafficMetrics();
    }

    // Cache for 1 minute
    return cacheMetricsResponse(metrics, 60);
  } catch (error) {
    console.error('[v0] Error getting traffic metrics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch metrics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST handler for recording traffic events
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const event = await request.json();
    
    // Validate event structure
    if (!event.method || !event.path) {
      return new Response(
        JSON.stringify({ error: 'Invalid event structure' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log traffic event for Analytics Engine (would be sent to real analytics system)
    console.log('[v0] Traffic Event:', event.method, event.path, event.statusCode, `${event.responseTime}ms`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, tracked: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[v0] Error processing traffic event:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Example usage:
 *
 * // Get overall metrics
 * fetch('/api/traffic-metrics')
 *
 * // Get metrics for a specific route
 * fetch('/api/traffic-metrics?route=/api/products')
 *
 * // Track traffic event
 * fetch('/api/traffic-metrics', {
 *   method: 'POST',
 *   body: JSON.stringify({ method: 'GET', path: '/', statusCode: 200, responseTime: 45 })
 * })
 */
