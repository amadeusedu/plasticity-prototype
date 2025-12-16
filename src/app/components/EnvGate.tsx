import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

export default function EnvGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { env, envError } = useAppContext();

  if (envError || !env) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Environment not configured</Text>
        <Text style={styles.message}>
          Ensure SUPABASE_URL and SUPABASE_ANON_KEY are available (VITE_ or EXPO_PUBLIC_ prefixes). Restart once set.
        </Text>
        {envError ? <Text style={styles.errorDetails}>{envError.message}</Text> : null}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
  errorDetails: {
    marginTop: 12,
    color: '#fb923c',
    textAlign: 'center',
  },
});
