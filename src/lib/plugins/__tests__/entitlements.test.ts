import { describe, expect, it } from 'vitest';
import { DefaultEntitlementsProvider } from '../entitlements';
import { ValidatedEnv } from '../../env';

const baseEnv: ValidatedEnv = {
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon-key-1234567890',
  environment: 'development',
  masks: {
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: '*****67890',
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
    const provider = new DefaultEntitlementsProvider({ ...baseEnv, forcePremium: false, environment: 'production' });
    const snapshot = await provider.getEntitlements();
    expect(snapshot.isPremium).toBe(false);
    expect(snapshot.source).toBe('env-override');
  });
});
