import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface ToastFeedbackProps {
  message: string | null;
  tone?: 'neutral' | 'success' | 'warning';
  durationMs?: number;
}

export function ToastFeedback({ message, tone = 'neutral', durationMs = 2000 }: ToastFeedbackProps): JSX.Element | null {
  const [visible, setVisible] = useState(Boolean(message));
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, message, opacity]);

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.container, styles[tone], { opacity }]}> 
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  text: {
    ...typography.label,
  },
  neutral: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
});
