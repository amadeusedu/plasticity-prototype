import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getValidatedEnv } from '../env';
import type { Database } from './database.types';

let cachedClient: SupabaseClient<Database> | null = null;
let clientError: Error | null = null;

function createSupabase(): SupabaseClient<Database> {
  const env = getValidatedEnv();
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  try {
    cachedClient = createSupabase();
    return cachedClient;
  } catch (error) {
    clientError = error as Error;
    throw error;
  }
}

export function getSupabaseInitError(): Error | null {
  return clientError;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    clientError = error as Error;
    throw error;
  }
  return data.user ?? null;
}

// Back-compat helper used in existing code paths.
export async function getSupabaseUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
