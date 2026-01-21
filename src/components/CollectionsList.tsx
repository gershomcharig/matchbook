'use client';

import { useEffect, useState } from 'react';
import { Folder, Plus } from 'lucide-react';
import { getCollections, type Collection } from '@/app/actions/collections';
import { findIconByName } from '@/lib/icons';

interface CollectionsListProps {
  /** Callback when "New Collection" is clicked */
  onNewCollection?: () => void;
  /** Callback when a collection is clicked */
  onSelectCollection?: (collection: Collection) => void;
  /** Currently selected collection ID */
  selectedId?: string;
  /** Trigger refresh when this value changes */
  refreshTrigger?: number;
}

export default function CollectionsList({
  onNewCollection,
  onSelectCollection,
  selectedId,
  refreshTrigger,
}: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      setIsLoading(true);
      setError(null);

      const result = await getCollections();

      if (result.success && result.collections) {
        setCollections(result.collections);
      } else {
        setError(result.error || 'Failed to load collections');
      }

      setIsLoading(false);
    }

    fetchCollections();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Collections
        </h2>
        {onNewCollection && (
          <button
            onClick={onNewCollection}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collections list */}
      {collections.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
            <Folder className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No collections yet
          </p>
          {onNewCollection && (
            <button
              onClick={onNewCollection}
              className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Create your first collection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {collections.map((collection) => {
            const iconData = findIconByName(collection.icon);
            const Icon = iconData?.icon || Folder;
            const isSelected = selectedId === collection.id;

            return (
              <button
                key={collection.id}
                onClick={() => onSelectCollection?.(collection)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {/* Color swatch with icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: collection.color }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Name */}
                <span
                  className={`
                    text-sm font-medium truncate
                    ${
                      isSelected
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }
                  `}
                >
                  {collection.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
