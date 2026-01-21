'use client';

import { Check } from 'lucide-react';
import { PRESET_COLORS, getContrastColor, type PresetColor } from '@/lib/colors';

interface ColorPickerProps {
  /** Currently selected color value (hex) */
  value?: string;
  /** Callback when a color is selected */
  onSelect: (color: PresetColor) => void;
  /** Optional label */
  label?: string;
}

export default function ColorPicker({ value, onSelect, label }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => {
          const isSelected = value?.toLowerCase() === color.value.toLowerCase();
          const contrastColor = getContrastColor(color.value);

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onSelect(color)}
              title={color.name}
              className={`
                relative w-8 h-8 rounded-lg transition-all duration-150 ease-out
                hover:scale-110 hover:shadow-lg hover:z-10
                focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900
                ${isSelected ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white ring-offset-white dark:ring-offset-zinc-900 scale-110 shadow-lg' : ''}
              `}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name}`}
              aria-pressed={isSelected}
            >
              {/* Checkmark for selected state */}
              {isSelected && (
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: contrastColor }}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </span>
              )}

              {/* Inner shadow for depth */}
              <span className="absolute inset-0 rounded-lg shadow-inner pointer-events-none opacity-20" />
            </button>
          );
        })}
      </div>

      {/* Selected color name indicator */}
      {value && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Selected:{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {PRESET_COLORS.find((c) => c.value.toLowerCase() === value.toLowerCase())?.name || value}
          </span>
        </p>
      )}
    </div>
  );
}
