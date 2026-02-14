# Hei App - Quick Reference Guide

## Admin Guide

### Managing Bill Settings

#### Accessing Bill Settings
1. **Login as Admin**: Use admin panel to authenticate
2. **Navigate**: Go to admin dashboard → Bill Customizer
3. **Requirements**: 
   - `adminAuthenticated` must be `true` in localStorage
   - `adminId` must be set in localStorage

#### Updating Bill Settings
```
1. Open Bill Customizer
2. Edit desired fields
3. Click "Save Settings"
4. System automatically:
   - Validates required fields (name, phone)
   - Saves to Firebase
   - Updates localStorage
   - Tracks admin action
   - Shows success message
```

#### Required Fields
- **Company Name**: 1-100 characters
- **Company Phone**: Must have value
- Optional: Logo, address, GST, tagline, etc.

#### Layout Options
- `modern`: Sleek, contemporary design
- `classic`: Traditional professional look
- `minimal`: Clean, simple format
- `detailed`: Full information layout

---

## User Guide

### Downloading Bills

#### From Orders
1. **Open "My Orders"** in app
2. **Select Order** you want bill for
3. **Choose Format**:
   - **PDF**: Full document, email-friendly
   - **JPG**: Image format, shareable
   - **Print**: Send to printer directly

#### What's Included
- ✅ Company info and logo
- ✅ All ordered products with images
- ✅ Sizes, colors selected
- ✅ Pricing breakdown
- ✅ Shipping address
- ✅ Shipping label (if enabled)
- ✅ Cut line (if enabled)

#### Mobile Tips
- Download/Print buttons stack on small screens
- Use landscape orientation for better layout
- JPG format works best for phones

---

## Developer Quick Start

### Adding Analytics Tracking

#### Simple Event
```typescript
import { trackEvent } from '../utils/analytics';

// Track a custom event
await trackEvent('custom_event', {
  product_id: '123',
  action: 'viewed',
  metadata: {}
});
```

#### Predefined Events
```typescript
import { trackBillDownload, trackAdminAction, trackTryOn } from '../utils/analytics';

// Track bill download
await trackBillDownload(orderId, 'pdf');

// Track admin action
await trackAdminAction('settings_changed', { 
  field: 'primary_color' 
});

// Track try-on usage
await trackTryOn(productId, 'camera');
```

#### Page View
```typescript
import { trackPageView } from '../utils/analytics';

// Auto-tracked on route change
// Or manually:
await trackPageView('/products/123', {
  category: 'hairclips',
  view_type: 'detail'
});
```

---

### Firebase Rules Reference

#### Check Bill Settings Rules
```
/database.rules.json → Search "bill_settings"
```

#### Typical Rules Pattern
```json
"bill_settings": {
  ".read": true,           // Everyone can read
  ".write": "auth != null", // Only authenticated users can write
  
  "$other": {
    ".validate": false      // No unknown fields
  }
}
```

---

### localStorage Keys

#### Bill Settings
```typescript
// Key: 'billSettings'
// Format: JSON string of BillSettings object
const settings = JSON.parse(localStorage.getItem('billSettings'));
```

#### Admin Authentication
```typescript
localStorage.getItem('adminAuthenticated');  // 'true' or 'false'
localStorage.getItem('adminId');             // User UID
localStorage.getItem('adminRole');           // 'admin' or 'super_admin'
```

#### Analytics Session
```typescript
localStorage.getItem('sessionId');           // Current session identifier
localStorage.getItem('userId');              // User UID if logged in
```

---

## Troubleshooting

### Bill Settings Not Saving

#### Problem: "Access Denied" Error
```
Solution:
1. Verify admin login
2. Check: localStorage.getItem('adminAuthenticated') === 'true'
3. Check: localStorage.getItem('adminId') is set
4. Try logging in again
```

#### Problem: Settings Not Appearing in Bills
```
Solution:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache for site
3. Check localStorage: 
   JSON.parse(localStorage.getItem('billSettings'))
4. Verify settings were saved to Firebase
```

#### Problem: Firebase Write Error
```
Solution:
1. Check Firebase rules are deployed
2. Check auth token validity
3. Validate required fields are filled
4. Check Firebase console for specific error
```

---

### Bill Download Issues

#### Problem: Download Hangs/Doesn't Complete
```
Solution:
1. Check browser console for errors
2. Verify bill settings exist: 
   localStorage.getItem('billSettings')
3. Try different format (PDF → JPG)
4. Clear browser cache
5. Use different browser
```

#### Problem: Bill Images Not Showing
```
Solution:
1. Check setting: show_product_images = true
2. Verify product images exist and load
3. Check browser console for CORS errors
4. Verify localStorage has latest settings
5. Refresh and try again
```

#### Problem: Print Dialog Doesn't Open
```
Solution:
1. Check browser security settings
2. Enable popups for this site
3. Try PDF download instead
4. Check print CSS is loaded
5. Try print via browser menu (Ctrl+P)
```

---

### Analytics Not Tracking

#### Problem: Events Not Appearing in Firebase
```
Solution:
1. Check Firebase rules allow writes:
   /database.rules.json → "analytics" → .write: true
2. Verify Firebase connection
3. Check browser console for fetch errors
4. Verify /api/track-view endpoint exists
5. Check network tab for failed requests
```

#### Problem: Session ID Not Consistent
```
Solution:
1. Don't clear sessionStorage during navigation
2. Use same browser tab (new tab = new session)
3. Check: sessionStorage.getItem('analytics_session_id')
4. Session expires on browser close
```

#### Problem: User ID Shows Null
```
Solution:
1. User not logged in? User ID will be null (normal)
2. If logged in, check: localStorage.getItem('userId')
3. User ID set when auth context provides user.uid
4. Anonymous tracking still works without user ID
```

---

### Dialog Header Issues

#### Problem: Text Overflows on Mobile
```
Solution:
1. Text should truncate automatically
2. Check CSS has: text-truncate class
3. Verify media query is applied:
   @media screen and (max-width: 480px)
4. Check browser zoom level (should be 100%)
```

#### Problem: Header Too Large on Mobile
```
Solution:
1. Check responsive breakpoints
2. Verify padding: p-3 on mobile, p-6 on desktop
3. Clear cache and reload
4. Test in device mode (F12 → toggle device toolbar)
```

---

## Firebase Console Checks

### Verify Bill Settings
```
Firebase Console → Realtime Database
→ bill_settings

Should see:
{
  "company_name": "Your Company",
  "company_phone": "+91...",
  "layout_style": "modern",
  "updated_at": "2024-02-13T...",
  ...
}
```

### View Analytics Events
```
Firebase Console → Realtime Database
→ analytics

Should see events like:
{
  "event_type": "bill_download",
  "timestamp": "2024-02-13T...",
  "order_id": "order_123",
  "format": "pdf"
}
```

### Check Traffic Logs
```
Firebase Console → Realtime Database
→ traffic_logs

Should see logs like:
{
  "timestamp": "2024-02-13T...",
  "endpoint": "/api/track-view",
  "method": "POST",
  "status": 200,
  "response_time_ms": 45
}
```

---

## Testing Checklist

### Bill Settings
- [ ] Admin can access customizer
- [ ] Non-admin sees access denied
- [ ] Required fields validation works
- [ ] Settings save to Firebase
- [ ] Settings sync to localStorage
- [ ] Bills use saved settings
- [ ] Settings persist on refresh

### Downloads
- [ ] PDF download creates file
- [ ] JPG download creates image
- [ ] Print opens dialog
- [ ] Product images display
- [ ] Mobile layout looks good
- [ ] Download event tracked
- [ ] No console errors

### Analytics
- [ ] Page views logged
- [ ] Events logged with timestamp
- [ ] Session ID consistent
- [ ] User ID captured (if logged in)
- [ ] Admin actions tracked
- [ ] Data visible in Firebase
- [ ] No errors in console

### Responsive
- [ ] Desktop: Full layout (>768px)
- [ ] Tablet: Optimized (480-768px)
- [ ] Mobile: Compact (<480px)
- [ ] All buttons functional
- [ ] Text readable
- [ ] Images scale properly
- [ ] No horizontal scroll

---

## Common Commands

### View Bill Settings
```javascript
JSON.parse(localStorage.getItem('billSettings'))
```

### Force Reload Settings
```javascript
localStorage.removeItem('billSettings');
location.reload();
```

### Check Admin Status
```javascript
{
  authenticated: localStorage.getItem('adminAuthenticated'),
  adminId: localStorage.getItem('adminId'),
  adminRole: localStorage.getItem('adminRole')
}
```

### Clear Analytics Session
```javascript
sessionStorage.removeItem('analytics_session_id');
```

### Trigger Test Event
```javascript
import { trackEvent } from './src/utils/analytics';
trackEvent('test_event', { timestamp: new Date() });
```

---

## Performance Tips

### For Admins
1. Save bill settings once, not repeatedly
2. Use color picker instead of typing hex values
3. Test bill preview before finalizing

### For Users
1. Download bills directly (faster than printing)
2. Use JPG for mobile sharing
3. Use PDF for email/storage

### For Developers
1. Analytics tracking is non-blocking
2. Settings cached in localStorage
3. Firebase rules prevent unauthorized access
4. Mobile CSS optimized for small screens

---

## Support Resources

### Documentation Files
- `UPDATES_SUMMARY.md` - Complete change log
- `ARCHITECTURE.md` - System design diagrams
- `QUICK_REFERENCE.md` - This file

### Firebase Resources
- [Firebase Rules Docs](https://firebase.google.com/docs/rules)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Realtime Database Guide](https://firebase.google.com/docs/database)

### Component Files
- Bill Settings: `/src/components/admin/BillCustomizer.tsx`
- Orders: `/src/components/MyOrdersSheet.tsx`
- Analytics: `/src/utils/analytics.ts`
- Bill Generator: `/src/utils/billGenerator.ts`

---

## Version Info

- **Last Updated**: 2/13/2026
- **System**: Hei - Fashion & Accessories Platform
- **Framework**: React + TypeScript
- **Database**: Firebase Realtime Database
- **Tracking**: Firebase + API endpoints
- **Mobile**: Responsive design, <480px optimized

---

*Quick Reference - Keep this handy!*
