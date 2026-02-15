# Debugging Guide for Issues

## Issue 1: Video Overlay Sections Not Showing

### Symptoms
- Video overlay sections are not visible on the homepage
- Console shows video overlay section data but nothing renders

### Root Causes & Fixes Applied
1. **Type Definition Issue**: The `allSectionsOrder` array type was missing the `'video_overlay'` type
   - **Fixed**: Added `'video_overlay'` to the type union

2. **Data Loading Issue**: Video overlay sections data might not be loading from Firebase
   - **Debug Logs Added**: Check browser console for:
     - `[v0] Video overlay sections data:` - Shows if data is loaded
     - `[v0] Video overlay items data:` - Shows video items
     - `[v0] Processing video overlay section:` - Shows section processing
     - `[v0] Final video overlay sections:` - Shows final data structure
     - `[v0] Rendering video_overlay section:` - Shows rendering attempt

3. **Component Issue**: The VideoOverlaySection component requires specific data structure
   - Expected structure: `{ id, video_url, overlay_text, overlay_subtext, order }`
   - Current check: Component validates `videos.length > 0` before rendering

### How to Debug
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `[v0]`
4. Check if `Final video overlay sections` shows your data
5. If showing, check `Rendering video_overlay section` logs

**Expected Flow:**
```
[v0] Video overlay sections data: {...}
[v0] Video overlay items data: {...}
[v0] Processing video overlay section: section_id {...}
[v0] Adding video to section: {...}
[v0] Final video overlay sections: [{...}]
[v0] Rendering video_overlay section: section_id true {data}
```

---

## Issue 2: Bill Not Showing Product Images

### Symptoms
- Bills download but show no product images
- Bills in PDF/JPG format are missing images

### Root Causes & Fixes Applied
1. **Image Loading Timeout**: html2canvas had only 5 second timeout for images
   - **Fixed**: Increased to 10 seconds (`imageTimeout: 10000`)

2. **Image HTML Generation**: Images might not have been rendering properly
   - **Fixed**: 
     - Removed error handlers that could hide images
     - Set explicit `display: block` and `opacity: 1`
     - Added logging to track which images are added

3. **CORS Issues**: Images might fail to load due to cross-origin issues
   - **Already Configured**: 
     - `useCORS: true` in html2canvas
     - `crossorigin="anonymous"` in img tags
     - `allowTaint: true` as fallback

### Debug Logs for Images
When downloading a bill, check console for:
- `[v0] Adding product image to bill:` - Shows which images are added
- `[v0] Using fallback image URL:` - Shows if URL encoding failed
- `[v0] Skipping image:` - Shows why images were skipped
- `[v0] Converting bill to canvas for PDF/JPG:` - Start of rendering
- `[v0] PDF/JPG canvas created, size:` - Canvas dimensions

**Expected Flow:**
```
[v0] Adding product image to bill: https://...
[v0] Converting bill to canvas for PDF...
[v0] PDF canvas created, size: 1240 x 1754
```

### Image Requirements
- Images must be accessible (no 403/404 errors)
- R2 images are automatically converted to absolute URLs
- Blob URLs are passed through as-is
- If image fails to load, it's removed from bill (gap reduced)

---

## Issue 3: Traffic Tracking Not Working

### Current Implementation
- **Status**: Wrangler.toml updated with Analytics Engine binding
- **Location**: `src/utils/trafficTracker.ts` and `src/middleware/trafficMiddleware.ts`
- **Binding**: `TRAFFIC_ANALYTICS` in wrangler.toml

### Potential Issues
1. **Analytics Engine Binding Not Configured**: 
   - Check if `[[analytics_engine_datasets]]` is present in wrangler.toml
   - Verify binding name is `TRAFFIC_ANALYTICS`

2. **Middleware Not Hooked**:
   - Middleware needs to be added to your worker handler
   - Check if trafficMiddleware is imported and called

3. **Environment**: 
   - Analytics Engine only works in Cloudflare Workers
   - Local development needs different setup

### How to Enable
1. Ensure wrangler.toml has Analytics Engine bindings (already added)
2. Integrate middleware into your worker
3. Deploy to Cloudflare Workers
4. Check Cloudflare dashboard > Analytics Engine > TRAFFIC_ANALYTICS

---

## How to Remove Debug Logs

Once issues are confirmed fixed, remove these lines:

### In Home.tsx (lines ~220-250):
- Remove all `console.log('[v0]')` statements in video overlay loading
- Remove the debug render output in video_overlay section rendering

### In billGenerator.ts:
- Remove `console.log('[v0]')` statements for image tracking (~line 910, 914, 918)
- Remove `logging: true` in html2canvas (change back to `false`)

---

## Summary Checklist

- [ ] Video overlay sections appear on homepage
- [ ] Video overlay data shows in console logs with correct structure
- [ ] Bill downloads include product images
- [ ] Console shows image loading logs
- [ ] Traffic tracking captures requests (check wrangler.toml)
- [ ] All debug logs removed from code
