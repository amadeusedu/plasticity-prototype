export const colors = {
  background: '#0b1224',
  surface: '#111827',
  surfaceAlt: '#1f2937',
  border: '#1f2937',
  borderMuted: '#374151',
  primary: '#3b82f6',
  primaryMuted: '#60a5fa',
  accent: '#22d3ee',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  success: '#34d399',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
};

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  body: {
    fontSize: 14,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
};
