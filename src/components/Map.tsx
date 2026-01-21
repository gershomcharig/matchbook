'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Map as MapGL, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapMarker from './MapMarker';
import { type PlaceWithCollection } from '@/app/actions/places';

// London coordinates for empty state
const LONDON_CENTER = {
  longitude: -0.1278,
  latitude: 51.5074,
};

const INITIAL_ZOOM = 11;

// Padding for fitBounds (pixels)
const FIT_BOUNDS_PADDING = { top: 80, bottom: 80, left: 80, right: 400 };
const FIT_BOUNDS_PADDING_MOBILE = { top: 80, bottom: 80, left: 40, right: 40 };

interface MapProps {
  /** Places to display as markers */
  places?: PlaceWithCollection[];
  /** Callback when a marker is clicked */
  onMarkerClick?: (placeId: string) => void;
}

export default function Map({ places = [], onMarkerClick }: MapProps) {
  const mapRef = useRef<MapRef>(null);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (placeId: string) => {
      console.log('[Marker Clicked] Place ID:', placeId);
      onMarkerClick?.(placeId);
    },
    [onMarkerClick]
  );

  // Fit map to show all places when places change
  useEffect(() => {
    if (!mapRef.current) return;

    // Filter places with valid coordinates
    const placesWithCoords = places.filter(
      (p) => p.lat !== null && p.lng !== null
    );

    if (placesWithCoords.length === 0) {
      // No places - center on London
      mapRef.current.flyTo({
        center: [LONDON_CENTER.longitude, LONDON_CENTER.latitude],
        zoom: INITIAL_ZOOM,
        duration: 1000,
      });
      return;
    }

    if (placesWithCoords.length === 1) {
      // Single place - center on it with reasonable zoom
      const place = placesWithCoords[0];
      mapRef.current.flyTo({
        center: [place.lng!, place.lat!],
        zoom: 15,
        duration: 1000,
      });
      return;
    }

    // Multiple places - fit bounds
    const lngs = placesWithCoords.map((p) => p.lng!);
    const lats = placesWithCoords.map((p) => p.lat!);

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];

    // Use responsive padding (more for desktop sidebar)
    const isMobile = window.innerWidth < 1024;
    const padding = isMobile ? FIT_BOUNDS_PADDING_MOBILE : FIT_BOUNDS_PADDING;

    mapRef.current.fitBounds(bounds, {
      padding,
      duration: 1000,
      maxZoom: 16,
    });
  }, [places]);

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{
        ...LONDON_CENTER,
        zoom: INITIAL_ZOOM,
      }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Render markers for places with valid coordinates and collection data */}
      {places.map((place) => {
        if (place.lat === null || place.lng === null || !place.collection) {
          return null;
        }

        return (
          <MapMarker
            key={place.id}
            placeId={place.id}
            lat={place.lat}
            lng={place.lng}
            color={place.collection.color}
            iconName={place.collection.icon}
            onClick={handleMarkerClick}
          />
        );
      })}
    </MapGL>
  );
}
