import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/shared/Button';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.VERIFY_EMAIL>;

export function VerifyEmailScreen({ navigation }: Props) {

  return (
    <View style={styles.container}>
      <Text style={styles.illustration} allowFontScaling={false}>📨</Text>
      <Text style={styles.title} allowFontScaling minimumFontScale={0.9}>Inscription terminee</Text>
      <Text style={styles.description} allowFontScaling minimumFontScale={0.9}>
        Votre compte est actif immediatement. Connectez-vous pour continuer.
      </Text>
      <Button title="Aller a la connexion" onPress={() => navigation.navigate(ROUTES.LOGIN)} />
      <Pressable
        onPress={() => navigation.navigate(ROUTES.LOGIN)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Revenir a la connexion"
      >
        <Text style={styles.link} allowFontScaling minimumFontScale={0.9}>Revenir a la connexion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  illustration: {
    fontSize: 56,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  link: {
    ...typography.label,
    color: colors.primary,
  },
  feedback: {
    ...typography.caption,
    color: colors.text.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
});
