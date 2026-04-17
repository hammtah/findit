import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...rest }, ref) => {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label} allowFontScaling minimumFontScale={0.9}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        style={[styles.input, error ? styles.inputError : undefined, style]}
        placeholderTextColor={colors.text.muted}
        accessible={true}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityHint={rest.accessibilityHint}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} allowFontScaling minimumFontScale={0.9}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, minHeight: 44, ...typography.body, color: colors.text.primary, backgroundColor: colors.background.primary },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
