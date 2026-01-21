'use server';

import { supabase } from '@/lib/supabase';
import { getOrCreateDefaultCollection } from './collections';

export interface Place {
  id: string;
  collection_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  rating: number | null;
  opening_hours: Record<string, unknown> | null;
  website: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatePlaceInput {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  collectionId?: string;
  rating?: number;
  website?: string;
  phone?: string;
  notes?: string;
}

export interface CreatePlaceResult {
  success: boolean;
  place?: Place;
  error?: string;
}

/**
 * Create a new place in the database
 */
export async function createPlace(input: CreatePlaceInput): Promise<CreatePlaceResult> {
  const { name, address, lat, lng, googleMapsUrl, collectionId, rating, website, phone, notes } =
    input;

  // Validate input
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Place name is required' };
  }

  try {
    // Get or create default collection if none specified
    let finalCollectionId = collectionId;

    if (!finalCollectionId) {
      const defaultResult = await getOrCreateDefaultCollection();
      if (!defaultResult.success || !defaultResult.collection) {
        return { success: false, error: 'Failed to get default collection' };
      }
      finalCollectionId = defaultResult.collection.id;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('places')
      .insert({
        name: name.trim(),
        address: address || null,
        lat: lat || null,
        lng: lng || null,
        google_maps_url: googleMapsUrl || null,
        collection_id: finalCollectionId,
        rating: rating || null,
        opening_hours: null,
        website: website || null,
        phone: phone || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating place:', error);
      return { success: false, error: 'Failed to create place' };
    }

    return { success: true, place: data as Place };
  } catch (err) {
    console.error('Error creating place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch all places from the database (excluding soft-deleted)
 */
export async function getPlaces(): Promise<{
  success: boolean;
  places?: Place[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as Place[] };
  } catch (err) {
    console.error('Error fetching places:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Place with collection data included (for map display)
 */
export interface PlaceWithCollection extends Place {
  collection: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

/**
 * Fetch all places with their collection data (for map markers)
 * Excludes soft-deleted places
 */
export async function getPlacesWithCollections(): Promise<{
  success: boolean;
  places?: PlaceWithCollection[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        collection:collections(id, name, color, icon)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places with collections:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as PlaceWithCollection[] };
  } catch (err) {
    console.error('Error fetching places with collections:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch places for a specific collection
 */
export async function getPlacesByCollection(collectionId: string): Promise<{
  success: boolean;
  places?: Place[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('collection_id', collectionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as Place[] };
  } catch (err) {
    console.error('Error fetching places:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update a place's editable fields
 */
export interface UpdatePlaceInput {
  id: string;
  name?: string;
  notes?: string;
  collectionId?: string;
}

export async function updatePlace(input: UpdatePlaceInput): Promise<{
  success: boolean;
  place?: Place;
  error?: string;
}> {
  const { id, name, notes, collectionId } = input;

  if (!id) {
    return { success: false, error: 'Place ID is required' };
  }

  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return { success: false, error: 'Place name cannot be empty' };
      }
      updates.name = name.trim();
    }

    if (notes !== undefined) {
      updates.notes = notes || null;
    }

    if (collectionId !== undefined) {
      updates.collection_id = collectionId;
    }

    const { data, error } = await supabase
      .from('places')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating place:', error);
      return { success: false, error: 'Failed to update place' };
    }

    return { success: true, place: data as Place };
  } catch (err) {
    console.error('Error updating place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Soft delete a place (set deleted_at timestamp)
 */
export async function softDeletePlace(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!id) {
    return { success: false, error: 'Place ID is required' };
  }

  try {
    const { error } = await supabase
      .from('places')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase error soft deleting place:', error);
      return { success: false, error: 'Failed to delete place' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error soft deleting place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Restore a soft-deleted place
 */
export async function restorePlace(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!id) {
    return { success: false, error: 'Place ID is required' };
  }

  try {
    const { error } = await supabase
      .from('places')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase error restoring place:', error);
      return { success: false, error: 'Failed to restore place' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error restoring place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Permanently delete a place from the database
 */
export async function permanentlyDeletePlace(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!id) {
    return { success: false, error: 'Place ID is required' };
  }

  try {
    // First delete any place_tags associations
    await supabase.from('place_tags').delete().eq('place_id', id);

    // Then delete the place
    const { error } = await supabase.from('places').delete().eq('id', id);

    if (error) {
      console.error('Supabase error permanently deleting place:', error);
      return { success: false, error: 'Failed to permanently delete place' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error permanently deleting place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch soft-deleted places (trash)
 */
export async function getDeletedPlaces(): Promise<{
  success: boolean;
  places?: PlaceWithCollection[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        collection:collections(id, name, color, icon)
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching deleted places:', error);
      return { success: false, error: 'Failed to fetch deleted places' };
    }

    return { success: true, places: data as PlaceWithCollection[] };
  } catch (err) {
    console.error('Error fetching deleted places:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============ Tag Related Functions ============

export interface Tag {
  id: string;
  name: string;
}

/**
 * Get all tags
 */
export async function getTags(): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching tags:', error);
      return { success: false, error: 'Failed to fetch tags' };
    }

    return { success: true, tags: data as Tag[] };
  } catch (err) {
    console.error('Error fetching tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get tags for a specific place
 */
export async function getTagsForPlace(placeId: string): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('place_tags')
      .select('tag_id, tags(id, name)')
      .eq('place_id', placeId);

    if (error) {
      console.error('Supabase error fetching place tags:', error);
      return { success: false, error: 'Failed to fetch place tags' };
    }

    const tags = data
      .map((pt) => pt.tags as unknown as Tag)
      .filter((t): t is Tag => t !== null);

    return { success: true, tags };
  } catch (err) {
    console.error('Error fetching place tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a tag if it doesn't exist, return existing if it does
 */
export async function getOrCreateTag(name: string): Promise<{
  success: boolean;
  tag?: Tag;
  error?: string;
}> {
  const trimmedName = name.trim().toLowerCase();

  if (!trimmedName) {
    return { success: false, error: 'Tag name is required' };
  }

  try {
    // Check if tag exists
    const { data: existing, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', trimmedName)
      .single();

    if (existing && !fetchError) {
      return { success: true, tag: existing as Tag };
    }

    // Create new tag
    const { data: newTag, error: createError } = await supabase
      .from('tags')
      .insert({ name: trimmedName })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error creating tag:', createError);
      return { success: false, error: 'Failed to create tag' };
    }

    return { success: true, tag: newTag as Tag };
  } catch (err) {
    console.error('Error in getOrCreateTag:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update tags for a place
 */
export async function updatePlaceTags(
  placeId: string,
  tagNames: string[]
): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    // Delete existing place_tags
    const { error: deleteError } = await supabase
      .from('place_tags')
      .delete()
      .eq('place_id', placeId);

    if (deleteError) {
      console.error('Supabase error deleting place tags:', deleteError);
      return { success: false, error: 'Failed to update tags' };
    }

    if (tagNames.length === 0) {
      return { success: true, tags: [] };
    }

    // Get or create all tags
    const tags: Tag[] = [];
    for (const name of tagNames) {
      const result = await getOrCreateTag(name);
      if (result.success && result.tag) {
        tags.push(result.tag);
      }
    }

    // Insert new place_tags
    const placeTags = tags.map((tag) => ({
      place_id: placeId,
      tag_id: tag.id,
    }));

    const { error: insertError } = await supabase
      .from('place_tags')
      .insert(placeTags);

    if (insertError) {
      console.error('Supabase error inserting place tags:', insertError);
      return { success: false, error: 'Failed to update tags' };
    }

    return { success: true, tags };
  } catch (err) {
    console.error('Error updating place tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Place with collection and tags data
 */
export interface PlaceWithCollectionAndTags extends PlaceWithCollection {
  tags: Tag[];
}

/**
 * Fetch all places with their collection and tags data
 */
export async function getPlacesWithCollectionsAndTags(): Promise<{
  success: boolean;
  places?: PlaceWithCollectionAndTags[];
  error?: string;
}> {
  try {
    // First get places with collections
    const placesResult = await getPlacesWithCollections();
    if (!placesResult.success || !placesResult.places) {
      return { success: false, error: placesResult.error };
    }

    // Then get tags for each place
    const placesWithTags: PlaceWithCollectionAndTags[] = await Promise.all(
      placesResult.places.map(async (place) => {
        const tagsResult = await getTagsForPlace(place.id);
        return {
          ...place,
          tags: tagsResult.success && tagsResult.tags ? tagsResult.tags : [],
        };
      })
    );

    return { success: true, places: placesWithTags };
  } catch (err) {
    console.error('Error fetching places with tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
