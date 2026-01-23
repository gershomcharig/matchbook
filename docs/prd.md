# Matchbook PRD

## What is it

Matchbook is a personal place-saving app that makes it effortless to collect and organize locations you want to visit.

**The core idea**: Paste a Google Maps link (or share it directly from the Google Maps app on Android) and Matchbook automatically extracts all the place details—name, address, rating, hours, and more. No typing, no forms, just paste and save.

**Key features**:
- **Effortless saving**: Paste links or share from Google Maps to instantly save places
- **Smart organization**: Group places into customizable collections with colored pins and icons
- **Flexible browsing**: Map view with side panel for exploring collections and places as lists
- **Travel-ready**: Mobile-first PWA that works great on your phone while exploring a new city
- **Your data**: Places stored securely with soft-delete and 30-day trash recovery

## Target User

Single user (personal use). The app will be password-protected to keep data private when deployed online.

## Tech Stack

- **Frontend**: Next.js (React framework)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Maps**: Mapbox
- **PWA**: Progressive Web App for mobile share sheet integration
- **Styling**: Minimal & clean design, mobile-first responsive, no visible branding

## Core Features

### Map View (Main View)
- Displays saved places as colored pins on a Mapbox map
- Each collection has a customizable pin color and icon (from an icon library, ~50-80 icons)
- Clicking a pin opens place details in a panel (slide-up on mobile, side panel on desktop)
- Default view: zoom to show all saved places (empty state: centered on London, UK)
- **Filtering**:
  - Select a collection in the side panel to filter map to only those places
  - Filter by tags via the filter bar
  - Global search across place names, notes, and tags
- Context menu (right-click desktop, long-press mobile): Edit, Move to collection, Copy address, Navigate, Delete
- Color palette for pins: ~12-16 curated preset colors

### Place Details
When viewing a place, display:
- Place name
- Address (with copy to clipboard button)
- Google Maps link
- Rating (if available)
- Opening hours (if available)
- Website (if available)
- Phone number (if available)
- Collection it belongs to (clickable - filters map to that collection)
- User-added notes (plain text)
- User-added tags (free-form, clickable - filters map view by that tag)
- Button to open navigation (Google Maps or other apps)
- Button to copy address to clipboard

### Adding Places (Key Feature)
- **Paste to add**: Simply pasting a Google Maps link anywhere in the app triggers place detection
- Auto-extracts: place name, address, coordinates, Google Maps link, rating, opening hours, website, phone number
- Uses free alternatives (web scraping/geocoding) instead of Google Places API
- After paste, prompts user to select which collection to save to
- Can paste multiple links at once
- **Mobile**: Share sheet integration via PWA (Android) + visible paste button always shown
- **Manual entry**: Option to add places by typing name/address (geocoded to get coordinates)
- **Error handling**: If link processing fails, show error and offer manual entry fallback
- **Duplicates**: Warn if place already exists (by coordinates or link) but allow adding anyway

### Collections Panel (Primary Navigation)
The collections panel is the main way to explore places in list format. It appears as a side panel on desktop and can be opened on mobile.

- **Collections list**: Shows all collections with place counts
- **Collection drill-down**: Click a collection to:
  - Show a sorted list of places in that collection (newest, oldest, A-Z, Z-A)
  - Automatically filter map pins to only show places from that collection
  - Back button returns to collections list and clears filter
- **Trash**: Appears as a special item at the bottom of the collections list
  - Shows deleted places with days remaining until permanent deletion
  - Restore or permanently delete places from trash
  - Trashed places do not appear on the map

### Collection Management
- Create, edit, delete collections
- Customize: name, pin color (preset palette), pin icon (from icon library)
- One default "My Places" collection auto-created on first place add (can be renamed/deleted)

### Place Management
- Edit places: name, notes, tags, collection
- Move places between collections
- Soft delete: deleted places go to Trash (accessible via collections panel), recoverable for 30 days

### Authentication
- Simple password protection (single password for app access)
- Password set during initial setup
- Stay logged in on device (persistent session until explicit logout)

## Progressive Web App (PWA)
- Manifest.json with app name, icons, theme colors
- Service worker for PWA features
- Installable on mobile home screen
- Share Target API support (Android only - receives shared links from other apps)
- iOS users: install to home screen + use paste button (Share Target not supported on iOS)

## Design Principles

- **Minimal & clean**: Simple UI, lots of white space, focus on map and content
- **No visible branding**: Functional UI without prominent app name/logo
- **Mobile-first**: Optimized for phone use while traveling, scales up for desktop
- **Online only**: Requires internet connection (no offline support)

## Empty State

- Map centered on London, UK
- Prompt: "Paste a Google Maps link to get started"

## Data Limits

- Soft limits with warnings: No hard caps, but warn users if data is getting very large (performance reasons)

## Future Features

(Not in initial release)

1. **Export & Import**: Export to JSON/CSV for backup, import from JSON to restore
2. **Full authentication**: Proper login system with email/password for multi-user support
3. **Place thumbnails**: Save photos of places
4. **Distance sorting**: Sort by distance from current GPS location
5. **Custom ordering**: Drag-and-drop manual arrangement of places
6. **Center on user location**: Default map view option to center on GPS
7. **Web scraping for articles**: Paste article link, extract list of places immediately
8. **Multi-collection places**: Places belonging to more than one collection
9. **Additional export formats**: PDF/printable, Google Maps list
10. **Pin clustering**: Group nearby pins when zoomed out (optional toggle)
11. **Keyboard shortcuts**: V for view toggle, / for search, Escape to close, etc.
12. **Read Later for articles**: Save article links to process later (alternative to immediate extraction)
