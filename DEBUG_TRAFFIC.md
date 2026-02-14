# Traffic/Analytics Debugging Guide

## Expected Console Output

When you refresh the app, you should see these messages in the browser console (F12):

```
[v0] Analytics initialized
[v0] Tracking page view: /
[v0] Tracking event: session_start
[v0] Tracking page view: /
[v0] Page view recorded: /
[v0] Event recorded: session_start
[v0] Analytics ready - monitoring page changes
```

## Step 1: Check Console Logs

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Refresh the page (Ctrl+R or Cmd+R)
4. Look for messages starting with `[v0]`

### Expected Messages:
- `[v0] Analytics initialized`
- `[v0] Tracking page view: /`
- `[v0] Tracking event: session_start`
- `[v0] Page view recorded: /`
- `[v0] Event recorded: session_start`
- `[v0] Analytics ready - monitoring page changes`

## Step 2: Check Network Requests

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by XHR/Fetch
4. Refresh the page
5. Look for requests to:
   - `/api/track-view` - Should see POST request with status 200
   - `/api/track-event` - Should see POST request with status 200

### What You'll See:
- Request method: POST
- Status: 200 (success) or 500 (error)
- Response: `{"success": true}`

## Step 3: Check KV Data in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Storage** → **KV** → **ANALYTICS_KV**
4. Click **Browse**
5. Look for keys like:
   - `view:timestamp:id` - Page views
   - `event_count:session_start:date` - Session count
   - `daily:YYYY-MM-DD` - Daily view count

## Step 4: Verify API Endpoints Exist

Check that these endpoints exist:
- `/functions/api/track-view.ts` - ✓ Exists
- `/functions/api/track-event.ts` - ✓ Exists

## Common Issues and Fixes

### Issue: No Console Messages
**Problem**: Analytics not running at all

**Solution**:
1. Check that `initAnalytics()` is called in App.tsx
2. Check browser console for JavaScript errors
3. Try refreshing with Ctrl+Shift+R (hard refresh)

---

### Issue: Console Shows Messages but Network Requests Fail
**Problem**: Analytics initialized but API calls not working

**Cause**: Likely CORS issue or endpoint not deployed

**Solution**:
1. Check Network tab for error details
2. Verify `/api/track-view` and `/api/track-event` endpoints exist
3. Check for 404 errors (endpoint missing)
4. Check for 500 errors (server error)

---

### Issue: Network Requests Succeed but No Data in KV
**Problem**: API calls succeed but data not stored

**Cause**: Environment variable ANALYTICS_KV not connected

**Solution**:
1. Go to Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. Verify `ANALYTICS_KV` is connected to KV store
4. Redeploy after checking

---

### Issue: "403 Unauthorized" Errors
**Problem**: KV access denied

**Solution**:
1. Check KV namespace permissions
2. Ensure ANALYTICS_KV is properly bound in wrangler.toml
3. Redeploy functions

---

## Testing Steps

### Test 1: Manual API Call
Open browser console and run:
```javascript
fetch('/api/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/test',
    sessionId: 'test-session',
    referrer: '',
    userId: null,
    timestamp: new Date().toISOString(),
  })
}).then(r => r.json()).then(console.log)
```

Expected response: `{ success: true }`

---

### Test 2: Check KV Keys
In console, refresh and wait 2 seconds, then check Vercel KV dashboard for new keys.

---

## What the Data Looks Like

### view:* (Page Views)
```json
{
  "path": "/",
  "referrer": "",
  "sessionId": "uuid",
  "userAgent": "Mozilla/5.0...",
  "country": "IN",
  "browser": "Chrome",
  "deviceType": "Desktop",
  "timestamp": 1708888800000
}
```

### event_count:* (Event Counts)
```
event_count:session_start:2024-02-14 = 5
```

### daily:* (Daily Totals)
```
daily:2024-02-14 = 42
```

---

## Next Steps

1. **Refresh app and check console** - Look for `[v0]` messages
2. **Check Network tab** - Verify `/api/track-view` and `/api/track-event` requests
3. **Check KV dashboard** - Verify data is being stored
4. **If still not working** - Check the error messages in console/network

All troubleshooting info will be in the browser console with `[v0]` prefix!
