'use server';

import { supabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth';

/**
 * Verify password against stored hash in database
 * @param password - The password to verify
 * @returns { success: boolean, error?: string }
 */
export async function verifyPasswordAction(password: string) {
  try {

    // Fetch stored password hash from settings table
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'password_hash')
      .single();

    if (error || !data) {
      return { success: false, error: 'Password not configured. Please run setup first.' };
    }

    const storedHash = data.value;

    // Verify password using constant-time comparison
    const isValid = await verifyPassword(password, storedHash);

    if (!isValid) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Password verification error:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
