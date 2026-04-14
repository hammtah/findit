import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>'Profil'</Text>
      <Text style={styles.caption}>'Placeholder pour Dev 3.'</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background.primary },
  title: { ...typography.h2, color: colors.text.primary },
  caption: { ...typography.body, marginTop: spacing.sm, color: colors.text.secondary },
});
