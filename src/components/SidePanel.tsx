'use client';

import { useState, useCallback, useEffect } from 'react';
import CollectionsList from './CollectionsList';
import CollectionPlacesList from './CollectionPlacesList';
import { type Collection } from '@/app/actions/collections';
import { type PlaceWithCollection } from '@/app/actions/places';

interface SidePanelProps {
  places: PlaceWithCollection[];
  onNewCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onFocusCollection: (collection: Collection) => void;
  onPlaceClick: (placeId: string) => void;
  onCollectionFilterChange: (collectionId: string | null) => void;
  selectedPlaceId?: string | null;
  collectionsRefreshTrigger?: number;
}

export default function SidePanel({
  places,
  onNewCollection,
  onEditCollection,
  onFocusCollection,
  onPlaceClick,
  onCollectionFilterChange,
  selectedPlaceId,
  collectionsRefreshTrigger,
}: SidePanelProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // When a collection is selected, filter map to that collection
  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      setSelectedCollection(collection);
      onCollectionFilterChange(collection.id);
    },
    [onCollectionFilterChange]
  );

  // When going back, clear the collection filter
  const handleBack = useCallback(() => {
    setSelectedCollection(null);
    onCollectionFilterChange(null);
  }, [onCollectionFilterChange]);

  // Get places for selected collection
  const collectionPlaces = selectedCollection
    ? places.filter((p) => p.collection_id === selectedCollection.id)
    : [];

  // If selected collection is deleted (refresh trigger), go back
  useEffect(() => {
    if (selectedCollection) {
      // Check if collection still exists in the places data
      const stillExists = places.some(
        (p) => p.collection?.id === selectedCollection.id
      );
      // Collection might be empty but still exist, so also check if any places reference it
      // For now we keep the collection view even if empty - user can go back manually
    }
  }, [collectionsRefreshTrigger, selectedCollection, places]);

  if (selectedCollection) {
    return (
      <CollectionPlacesList
        collection={selectedCollection}
        places={collectionPlaces}
        onBack={handleBack}
        onPlaceClick={onPlaceClick}
        onEditCollection={onEditCollection}
        selectedPlaceId={selectedPlaceId}
      />
    );
  }

  return (
    <CollectionsList
      onNewCollection={onNewCollection}
      onSelectCollection={handleSelectCollection}
      onEditCollection={onEditCollection}
      onFocusCollection={onFocusCollection}
      refreshTrigger={collectionsRefreshTrigger}
    />
  );
}
