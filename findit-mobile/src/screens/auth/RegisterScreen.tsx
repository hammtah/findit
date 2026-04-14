import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

export function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>'Inscription'</Text>
      <Text style={styles.caption}>'Ecran en cours de construction.'</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background.primary },
  title: { ...typography.h2, color: colors.text.primary },
  caption: { ...typography.body, marginTop: spacing.sm, color: colors.text.secondary },
});
