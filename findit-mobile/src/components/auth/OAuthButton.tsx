import { Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export function OAuthButton({ provider, onPress }: { provider: 'google' | 'apple'; onPress: () => void }) {
  const label = provider === 'google' ? 'Continuer avec Google' : 'Continuer avec Apple';

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: 'center' },
  label: { ...typography.body, color: colors.text.primary },
});
