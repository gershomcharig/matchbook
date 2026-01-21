'use client';

import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import {
  PRESET_ICONS,
  getIconCategories,
  getIconsByCategory,
  type PresetIcon,
} from '@/lib/icons';

interface IconPickerProps {
  /** Currently selected icon name */
  value?: string;
  /** Callback when an icon is selected */
  onSelect: (icon: PresetIcon) => void;
  /** Optional label */
  label?: string;
  /** Optional accent color for selection ring (hex) */
  accentColor?: string;
}

export default function IconPicker({
  value,
  onSelect,
  label,
  accentColor,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = getIconCategories();

  // Filter icons based on search and category
  const filteredIcons = PRESET_ICONS.filter((icon) => {
    const matchesSearch =
      searchQuery === '' ||
      icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || icon.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group icons by category for display
  const groupedIcons = selectedCategory
    ? { [selectedCategory]: getIconsByCategory(selectedCategory) }
    : categories.reduce(
        (acc, category) => {
          const categoryIcons = filteredIcons.filter(
            (icon) => icon.category === category
          );
          if (categoryIcons.length > 0) {
            acc[category] = categoryIcons;
          }
          return acc;
        },
        {} as Record<string, PresetIcon[]>
      );

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
            selectedCategory === null
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              selectedCategory === category
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Scrollable icon grid */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category} className="p-3">
            {/* Category header (only show when viewing all) */}
            {selectedCategory === null && (
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                {category}
              </p>
            )}

            {/* Icon grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {icons.map((iconData) => {
                const Icon = iconData.icon;
                const isSelected = value === iconData.name;

                return (
                  <button
                    key={iconData.name}
                    type="button"
                    onClick={() => onSelect(iconData)}
                    title={iconData.name}
                    className={`
                      relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ease-out
                      hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-110
                      focus:outline-none focus:ring-2 focus:ring-amber-500/50
                      ${
                        isSelected
                          ? 'bg-zinc-200 dark:bg-zinc-700 ring-2 ring-offset-1 ring-offset-zinc-50 dark:ring-offset-zinc-800'
                          : ''
                      }
                    `}
                    style={
                      isSelected && accentColor
                        ? ({ '--tw-ring-color': accentColor } as React.CSSProperties)
                        : undefined
                    }
                    aria-label={`Select ${iconData.name}`}
                    aria-pressed={isSelected}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    />

                    {/* Checkmark badge for selected */}
                    {isSelected && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: accentColor || '#f59e0b' }}
                      >
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredIcons.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No icons found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Selected icon indicator */}
      {value && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Selected:{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {value}
          </span>
        </p>
      )}
    </div>
  );
}
