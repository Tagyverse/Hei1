# Video Sections Admin Panel Guide

## New "Video Sections" Tab

A dedicated "Video Sections" tab has been added to the Admin panel for managing video content on your homepage.

### Location
- Admin Dashboard → **Video Sections** tab (between Marquee and Homepage Sections)

### Features

#### 1. Video Section Manager
- Add YouTube/Vimeo videos to your homepage
- Configure video titles and descriptions
- Set visibility and ordering
- Supports multiple videos in a section
- Choose display layout (carousel, grid, etc.)

#### 2. Video Overlay Sections
- Create video sections with text overlays
- Add custom text on top of videos
- Configure overlay styling and positioning
- Control overlay animation and transitions

### How to Add Video Sections

1. **Click on "Video Sections" tab** in the Admin panel
2. **In Video Section Manager:**
   - Click "Add Video" button
   - Enter video URL (YouTube or Vimeo)
   - Add title and description
   - Configure display settings
   - Set order_index for positioning on homepage

3. **Save and Publish**
   - Changes are saved to database
   - Click "Publish" to sync with frontend
   - Videos will appear on homepage based on order

### Video Section Configuration Options

| Setting | Description |
|---------|-------------|
| Video URL | YouTube or Vimeo video link |
| Title | Section or video title |
| Description | Additional details about the video |
| Display Type | How videos are displayed (carousel, grid, etc.) |
| Order Index | Position on the homepage (lower = higher) |
| Visibility | Show/hide section without deleting |

### Homepage Display

Video sections appear in the following order on the homepage:
1. Carousel
2. Custom Sections
3. Categories/Products
4. Marquee sections
5. **Video Sections** ← Managed from new tab
6. Video Overlay sections
7. Additional content

### Integration with JSON Structure

Video sections are stored in the database as:
```
database/
├── video_sections/
│   ├── section_1/
│   │   ├── title: "Our Collection"
│   │   ├── videos: [video_id_1, video_id_2]
│   │   ├── order_index: 5
│   │   └── is_visible: true
│   └── section_2/
│       └── ...
├── video_items/
│   ├── video_id_1/
│   │   ├── url: "https://youtube.com/..."
│   │   ├── title: "Video Title"
│   │   └── isVisible: true
│   └── ...
└── all_sections_order/
    └── Contains the ordering of all section types
```

### Publishing Changes

After making changes to video sections:
1. Click the **"Publish"** button in the Admin panel
2. Select "Homepage Sections" if not auto-selected
3. Confirm publication
4. Check the homepage to verify changes are live

### Troubleshooting

**Videos not appearing on homepage:**
- Ensure section is set to `is_visible: true`
- Check that videos are configured with `isVisible: true`
- Verify section has a lower `order_index` than hidden sections
- Publish changes - changes in admin don't auto-sync

**Order not correct:**
- Check `order_index` values in database
- Lower numbers appear higher on the page
- Use "Move Up/Down" buttons in admin interface
- Republish after reordering

**Cannot see Video Sections tab:**
- Make sure you're logged in as admin
- Admin credentials are required
- Check browser console for any errors

### Related Tabs

- **Homepage Sections**: Manage product/category sections and overall section ordering
- **Marquee**: Top scrolling banner text
- **Carousel**: Banner image carousel

For more details, see `VIDEO_SECTIONS_INTEGRATION_GUIDE.md`
