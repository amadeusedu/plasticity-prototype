import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface ChoiceRowProps {
  label: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function ChoiceRow({ label, description, selected, onPress, disabled }: ChoiceRowProps): JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => [styles.row, selected ? styles.rowSelected : null, pressed && styles.rowPressed]}
    >
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.bullet, selected ? styles.bulletSelected : null]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
  },
  rowPressed: {
    transform: [{ scale: 0.99 }],
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
  },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  bulletSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
