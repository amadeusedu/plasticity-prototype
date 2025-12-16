import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing, typography } from '../../ui/theme';
import { PromptCard } from '../../ui/PromptCard';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { DailySummary, WeeklyReport, getTodaySummary, getWeeklyReport, seedWeeklyData } from '../../lib/premium/reportsService';
import { FadeIn } from '../../ui/Motion';
import { useAppContext } from '../providers/AppProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export default function ReportsScreen({ navigation }: Props): JSX.Element {
  const [daily, setDaily] = useState<DailySummary>(getTodaySummary());
  const [weekly, setWeekly] = useState<WeeklyReport>(getWeeklyReport());
  const { entitlements } = useAppContext();
  const isPremium = entitlements?.isPremium ?? false;

  useEffect(() => {
    setDaily(getTodaySummary());
    setWeekly(getWeeklyReport());
  }, []);

  const handleSeed = () => {
    seedWeeklyData();
    setDaily(getTodaySummary());
    setWeekly(getWeeklyReport());
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PromptCard
        title="Daily summary"
        body="Minutes trained, completions, and performance focus for today."
        hint={`Sessions: ${daily.gamesCompleted} • Minutes: ${daily.minutes}`}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.caption}>Minutes trained: {daily.minutes}</Text>
        <Text style={styles.caption}>Games completed: {daily.gamesCompleted}</Text>
        <Text style={styles.caption}>Streak: {daily.streak}</Text>
        {daily.bestMetric ? <Text style={styles.caption}>Best today: {daily.bestMetric}</Text> : null}
        {daily.weakMetric ? <Text style={styles.caption}>Needs attention: {daily.weakMetric}</Text> : null}
      </View>

      <PromptCard
        title="Weekly report"
        body={isPremium ? 'Domain progress with interference and switch cost callouts.' : 'Upgrade to review weekly trends.'}
        hint={`Generated ${new Date(weekly.generatedAt).toDateString()}`}
      />

      {isPremium ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domain trends</Text>
          {weekly.domainTrends.map((trend) => (
            <FadeIn key={trend.domain}>
              <View style={styles.row}>
                <Text style={styles.label}>{trend.domain}</Text>
                <Text style={styles.value}>{trend.direction}</Text>
              </View>
            </FadeIn>
          ))}
          <Text style={styles.sectionTitle}>Key metrics</Text>
          {weekly.keyMetrics.map((metric) => (
            <View key={metric.label} style={styles.row}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{metric.value}</Text>
            </View>
          ))}
          <Text style={styles.caption}>{weekly.recommendation}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.caption}>Weekly reporting is premium. Toggle premium in DEV_MENU to test.</Text>
        </View>
      )}

      <PrimaryButton label="Seed 7-day data" onPress={handleSeed} variant="ghost" />
      <PrimaryButton label="Back to plan" onPress={() => navigation.navigate('Plan')} />
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
