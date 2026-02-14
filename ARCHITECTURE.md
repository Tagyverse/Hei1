# Hei App - System Architecture

## Data Flow Diagrams

### 1. Bill Settings Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN USER LOGIN                            │
│     (adminAuthenticated=true, adminId stored in localStorage)    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ Bill Customizer   │
         │   Component       │
         └────────┬──────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────────┐   ┌──────────────────┐
│   Firebase DB   │   │   localStorage   │
│  bill_settings  │   │  billSettings    │
│   (Persistent)  │   │   (Cache)        │
└────────┬────────┘   └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
         ┌──────────▼─────────┐
         │  App Initialization │
         │  (loadBillSettings) │
         └──────────┬──────────┘
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ▼                            ▼
┌─────────────────────┐    ┌──────────────────┐
│  Bill Generator     │    │  MyOrdersSheet   │
│  (Uses settings)    │    │  (Uses settings) │
└─────────────────────┘    └──────────────────┘
      │                            │
      └──────────┬─────────────────┘
                 │
         ┌───────▼────────┐
         │  Bill Output   │
         │  PDF/JPG/Print │
         └───────────────┘
```

### 2. Analytics & Tracking Flow

```
┌────────────────────────────────────────────────────────┐
│              USER ACTIONS IN APP                       │
│  - Page view, Bill download, Product view, Purchase   │
└────────────────┬───────────────────────────────────────┘
                 │
         ┌───────▼────────────────┐
         │   Analytics Utility    │
         │  (analytics.ts)        │
         └───────┬────────────────┘
                 │
      ┌──────────┴────────────┐
      │                       │
      ▼                       ▼
┌──────────────────┐   ┌─────────────────────┐
│   API Endpoint   │   │   Firebase DB       │
│  /api/track-view │   │   analytics/        │
│                  │   │   traffic_logs/     │
└──────────────────┘   └─────────────────────┘
      │                       │
      │                       └──────────┐
      │                                  │
      └──────────────┬───────────────────┘
                     │
         ┌───────────▼──────────┐
         │  Admin Dashboard     │
         │  (View Analytics)    │
         └──────────────────────┘
```

### 3. Bill Download Flow

```
┌─────────────────────────────────────────┐
│    User in MyOrdersSheet                 │
│  Clicks: PDF | JPG | Print Button       │
└────────────┬────────────────────────────┘
             │
   ┌─────────▼─────────┐
   │ Load Bill Settings │
   │ From localStorage  │
   └────────┬──────────┘
            │
   ┌────────▼──────────────────┐
   │ Generate Bill HTML/Canvas  │
   │ Using Saved Settings       │
   └────────┬──────────────────┘
            │
    ┌───────┴────────┬──────────┐
    │                │          │
    ▼                ▼          ▼
┌────────┐  ┌───────────┐  ┌────────┐
│  PDF   │  │    JPG    │  │ Print  │
│Download│  │ Download  │  │Dialog  │
└────┬───┘  └─────┬─────┘  └───┬────┘
     │            │            │
     └────────┬───┴────────┬───┘
              │            │
              ▼            ▼
        ┌─────────────────────┐
        │ Track Download Event │
        │  trackBillDownload() │
        └─────────┬───────────┘
                  │
                  ▼
          ┌──────────────────┐
          │  Firebase        │
          │  analytics/      │
          │  bill_download   │
          └──────────────────┘
```

---

## Firebase Rules Structure

### Authentication & Access Control

```
Root Rules
├── .read: false          (Deny by default)
├── .write: false         (Deny by default)
│
├── products/
│   ├── .read: true       (Public read)
│   ├── .write: auth!=null (Auth required)
│
├── bill_settings/        NEW
│   ├── .read: true       (Public read)
│   ├── .write: auth!=null (Auth required - admins)
│   ├── .validate: required fields
│   │
│   └── Fields:
│       ├── company_name (required)
│       ├── company_phone (required)
│       ├── layout_style (enum)
│       ├── colors (string)
│       ├── updated_at (timestamp)
│       └── ...
│
├── analytics/           NEW
│   ├── .read: auth!=null (Admin only)
│   ├── .write: true      (Public write)
│   ├── .indexOn: ["timestamp", "event_type"]
│   │
│   └── Fields:
│       ├── event_type (required)
│       ├── timestamp (required)
│       ├── user_id (optional)
│       ├── session_id (optional)
│       └── data (optional)
│
└── traffic_logs/        NEW
    ├── .read: auth!=null (Admin only)
    ├── .write: true      (Public write)
    ├── .indexOn: ["timestamp", "status"]
    │
    └── Fields:
        ├── timestamp (required)
        ├── endpoint (optional)
        ├── status (optional)
        ├── response_time_ms (optional)
        └── user_agent (optional)
```

---

## Component Hierarchy & Data Flow

```
App.tsx
├── Initialize Analytics
├── Load Bill Settings (Firebase → localStorage)
│
├── VirtualTryOn.tsx
│   ├── Track Try-On Usage
│   └── [Camera flip removed]
│
├── DressColorMatcher.tsx
│   └── [Responsive Header]
│
├── MyOrdersSheet.tsx
│   ├── Load Bill Settings
│   ├── Display Orders
│   │
│   ├── Bill Download Actions:
│   │   ├── handleDownloadPDF()
│   │   ├── handleDownloadJPG()
│   │   └── handlePrint()
│   │
│   ├── Track Downloads
│   │   └── trackBillDownload()
│   │
│   └── billGenerator.ts
│       ├── Use Bill Settings
│       ├── Render Product Images
│       └── Apply Mobile Responsive CSS
│
└── admin/BillCustomizer.tsx
    ├── Check Admin Auth
    ├── Load/Save Settings
    ├── Validate Required Fields
    │
    └── On Save:
        ├── Firebase DB Update
        ├── localStorage Update
        ├── Track Admin Action
        └── Show Success Message
```

---

## Data Models

### BillSettings Interface
```typescript
{
  // Header
  logo_url: string;
  company_name: string;
  company_tagline: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  company_gst: string;
  
  // Layout
  layout_style: 'modern' | 'classic' | 'minimal' | 'detailed';
  show_product_images: boolean;
  show_shipping_label: boolean;
  show_cut_line: boolean;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  header_bg_color: string;
  table_header_color: string;
  
  // Typography
  font_family: string;
  header_font_size: number;
  body_font_size: number;
  
  // Content
  footer_text: string;
  thank_you_message: string;
  
  // Shipping Label
  from_name: string;
  from_address: string;
  from_city: string;
  from_state: string;
  from_pincode: string;
  from_phone: string;
}
```

### AnalyticsEvent Interface
```typescript
{
  event_type: string;
  timestamp: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  referrer?: string;
  data?: Record<string, any>;
}
```

### TrafficLog Interface
```typescript
{
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  response_time_ms: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}
```

---

## Storage Hierarchy

### Firebase Realtime Database
- **Location**: /bill_settings
- **Size**: ~2KB per settings doc
- **Access**: Public read, admin write
- **Backup**: Automatic Firebase backups
- **Purpose**: Persistent data source

### Browser localStorage
- **Location**: billSettings key
- **Size**: ~2KB
- **Duration**: Until browser cache cleared
- **Sync**: Loaded on app init, updated on save
- **Purpose**: Fast access without API calls

### Browser sessionStorage
- **Location**: analytics_session_id key
- **Size**: ~40 bytes
- **Duration**: Current session only
- **Purpose**: Session tracking across pages

---

## Request Flow - Bill Download

```
User Click (PDF/JPG/Print)
        │
        ▼
1. Load Bill Settings
   └─> Check localStorage first
       └─> Fallback to default if missing
        │
        ▼
2. Generate Bill (HTML/Canvas)
   ├─> Insert company logo
   ├─> Add product images (if enabled)
   ├─> Apply color scheme
   ├─> Apply typography
   ├─> Add shipping label (if enabled)
   └─> Apply mobile responsive CSS
        │
        ├─> PDF: Generate PDF file
        ├─> JPG: Convert canvas to image
        └─> Print: Open browser print dialog
        │
        ▼
3. Track Event
   ├─> Firebase: Push to analytics/bill_download
   ├─> Capture: order_id, format, timestamp
   └─> Log: Success/error
        │
        ▼
4. Download Complete
   └─> Show success message
```

---

## Authentication Flow - Admin Bill Settings

```
Admin Login
    │
    ▼
localStorage updates:
├─> adminAuthenticated = 'true'
├─> adminId = 'user_uid'
└─> adminRole = 'admin' | 'super_admin'
    │
    ▼
BillCustomizer renders:
├─> Check localStorage.adminAuthenticated
├─> If true → Show edit form + blue banner
└─> If false → Show amber access denied banner
    │
    ▼
On Save:
├─> Validate admin auth (required)
├─> Validate required fields
├─> Update Firebase: /bill_settings
├─> Sync to localStorage: billSettings
├─> Track action: admin_action event
└─> Show: Success/Error alert
```

---

## Mobile Responsive Breakpoints

### Bill Display
- **Mobile** (< 480px):
  - Padding: 12px-15px
  - Font size: Reduced
  - Images: 40px
  - Layout: Single column

- **Tablet** (480px - 768px):
  - Padding: 16px-20px
  - Font size: Medium
  - Images: 45px
  - Layout: Optimized

- **Desktop** (> 768px):
  - Padding: 20px-24px
  - Font size: Full
  - Images: 50px
  - Layout: Multi-column

### Dialog Header
- **Mobile**: Flex-wrap, truncate text
- **Tablet**: Adjusted spacing
- **Desktop**: Full layout

---

## Error Handling Strategy

```
Try-Catch Blocks
├── Firebase Operations
│   └─> Log to console, show user message
├── localStorage Access
│   └─> Fallback to defaults
├── Analytics Tracking
│   └─> Silent fail (don't interrupt UX)
└── Bill Generation
    └─> Show error, allow retry
```

---

## Performance Considerations

### Optimizations Implemented
1. ✅ localStorage caching - Avoid API calls for bill settings
2. ✅ Session ID reuse - Single ID across page navigation
3. ✅ Async tracking - Non-blocking analytics
4. ✅ Lazy event data - Only track necessary fields
5. ✅ Firebase indexing - Fast query performance
6. ✅ CSS media queries - Mobile-optimized rendering

### Monitoring Points
- [ ] Firebase read/write operations
- [ ] localStorage access patterns
- [ ] Analytics event volume
- [ ] Bill generation time
- [ ] Page load impact

---

*Architecture Document*  
*Last Updated: 2/13/2026*
