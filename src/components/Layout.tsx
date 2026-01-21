'use client';

import { ReactNode, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Layers } from 'lucide-react';
import { clearSessionToken } from '@/lib/auth';
import NewCollectionModal from './NewCollectionModal';
import CollectionsList from './CollectionsList';
import { createCollection, type Collection } from '@/app/actions/collections';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
  onCollectionSelected?: (collection: Collection) => void;
}

export default function Layout({ children, sidePanel, onCollectionSelected }: LayoutProps) {
  const router = useRouter();
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCollectionsOpen, setIsMobileCollectionsOpen] = useState(false);
  const [collectionsRefreshTrigger, setCollectionsRefreshTrigger] = useState(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();

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
    </div>
  );
}
