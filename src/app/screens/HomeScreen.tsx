import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppContext } from '../providers/AppProvider';

interface HomeProps extends NativeStackScreenProps<RootStackParamList, 'Home'> {
  devMenuVisible: boolean;
  onSecretGesture: () => void;
  onRequestDevMenu: () => void;
}

export default function HomeScreen({ navigation, devMenuVisible, onSecretGesture, onRequestDevMenu }: HomeProps): JSX.Element {
  const { env, entitlements, envError } = useAppContext();

  const environmentLabel = useMemo(() => env?.ENVIRONMENT ?? 'unknown', [env]);
  const premiumLabel = useMemo(() => (entitlements?.isPremium ? 'Premium' : 'Free'), [entitlements]);

  const navigateToDevMenu = (): void => {
    navigation.navigate('DevMenu');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Plasticity Prototype</Text>
        <Text style={styles.subheading}>Environment: {environmentLabel}</Text>
        <Text style={styles.subheading}>Entitlements: {premiumLabel}</Text>
        {envError ? <Text style={styles.error}>Env error detected: {envError.message}</Text> : null}
        <Text style={styles.body}>
          Existing Supabase game session helpers remain intact. Use the embedded HTML games via the harness or React Native
          WebView shell.
        </Text>
        <Pressable accessibilityLabel="Open Dev Menu" onPress={navigateToDevMenu} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>Open DEV_MENU</Text>
        </Pressable>
        <Pressable accessibilityLabel="Request Dev Menu" onPress={onRequestDevMenu} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>{devMenuVisible ? 'DEV_MENU ready' : 'Toggle DEV_MENU'}</Text>
        </Pressable>
      </View>

      <Pressable
        onLongPress={() => {
          onSecretGesture();
          navigateToDevMenu();
        }}
        style={styles.secretToggle}
        accessibilityLabel="Secret dev toggle"
      >
        <Text style={styles.secretText}>Long press here to toggle DEV_MENU</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  body: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  error: {
    color: '#f97316',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  secretToggle: {
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  secretText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
