import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listCategories, listGames } from '../../games/registry';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppContext } from '../providers/AppProvider';
import { colors, spacing, typography } from '../../ui/theme';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { PromptCard } from '../../ui/PromptCard';
import { ChoiceRow } from '../../ui/ChoiceRow';
import { FadeIn } from '../../ui/Motion';

interface HomeProps extends NativeStackScreenProps<RootStackParamList, 'Home'> {
  devMenuVisible: boolean;
  onSecretGesture: () => void;
  onRequestDevMenu: () => void;
}

export default function HomeScreen({ navigation, devMenuVisible, onSecretGesture, onRequestDevMenu }: HomeProps): JSX.Element {
  const { env, entitlements, envError } = useAppContext();
  const games = useMemo(() => listGames(), []);
  const categories = useMemo(() => listCategories(), []);

  const environmentLabel = useMemo(() => env?.ENVIRONMENT ?? 'unknown', [env]);
  const premiumLabel = useMemo(() => (entitlements?.isPremium ? 'Premium' : 'Free'), [entitlements]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PromptCard
        title="Plasticity Games"
        body="Premium-grade cognitive labs wrapped into one runner."
        hint={`Environment: ${environmentLabel} • Entitlements: ${premiumLabel}`}
      />
      {envError ? <Text style={styles.error}>Env error detected: {envError.message}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Games</Text>
        {categories.map((category) => (
          <View key={category} style={styles.category}>
            <Text style={styles.categoryLabel}>{category}</Text>
            {games
              .filter((game) => game.category === category)
              .map((game) => (
                <FadeIn key={game.id}>
                  <ChoiceRow
                    label={game.title}
                    description={game.description}
                    onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
                  />
                </FadeIn>
              ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <PrimaryButton label="Open DEV_MENU" onPress={() => navigation.navigate('DevMenu')} />
        <PrimaryButton
          label={devMenuVisible ? 'DEV_MENU ready' : 'Toggle DEV_MENU'}
          onPress={onRequestDevMenu}
          variant="ghost"
        />
        <View style={styles.secretContainer}>
          <Text style={styles.secret}>Long press below to toggle DEV_MENU</Text>
          <PrimaryButton
            label="Hold to unlock"
            onPress={() => {}}
            onLongPress={() => {
              onSecretGesture();
              navigation.navigate('DevMenu');
            }}
            variant="ghost"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  category: {
    gap: spacing.sm,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  error: {
    color: colors.warning,
    ...typography.body,
  },
  secret: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.sm,
  },
  secretContainer: {
    gap: spacing.xs,
    alignItems: 'center',
  },
});
