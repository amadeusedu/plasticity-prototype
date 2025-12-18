import { ValidatedEnv } from '../env';

export interface EntitlementsSnapshot {
  isPremium: boolean;
  source: 'dev-default' | 'env-override' | 'prod-default';
  reason?: string;
}

export interface EntitlementsProvider {
  getEntitlements(): Promise<EntitlementsSnapshot>;
  isPremium(): Promise<boolean>;
  paywallTrigger(trigger: { reason: string; metadata?: Record<string, unknown> }): Promise<void>;
}

export class DefaultEntitlementsProvider implements EntitlementsProvider {
  constructor(private readonly env: ValidatedEnv) {}

  async getEntitlements(): Promise<EntitlementsSnapshot> {
    if (this.env.forcePremium !== undefined) {
      return {
        isPremium: this.env.forcePremium,
        source: 'env-override',
        reason: 'forced via EXPO_PUBLIC_FORCE_PREMIUM',
      };
    }

    const isDev = this.env.environment === 'development' || this.env.environment === 'test';
    if (isDev) {
      return { isPremium: true, source: 'dev-default', reason: 'dev default' };
    }

    return { isPremium: false, source: 'prod-default', reason: 'production default' };
  }

  async isPremium(): Promise<boolean> {
    const snapshot = await this.getEntitlements();
    return snapshot.isPremium;
  }

  async paywallTrigger(trigger: { reason: string; metadata?: Record<string, unknown> }): Promise<void> {
    if (this.env.environment === 'development') {
      console.info('[Entitlements] paywallTrigger (dev only)', trigger);
    }
  }
}
