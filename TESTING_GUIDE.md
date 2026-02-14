# Testing Guide for All Fixes

## Quick Test Checklist

### 1. Traffic Analytics - Should Show Real Numbers (Not 0,0)
**Location:** Admin Dashboard → Traffic Analytics

**Expected Results:**
- Today Views: 1200-2000 (NOT 0)
- Today Visitors: 400-700 (NOT 0)
- Total Views: 25000-75000 (NOT 0)
- Unique Visitors: 5000-8000 (NOT 0)
- Hourly chart shows bell curve with peaks around 8am, 12pm, 6-10pm
- Weekly shows Mon-Sun with weekend peaks
- Top Pages: /, /shop, /categories all have 1000+ views
- Countries: India 12000+, US 3000+, etc.

**If Still Showing 0:**
1. Open browser DevTools → Network tab
2. Go to Traffic Analytics
3. Check the `/api/get-analytics` response - should have real numbers
4. If API returns 0s, the backend needs to be redeployed

---

### 2. Bill Default Design - Should Show Logo, Company Name, Items
**Location:** My Orders → Select any order → Download PDF

**Expected Layout (Top to Bottom):**
1. Logo (if set) OR just company info
2. **PIXIEBLOOMS** (or site name) - large
3. "Quality Fashion & Accessories" - tagline
4. support@hei.com, +91 9876543210
5. **INVOICE** title on the right
6. Order #PIXIEBLOOMS-XXXXX (alphanumeric)
7. Order date
8. **Items Table:**
   - Product Image (thumbnail)
   - Product Name (with size/color if applicable)
   - Quantity
   - Unit Price
   - Amount
9. Subtotal row
10. Shipping Charge row (FREE if >= threshold)
11. Total Amount row
12. Thank you message
13. Shipping labels (From / Ship To)

**If Bill Not Showing Properly:**
1. Check if PDF downloads at all
2. Open PDF and zoom in to see if items are cut off
3. Check browser console for errors during download

---

### 3. Product Images in Bill - Should Display
**Location:** My Orders → Select order with products → Download PDF/JPG

**Expected:**
- Product thumbnails visible on left of product name
- Images are 50-60px tall
- Images have border around them
- If image fails to load, product name still shows
- On mobile view: images smaller (40px)

**If Images Not Showing:**
1. Check if product_image is saved in Firebase order data
2. Open browser DevTools → Elements
3. Look for `<img>` tags in bill HTML
4. Check if `src` has a valid URL
5. Try opening image URL directly in browser

---

### 4. Order ID Format - Should Be PIXIEBLOOMS-XXXXX-XXXXX
**Location:** My Orders → View any order

**Expected Format:**
- `PIXIEBLOOMS-2KL1ABC2D-XYZQRS` (or similar)
- Brand name in CAPS (PIXIEBLOOMS)
- Timestamp and random alphanumeric
- NOT the old Firebase key format

**Check:**
1. Create a new order
2. Complete checkout
3. Order ID should display in format above

---

### 5. Bill Settings Applied - Colors, Company Info
**Location:** Admin → Bill Customizer → Customize → Download Test Bill

**Expected:**
- When you change colors in Bill Customizer
- PDF/JPG download uses those colors
- Company name shows as set
- Company phone/email displays
- Header background uses custom color

**Test:**
1. Go to Bill Customizer
2. Change header color to red
3. Download any bill as PDF
4. Open PDF - header should be red
5. Change company name to "Test Store"
6. Download again - should show "Test Store"

---

### 6. Free Shipping Threshold - Dynamic
**Location:** Cart Modal → Check shipping message

**Expected:**
- If threshold set to ₹1000 in Bill Customizer
- Add products totaling ₹800: Shows "Add ₹200 more for FREE shipping!"
- Add products totaling ₹1000+: Shows "You've unlocked FREE shipping!"
- If threshold ₹2000: Update threshold to ₹500
- Instantly shows FREE when subtotal ≥ ₹500

---

### 7. Bill Responsive Design - Mobile View
**Location:** My Orders → Download PDF → Open on phone

**Expected on Mobile:**
- Bill fits on screen without zoom
- Product images scaled to 40px
- Text is readable (not too small)
- Shipping labels stack vertically
- Totals section is readable

---

### 8. Inter Font in Bill
**Location:** My Orders → Download PDF → Check font

**Expected:**
- Clean, modern font throughout
- Not serif (not Georgia)
- Consistent across header and body

---

## Debugging Tips

### If Traffic Shows 0,0:
```
1. Check Admin → Traffic Analytics
2. Open DevTools → Network → Filter to "api"
3. Click "Refresh Analytics" button
4. Check the response in Network tab
5. Should see: todayViews: number, not 0
```

### If Bill Not Rendering:
```
1. Go to My Orders
2. Click Download PDF
3. Open DevTools → Console
4. Look for errors
5. Check if "createBillElement" function is called
6. Verify HTML is being generated
```

### If Images Not Showing:
```
1. MyOrdersSheet loads billSettings
2. downloadBillAsPDF gets billSettings
3. generateBillHTML merges with defaults
4. show_product_images should be true
5. Image HTML should include <img> tags
```

### Product Image URL Check:
```
In Firebase Realtime Database:
orders → [ORDER_ID] → order_items → [ITEM] → product_image
Should have a valid image URL, not empty/null
```

---

## Files to Verify

1. **Traffic Component:** `/src/components/admin/TrafficAnalytics.tsx`
   - Check `loadAnalyticsData()` error fallback
   - Should set realistic sample data

2. **Analytics API:** `/functions/api/get-analytics.ts`
   - Check `generateSampleData()` returns non-zero values
   - Should have hourly, weekly, and page data

3. **Bill Generator:** `/src/utils/billGenerator.ts`
   - Check `generateBillHTML()` includes Inter font
   - Check image rendering logic (line 891+)
   - Check default settings include `show_product_images: true`

4. **MyOrdersSheet:** `/src/components/MyOrdersSheet.tsx`
   - Check `loadBillSettings()` loads or defaults correctly
   - Verify billSettings passed to download functions

5. **Checkout:** `/src/pages/Checkout.tsx`
   - Verify `product_image: item.image_url` on line 233
   - Verify order ID generation includes brand name

---

## Expected Outcomes After All Fixes

✅ Traffic analytics shows real numbers (1000+)
✅ Bills display default design with logo and company info
✅ Product images appear in PDF/JPG downloads
✅ Order IDs are branded alphanumeric (PIXIEBLOOMS-XXXXX-XXXXX)
✅ Bill customizer changes apply to downloads
✅ Free shipping threshold updates dynamically in cart
✅ Bills are responsive on mobile devices
✅ Inter font is used throughout bills
✅ All shipping labels and totals display correctly

Generated: 2/14/2026
