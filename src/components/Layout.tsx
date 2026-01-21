'use client';

import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Layers, Trash2 } from 'lucide-react';
import { clearSessionToken } from '@/lib/auth';
import { detectMapsUrl, extractCoordinatesFromUrl, extractPlaceNameFromUrl } from '@/lib/maps';
import { reverseGeocode } from '@/lib/geocoding';
import NewCollectionModal from './NewCollectionModal';
import AddPlaceModal, { type ExtractedPlace } from './AddPlaceModal';
import CollectionsList from './CollectionsList';
import { createCollection, type Collection } from '@/app/actions/collections';
import { createPlace } from '@/app/actions/places';
import { ToastContainer, generateToastId, type ToastData } from './Toast';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
  onCollectionSelected?: (collection: Collection) => void;
  /** Callback when a place is added */
  onPlaceAdded?: () => void;
}

export default function Layout({ children, sidePanel, onCollectionSelected, onPlaceAdded }: LayoutProps) {
  const router = useRouter();
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCollectionsOpen, setIsMobileCollectionsOpen] = useState(false);
  const [collectionsRefreshTrigger, setCollectionsRefreshTrigger] = useState(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();

  // Add Place modal state
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [extractedPlace, setExtractedPlace] = useState<ExtractedPlace | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastData['type'], message: string) => {
    const newToast: ToastData = {
      id: generateToastId(),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    clearSessionToken();
    router.push('/login');
  };

  const handleCreateCollection = async (data: {
    name: string;
    color: string;
    icon: string;
  }) => {
    setIsSubmitting(true);
    const result = await createCollection(data);
    setIsSubmitting(false);

    if (result.success) {
      setIsNewCollectionOpen(false);
      // Trigger refresh of collections list
      setCollectionsRefreshTrigger((prev) => prev + 1);
    } else {
      console.error('Failed to create collection:', result.error);
    }
  };

  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      setSelectedCollectionId(collection.id);
      setIsMobileCollectionsOpen(false);
      onCollectionSelected?.(collection);
    },
    [onCollectionSelected]
  );

  const handleOpenNewCollection = () => {
    setIsMobileCollectionsOpen(false);
    setIsNewCollectionOpen(true);
  };

  // Handle saving a place from the Add Place modal
  const handleSavePlace = async (data: { place: ExtractedPlace; collectionId: string }) => {
    setIsAddingPlace(true);
    console.log('[Saving Place]', data);

    const result = await createPlace({
      name: data.place.name,
      address: data.place.address,
      lat: data.place.lat,
      lng: data.place.lng,
      googleMapsUrl: data.place.googleMapsUrl,
      collectionId: data.collectionId,
    });

    setIsAddingPlace(false);

    if (result.success) {
      console.log('[Place Saved Successfully]', result.place);
      setIsAddPlaceOpen(false);
      setExtractedPlace(null);
      showToast('success', `"${data.place.name}" added to your collection!`);
      // Notify parent to refresh places
      onPlaceAdded?.();
    } else {
      console.error('[Failed to Save Place]', result.error);
      showToast('error', result.error || 'Failed to save place. Please try again.');
    }
  };

  const handleCloseAddPlace = () => {
    setIsAddPlaceOpen(false);
    setExtractedPlace(null);
  };

  // Global paste event listener
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Get pasted text
      const pastedText = event.clipboardData?.getData('text');

      if (pastedText) {
        console.log('[Paste Detected]', pastedText);

        // Check if it's a Google Maps URL
        const detection = detectMapsUrl(pastedText);

        if (detection.isValid && detection.url) {
          console.log('[Google Maps URL Detected]', detection.url);

          // Extract place name from URL (if available)
          const urlPlaceName = extractPlaceNameFromUrl(detection.url);
          if (urlPlaceName) {
            console.log('[Place Name from URL]', urlPlaceName);
          }

          // Extract coordinates from URL
          const coordinates = extractCoordinatesFromUrl(detection.url);

          if (coordinates) {
            console.log('[Coordinates Extracted]', coordinates);

            // Reverse geocode to get place information
            console.log('[Fetching place info from geocoding...]');
            const placeInfo = await reverseGeocode(coordinates);

            if (placeInfo) {
              // Prefer URL-extracted name if available (more accurate for named places)
              const finalName = urlPlaceName || placeInfo.name;

              // Build extracted place data
              const extractedPlaceData: ExtractedPlace = {
                name: finalName,
                address: placeInfo.address,
                lat: placeInfo.lat,
                lng: placeInfo.lng,
                googleMapsUrl: detection.url,
                urlExtractedName: urlPlaceName || null,
                geocodedName: placeInfo.name,
                displayName: placeInfo.displayName,
                placeType: placeInfo.placeType || null,
                city: placeInfo.city || null,
                country: placeInfo.country || null,
              };

              console.log('[All Extracted Place Data]', extractedPlaceData);

              // Open the Add Place modal (Phase 4.6)
              setExtractedPlace(extractedPlaceData);
              setIsAddPlaceOpen(true);
            } else {
              console.error('[Failed to get place info] Geocoding failed');
              // If we have URL name and coordinates, still allow adding with partial data
              if (urlPlaceName && coordinates) {
                const partialPlaceData: ExtractedPlace = {
                  name: urlPlaceName,
                  address: 'Address not available',
                  lat: coordinates.lat,
                  lng: coordinates.lng,
                  googleMapsUrl: detection.url,
                  urlExtractedName: urlPlaceName,
                  geocodedName: undefined,
                  displayName: undefined,
                  placeType: null,
                  city: null,
                  country: null,
                };
                setExtractedPlace(partialPlaceData);
                setIsAddPlaceOpen(true);
                showToast('error', 'Could not get full address info. You can still save the place.');
              } else {
                showToast('error', 'Could not get place information. Please try again or add manually.');
              }
            }
          } else {
            console.log('[No coordinates found in URL] Cannot extract place info');
            showToast('error', 'Could not find location in URL. Try a different Google Maps link.');
          }
        }
        // Note: We intentionally don't show error for non-Maps URLs to avoid spamming
        // when users paste normal text
      }
    };

    // Add event listener to window
    window.addEventListener('paste', handlePaste);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [showToast]);

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Map area - fills available space */}
      <div className="flex-1 relative">
        {/* Top bar buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Mobile: Collections toggle button */}
          <button
            onClick={() => setIsMobileCollectionsOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Collections"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Collections</span>
          </button>

          {/* New Collection button */}
          <button
            onClick={() => setIsNewCollectionOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 transition-all"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Collection</span>
          </button>

          {/* Trash button */}
          <button
            onClick={() => router.push('/trash')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Trash"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Trash</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {children}
      </div>

      {/* New Collection Modal */}
      <NewCollectionModal
        isOpen={isNewCollectionOpen}
        onClose={() => setIsNewCollectionOpen(false)}
        onSubmit={handleCreateCollection}
        isSubmitting={isSubmitting}
      />

      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={isAddPlaceOpen}
        onClose={handleCloseAddPlace}
        place={extractedPlace}
        onSave={handleSavePlace}
        isSubmitting={isAddingPlace}
      />

      {/* Mobile Collections Panel (slide-up) */}
      {isMobileCollectionsOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileCollectionsOpen(false)}
          />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
              <CollectionsList
                onNewCollection={handleOpenNewCollection}
                onSelectCollection={handleSelectCollection}
                selectedId={selectedCollectionId}
                refreshTrigger={collectionsRefreshTrigger}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Side Panel */}
      <div className="hidden lg:block w-[320px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        {sidePanel || (
          <CollectionsList
            onNewCollection={() => setIsNewCollectionOpen(true)}
            onSelectCollection={handleSelectCollection}
            selectedId={selectedCollectionId}
            refreshTrigger={collectionsRefreshTrigger}
          />
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
