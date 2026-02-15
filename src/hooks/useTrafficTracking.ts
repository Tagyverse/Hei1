import { useEffect } from 'react';

interface TrafficEvent {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  referer?: string;
  userAgent?: string;
  countryCode?: string;
}

/**
 * Hook for client-side traffic tracking
 * Automatically tracks page views and API calls
 */
export function useTrafficTracking() {
  useEffect(() => {
    const pageStartTime = Date.now();

    // Track page view on mount
    const trackPageView = async () => {
      try {
        const event: TrafficEvent = {
          timestamp: pageStartTime,
          method: 'GET',
          path: window.location.pathname,
          statusCode: 200,
          responseTime: Date.now() - pageStartTime,
          referer: document.referrer || undefined,
          userAgent: navigator.userAgent,
          countryCode: undefined
        };

        // Send to analytics via fetch (fire-and-forget)
        fetch('/api/traffic-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true // Ensures request completes even if page unloads
        }).catch(err => console.error('[v0] Traffic tracking failed:', err));
      } catch (error) {
        console.error('[v0] Error tracking page view:', error);
      }
    };

    // Track on mount
    trackPageView();

    // Cleanup: Track time spent on page
    return () => {
      const timeSpent = Date.now() - pageStartTime;
      try {
        const event: TrafficEvent = {
          timestamp: pageStartTime,
          method: 'GET',
          path: window.location.pathname,
          statusCode: 200,
          responseTime: timeSpent,
          referer: document.referrer || undefined
        };

        fetch('/api/traffic-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true
        }).catch(() => {}); // Silent fail on cleanup
      } catch (error) {
        // Silently fail on cleanup
      }
    };
  }, []);

  // Intercept fetch calls for API tracking
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

      return originalFetch.apply(this, args).then(response => {
        const responseTime = Date.now() - startTime;

        // Only track API calls, not static assets
        if (url && !url.match(/\.(js|css|woff2|png|jpg|svg|gif|webp)$/)) {
          try {
            const path = new URL(url, window.location.origin).pathname;
            const event: TrafficEvent = {
              timestamp: startTime,
              method: (args[1]?.method || 'GET') as string,
              path,
              statusCode: response.status,
              responseTime
            };

            // Send tracking data (non-blocking)
            navigator.sendBeacon('/api/traffic-metrics', JSON.stringify(event));
          } catch (error) {
            // Silently fail - don't disrupt API calls
          }
        }

        return response;
      });
    };

    return () => {
      // Restore original fetch on unmount
      window.fetch = originalFetch;
    };
  }, []);
}

/**
 * Hook to manually track custom events
 */
export function useTrackEvent() {
  return (eventName: string, metadata?: Record<string, any>) => {
    try {
      const event: any = {
        timestamp: Date.now(),
        method: 'POST',
        path: `/events/${eventName}`,
        statusCode: 200,
        responseTime: 0,
        ...metadata
      };

      navigator.sendBeacon('/api/traffic-metrics', JSON.stringify(event));
    } catch (error) {
      console.error('[v0] Error tracking custom event:', error);
    }
  };
}
