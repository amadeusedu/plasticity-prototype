import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { resultsService, formatRlsHint } from '../../lib/results/ResultsService';
import { useAppContext } from '../providers/AppProvider';
import { RootStackParamList } from '../navigation/AppNavigator';
import { latestInsight } from '../../lib/premium/sessionInsights';
import { seedWeeklyData } from '../../lib/premium/reportsService';
import { listGames } from '../../games/registry';

type Props = NativeStackScreenProps<RootStackParamList, 'DevMenu'>;

export default function DevMenuScreen({ navigation }: Props): JSX.Element {
  const { env, entitlements, envError, lastError, setLastError, setEntitlementsOverride } = useAppContext();
  const [rlsStatus, setRlsStatus] = useState<string>('Not run');
  const [rlsRunning, setRlsRunning] = useState<boolean>(false);
  const [premiumOverride, setPremiumOverride] = useState<'premium' | 'free' | 'reset'>('reset');
  const [exportedSession, setExportedSession] = useState<string>('');
  const [jumpGameId, setJumpGameId] = useState<string>('');

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

  const handleSeedStats = (): void => {
    seedWeeklyData(14);
    setRlsStatus('Seeded 14 days');
    setLastError(null);
  };

  const handleTogglePremium = (): void => {
    const next = !(entitlements?.isPremium ?? false);
    setPremiumOverride(next ? 'premium' : 'free');
    setEntitlementsOverride(next);
  };

  const handleExportSession = (): void => {
    const latest = latestInsight();
    if (!latest) {
      setExportedSession('No sessions available to export.');
      return;
    }
    setExportedSession(JSON.stringify(latest, null, 2));
  };

  const handleJumpToGame = (): void => {
    const target = jumpGameId.trim();
    if (!target) return;
    try {
      const gameExists = listGames().some((game) => game.id === target);
      if (!gameExists) {
        setLastError(`Unknown game id: ${target}`);
        return;
      }
      navigation.navigate('GameRunner', { gameId: target, mode: 'normal' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to jump to game';
      setLastError(message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Environment</Text>
        <Text style={styles.value}>SUPABASE_URL: {env?.masks.supabaseUrl ?? 'missing'}</Text>
        <Text style={styles.value}>SUPABASE_ANON_KEY: {env?.masks.supabaseAnonKey ?? 'missing'}</Text>
        <Text style={styles.value}>ENVIRONMENT: {env?.environment ?? 'unknown'}</Text>
        <Pressable accessibilityLabel="Open sign in" onPress={() => navigation.navigate('Auth')} style={styles.button}>
          <Text style={styles.buttonLabel}>Sign in</Text>
        </Pressable>
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
        <Pressable accessibilityLabel="Toggle premium" onPress={handleTogglePremium} style={styles.button}>
          <Text style={styles.buttonLabel}>Toggle premium</Text>
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
        <Pressable accessibilityLabel="Seed stats" onPress={handleSeedStats} style={styles.button}>
          <Text style={styles.buttonLabel}>Seed 14 days of stats</Text>
        </Pressable>
        <Pressable accessibilityLabel="Export last session" onPress={handleExportSession} style={styles.button}>
          <Text style={styles.buttonLabel}>Export last session JSON</Text>
        </Pressable>
        {exportedSession ? <Text style={styles.monoBox}>{exportedSession}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Navigation</Text>
        <Text style={styles.value}>Jump to game id (available: {listGames().map((g) => g.id).join(', ')})</Text>
        <TextInput
          value={jumpGameId}
          onChangeText={setJumpGameId}
          placeholder="game id"
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <Pressable accessibilityLabel="Jump to game" onPress={handleJumpToGame} style={styles.button}>
          <Text style={styles.buttonLabel}>Jump to game</Text>
        </Pressable>
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
  monoBox: {
    marginTop: 8,
    fontFamily: 'monospace',
    backgroundColor: '#0b1224',
    color: '#cbd5e1',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    marginTop: 8,
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#e2e8f0',
    padding: 10,
  },
});
