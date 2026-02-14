# Troubleshooting Guide - Bill Settings & Analytics

## Problem 1: Bill Settings Not Saving

### Symptoms
- Alert says "Validation error" or "Permission denied"
- Settings not appearing after save

### Solutions

**Check 1: Admin Authentication**
```javascript
// Open browser console and check:
console.log('Admin Auth:', localStorage.getItem('adminAuthenticated'));
console.log('Admin ID:', localStorage.getItem('adminId'));
```

**Must show:**
- `adminAuthenticated: 'true'`
- `adminId: <some-value>`

If not, login to admin panel first.

**Check 2: Required Fields**
- Company Name: Must have at least 1 character
- Company Phone: Must have at least 1 character

**Check 3: Firebase Connection**
```javascript
// In console:
console.log('Firebase DB:', db);
```

If `undefined`, Firebase isn't initialized.

**Check 4: Firebase Rules**
Your rules must have:
```json
"bill_settings": {
  ".write": "auth != null"
}
```

Not: `.write": "auth != null && custom validation"` (too strict)

### Quick Fix
1. Clear console errors
2. Make sure you see blue banner: "Admin Mode Active"
3. Fill in Company Name and Company Phone
4. Try saving again
5. Check localStorage: `localStorage.getItem('billSettings')`

---

## Problem 2: Traffic/Analytics Not Working

### Symptoms
- Analytics dashboard shows 0 reads/writes
- No events logged in Firebase
- `console.log` messages about analytics missing

### Solutions

**Check 1: Analytics Collection Write Access**
```javascript
// In console:
import { push, ref } from 'firebase/database';
import { db } from './src/lib/firebase';

// Try manual push
push(ref(db, 'analytics'), { test: true, timestamp: Date.now() })
  .then(() => console.log('Write OK'))
  .catch(err => console.error('Write Error:', err));
```

**Check 2: Firebase Rules for Analytics**
Your rules must have:
```json
"analytics": {
  ".write": true,
  ".read": "auth != null"
}
```

The `.write": true` is CRITICAL - it allows public writes.

**Check 3: Session ID Generation**
```javascript
// In console:
console.log('Session ID:', sessionStorage.getItem('analytics_session_id'));
```

Should show a UUID. If empty, tracking won't work.

**Check 4: Console Errors**
Look for:
- `[v0] Page view tracked: /path` - Good sign
- `[Firebase Analytics] Warning:` - Analytics tried but failed gracefully
- Actual errors in red - Need to fix

### Quick Fix
1. Deploy updated Firebase rules
2. Verify rules have `.write: true` for analytics
3. Clear sessionStorage: `sessionStorage.clear()`
4. Refresh page
5. Check console for `[v0] Page view tracked` messages

---

## Problem 3: Admin Actions Not Being Tracked

### Symptoms
- Bill settings save works
- But no "bill_settings_updated" events in Firebase

### Solutions

**This is expected behavior** - we made analytics "fire and forget"

To verify it's working:
1. Open browser DevTools → Console
2. Save bill settings
3. Look for messages:
   - `[v0] Bill settings saved successfully` - Save worked
   - `[v0] Event tracked: bill_settings_updated` - Analytics worked
   - `[Firebase Analytics] Warning:` - Analytics failed but didn't block save

**It's OK if you see warnings** - the system is designed to not break if analytics fails.

---

## Firebase Rules Deployment

### Correct bill_settings Rules
```json
"bill_settings": {
  ".read": true,
  ".indexOn": ["updated_at"],
  ".write": "auth != null",
  "company_name": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0)"
  },
  "company_phone": {
    ".validate": "!newData.exists() || (newData.isString() && newData.val().length > 0)"
  }
}
```

### Correct analytics Rules
```json
"analytics": {
  ".read": "auth != null",
  ".write": true,
  ".indexOn": ["timestamp", "event_type"]
}
```

### Correct traffic_logs Rules
```json
"traffic_logs": {
  ".read": "auth != null",
  ".write": true,
  ".indexOn": ["timestamp", "status"]
}
```

---

## Testing Checklist

### Bill Settings Save Test
- [ ] Login as admin
- [ ] Go to Bill Customizer
- [ ] See blue banner "Admin Mode Active"
- [ ] Change company name
- [ ] Click Save
- [ ] See success alert
- [ ] Refresh page
- [ ] Settings still there
- [ ] Check `localStorage.getItem('billSettings')` - should have updates

### Analytics Test
1. Open DevTools Console
2. Refresh page
3. Look for `[v0] Page view tracked:`
4. Change route/page
5. Look for more `[v0] Page view tracked:` messages
6. Look for `session_start` event logged

### End-to-End Test
1. User downloads bill (PDF/JPG)
2. Bill downloads successfully
3. Console shows `[v0] Event tracked: bill_download`
4. Check Firebase console → analytics collection
5. Should see events there (might take 30 seconds to appear)

---

## Debug Mode

Add these to console to enable verbose logging:

```javascript
// Enable all analytics logging
window.DEBUG_ANALYTICS = true;

// Then modify analytics.ts to check:
if (window.DEBUG_ANALYTICS) console.log('[Analytics]', ...);
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Validation error" alert | Required fields empty | Fill company name & phone |
| "Permission denied" alert | Not logged in as admin | Login to admin panel |
| 0 analytics events | `.write: true` missing | Update Firebase rules |
| Bill settings lost on refresh | localStorage not saving | Check browser storage is enabled |
| Tracking blocks page load | Awaiting analytics | Should be fire-and-forget now |

---

## Performance Notes

All analytics calls are now **fire-and-forget**:
- ✅ Page loads never blocked by analytics
- ✅ Bill settings save never blocked by Firebase writes
- ✅ Download buttons respond immediately
- ✅ Failures silently log warnings but don't break app

This is intentional and working as designed.
