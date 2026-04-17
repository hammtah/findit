import { Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  title,
  variant = 'primary',
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      {...rest}
      accessible={true}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, containerStyle]}
    >
      <Text
        style={[styles.label, variant === 'ghost' && styles.labelGhost]}
        allowFontScaling
        minimumFontScale={0.9}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  label: { ...typography.label, color: colors.text.inverse },
  labelGhost: { color: colors.text.primary },
});
