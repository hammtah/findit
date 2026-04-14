export const colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    card: '#FFFFFF',
  },
  border: '#E5E7EB',
  categories: {
    cles: '#F59E0B',
    electronique: '#3B82F6',
    vetements: '#8B5CF6',
    papiers: '#6B7280',
    animaux: '#10B981',
    sac: '#F97316',
    bijoux: '#EC4899',
    autre: '#9CA3AF',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
} as const;

export const borderRadius = { sm: 6, md: 10, lg: 16, full: 9999 } as const;
