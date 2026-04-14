import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

export function StarRating({ value }: { value: number }) {
  return (
    <View style={styles.container}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  star: { color: colors.warning },
  value: { ...typography.caption, color: colors.text.secondary },
});
