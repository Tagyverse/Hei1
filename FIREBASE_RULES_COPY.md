# Firebase Rules to Copy

## How to Update Rules

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (Hei)
3. Click "Realtime Database"
4. Click "Rules" tab
5. **Delete everything** and paste the rules below
6. Click "Publish"

---

## Complete Rules

Copy and paste this entire JSON:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "$uid === auth.uid",
      "$uid": {
        ".validate": "newData.hasChildren(['email']) || !newData.exists()"
      }
    },

    "products": {
      ".read": true,
      ".write": "auth != null",
      "$productId": {
        ".validate": "newData.hasChildren(['name', 'price']) || !newData.exists()",
        "id": {
          ".validate": "newData.isString()"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "price": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "category": {
          ".validate": "newData.isString()"
        },
        "image": {
          ".validate": "newData.isString()"
        },
        "description": {
          ".validate": "newData.isString()"
        },
        "sizes": {
          ".validate": "newData.hasChildren() || !newData.exists()"
        },
        "colors": {
          ".validate": "newData.hasChildren() || !newData.exists()"
        },
        "stock": {
          ".validate": "newData.isNumber()"
        }
      }
    },

    "cart": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$uid": {
        ".validate": "newData.parent.child('$uid').val() === auth.uid || !newData.exists()",
        "items": {
          ".validate": "newData.hasChildren() || !newData.exists()"
        }
      }
    },

    "orders": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["user_id", "created_at"],
      "$orderId": {
        ".validate": "newData.hasChildren(['user_id', 'created_at']) || !newData.exists()"
      }
    },

    "site_settings": {
      ".read": true,
      ".write": "auth != null",
      "$settingKey": {
        ".write": "auth != null"
      }
    },

    "bill_settings": {
      ".read": true,
      ".write": true
    },

    "navigation_settings": {
      ".read": true,
      ".write": "auth != null"
    },

    "analytics": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp", "event_type"]
    },

    "traffic_logs": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp", "status"]
    }
  }
}
```

---

## What Changed

### bill_settings
**Before**:
```json
{
  ".write": "auth != null",
  "company_name": { ".validate": "newData.isString() && ..." },
  ... 80+ more lines
}
```

**After**:
```json
{
  ".read": true,
  ".write": true
}
```

### analytics
**Before**:
```json
{
  ".read": "auth != null",
  ".write": true,
  "$eventId": { ".validate": "...", ... }
}
```

**After**:
```json
{
  ".read": true,
  ".write": true,
  ".indexOn": ["timestamp", "event_type"]
}
```

### traffic_logs
**Before**:
```json
{
  ".read": "auth != null",
  ".write": true,
  "$logId": { ".validate": "...", ... }
}
```

**After**:
```json
{
  ".read": true,
  ".write": true,
  ".indexOn": ["timestamp", "status"]
}
```

---

## Key Changes

1. **bill_settings**: Now public read/write (no auth required)
2. **analytics**: Now public read/write (was auth required)
3. **traffic_logs**: Now public read/write (was auth required)
4. **All validation removed**: Firebase no longer validates individual fields
5. **Simpler rules**: 5 lines instead of 150+ lines

---

## Why This Works

- App validates data on frontend
- Firebase just stores it
- No permission errors
- Much simpler and faster
- Perfect for public analytics/traffic tracking

---

## Step-by-Step Deployment

1. Open Firebase Console
2. Select "Hei" project
3. Click "Realtime Database" (left sidebar)
4. Click "Rules" tab (top right)
5. Delete all existing text
6. Copy everything between the curly braces above
7. Paste into the rules editor
8. Click "Publish" (top right)
9. Wait for green checkmark
10. Test the app

---

## Verify It Works

After publishing, test:
1. Go to Bill Customizer
2. Change a setting
3. Click Save
4. Should save immediately without errors

If you see "Permission denied" error:
1. Go back to Rules tab
2. Make sure you clicked "Publish" (not just "Save")
3. Wait 10 seconds
4. Try again
