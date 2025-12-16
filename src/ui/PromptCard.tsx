import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface PromptCardProps {
  title: string;
  body?: string;
  hint?: string;
}

export function PromptCard({ title, body, hint }: PromptCardProps): JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
  },
});
