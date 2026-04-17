import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../../constants/theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.illustration}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant="secondary"
          onPress={onAction}
          containerStyle={styles.actionButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  illustration: { fontSize: 48, marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  description: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  actionButton: { marginTop: spacing.lg, minWidth: 180 },
});
