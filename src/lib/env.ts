import { z } from 'zod';

type EnvSource = Record<string, string | undefined>;

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  ENVIRONMENT: z.string().default('development'),
  FORCE_PREMIUM: z
    .enum(['true', 'false'])
    .optional()
    .transform((value: string | undefined) => value === 'true'),
});

function readEnv(key: string, sources: EnvSource[]): string | undefined {
  for (const source of sources) {
    const value = source[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

function mask(value: string, visible = 4): string {
  if (value.length <= visible) return value;
  const hiddenLength = Math.max(0, value.length - visible);
  return `${'*'.repeat(hiddenLength)}${value.slice(-visible)}`;
}

export interface ValidatedEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ENVIRONMENT: string;
  FORCE_PREMIUM?: boolean;
  masks: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
}

export function getValidatedEnv(): ValidatedEnv {
  const importMetaEnv =
    typeof import.meta !== 'undefined' && typeof (import.meta as any).env !== 'undefined'
      ? ((import.meta as any).env as EnvSource)
      : {};

  const processEnv = typeof process !== 'undefined' ? (process.env as EnvSource) : {};
  const globalEnv = (globalThis as any)?.__APP_ENV__ as EnvSource | undefined;

  const rawEnv: EnvSource = {
    SUPABASE_URL:
      readEnv('VITE_SUPABASE_URL', [importMetaEnv, processEnv, globalEnv ?? {}]) ??
      readEnv('EXPO_PUBLIC_SUPABASE_URL', [importMetaEnv, processEnv, globalEnv ?? {}]),
    SUPABASE_ANON_KEY:
      readEnv('VITE_SUPABASE_ANON_KEY', [importMetaEnv, processEnv, globalEnv ?? {}]) ??
      readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', [importMetaEnv, processEnv, globalEnv ?? {}]),
    ENVIRONMENT: readEnv('APP_ENV', [processEnv, importMetaEnv, globalEnv ?? {}]) ?? processEnv.NODE_ENV,
    FORCE_PREMIUM: readEnv('EXPO_PUBLIC_FORCE_PREMIUM', [processEnv, importMetaEnv, globalEnv ?? {}]),
  };

  const parsed = EnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const messages = parsed.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return {
    ...parsed.data,
    masks: {
      SUPABASE_URL: mask(parsed.data.SUPABASE_URL, 12),
      SUPABASE_ANON_KEY: mask(parsed.data.SUPABASE_ANON_KEY, 6),
    },
  };
}

export function tryValidateEnv(): { env: ValidatedEnv | null; error: Error | null } {
  try {
    const env = getValidatedEnv();
    return { env, error: null };
  } catch (error) {
    return { env: null, error: error as Error };
  }
}
