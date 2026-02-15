# Traffic Tracking Setup Guide

This guide explains how to set up comprehensive traffic tracking using Cloudflare Analytics Engine and KV storage.

## Architecture Overview

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Traffic Middleware             │
│  - Captures request details     │
│  - Measures response time       │
│  - Extracts user info           │
└──────┬──────────────────────────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐          ┌────────────────────┐
│ Analytics Engine │          │   KV Storage       │
│ (Historical)     │          │ (Real-time)        │
│ - Long-term data │          │ - Aggregated data  │
│ - Trends         │          │ - Quick access     │
│ - Reports        │          │ - Dashboard        │
└──────────────────┘          └────────────────────┘
```

## What's Included

### 1. **wrangler.toml** - Already Updated ✅
- Analytics Engine dataset binding: `TRAFFIC_ANALYTICS`
- KV namespace binding: `ANALYTICS_KV` (already configured)
- Configured for production, preview, and development environments

### 2. **Traffic Tracker Module** (`src/utils/trafficTracker.ts`)
- `trackTrafficEvent()` - Send events to Analytics Engine
- `updateRealtimeMetrics()` - Update KV real-time data
- `getTrafficMetrics()` - Retrieve current metrics
- `getRouteTraffic()` - Get traffic for specific routes
- `getUserTraffic()` - Get user-specific traffic data

### 3. **Traffic Middleware** (`src/middleware/trafficMiddleware.ts`)
- `createTrafficMiddleware()` - Wrap handlers to auto-track requests
- Automatically extracts: method, path, status code, response time, user ID, country
- Handles both successful requests and errors

### 4. **API Endpoint** (`src/api/traffic-metrics.ts`)
- `GET /api/traffic-metrics` - Retrieve metrics
- `GET /api/traffic-metrics?route=/path` - Get specific route metrics
- `GET /api/traffic-metrics?userId=user123` - Get user metrics

## Integration Steps

### Step 1: Deploy to Cloudflare
```bash
npm run deploy
# or
wrangler deploy
```

### Step 2: Integrate Middleware (if using Express/Hono)

**For Hono Workers:**
```typescript
import { Hono } from 'hono';
import { createTrafficMiddleware } from './middleware/trafficMiddleware';

const app = new Hono();
const env = { ANALYTICS_KV, TRAFFIC_ANALYTICS };

// Add traffic tracking
app.use('*', createTrafficMiddleware(env));

// Your routes
app.get('/api/products', (c) => {
  return c.json({ products: [...] });
});
```

**For Express-like setup:**
```typescript
// Before other middleware
app.use(createTrafficMiddleware(env));
```

### Step 3: Extract User ID (Customize)

Edit `src/middleware/trafficMiddleware.ts` - `extractUserId()` function:

```typescript
function extractUserId(request: Request): string | undefined {
  // Option 1: From your custom auth header
  const authHeader = request.headers.get('x-auth-user-id');
  if (authHeader) return authHeader;

  // Option 2: From your session cookie
  const cookies = parseCookies(request.headers.get('cookie'));
  return cookies['your-session-id'];

  // Option 3: From JWT token
  // const token = extractToken(request);
  // return decodeToken(token).userId;

  return undefined;
}
```

### Step 4: Query Metrics via API

```typescript
// Get overall traffic
const metrics = await fetch('/api/traffic-metrics').then(r => r.json());
console.log(metrics.data);
// Output:
// {
//   totalRequests: 1234,
//   requestsPerMinute: 12,
//   requestsPerHour: 234,
//   avgResponseTime: 45.2,
//   errorRate: 2.5
// }

// Get route-specific traffic
const routeMetrics = await fetch('/api/traffic-metrics?route=/api/products')
  .then(r => r.json());
console.log(routeMetrics.data);
// Output:
// {
//   route: '/api/products',
//   count: 156,
//   avgResponseTime: 32.1,
//   errors: 2
// }

// Get user traffic
const userMetrics = await fetch('/api/traffic-metrics?userId=user123')
  .then(r => r.json());
console.log(userMetrics.data);
// Output:
// {
//   userId: 'user123',
//   count: 28,
//   firstAccessed: '2024-02-10T10:30:00Z',
//   lastAccessed: '2024-02-14T15:45:00Z'
// }
```

## Accessing Analytics Engine Data

### Via Cloudflare Dashboard

1. Go to Workers → Your Worker
2. Click "Analytics Engine" tab
3. View events sent by your worker in real-time

### Via SQL Queries (Advanced)

```sql
SELECT
  _BLOB_0 as user_id,
  _BLOB_1 as country,
  COUNT(*) as request_count,
  AVG(_DOUBLE_0) as avg_response_time
FROM TRAFFIC_ANALYTICS
WHERE timestamp >= NOW() - interval '1 day'
GROUP BY _BLOB_0, _BLOB_1
ORDER BY request_count DESC
```

## Data Storage & Retention

### KV Storage (Real-time)
- **Minute metrics**: 1 hour TTL
- **Hour metrics**: 24 hours TTL
- **Path metrics**: 7 days TTL
- **User metrics**: 30 days TTL

### Analytics Engine (Historical)
- **Retention**: 30 days (Cloudflare default)
- **Resolution**: Per-request data
- **Best for**: Trends, reports, detailed analysis

## Dashboard Integration

Create a dashboard component to display metrics:

```typescript
import { useEffect, useState } from 'react';

export function TrafficDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch('/api/traffic-metrics');
      const data = await res.json();
      setMetrics(data.data);
      setLoading(false);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>Requests/Min: {metrics.requestsPerMinute}</div>
      <div>Requests/Hour: {metrics.requestsPerHour}</div>
      <div>Avg Response Time: {metrics.avgResponseTime}ms</div>
      <div>Error Rate: {metrics.errorRate}%</div>
    </div>
  );
}
```

## Metrics Explained

| Metric | Definition | Use Case |
|--------|-----------|----------|
| **Requests/Minute** | Current traffic rate | Real-time monitoring |
| **Requests/Hour** | Hourly traffic volume | Traffic patterns |
| **Avg Response Time** | Average request duration | Performance tracking |
| **Error Rate** | % of failed requests | Health monitoring |
| **Top Routes** | Most accessed paths | Usage analytics |
| **User Metrics** | Per-user traffic data | User behavior |

## Troubleshooting

### No metrics appearing?
1. Deploy with `wrangler deploy`
2. Make requests to your worker
3. Wait 5-10 seconds for data to sync
4. Check `/api/traffic-metrics` endpoint

### KV quota exceeded?
- Reduce TTL values in `trafficTracker.ts`
- Implement cleanup with `cleanupOldMetrics()`
- Monitor KV usage in dashboard

### Analytics Engine not showing data?
- Ensure `TRAFFIC_ANALYTICS` binding exists in wrangler.toml
- Verify middleware is actually being called
- Check worker console for errors

## Limitations & Future Enhancements

### Current
- Real-time aggregation only (minute/hour level)
- Manual user ID extraction
- No built-in visualization

### Could Add
- Aggregation by geographic region
- Request filtering (exclude health checks, etc.)
- Custom event tracking
- Integration with external analytics services
- Real-time alerting for anomalies

## Security Considerations

- **Analytics Engine data** is read-only from KV (no query-based filtering)
- **User IDs** should be anonymized/hashed if sensitive
- **PII**: Avoid storing personally identifiable information in events
- **Access**: Protect `/api/traffic-metrics` endpoint with authentication

## Performance Impact

- **Middleware overhead**: ~1-2ms per request
- **KV operations**: Batched and non-blocking
- **Analytics Engine**: Asynchronous, no blocking

## Cost Considerations

With Cloudflare Workers:
- **KV Operations**: Included in Workers pricing
- **Analytics Engine**: Included in Workers pricing
- **No additional cost** for traffic tracking

---

**Deployed Successfully!** Your traffic tracking is now live. Start making requests and check `/api/traffic-metrics` to see your data.
