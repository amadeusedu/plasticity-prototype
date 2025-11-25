/**
 * supabaseClient.ts
 * Single Supabase client instance for the Plasticity prototype.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined);

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or anon key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or Expo equivalents).'
  );
}

// Using `any` for now; you can replace with generated types later.
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);
