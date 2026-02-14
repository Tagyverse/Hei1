# Wrangler Deployment with R2 Bindings

Since you're managing bindings through `wrangler.toml`, follow these steps to deploy with full R2 support.

## Prerequisites

```bash
npm install -g wrangler
wrangler login
```

## Step 1: Create R2 Bucket

The `wrangler.toml` expects a bucket named `pixie-blooms-images`. Create it:

```bash
wrangler r2 bucket create pixie-blooms-images
```

You should see:
```
✅ Created bucket 'pixie-blooms-images'
```

### Verify Bucket Exists

```bash
wrangler r2 bucket list
```

You should see `pixie-blooms-images` in the list.

## Step 2: Create KV Namespace (for Analytics)

```bash
wrangler kv:namespace create "ANALYTICS_KV"
```

This will output something like:
```
{ binding = "ANALYTICS_KV", id = "abc123def456..." }
```

**Copy the ID** and update `wrangler.toml` line 19:

```toml
[[kv_namespaces]]
binding = "ANALYTICS_KV"
id = "abc123def456..."  # ← Replace with your actual ID
```

## Step 3: Verify wrangler.toml Configuration

Your `wrangler.toml` should have:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "pixie-blooms-images"
preview_bucket_name = "pixie-blooms-images"

[[kv_namespaces]]
binding = "ANALYTICS_KV"
id = "your-actual-kv-id"  # ← Must be real ID from Step 2
```

## Step 4: Build and Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=pixieblooms3

# Or if this is first deployment:
wrangler pages deploy dist --project-name=your-project-name
```

Wrangler will:
- Upload your built site
- Apply R2 and KV bindings from `wrangler.toml`
- Set up all environment variables
- Configure functions with proper bindings

## Step 5: Verify Deployment

After deployment completes, you'll see a URL like:
```
https://abc123.pixieblooms3.pages.dev
```

### Test R2 Upload

```bash
# Replace with your actual deployment URL
curl -X POST https://your-site.pages.dev/api/r2-upload \
  -F "file=@test.png"
```

Should return:
```json
{
  "url": "/api/r2-image?key=images/...",
  "fileName": "images/1234567890-abc.png",
  "size": 12345,
  "type": "image/png"
}
```

### Test R2 List

```bash
curl https://your-site.pages.dev/api/r2-list
```

Should return:
```json
{
  "images": [...],
  "truncated": false,
  "cursor": null
}
```

## Step 6: Test in Admin Panel

1. Go to your deployed site
2. Navigate to Admin panel
3. Open **R2 Gallery Manager**
4. You should NOT see the yellow warning
5. Try uploading an image
6. Image should appear in gallery

## Troubleshooting

### "Bucket not found" Error

**Problem**: The R2 bucket doesn't exist

**Solution**:
```bash
# List your buckets
wrangler r2 bucket list

# If pixie-blooms-images is not listed, create it:
wrangler r2 bucket create pixie-blooms-images
```

### "R2_BUCKET is undefined" in Production

**Problem**: Bindings weren't applied during deployment

**Solutions**:

1. **Verify wrangler.toml exists in project root**
   ```bash
   ls -la wrangler.toml
   ```

2. **Deploy with wrangler (not git push)**
   ```bash
   wrangler pages deploy dist --project-name=pixieblooms3
   ```

3. **Check deployment logs**
   - Look for "Applying bindings from wrangler.toml"
   - Should list R2_BUCKET and ANALYTICS_KV

### KV Namespace Errors

**Problem**: Invalid KV namespace ID in wrangler.toml

**Solution**:
```bash
# Create KV namespace
wrangler kv:namespace create "ANALYTICS_KV"

# Copy the ID from output and update wrangler.toml
# Replace line 19 with the real ID (not placeholder)
```

### Still Seeing "Development Mode" Warning

**Problem**: Deployment didn't pick up bindings from wrangler.toml

**Solutions**:

1. **Redeploy using wrangler CLI directly** (not git):
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=pixieblooms3
   ```

2. **If deploying via git**, bindings may need to be set in Dashboard:
   - Go to Cloudflare Dashboard
   - Workers & Pages → Your Project → Settings → Functions
   - Manually add bindings there
   - Then redeploy from git

## Local Development with R2

For local development with R2, use:

```bash
npm run dev:wrangler
```

This uses `wrangler pages dev` which simulates Cloudflare Pages locally with bindings.

**Note**: R2 in local development will use the same production bucket. Be careful not to accidentally delete production images.

## Production Environment Variables

Environment variables are set in `wrangler.toml` under `[vars]` and `[env.production.vars]`.

Current vars:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ANALYTICS_TOKEN`

These are automatically applied during wrangler deployment.

## Continuous Deployment

If you want automatic deployments from git:

1. **Connect repository** in Cloudflare Pages Dashboard
2. **Set build command**: `npm run build`
3. **Set output directory**: `dist`
4. **Important**: Wrangler.toml bindings only work with CLI deployments

For git-based deployments, you'll need to set bindings manually in the Dashboard (see R2-SIMPLE-SETUP.md).

## Summary

**For wrangler CLI deployments**:
- ✅ Bindings managed in wrangler.toml
- ✅ Create R2 bucket via CLI
- ✅ Deploy with `wrangler pages deploy`

**For git-based deployments**:
- ❌ Bindings in wrangler.toml are ignored
- ✅ Must set bindings in Dashboard manually
- ✅ Push to git to trigger deployment

Choose the deployment method that works best for your workflow.
