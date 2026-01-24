'use client';

import { useState, useEffect } from 'react';
import { Folder, Trash2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import { PRESET_COLORS, findColorByValue, type PresetColor } from '@/lib/colors';
import { findIconByName, type PresetIcon } from '@/lib/icons';
import type { Collection } from '@/app/actions/collections';

interface EditCollectionModalProps {
  /** The collection to edit */
  collection: Collection | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when collection is saved */
  onSave: (data: { id: string; name: string; color: string; icon: string }) => void;
  /** Callback when collection is deleted */
  onDelete: (id: string) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether delete is in progress */
  isDeleting?: boolean;
  /** Number of places in this collection */
  placeCount?: number;
}

export default function EditCollectionModal({
  collection,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  placeCount = 0,
}: EditCollectionModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<PresetColor>(PRESET_COLORS[0]);
  const [icon, setIcon] = useState<PresetIcon | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      const foundColor = findColorByValue(collection.color);
      if (foundColor) setColor(foundColor);
      const foundIcon = findIconByName(collection.icon);
      if (foundIcon) setIcon(foundIcon);
      setShowDeleteConfirm(false);
    }
  }, [collection]);

  const isValid = name.trim().length > 0;
  const isLoading = isSaving || isDeleting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading || !collection || !icon) return;

    onSave({
      id: collection.id,
      name: name.trim(),
      color: color.value,
      icon: icon.name,
    });
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (collection) {
      onDelete(collection.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Get the selected icon component for preview
  const SelectedIcon = icon?.icon || Folder;

  if (!collection) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Collection" maxWidth="max-w-lg">
      {showDeleteConfirm ? (
        // Delete confirmation view
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete "{collection.name}"?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
              {placeCount > 0 ? (
                <>
                  This collection contains <strong>{placeCount} {placeCount === 1 ? 'place' : 'places'}</strong>.
                  {' '}They will be moved to your default collection.
                </>
              ) : (
                'This collection is empty and will be permanently deleted.'
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Collection
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Edit form view
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-4">
              {/* Pin preview */}
              <div
                className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: color.value }}
              >
                <SelectedIcon className="w-7 h-7 text-white" />
              </div>
              {/* Name preview */}
              <div>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {name || 'Collection Name'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {color.name} · {icon?.name || 'Icon'}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Name input */}
          <div className="space-y-1">
            <label
              htmlFor="edit-collection-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <Folder className="w-4 h-4" />
              </div>
              <input
                id="edit-collection-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Favorite Restaurants"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          {/* Color picker */}
          <ColorPicker
            label="Color"
            value={color.value}
            onSelect={setColor}
          />

          {/* Icon picker */}
          {icon && (
            <IconPicker
              label="Icon"
              value={icon.name}
              onSelect={setIcon}
              accentColor={color.value}
            />
          )}

          {/* Delete link */}
          <div>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete this collection
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
