/**
 * Curated color palette for collection pins.
 * These colors are chosen to:
 * - Stand out clearly on map backgrounds (light/dark)
 * - Be visually distinguishable from each other
 * - Look vibrant and appealing on pin markers
 */

export interface PresetColor {
  /** Hex color value */
  value: string;
  /** Human-readable name */
  name: string;
}

export const PRESET_COLORS: PresetColor[] = [
  // Warm colors
  { value: '#EF4444', name: 'Red' },
  { value: '#F97316', name: 'Orange' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EAB308', name: 'Yellow' },

  // Cool colors
  { value: '#84CC16', name: 'Lime' },
  { value: '#22C55E', name: 'Green' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#06B6D4', name: 'Cyan' },

  // Blues and purples
  { value: '#3B82F6', name: 'Blue' },
  { value: '#6366F1', name: 'Indigo' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#A855F7', name: 'Purple' },

  // Pinks and neutrals
  { value: '#EC4899', name: 'Pink' },
  { value: '#F43F5E', name: 'Rose' },
  { value: '#78716C', name: 'Stone' },
  { value: '#1E293B', name: 'Slate' },
];

/** Default color for new collections */
export const DEFAULT_COLOR = PRESET_COLORS[2]; // Amber - matches app accent

/**
 * Find a preset color by its hex value
 */
export function findColorByValue(value: string): PresetColor | undefined {
  return PRESET_COLORS.find(
    (color) => color.value.toLowerCase() === value.toLowerCase()
  );
}

/**
 * Get a contrasting text color (white or black) for a given background
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
