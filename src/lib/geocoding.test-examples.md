# Geocoding Test Examples

This file documents test examples for the geocoding functionality.

## Reverse Geocoding Test Cases

Test these URLs by pasting them in the application. The console should show extracted coordinates and place information.

### Test 1: Big Ben, London
```
URL: https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
Expected Coordinates: { lat: 51.5007292, lng: -0.1268141 }
Expected Place Info:
  - Name: Big Ben (or similar landmark name)
  - Address: Westminster, London, UK
```

### Test 2: Eiffel Tower, Paris
```
URL: https://google.com/maps/@48.858844,2.294351,15z
Expected Coordinates: { lat: 48.858844, lng: 2.294351 }
Expected Place Info:
  - Name: Tour Eiffel / Eiffel Tower
  - Address: Champ de Mars, Paris, France
```

### Test 3: Sydney Opera House
```
URL: https://www.google.com/maps/place/Sydney+Opera+House/@-33.8567844,151.2152967,17z
Expected Coordinates: { lat: -33.8567844, lng: 151.2152967 }
Expected Place Info:
  - Name: Sydney Opera House
  - Address: Sydney, New South Wales, Australia
```

### Test 4: Colosseum, Rome
```
URL: https://maps.google.com/?q=41.8902,12.4922
Expected Coordinates: { lat: 41.8902, lng: 12.4922 }
Expected Place Info:
  - Name: Colosseo / Colosseum
  - Address: Rome, Italy
```

## Console Output Example

When pasting a Google Maps URL, you should see this sequence in the console:

```
[Paste Detected] https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
[Google Maps URL Detected] https://www.google.com/maps/place/Big+Ben/@51.5007292,-0.1268141,17z
[Coordinates Extracted] { lat: 51.5007292, lng: -0.1268141 }
[Fetching place info...]
[Place Info Retrieved] {
  name: "Big Ben",
  address: "Westminster, London, SW1A 0AA, United Kingdom",
  coordinates: { lat: 51.5007292, lng: -0.1268141 }
}
```

## Rate Limiting Note

Nominatim has a rate limit of 1 request per second. If you paste multiple URLs quickly, you may need to wait between requests to avoid being rate-limited.

## Error Cases

### No Coordinates in URL
```
URL: https://goo.gl/maps/shortcode
Console: [No coordinates found in URL] Cannot extract place info
```

### Geocoding Failure
If Nominatim API is unavailable or returns an error:
```
Console: [Failed to get place info] Geocoding failed
```

## Testing Steps

1. Run the dev server: `npm run dev`
2. Open the browser and navigate to the app
3. Open the browser console (F12 or Cmd+Option+I)
4. Copy one of the test URLs above
5. Paste it anywhere in the app (Cmd+V or Ctrl+V)
6. Watch the console for the extraction and geocoding steps
7. Verify the place name and address are retrieved correctly
