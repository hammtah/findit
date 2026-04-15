import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { authApi } from '../../api/auth.api';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';

const schema = z
  .object({
    new_password: z.string().min(8, 'Minimum 8 caracteres'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.RESET_PASSWORD>;
type FormValues = z.infer<typeof schema>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const token = route.params?.token;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setFeedback('Token de reinitialisation manquant.');
      return;
    }
    try {
      setFeedback(null);
      await authApi.resetPassword({
        token,
        new_password: values.new_password,
      });
      navigation.navigate(ROUTES.LOGIN);
    } catch {
      setFeedback('Impossible de reinitialiser le mot de passe.');
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reinitialiser le mot de passe</Text>
      <Text style={styles.caption}>Choisissez un nouveau mot de passe securise.</Text>

      <Controller
        control={control}
        name="new_password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nouveau mot de passe"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoComplete="password-new"
            error={errors.new_password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirm_password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirmer le mot de passe"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoComplete="password-new"
            error={errors.confirm_password?.message}
          />
        )}
      />

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Button title="Valider" onPress={onSubmit} disabled={isSubmitting || !token} />
      <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
        <Text style={styles.link}>Retour a la connexion</Text>
      </Pressable>

      {isSubmitting ? <LoadingOverlay /> : null}
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
