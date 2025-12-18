import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { colors, spacing, typography } from '../../ui/theme';
import { useAuth } from '../providers/AuthProvider';

export default function AuthScreen(): JSX.Element {
  const { signIn, signUp, signOut, user, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasValidInput = useMemo(() => email.trim().includes('@') && password.trim().length >= 6, [email, password]);

  const validateInput = useCallback((): boolean => {
    if (!email.trim().includes('@')) {
      setLocalError('Please enter a valid email.');
      return false;
    }
    if (password.trim().length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return false;
    }
    setLocalError(null);
    return true;
  }, [email, password]);

  const handleAuth = useCallback(
    async (mode: 'sign-in' | 'sign-up') => {
      if (!validateInput()) return;
      setStatus(null);
      const action = mode === 'sign-in' ? signIn : signUp;
      const outcome = await action(email.trim(), password);
      if (!outcome.ok) {
        setLocalError(outcome.error);
        return;
      }
      setStatus(mode === 'sign-in' ? 'Signed in successfully.' : 'Account created. You are signed in.');
    },
    [email, password, signIn, signUp, validateInput]
  );

  const handleSignOut = useCallback(async () => {
    setStatus(null);
    setLocalError(null);
    await signOut();
  }, [signOut]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Access your Plasticity data with email and password.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <PrimaryButton label="Sign in" onPress={() => handleAuth('sign-in')} disabled={!hasValidInput || loading} />
        <PrimaryButton
          label="Create account"
          onPress={() => handleAuth('sign-up')}
          disabled={!hasValidInput || loading}
          variant="ghost"
        />
        {user ? <PrimaryButton label="Sign out" onPress={handleSignOut} disabled={loading} variant="ghost" /> : null}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.text} />
            <Text style={styles.loadingText}>Working…</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
  },
  error: {
    ...typography.body,
    color: colors.warning,
  },
  status: {
    ...typography.body,
    color: colors.success,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
