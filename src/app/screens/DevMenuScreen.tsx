import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

export default function DevMenuScreen(): JSX.Element {
  const { env, entitlements, envError, lastError } = useAppContext();

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
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Errors</Text>
        <Text style={styles.value}>{lastError ?? 'No errors captured'}</Text>
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
});
