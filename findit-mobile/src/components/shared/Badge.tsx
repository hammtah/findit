import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

interface BadgeProps {
  label: string;
  tone?: 'default' | 'primary' | 'success' | 'danger';
}

export function Badge({ label, tone = 'default' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={[styles.label, tone !== 'default' && styles.labelLight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  default: { backgroundColor: colors.background.secondary },
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.secondary },
  danger: { backgroundColor: colors.danger },
  label: { ...typography.caption, color: colors.text.secondary },
  labelLight: { color: colors.text.inverse },
});
