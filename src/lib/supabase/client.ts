import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { getValidatedEnv } from '../env';
import { Database } from './types';

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

export async function getSupabaseUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    clientError = error as Error;
    throw error;
  }
  return data.user?.id ?? null;
}
