// src/lib/env.ts
// Future-proof: works in Expo runtime + tests/CI without import.meta.
// Keeps the existing public API expected by the app/plugins (ValidatedEnv, getValidatedEnv, tryValidateEnv).

type EnvValue = string | undefined | null;

function isNonEmptyString(v: EnvValue): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function pickEnv(...values: EnvValue[]): string | undefined {
  for (const v of values) {
    if (isNonEmptyString(v)) return v.trim();
  }
  return undefined;
}

function maskSecret(value: string, keepStart = 6, keepEnd = 4): string {
  if (value.length <= keepStart + keepEnd) return "***";
  return `${value.slice(0, keepStart)}…${value.slice(-keepEnd)}`;
}

export type EnvironmentName = "development" | "test" | "production";

function normalizeEnvironment(v: string | undefined): EnvironmentName {
  const raw = (v ?? "").toLowerCase();
  if (raw === "test") return "test";
  if (raw === "production" || raw === "prod") return "production";
  return "development";
}

export type ValidatedEnv = {
  // Keep camelCase keys for app/runtime consumption.
  supabaseUrl: string;
  supabaseAnonKey: string;

  environment: EnvironmentName;
  forcePremium?: boolean;

  masks: {
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
};

function buildValidatedEnv(): ValidatedEnv {
  // Expo client-side convention: EXPO_PUBLIC_*
  const supabaseUrl = pickEnv(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL
  );

  const supabaseAnonKey = pickEnv(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  );

  if (!supabaseUrl) {
    throw new Error(
      `[env] Missing SUPABASE_URL. Set EXPO_PUBLIC_SUPABASE_URL in .env for Expo, or SUPABASE_URL for tests/CI.`
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      `[env] Missing SUPABASE_ANON_KEY. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in .env for Expo, or SUPABASE_ANON_KEY for tests/CI.`
    );
  }

  // Optional values used by plugins:
  const environment = normalizeEnvironment(
    pickEnv(process.env.EXPO_PUBLIC_ENVIRONMENT, process.env.ENVIRONMENT, process.env.NODE_ENV)
  );

  const forcePremiumRaw = pickEnv(process.env.EXPO_PUBLIC_FORCE_PREMIUM, process.env.FORCE_PREMIUM);
  const forcePremium =
    forcePremiumRaw === undefined
      ? undefined
      : forcePremiumRaw.toLowerCase() === "true" || forcePremiumRaw === "1";

  return {
    supabaseUrl,
    supabaseAnonKey,
    environment,
    forcePremium,
    masks: {
      supabaseUrl: maskSecret(supabaseUrl),
      supabaseAnonKey: maskSecret(supabaseAnonKey),
    },
  };
}

let _cached: ValidatedEnv | null = null;

export function getValidatedEnv(): ValidatedEnv {
  if (_cached) return _cached;
  _cached = buildValidatedEnv();
  return _cached;
}

/**
 * IMPORTANT: AppProvider code expects outcome.env and outcome.error fields to exist.
 * So we do NOT return a discriminated union here.
 */
export function tryValidateEnv(): { env?: ValidatedEnv; error?: Error } {
  try {
    return { env: getValidatedEnv(), error: undefined };
  } catch (e) {
    return { env: undefined, error: e as Error };
  }
}

// Back-compat export used in various places
export const env: ValidatedEnv = getValidatedEnv();
