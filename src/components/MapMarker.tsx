'use client';

import { Marker, MarkerEvent } from 'react-map-gl/mapbox';
import { getContrastColor } from '@/lib/colors';
import { findIconByName } from '@/lib/icons';

interface MapMarkerProps {
  /** Unique identifier for the place */
  placeId: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Collection color (hex) */
  color: string;
  /** Collection icon name */
  iconName: string;
  /** Click handler */
  onClick?: (placeId: string) => void;
}

export default function MapMarker({
  placeId,
  lat,
  lng,
  color,
  iconName,
  onClick,
}: MapMarkerProps) {
  const iconData = findIconByName(iconName);
  const IconComponent = iconData?.icon;
  const contrastColor = getContrastColor(color);

  const handleClick = (e: MarkerEvent<MouseEvent>) => {
    e.originalEvent.stopPropagation();
    onClick?.(placeId);
  };

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={handleClick}
    >
      {/* Custom pin shape with drop shadow */}
      <div
        className="relative cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        {/* Pin body - teardrop shape using SVG */}
        <svg
          width="32"
          height="42"
          viewBox="0 0 32 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pin shape path - teardrop */}
          <path
            d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
            fill={color}
          />
          {/* Inner circle for icon background */}
          <circle
            cx="16"
            cy="14"
            r="10"
            fill={color}
            stroke={contrastColor}
            strokeWidth="1.5"
            strokeOpacity="0.2"
          />
        </svg>

        {/* Icon positioned in the center of the pin */}
        <div
          className="absolute top-[6px] left-1/2 -translate-x-1/2 flex items-center justify-center"
          style={{ width: '20px', height: '20px' }}
        >
          {IconComponent && (
            <IconComponent
              size={14}
              color={contrastColor}
              strokeWidth={2.5}
            />
          )}
        </div>
      </div>
    </Marker>
  );
}
