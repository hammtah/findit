import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
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
    nom: z.string().min(2, 'Minimum 2 caracteres').max(100),
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caracteres'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.REGISTER>;
type FormValues = z.infer<typeof schema>;
type ApiErrorPayload = { code?: string; message?: string };

export function RegisterScreen({ navigation }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await authApi.register({
        nom: values.nom,
        email: values.email,
        password: values.password,
      });
      navigation.navigate(ROUTES.LOGIN);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      if (axiosError.response?.status === 409 && axiosError.response.data?.code === 'EMAIL_ALREADY_EXISTS') {
        setSubmitError('Cet email est deja utilise.');
        return;
      }
      if (axiosError.code === 'ECONNABORTED' || axiosError.message === 'Network Error') {
        setSubmitError("Connexion au serveur impossible. Verifie l'URL API et que le backend est demarre.");
        return;
      }
      setSubmitError('Impossible de creer votre compte.');
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling minimumFontScale={0.9}>Inscription</Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="nom"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nom complet" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nom?.message} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="password-new"
              error={errors.password?.message}
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

        {submitError ? <Text style={styles.errorText} allowFontScaling minimumFontScale={0.9}>{submitError}</Text> : null}
        <Button
          title="Creer mon compte"
          onPress={onSubmit}
          disabled={isSubmitting}
          accessibilityHint="Soumettre le formulaire d'inscription"
        />
        <Pressable
          onPress={() => navigation.navigate(ROUTES.LOGIN)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Retour a la connexion"
        >
          <Text style={styles.link} allowFontScaling minimumFontScale={0.9}>J'ai deja un compte</Text>
        </Pressable>
      </View>
      {isSubmitting ? <LoadingOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  form: {
    gap: spacing.md,
  },
  link: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
});
