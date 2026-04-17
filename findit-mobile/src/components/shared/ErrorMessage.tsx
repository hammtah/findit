import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../../constants/theme';

interface ErrorMessageProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, retryLabel, onRetry }: ErrorMessageProps) {
  return (
    <View style={styles.container} accessible={true} accessibilityRole="alert">
      <Text style={styles.text} allowFontScaling minimumFontScale={0.9}>{message}</Text>
      {retryLabel && onRetry ? (
        <Button
          title={retryLabel}
          variant="secondary"
          onPress={onRetry}
          containerStyle={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 10, padding: spacing.md },
  text: { ...typography.body, color: colors.danger },
  retryButton: { marginTop: spacing.sm },
});
