import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { resultsService, formatRlsHint } from '../../lib/results/ResultsService';
import { useAppContext } from '../providers/AppProvider';

export default function DevMenuScreen(): JSX.Element {
  const { env, entitlements, envError, lastError, setLastError, setEntitlementsOverride } = useAppContext();
  const [rlsStatus, setRlsStatus] = useState<string>('Not run');
  const [rlsRunning, setRlsRunning] = useState<boolean>(false);
  const [premiumOverride, setPremiumOverride] = useState<'premium' | 'free' | 'reset'>('reset');

  const runRlsSelfTest = async (): Promise<void> => {
    setRlsRunning(true);
    setRlsStatus('Running...');
    try {
      const outcome = await resultsService.runSelfTest();
      setRlsStatus(`OK (session ${outcome.sessionId})`);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? formatRlsHint(error) : 'Unknown RLS error';
      setLastError(message);
      setRlsStatus('Failed');
    } finally {
      setRlsRunning(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Environment</Text>
        <Text style={styles.value}>SUPABASE_URL: {env?.masks.SUPABASE_URL ?? 'missing'}</Text>
        <Text style={styles.value}>SUPABASE_ANON_KEY: {env?.masks.SUPABASE_ANON_KEY ?? 'missing'}</Text>
        <Text style={styles.value}>ENVIRONMENT: {env?.ENVIRONMENT ?? 'unknown'}</Text>
        {envError ? <Text style={styles.warning}>Env validation error: {envError.message}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Entitlements</Text>
        <Text style={styles.value}>Premium: {entitlements?.isPremium ? 'true' : 'false'}</Text>
        <Text style={styles.value}>Source: {entitlements?.source ?? 'unknown'}</Text>
        {entitlements?.reason ? <Text style={styles.value}>Reason: {entitlements.reason}</Text> : null}
        <Pressable
          accessibilityLabel="Force premium"
          onPress={() => {
            setPremiumOverride('premium');
            setEntitlementsOverride(true);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Force premium (dev)</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Force free"
          onPress={() => {
            setPremiumOverride('free');
            setEntitlementsOverride(false);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Force free (dev)</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Reset entitlements override"
          onPress={() => {
            setPremiumOverride('reset');
            setEntitlementsOverride(null);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Reset override</Text>
        </Pressable>
        <Text style={styles.value}>Override: {premiumOverride}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Errors</Text>
        <Text style={styles.value}>{lastError ?? 'No errors captured'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>RLS self-test</Text>
        <Text style={styles.value}>Creates a session, saves a trial, finalizes, then reads back.</Text>
        <Pressable accessibilityLabel="Run RLS self test" onPress={runRlsSelfTest} disabled={rlsRunning} style={styles.button}>
          <Text style={styles.buttonLabel}>{rlsRunning ? 'Running...' : 'Run self test'}</Text>
        </Pressable>
        <Text style={styles.value}>Status: {rlsStatus}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#0b1224',
    gap: 16,
  },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  value: {
    color: '#cbd5e1',
    marginBottom: 4,
  },
  warning: {
    color: '#fb923c',
    marginTop: 4,
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '700',
  },
});
