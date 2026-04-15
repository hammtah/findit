import { Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export function OAuthButton({
  provider,
  onPress,
  disabled,
}: {
  provider: 'google' | 'apple';
  onPress: () => void;
  disabled?: boolean;
}) {
  const label = provider === 'google' ? 'Continuer avec Google' : 'Continuer avec Apple';

  return (
    <Pressable onPress={onPress} style={[styles.button, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  label: { ...typography.body, color: colors.text.primary },
});
