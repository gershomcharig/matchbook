# Google Maps URL Detection Test Cases

This file documents the various Google Maps URL formats that the `maps.ts` utility should detect.

## Supported URL Formats

### 1. Standard google.com/maps URLs
```
https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
https://google.com/maps/place/Eiffel+Tower/@48.858844,2.294351
www.google.com/maps/@51.5074,-0.1278,14z
```

### 2. maps.google.com domain
```
https://maps.google.com/maps?q=London+Eye
https://maps.google.com/?q=Tower+Bridge
maps.google.com/maps/place/Buckingham+Palace
```

### 3. Regional Google domains
```
https://www.google.co.uk/maps/place/Westminster+Abbey
https://google.de/maps/@52.520008,13.404954
https://www.google.com.au/maps/place/Sydney+Opera+House
```

### 4. Shortened goo.gl/maps URLs
```
https://goo.gl/maps/ABC123XYZ
goo.gl/maps/DEF456UVW
```

### 5. New maps.app.goo.gl format
```
https://maps.app.goo.gl/ABC123XYZ
maps.app.goo.gl/DEF456UVW
```

## Non-Maps URLs (Should be Ignored)

These should NOT be detected as Google Maps URLs:
```
https://www.google.com/search?q=london
https://maps.example.com/location
https://youtube.com/watch?v=123
Just plain text with no URL
```

## Coordinate Extraction Test Cases

These URLs contain coordinates that should be extracted:

### @lat,lng format (most common)
```
https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
Expected: { lat: 51.5007292, lng: -0.1268141 }

https://google.com/maps/@48.858844,2.294351,15z
Expected: { lat: 48.858844, lng: 2.294351 }
```

### !3d!4d format
```
https://www.google.com/maps/place/Tower+Bridge/@51.5055!3d51.5055!4d-0.0754
Expected: { lat: 51.5055, lng: -0.0754 }
```

### ?q=lat,lng format
```
https://maps.google.com/?q=51.5074,-0.1278
Expected: { lat: 51.5074, lng: -0.1278 }
```

### ?ll=lat,lng format
```
https://www.google.com/maps?ll=52.520008,13.404954
Expected: { lat: 52.520008, lng: 13.404954 }
```

### ?center=lat,lng format
```
https://www.google.com/maps?center=40.7128,-74.0060
Expected: { lat: 40.7128, lng: -74.006 }
```

## Place Name Extraction Test Cases (Phase 4.5)

These URLs contain place names that should be extracted:

### Standard /place/Name format
```
https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
Expected name: "Big Ben"

https://www.google.com/maps/place/Eiffel+Tower,+Paris/@48.858844,2.294351
Expected name: "Eiffel Tower, Paris"

https://www.google.com/maps/place/The+Coffee+House/@51.5,-0.1
Expected name: "The Coffee House"

https://www.google.com/maps/place/Sydney+Opera+House/@-33.8568,151.2153
Expected name: "Sydney Opera House"
```

### URLs without place names
```
https://www.google.com/maps/@51.5074,-0.1278,14z
Expected name: null (no /place/ in URL - will use geocoded name)

https://maps.google.com/?q=51.5074,-0.1278
Expected name: null (coordinate-only URL - will use geocoded name)
```

## Testing

To test these formats:
1. Run the dev server: `npm run dev`
2. Open the browser console
3. Copy and paste each URL format above
4. Verify console logs show:
   - "[Google Maps URL Detected]" for valid Maps URLs
   - "[Place Name from URL]" for URLs with /place/Name
   - "[Coordinates Extracted]" for URLs with coordinate data
   - "[All Extracted Place Data]" with full data object including:
     - name (from URL or geocoding)
     - address (from geocoding)
     - coordinates
     - googleMapsUrl (original URL)
     - urlExtractedName (name from URL if available)
     - Extended fields (rating, openingHours, website, phone - all null)
   - "[Not a Google Maps URL] Ignoring paste" for non-Maps text
