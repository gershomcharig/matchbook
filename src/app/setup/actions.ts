'use server';

import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export type SetupResult = {
  success: boolean;
  error?: string;
};

/**
 * Set up the initial password for the app
 * Saves the hashed password to the settings table
 */
export async function setupPassword(password: string): Promise<SetupResult> {
  try {
    // Check if password is already set
    const { data: existingPassword } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'password_hash')
      .single();

    if (existingPassword) {
      return {
        success: false,
        error: 'Password is already set. Please use the login page.',
      };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Save to settings table
    const { error } = await supabase.from('settings').insert({
      key: 'password_hash',
      value: hashedPassword,
    });

    if (error) {
      console.error('Failed to save password:', error);
      return {
        success: false,
        error: 'Failed to save password. Please try again.',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Setup error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check if a password has already been set up
 */
export async function isPasswordSet(): Promise<boolean> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'password_hash')
    .single();

  return !!data;
}
