import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getGamePlugin } from '../../games/registry';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing, typography } from '../../ui/theme';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { PromptCard } from '../../ui/PromptCard';
import { ChoiceRow } from '../../ui/ChoiceRow';
import { useAppContext } from '../providers/AppProvider';

export type GameDetailParams = NativeStackScreenProps<RootStackParamList, 'GameDetail'>;

export default function GameDetailScreen({ route, navigation }: GameDetailParams): JSX.Element {
  const { gameId } = route.params;
  const plugin = useMemo(() => getGamePlugin(gameId), [gameId]);
  const { entitlements } = useAppContext();

  const locked = plugin.requiresPremium && !entitlements?.isPremium;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PromptCard
        title={plugin.title}
        body={plugin.description}
        hint={`Category: ${plugin.category} • Version ${plugin.version}`}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <ChoiceRow
          label="Assessment"
          description="Adaptive difficulty with stable metrics."
          onPress={() => navigation.navigate('GameRunner', { gameId, mode: 'assessment' })}
          selected={false}
          disabled={locked}
        />
        <ChoiceRow
          label="Standard"
          description="Straight into the experience."
          onPress={() => navigation.navigate('GameRunner', { gameId, mode: 'normal' })}
          selected
          disabled={locked}
        />
        <ChoiceRow
          label="Tutorial"
          description="Walkthrough of the controls before you start."
          onPress={() => navigation.navigate('GameRunner', { gameId, mode: 'tutorial' })}
          selected={false}
          disabled={locked}
        />
        {locked ? <Text style={styles.lockedLabel}>Requires premium access</Text> : null}
      </View>
      <PrimaryButton label="Start" onPress={() => navigation.navigate('GameRunner', { gameId, mode: 'normal' })} disabled={locked} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
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
  lockedLabel: {
    ...typography.body,
    color: colors.warning,
    marginTop: spacing.sm,
  },
});
