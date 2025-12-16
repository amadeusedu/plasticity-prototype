import { describe, expect, it } from 'vitest';
import { DefaultEntitlementsProvider } from '../entitlements';
import { ValidatedEnv } from '../../env';

const baseEnv: ValidatedEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key-1234567890',
  ENVIRONMENT: 'development',
  masks: {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: '*****67890',
  },
};

describe('DefaultEntitlementsProvider', () => {
  it('grants premium in development', async () => {
    const provider = new DefaultEntitlementsProvider(baseEnv);
    const snapshot = await provider.getEntitlements();
    expect(snapshot.isPremium).toBe(true);
    expect(snapshot.source).toBe('dev-default');
  });

  it('respects env override', async () => {
    const provider = new DefaultEntitlementsProvider({ ...baseEnv, FORCE_PREMIUM: false, ENVIRONMENT: 'production' });
    const snapshot = await provider.getEntitlements();
    expect(snapshot.isPremium).toBe(false);
    expect(snapshot.source).toBe('env-override');
  });
});
