# Traffic Analytics Setup Guide

Your traffic analytics is already coded correctly. The KV namespace exists with ID: `ba6101c8b9044469a2981a20bc87ac27`

## Two Deployment Methods

### Method 1: Using Wrangler CLI (Recommended - Bindings Work)

This method applies bindings from wrangler.toml automatically.

#### Step 1: Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

#### Step 2: Verify KV Namespace

Check if the KV namespace exists:

```bash
wrangler kv:namespace list
```

You should see a namespace with ID `ba6101c8b9044469a2981a20bc87ac27`. If not, create it:

```bash
wrangler kv:namespace create "ANALYTICS_KV"
```

Then update the ID in `wrangler.toml` line 19.

#### Step 3: Create R2 Bucket

```bash
wrangler r2 bucket create pixie-blooms-images
```

#### Step 4: Build and Deploy

```bash
npm run build
wrangler pages deploy dist --project-name=pixieblooms
```

Wrangler will automatically apply all bindings from wrangler.toml.

#### Step 5: Verify

After deployment, visit your site's `/admin` page and check Traffic Analytics. It should show real data.

---

### Method 2: Git Deployment (Requires Manual Dashboard Setup)

If you prefer deploying via git push, you need to add bindings manually in the dashboard.

#### Step 1: Remove Bindings from wrangler.toml

Comment out the bindings so the dashboard allows manual configuration:

```toml
# [[kv_namespaces]]
# binding = "ANALYTICS_KV"
# id = "ba6101c8b9044469a2981a20bc87ac27"

# [[r2_buckets]]
# binding = "R2_BUCKET"
# bucket_name = "pixie-blooms-images"
# preview_bucket_name = "pixie-blooms-images"
```

Also comment out the env.production and env.preview binding sections.

#### Step 2: Create R2 Bucket

1. Go to Cloudflare Dashboard → **R2**
2. Click **Create bucket**
3. Name: `pixie-blooms-images`
4. Click **Create bucket**

#### Step 3: Add Bindings in Dashboard

1. Go to **Workers & Pages** → **Your Project** (pixieblooms)
2. Click **Settings** → **Functions** → **Bindings**
3. Click **+ Add**

**Add KV Binding:**
- Type: KV namespace
- Variable name: `ANALYTICS_KV` (exactly this)
- KV namespace: Select the namespace with ID `ba6101c8b9044469a2981a20bc87ac27`
- Save

**Add R2 Binding:**
- Click **+ Add** again
- Type: R2 bucket
- Variable name: `R2_BUCKET` (exactly this)
- R2 bucket: `pixie-blooms-images`
- Save

#### Step 4: Deploy

```bash
git add .
git commit -m "Update bindings configuration"
git push
```

Or click "Retry deployment" in the Cloudflare dashboard.

---

## How Traffic Analytics Works

Your app has two analytics implementations:

### 1. KV-Based Analytics (Custom Tracking)

**Files:**
- `/functions/api/track-view.ts` - Records page views to KV
- `/functions/api/get-analytics.ts` - Retrieves analytics from KV

**How it works:**
- Stores each page view in KV with key `view:timestamp:random`
- Keeps data for 90 days
- Tracks: path, country, city, browser, device, session

**Frontend integration:**
```javascript
// This is already in your code
fetch('/api/track-view', {
  method: 'POST',
  body: JSON.stringify({
    path: window.location.pathname,
    referrer: document.referrer,
    sessionId: 'generated-session-id'
  })
});
```

### 2. Cloudflare Web Analytics (Official API)

**File:**
- `/functions/api/cloudflare-analytics.ts` - Fetches from Cloudflare's GraphQL API

**How it works:**
- Uses Cloudflare's Web Analytics API
- Requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_ANALYTICS_TOKEN`
- Queries RUM (Real User Monitoring) data

---

## Testing Traffic Analytics

### Test KV Analytics

1. Visit your deployed site
2. Browse a few pages
3. Go to `/admin`
4. Click **Traffic Analytics** tab
5. You should see:
   - Today's views
   - Total views
   - Top pages
   - Countries
   - Browser/device stats
   - Hourly/weekly charts

### Check if KV is Working

Open browser console on your site:

```javascript
// Track a test view
fetch('/api/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/test',
    referrer: document.referrer,
    sessionId: 'test-session-' + Date.now()
  })
})
.then(r => r.json())
.then(data => console.log('Track result:', data));

// Get analytics
fetch('/api/get-analytics')
  .then(r => r.json())
  .then(data => console.log('Analytics:', data));
```

If you see errors like "ANALYTICS_KV binding not configured", the binding isn't connected yet.

---

## Troubleshooting

### Error: "ANALYTICS_KV binding not configured"

**Cause:** The KV binding isn't connected to your Functions.

**Solution:**
- If using Wrangler CLI: Deploy with `wrangler pages deploy`
- If using git: Add binding manually in dashboard (see Method 2)

### Empty Analytics Data

**Cause:** No traffic has been tracked yet.

**Solution:**
- Visit your site and browse a few pages
- Wait a minute for data to be written to KV
- Refresh the analytics page

### KV Namespace Not Found

**Cause:** The KV namespace doesn't exist or ID is wrong.

**Solution:**
```bash
wrangler kv:namespace list
```

Find your namespace ID and update line 19 in `wrangler.toml`.

---

## Which Method Should You Use?

### Use Wrangler CLI if:
- You want configuration in code (infrastructure as code)
- You need bindings for local development
- You want consistency across environments

### Use Git + Dashboard if:
- You prefer clicking over CLI commands
- You want visual confirmation of settings
- You're more comfortable with web interfaces

Both methods work equally well. Choose based on your preference.

---

## Current Configuration

Your `wrangler.toml` currently has:

```toml
[[kv_namespaces]]
binding = "ANALYTICS_KV"
id = "ba6101c8b9044469a2981a20bc87ac27"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "pixie-blooms-images"
```

If deploying with Wrangler CLI: **Keep these** ✅
If deploying with git: **Comment these out** and add bindings in dashboard ⚠️
