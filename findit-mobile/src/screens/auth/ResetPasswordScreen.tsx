import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/shared/Button';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.REGISTER>;

export function ResetPasswordScreen({ navigation }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const onSubmit = () => {
    setFeedback('La reinitialisation de mot de passe par email est desactivee sur cette version.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reinitialiser le mot de passe</Text>
      <Text style={styles.caption}>Cette action n'est pas disponible dans ce flow d'authentification.</Text>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Button title="Compris" onPress={onSubmit} />
      <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
        <Text style={styles.link}>Retour a la connexion</Text>
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
  feedback: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
});
