import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing, typography } from '../../ui/theme';
import { PromptCard } from '../../ui/PromptCard';
import { TrainingPlan, loadPlan, upsertPlan } from '../../lib/premium/planService';
import { computeCognitiveProfile, loadCachedProfile } from '../../lib/premium/profileService';
import { getGamePlugin } from '../../games/registry';
import { ChoiceRow } from '../../ui/ChoiceRow';
import { FadeIn } from '../../ui/Motion';
import { useAppContext } from '../providers/AppProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Plan'>;

export default function PlanScreen({ navigation }: Props): JSX.Element {
  const [plan, setPlan] = useState<TrainingPlan | null>(loadPlan());
  const profile = loadCachedProfile();
  const { entitlements } = useAppContext();
  const isPremium = entitlements?.isPremium ?? false;

  useEffect(() => {
    const ensurePlan = async () => {
      if (plan) return;
      const baseProfile = profile ?? (await computeCognitiveProfile());
      const created = upsertPlan(baseProfile);
      setPlan(created);
    };
    void ensurePlan();
  }, [plan, profile]);

  const startDay = (gameId: string) => {
    navigation.navigate('GameRunner', { gameId, mode: 'normal' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PromptCard
        title="Personalized plan"
        body="Seven-day circuit. One anchor drill plus support work per day."
        hint={plan ? `Created ${new Date(plan.createdAt).toDateString()}` : 'Generating plan…'}
      />

      {plan?.days
        .slice(0, isPremium ? plan.days.length : 3)
        .map((day) => {
          const anchor = getGamePlugin(day.anchorGame);
          const support = day.supportGames.map((id) => getGamePlugin(id));
          return (
            <FadeIn key={day.dayIndex}>
              <View style={styles.section}>
              <Text style={styles.sectionTitle}>Day {day.dayIndex}</Text>
              <Text style={styles.caption}>Focus: {day.focusDomain} • {day.minutes} minutes</Text>
              <ChoiceRow
                label={`Anchor • ${anchor.title}`}
                description={anchor.description}
                onPress={() => startDay(anchor.id)}
              />
              {support.map((plugin) => (
                <ChoiceRow key={plugin.id} label={`Support • ${plugin.title}`} description={plugin.description} onPress={() => startDay(plugin.id)} />
              ))}
            </View>
          </FadeIn>
        );
        })}
      {!isPremium ? (
        <View style={styles.section}>
          <Text style={styles.caption}>Upgrade to Premium to unlock the full 7-day playbook and history.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  caption: {
    ...typography.body,
    color: colors.textMuted,
  },
});
