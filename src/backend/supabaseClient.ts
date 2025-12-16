/**
 * supabaseClient.ts
 * Single Supabase client instance for the Plasticity prototype.
 */
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { getValidatedEnv } from '../lib/env';
import { Database } from '../lib/supabase/types';

let cachedClient: SupabaseClient<Database> | null = null;
let clientError: Error | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;
  try {
    const env = getValidatedEnv();
    cachedClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    return cachedClient;
  } catch (error) {
    clientError = error as Error;
    throw error;
  }
}

export function getSupabaseInitError(): Error | null {
  return clientError;
}
