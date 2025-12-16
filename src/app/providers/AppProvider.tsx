import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tryValidateEnv, ValidatedEnv } from '../../lib/env';
import { AnalyticsProvider, DefaultAnalyticsProvider } from '../../lib/plugins/analytics';
import { DefaultEntitlementsProvider, EntitlementsProvider, EntitlementsSnapshot } from '../../lib/plugins/entitlements';

type Nullable<T> = T | null;

interface AppContextValue {
  env: Nullable<ValidatedEnv>;
  envError: Nullable<Error>;
  analytics: Nullable<AnalyticsProvider>;
  entitlementsProvider: Nullable<EntitlementsProvider>;
  entitlements: Nullable<EntitlementsSnapshot>;
  lastError: Nullable<string>;
  setLastError: (value: Nullable<string>) => void;
  refreshEntitlements: () => Promise<void>;
  setEntitlementsOverride: (value: Nullable<boolean>) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [{ env, error: envError }, setEnvState] = useState<{ env: Nullable<ValidatedEnv>; error: Nullable<Error> }>(
    () => ({ env: null, error: null })
  );
  const [entitlements, setEntitlements] = useState<Nullable<EntitlementsSnapshot>>(null);
  const [lastError, setLastError] = useState<Nullable<string>>(null);
  const [entitlementsOverride, setEntitlementsOverride] = useState<Nullable<boolean>>(null);

  const providers = useMemo(() => {
    if (!env) return { analytics: null as Nullable<AnalyticsProvider>, entitlementsProvider: null as Nullable<EntitlementsProvider> };
    return {
      analytics: new DefaultAnalyticsProvider(env),
      entitlementsProvider: new DefaultEntitlementsProvider(env),
    };
  }, [env]);

  const refreshEntitlements = useCallback(async () => {
    if (!providers.entitlementsProvider) return;
    try {
      if (entitlementsOverride !== null) {
        setEntitlements({
          isPremium: entitlementsOverride,
          source: 'env-override',
          reason: 'Dev override',
        });
        return;
      }

      const snapshot = await providers.entitlementsProvider.getEntitlements();
      setEntitlements(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown entitlement error';
      setLastError(message);
    }
  }, [entitlementsOverride, providers.entitlementsProvider]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('premium.entitlementsOverride');
    if (raw === null) return;
    setEntitlementsOverride(raw === 'true');
  }, []);

  const handleOverrideUpdate = useCallback(
    (value: Nullable<boolean>) => {
      setEntitlementsOverride(value);
      if (typeof localStorage !== 'undefined') {
        if (value === null) {
          localStorage.removeItem('premium.entitlementsOverride');
        } else {
          localStorage.setItem('premium.entitlementsOverride', value ? 'true' : 'false');
        }
      }
      void refreshEntitlements();
    },
    [refreshEntitlements]
  );

  useEffect(() => {
    const outcome = tryValidateEnv();
    setEnvState({ env: outcome.env, error: outcome.error });
    if (outcome.error) {
      setLastError(outcome.error.message);
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  const value: AppContextValue = {
    env,
    envError,
    analytics: providers.analytics,
    entitlementsProvider: providers.entitlementsProvider,
    entitlements,
    lastError,
    setLastError,
    refreshEntitlements,
    setEntitlementsOverride: handleOverrideUpdate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
