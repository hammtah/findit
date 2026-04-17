import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/shared/Button';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.FORGOT_PASSWORD>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const onSubmit = () => {
    setConfirmation('La reinitialisation par email est desactivee sur cette version.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling minimumFontScale={0.9}>Mot de passe oublie</Text>
      <Text style={styles.caption} allowFontScaling minimumFontScale={0.9}>La reinitialisation de mot de passe par email n'est pas disponible.</Text>

      {confirmation ? <Text style={styles.confirmation} allowFontScaling minimumFontScale={0.9}>{confirmation}</Text> : null}
      <Button title="Compris" onPress={onSubmit} />
      <Pressable
        onPress={() => navigation.navigate(ROUTES.LOGIN)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Retour a la connexion"
      >
        <Text style={styles.link} allowFontScaling minimumFontScale={0.9}>Retour a la connexion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  caption: {
    ...typography.body,
    color: colors.text.secondary,
  },
  link: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'center',
  },
  confirmation: {
    ...typography.caption,
    color: colors.text.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
});
