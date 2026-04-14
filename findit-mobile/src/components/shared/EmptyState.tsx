import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  description: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
});
