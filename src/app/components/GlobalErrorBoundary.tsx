import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { colors, spacing, typography } from '../../ui/theme';

interface GlobalErrorBoundaryState {
  error: Error | null;
  info: string | null;
}

export class GlobalErrorBoundary extends React.Component<React.PropsWithChildren> {
  state: GlobalErrorBoundaryState = {
    error: null,
    info: null,
  };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.setState({ error, info: info.componentStack });
  }

  handleReset = (): void => {
    this.setState({ error: null, info: null });
  };

  render(): React.ReactNode {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const isDev = process.env.NODE_ENV !== 'production';

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            {isDev
              ? 'A crash was captured. Review the stack below and continue.'
              : 'The app hit an unexpected issue. Please restart the session.'}
          </Text>
          {isDev ? (
            <View style={styles.stackBox}>
              <Text style={styles.stackLabel}>Stack</Text>
              <Text style={styles.stack}>{error.message}</Text>
              {info ? <Text style={styles.stack}>{info}</Text> : null}
            </View>
          ) : null}
          <PrimaryButton label="Return to app" onPress={this.handleReset} />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  stackBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  stackLabel: {
    ...typography.subtitle,
    color: colors.text,
  },
  stack: {
    ...typography.body,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
});

