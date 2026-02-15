# Video Sections, Product Images & Bill Integration Guide

## Overview
This guide explains the three integrated features:
1. **Video Sections from JSON/Database** - Load video sections from published data
2. **Product Images in Orders** - Capture and store product images with orders
3. **Logo Fallback in Bills** - Display logo when product has no image

---

## 1. Video Sections Management

### Data Structure (Firebase/Database)
Video sections are stored in the `video_sections` collection with the following structure:

```json
{
  "video_section_1": {
    "id": "video_section_1",
    "title": "Our Collection Videos",
    "subtitle": "Watch how we create our beautiful pieces",
    "is_visible": true,
    "order_index": 5,
    "videos": ["video_1", "video_2", "video_3"]
  }
}
```

### Video Items Structure
Individual video items are stored in `video_sections` data:

```json
{
  "video_1": {
    "id": "video_1",
    "title": "Handmade Process",
    "video_url": "https://youtube.com/embed/...",
    "thumbnail_url": "https://...",
    "description": "Watch our artisans at work",
    "is_visible": true,
    "order": 0
  }
}
```

### How It Works
- Video sections are loaded from published data in `Home.tsx`
- Each section is added to `allSectionsOrder` with type `'video_section'`
- The section order can be controlled via Firebase `default_sections_visibility/order_video_section`
- Multiple video sections can be created and displayed

### Admin Panel Configuration
In your admin panel (SectionManager):
1. Create video sections with title, subtitle, and visibility
2. Set `is_visible` to true to display on homepage
3. Set `order_index` to control position relative to other sections
4. Add videos to the section by referencing video item IDs

---

## 2. Product Images in Orders

### How It Works
When a customer places an order:

```typescript
// From Checkout.tsx line 243-255
const orderItems = items.map(item => ({
  product_id: item.id,
  product_name: item.name,
  product_price: itemPrice,
  quantity: item.quantity,
  subtotal: itemPrice * item.quantity,
  selected_size: item.selectedSize || null,
  selected_color: item.selectedColor || null,
  product_image: item.image_url || null  // ← Product image captured here
}));
```

### Data Flow
1. **Cart**: Products in cart include `image_url`
2. **Checkout**: Image URL is extracted and added to order item
3. **Database**: Order stored with `product_image` field
4. **Bill Generation**: Image is used when generating invoice/receipt

### Product Image Requirements
- Must be a valid image URL (CORS-enabled)
- Can be from R2, external CDN, or API endpoint
- Fallback to logo if not available (see Bill Images below)

---

## 3. Bill Generation with Logo Fallback

### How It Works
When generating a bill (PDF or JPG):

```typescript
// From billGenerator.ts
const imageUrl = item.product_image || s.logo_url;

if (imageUrl) {
  // Use product image if available
  // Otherwise use company logo as fallback
  const imageHTML = `<img src="${imageUrl}" ... />`;
}
```

### Bill Settings Structure
```typescript
interface BillSettings {
  logo_url?: string;           // Company logo used as fallback
  show_product_images?: boolean; // Always true in current config
  // ... other settings
}
```

### Fallback Logic
1. **If product has image** → Display product image in bill
2. **If product has NO image** → Display company logo in bill (placeholder)
3. **If no logo_url** → Skip image (no fallback)

### Configuration
Logo URL is set in `bill_settings`:

```json
{
  "logo_url": "https://cdn.example.com/logo.png",
  "show_product_images": true,
  "company_name": "Your Company",
  "company_tagline": "Quality & Style"
}
```

### Bill Image Display
- Images in bills are optimized for:
  - **PDF Export**: High-quality canvas rendering (2x scale)
  - **JPG Export**: JPEG compression at quality level
  - **Print**: 300+ DPI equivalent
- HTML2Canvas configurations:
  - `imageTimeout: 10000ms` - Allows slow image loads
  - `useCORS: true` - Enables cross-origin images
  - `allowTaint: true` - Allows mixed content

---

## Admin Panel Integration

### Managing Video Sections
1. **SectionManager Component**:
   - List all video sections
   - Enable/disable visibility
   - Set order index
   - Add/remove videos

2. **VideoSectionManager Component**:
   - Create new sections
   - Upload/set thumbnail images
   - Configure video URLs

### Managing Bill Settings
1. **SettingsPanel**:
   - Upload company logo
   - Configure bill layout
   - Set theme and colors
   - Toggle image display

---

## Database Collections

```
/video_sections/
  ├── video_section_1
  │   ├── title
  │   ├── is_visible
  │   ├── order_index
  │   └── videos[]

/video_overlay_sections/
  ├── overlay_section_1
  │   ├── title
  │   ├── videos[]
  │   └── order_index

/orders/
  ├── order_id_1
  │   ├── order_items[]
  │   │   ├── product_image (captured at order time)
  │   │   └── ...

/bill_settings/
  ├── logo_url
  ├── show_product_images
  └── ...
```

---

## API Endpoints

### Get Published Data
**GET** `/api/get-published-data`
- Returns all published data including:
  - `video_sections`
  - `video_overlay_sections`
  - `bill_settings`
  - Product images

### Download Bill
**POST** `/api/download-bill`
- Generates PDF with product images
- Fallback to logo if image missing
- Returns file download

---

## Troubleshooting

### Video Sections Not Showing
1. Check `is_visible: true` in database
2. Verify `order_index` is set
3. Ensure videos array is not empty
4. Check browser console for errors

### Product Images Not in Bills
1. Verify `product_image` field in order items
2. Check `show_product_images: true` in bill settings
3. Ensure image URL is valid and CORS-enabled
4. Check canvas timeout (should be 10000ms)

### Logo Not Showing as Fallback
1. Set `logo_url` in bill_settings
2. Verify URL is accessible
3. Check file is valid image format
4. Ensure CORS is enabled for image URL

---

## Testing Checklist

- [ ] Create test video section in database
- [ ] Set `is_visible: true`
- [ ] Verify section appears on homepage
- [ ] Create test order with product
- [ ] Verify `product_image` saved in order
- [ ] Download bill as PDF
- [ ] Verify product image in PDF
- [ ] Create test product without image
- [ ] Download bill
- [ ] Verify logo appears as placeholder
- [ ] Test cross-browser compatibility
