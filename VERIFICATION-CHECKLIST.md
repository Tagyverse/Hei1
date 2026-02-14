# Complete Verification Checklist for R2 Data Sync

## All Data Published to R2

This document lists all data that should be published to R2 when you click "Publish" in the Admin panel.

### ✓ Core Product Data
- [ ] **Products** - All product details, images, prices, descriptions
- [ ] **Categories** - Product categories with names and display order
- [ ] **Reviews** - Customer reviews and ratings
- [ ] **Offers** - Active offers and discounts
- [ ] **Coupons** - Coupon codes and details

### ✓ Navigation & Layout
- [ ] **Navigation Settings** - Button labels, colors, themes (from NavigationCustomizer)
  - Button labels: Home, Shop All, Search, Cart, My Orders, Login, Sign Out, Admin
  - Colors: background, text, activeTab, inactiveButton
  - Theme mode: default, preset, custom
  - Border radius and button size
  - **PATH IN FIREBASE**: `navigation_settings` (NOT `navigation/style`)
  - **WHERE IT LOADS**: Navigation.tsx - top navigation bar

### ✓ Banner & Social
- [ ] **Site Content** - Welcome banner, top banner, site settings
  - Welcome banner title and subtitle
  - Top banner text and styling
  - **WHERE IT LOADS**: WelcomeBanner.tsx, TopBanner.tsx
- [ ] **Social Links** - Social media links (Instagram, Facebook, etc)
  - Link URLs and order
  - **WHERE IT LOADS**: WelcomeBanner.tsx, Footer.tsx

### ✓ Carousel & Images
- [ ] **Carousel Images** - Homepage carousel/slider images
- [ ] **Carousel Settings** - Carousel animation, timing, autoplay settings

### ✓ Homepage Sections
- [ ] **Homepage Sections** - Featured products, trending items, etc
  - Section titles, descriptions
  - Products to display in each section
  - **WHERE IT LOADS**: Home.tsx - main content areas
- [ ] **Info Sections** - Information blocks (About, Shipping, etc)
- [ ] **Marquee Sections** - Scrolling text/banner sections
  - Text content, animation speed
  - **WHERE IT LOADS**: Home.tsx - scrolling sections
- [ ] **Default Sections Visibility** - Which sections show/hide

### ✓ Video Content
- [ ] **Video Sections** - Video content blocks
- [ ] **Video Settings** - Video autoplay, controls
- [ ] **Video Overlay Sections** - Text overlays on videos
- [ ] **Video Overlay Items** - Individual overlay items

### ✓ Design & Styling
- [ ] **Card Designs** - Product card styling and layouts
  - Card border radius, shadow, hover effects
  - Font sizes, colors
- [ ] **Carousel Settings** - Carousel visual styling
- [ ] **Footer Settings** - Footer content, colors, links
  - Company name, email, phone, address
  - Quick links, social links
  - Background color, text color
  - Copyright text: "© 2024 Pixie Blooms.in. All rights reserved."
  - Crafted by: "Crafted by Tagyverse"

### ✓ Footer
- [ ] **Footer Config** - Footer configuration details
  - Logo, company info, links
  - **WHERE IT LOADS**: Footer.tsx - site footer

### ✓ Policies
- [ ] **Policies** - Privacy, shipping, refund policies
- [ ] **Settings** - General site settings
- [ ] **Bill Settings** - Invoice/receipt customization
- [ ] **Tax Settings** - Tax calculation settings

### ✓ Advanced Features
- [ ] **Try On Models** - AR/Virtual try-on models
- [ ] **Offers** - Special offers and promotions

## How to Verify Data is Publishing Correctly

### Step 1: Make Changes in Admin
1. Open Admin panel
2. Edit something (e.g., change a product name, update navigation label)
3. Save the changes to Firebase
4. Open browser console (F12 or DevTools)

### Step 2: Publish to R2
1. Click "Validate Data" button
2. Check console logs:
   ```
   [ADMIN] Data collected: X sections
   [ADMIN] ✓ site_content: YES/NO
   [ADMIN] ✓ social_links: YES/NO
   [ADMIN] ✓ marquee_sections: YES/NO
   ```
3. Click "Publish" button
4. Check console for upload confirmation:
   ```
   [PUBLISH] Starting publish to R2
   [PUBLISH] Successfully uploaded to R2 in XXXms
   [PUBLISH] Verified published data in XXXms
   ```

### Step 3: Verify on Frontend
1. Open Home or Shop page
2. Open browser console (F12)
3. Look for logs showing data was loaded from R2:
   ```
   [R2] Fetching published data from R2...
   [R2] Successfully fetched and parsed data in XXms
   [R2] Data keys available: [list of all keys]
   [R2] site_content: true
   [R2] social_links: true
   [NAVIGATION] Loaded navigation settings from R2
   [HOME] Published data loaded successfully
   [HOME] Loaded X products
   ```

## Common Issues & Fixes

### Issue: Navigation Changes Not Showing
**Problem**: Navigation button labels or colors not updating on home page
**Cause**: Saving to `navigation/style` instead of `navigation_settings`
**Fix**: NavigationCustomizer now saves to `navigation_settings` automatically

**Verification**:
1. In Admin > Navigation Settings, change a label (e.g., "Shop All" → "Shop Now")
2. Click Save
3. Check console: `[NAV] Saving navigation settings to navigation_settings`
4. Click Publish at bottom of Admin
5. Open Home page
6. Check console: `[NAVIGATION] Loaded navigation settings from R2`
7. Verify the label changed

### Issue: Banner/Social Not Showing
**Problem**: Welcome banner or social links showing defaults
**Cause**: `site_content` or `social_links` not in R2
**Fix**: 
1. Click Publish button
2. Check console: `[ADMIN] ✓ site_content: YES` and `[ADMIN] ✓ social_links: YES`
3. If NO, the data might not exist in Firebase

### Issue: Marquee Not Showing
**Problem**: Scrolling text not appearing on home
**Cause**: `marquee_sections` not published
**Fix**: Same as above - check publish logs for marquee_sections

### Issue: Data Still Shows as Default
**Problem**: Even after publishing, changes don't appear
**Cause**: Page is using cached data or loaded before publish
**Fix**:
1. Publish data
2. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check console for `[R2] Using cached data` - if yes, data might be stale
4. Wait 5 minutes for cache to expire, then refresh

## Testing Each Feature

### Test Navigation
1. Admin > Navigation Settings
2. Change "Shop All" to "Browse Products"
3. Save → Publish
4. Go to Home, check button text changed
5. Console should show: `[NAVIGATION] Applying button labels`

### Test Marquee
1. Admin > Marquee Sections
2. Edit or add a marquee section
3. Save → Publish
4. Go to Home
5. Verify scrolling text appears (usually near top)
6. Console should show: `[HOME] Published data loaded successfully`

### Test Banner
1. Admin > Welcome Banner or Top Banner
2. Update title/text
3. Save → Publish
4. Go to Home
5. Check banner text updated
6. Console: `[WELCOME-BANNER] Using published banner data` or `[TOP-BANNER] Using published data`

### Test Footer
1. Admin > Footer Settings
2. Update company name or copyright
3. Save → Publish
4. Go to Home/Shop
5. Scroll to footer
6. Should show: "© 2024 Pixie Blooms.in. All rights reserved." and "Crafted by Tagyverse"

### Test Products & Categories
1. Admin > Products or Categories
2. Add/edit a product or category
3. Save → Publish
4. Go to Shop
5. Check new product/category appears
6. Console: `[SHOP] Loaded X products`

## Data Flow Diagram

```
Admin Panel
    ↓
Firebase Database (navigation_settings, products, social_links, etc)
    ↓
Click "Publish"
    ↓
Validate Data ✓
    ↓
Collect all Firebase data
    ↓
Upload to R2 (site-data.json)
    ↓
Verify upload successful
    ↓
User visits Home/Shop
    ↓
getPublishedData() loads from R2
    ↓
Navigation.tsx, WelcomeBanner.tsx, Home.tsx, etc. display data
    ↓
If R2 fails → Fallback to Firebase
```

## Console Commands for Debugging

Open browser console and run:

```javascript
// Check if published data is loaded
console.log(window.location.href)

// Look for logs containing [R2], [HOME], [NAVIGATION], etc
```

Search console for these prefixes:
- `[R2]` - R2 data loading
- `[FALLBACK]` - Firebase fallback
- `[NAVIGATION]` - Navigation specific
- `[HOME]` - Home page
- `[SHOP]` - Shop page
- `[PUBLISH]` - Publishing process
- `[ADMIN]` - Admin actions
- `[TOP-BANNER]` - Top banner
- `[WELCOME-BANNER]` - Welcome banner

## Next Steps After Verification

If all checks pass:
1. You have a fully working app synced between Firebase and R2
2. All admin changes automatically publish to R2
3. Users always see the latest data from R2 with Firebase fallback
4. Navigation, banners, footers, products, and all other content are synced

If any checks fail:
1. Check the specific console logs mentioned
2. Ensure you clicked "Publish" after saving
3. Hard refresh the page to clear cache
4. Check that R2 bucket is properly configured in Cloudflare
5. Verify navigation_settings path is correct (not navigation/style)
