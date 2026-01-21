'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import Map from '@/components/Map';
import EmptyState from '@/components/EmptyState';
import PlaceDetailsPanel from '@/components/PlaceDetailsPanel';
import EditPlaceModal from '@/components/EditPlaceModal';
import {
  getPlacesWithCollections,
  getTagsForPlace,
  type PlaceWithCollection,
  type Tag,
} from '@/app/actions/places';

export default function Home() {
  const [places, setPlaces] = useState<PlaceWithCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithCollection | null>(null);
  const [selectedPlaceTags, setSelectedPlaceTags] = useState<Tag[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch places on mount and when triggered
  const fetchPlaces = useCallback(async () => {
    const result = await getPlacesWithCollections();
    if (result.success && result.places) {
      console.log('[Places Loaded]', result.places.length, 'places with collections');
      setPlaces(result.places);
    } else {
      console.error('[Failed to load places]', result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Fetch tags when a place is selected
  const fetchTagsForPlace = useCallback(async (placeId: string) => {
    const result = await getTagsForPlace(placeId);
    if (result.success && result.tags) {
      setSelectedPlaceTags(result.tags);
    } else {
      setSelectedPlaceTags([]);
    }
  }, []);

  // Handle marker click - open place details panel
  const handleMarkerClick = useCallback(
    (placeId: string) => {
      console.log('[Place Selected]', placeId);
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setSelectedPlace(place);
        setIsPanelOpen(true);
        fetchTagsForPlace(placeId);
      }
    },
    [places, fetchTagsForPlace]
  );

  // Handle closing the panel
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Keep selectedPlace for animation, clear after transition
    setTimeout(() => {
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
    }, 300);
  }, []);

  // Handle collection click from panel (will be used in Phase 9 for filtering)
  const handleCollectionClick = useCallback(
    (collectionId: string) => {
      console.log('[Collection Clicked from Panel]', collectionId);
      // TODO: Filter map to show only this collection (Phase 9)
      handleClosePanel();
    },
    [handleClosePanel]
  );

  // Handle tag click from panel (will be used in Phase 9 for filtering)
  const handleTagClick = useCallback(
    (tagName: string) => {
      console.log('[Tag Clicked from Panel]', tagName);
      // TODO: Filter map to show only places with this tag (Phase 9)
      handleClosePanel();
    },
    [handleClosePanel]
  );

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  // Handle edit save - refresh places and update selected place
  const handleEditSave = useCallback(async () => {
    await fetchPlaces();
    // Refresh the selected place with updated data
    if (selectedPlace) {
      const result = await getPlacesWithCollections();
      if (result.success && result.places) {
        const updated = result.places.find((p) => p.id === selectedPlace.id);
        if (updated) {
          setSelectedPlace(updated);
          fetchTagsForPlace(updated.id);
        }
      }
    }
  }, [fetchPlaces, selectedPlace, fetchTagsForPlace]);

  // Handle delete - refresh places and close panel
  const handleDelete = useCallback(async () => {
    await fetchPlaces();
    handleClosePanel();
  }, [fetchPlaces, handleClosePanel]);

  const hasPlaces = places.length > 0;

  return (
    <Layout onPlaceAdded={fetchPlaces}>
      <Map places={places} onMarkerClick={handleMarkerClick} />
      {!isLoading && !hasPlaces && <EmptyState />}

      {/* Place Details Panel */}
      <PlaceDetailsPanel
        place={selectedPlace}
        tags={selectedPlaceTags}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onCollectionClick={handleCollectionClick}
        onTagClick={handleTagClick}
        onEdit={handleEditClick}
      />

      {/* Edit Place Modal */}
      <EditPlaceModal
        place={selectedPlace}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        onDelete={handleDelete}
      />
    </Layout>
  );
}
