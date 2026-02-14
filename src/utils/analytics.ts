let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;

  const stored = sessionStorage.getItem('analytics_session_id');
  if (stored) {
    sessionId = stored;
    return sessionId;
  }

  sessionId = crypto.randomUUID();
  sessionStorage.setItem('analytics_session_id', sessionId);
  return sessionId;
}

/**
 * Track page view to KV via API endpoint
 */
export async function trackPageView(path: string, metadata?: Record<string, any>) {
  try {
    const sessionId = getSessionId();
    const userId = localStorage.getItem('userId');

    console.log('[v0] Tracking page view:', path);

    // Log to KV API endpoint (fire and forget)
    const response = fetch('/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        referrer: document.referrer,
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        metadata,
      }),
    });

    response
      .then(res => {
        if (res.ok) {
          console.log('[v0] Page view recorded:', path);
        } else {
          console.warn('[v0] Page view track failed:', res.status);
        }
      })
      .catch(err => console.warn('[v0] Page view track error:', err.message));
  } catch (error) {
    console.warn('[v0] Page view error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Track custom events to KV via API endpoint
 */
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>
): Promise<void> {
  try {
    const sessionId = getSessionId();
    const userId = localStorage.getItem('userId');

    console.log('[v0] Tracking event:', eventType, eventData);

    // Log to KV API endpoint (fire and forget)
    const response = fetch('/api/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        data: eventData,
      }),
    });

    response
      .then(res => {
        if (res.ok) {
          console.log('[v0] Event recorded:', eventType);
        } else {
          console.warn('[v0] Event track failed:', eventType, res.status);
        }
      })
      .catch(err => console.warn('[v0] Event track error:', eventType, err.message));
  } catch (error) {
    console.warn('[v0] Event error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Track bill generation
 */
export async function trackBillGenerated(
  orderId: string,
  itemCount: number,
  totalAmount: number
): Promise<void> {
  await trackEvent('bill_generated', {
    order_id: orderId,
    item_count: itemCount,
    total_amount: totalAmount,
  });
}

/**
 * Track bill download
 */
export async function trackBillDownload(
  orderId: string,
  format: 'pdf' | 'jpg' | 'print'
): Promise<void> {
  await trackEvent('bill_download', {
    order_id: orderId,
    format,
  });
}

/**
 * Track admin action
 */
export async function trackAdminAction(
  action: string,
  details?: Record<string, any>
): Promise<void> {
  const adminId = localStorage.getItem('adminId');
  await trackEvent('admin_action', {
    action,
    admin_id: adminId,
    ...details,
  });
}

/**
 * Track try-on usage
 */
export async function trackTryOn(
  productId: string,
  method: 'camera' | 'upload'
): Promise<void> {
  await trackEvent('try_on_used', {
    product_id: productId,
    method,
  });
}

/**
 * Track product interaction
 */
export async function trackProductView(
  productId: string,
  productName: string
): Promise<void> {
  await trackEvent('product_viewed', {
    product_id: productId,
    product_name: productName,
  });
}

/**
 * Track add to cart
 */
export async function trackAddToCart(
  productId: string,
  quantity: number,
  price: number
): Promise<void> {
  await trackEvent('add_to_cart', {
    product_id: productId,
    quantity,
    price,
  });
}

/**
 * Track purchase
 */
export async function trackPurchase(
  orderId: string,
  totalAmount: number,
  itemCount: number
): Promise<void> {
  await trackEvent('purchase_completed', {
    order_id: orderId,
    total_amount: totalAmount,
    item_count: itemCount,
  });
}

/**
 * Initialize analytics tracking
 */
export function initAnalytics() {
  console.log('[v0] Analytics initialized');

  // Track initial page view
  trackPageView(window.location.pathname);

  let lastPath = window.location.pathname;
  const checkPathInterval = setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      trackPageView(currentPath);
      lastPath = currentPath;
    }
  }, 1000);

  // Track user session start
  console.log('[v0] Tracking session start');
  trackEvent('session_start', {
    user_agent: navigator.userAgent,
    language: navigator.language,
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(checkPathInterval);
    console.log('[v0] Tracking session end');
    trackEvent('session_end');
  });

  console.log('[v0] Analytics ready - monitoring page changes');

  return { clearInterval };
}
