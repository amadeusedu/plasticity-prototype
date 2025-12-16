import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, onLongPress, disabled, variant = 'primary', style }: PrimaryButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' ? styles.ghost : styles.primary,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      <Text style={variant === 'ghost' ? styles.ghostLabel : styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: 'transparent',
  },
  label: {
    ...typography.label,
    color: '#fff',
  },
  ghostLabel: {
    ...typography.label,
    color: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
