import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PromptCard } from '../../ui/PromptCard';
import { colors, spacing, typography } from '../../ui/theme';
import {
  baselineGameOrder,
  buildAssessmentSummary,
  finalizeAssessmentProfile,
  getAssessmentRun,
  getShortConfigForAssessment,
} from '../../lib/premium/assessmentService';
import { getGamePlugin } from '../../games/registry';
import { ChoiceRow } from '../../ui/ChoiceRow';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { FadeIn } from '../../ui/Motion';
import { DomainScore } from '../../lib/premium/profileService';

type Props = NativeStackScreenProps<RootStackParamList, 'Assessment'>;

export default function AssessmentScreen({ navigation }: Props): JSX.Element {
  const [coverage, setCoverage] = useState<number>(0);
  const [profile, setProfile] = useState<DomainScore[] | null>(null);
  const run = useMemo(() => getAssessmentRun(), []);

  useEffect(() => {
    const summary = buildAssessmentSummary();
    setCoverage(summary.coverage);
    if (summary.profile) {
      setProfile(summary.profile.domainScores);
    }
  }, []);

  const handleComputeProfile = async (): Promise<void> => {
    const computed = await finalizeAssessmentProfile();
    setProfile(computed.domainScores);
    setCoverage(100);
  };

  const handleLaunchGame = (gameId: string): void => {
    const plugin = getGamePlugin(gameId);
    const sessionOverride = getShortConfigForAssessment(plugin);
    navigation.navigate('GameRunner', {
      gameId,
      mode: 'assessment',
      sessionOverride,
      runContext: { assessmentId: run.id },
    });
  };

  const profileReady = profile?.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PromptCard
        title="Baseline assessment"
        body="Five concise drills to capture a premium-grade cognitive fingerprint."
        hint={`Coverage ${coverage}% • Run ID ${run.id.slice(0, 6)}`}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required tasks</Text>
        {baselineGameOrder.map((gameId) => {
          const plugin = getGamePlugin(gameId);
          const completed = run.completedGameIds.includes(gameId);
          return (
            <FadeIn key={gameId}>
              <ChoiceRow
                label={plugin.title}
                description={plugin.description}
                onPress={() => handleLaunchGame(gameId)}
                selected={completed}
              />
            </FadeIn>
          );
        })}
        <Text style={styles.caption}>Each task is 60–90 seconds. Assessment completes in about 7 minutes.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        {profileReady ? (
          profile?.map((item) => (
            <View key={item.domain} style={styles.row}>
              <Text style={styles.label}>{item.domain}</Text>
              <Text style={styles.value}>{item.score}</Text>
              <Text style={styles.caption}>Sessions: {item.supportingSessions}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.caption}>Run the full battery to surface your CognitiveProfile.</Text>
        )}
        <PrimaryButton label={profileReady ? 'Recompute profile' : 'Compute profile'} onPress={handleComputeProfile} />
      </View>

      <PrimaryButton label="Move to plan" onPress={() => navigation.navigate('Plan')} disabled={!profileReady} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  value: {
    ...typography.subtitle,
    color: colors.text,
  },
});
