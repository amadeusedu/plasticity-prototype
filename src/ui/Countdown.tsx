import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface CountdownProps {
  seconds: number;
  onComplete?: () => void;
}

export function Countdown({ seconds, onComplete }: CountdownProps): JSX.Element {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Starting in</Text>
      <Text style={styles.value}>{remaining}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  value: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
});
