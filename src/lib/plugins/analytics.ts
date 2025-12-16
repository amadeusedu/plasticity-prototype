import { ValidatedEnv } from '../env';

export interface AnalyticsProvider {
  track(eventName: string, props?: Record<string, unknown>): Promise<void> | void;
}

export class DefaultAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly env: ValidatedEnv) {}

  track(eventName: string, props?: Record<string, unknown>): void {
    if (this.env.ENVIRONMENT === 'development') {
      console.info(`[Analytics][dev] ${eventName}`, props || {});
    }
  }
}
