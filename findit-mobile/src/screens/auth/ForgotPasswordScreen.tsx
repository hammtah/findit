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

const schema = z.object({
  email: z.email('Email invalide'),
});

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.FORGOT_PASSWORD>;
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await authApi.forgotPassword(values.email);
    setConfirmation('Si cet email existe, vous recevrez un lien de reinitialisation.');
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublie</Text>
      <Text style={styles.caption}>Entrez votre email pour recevoir un lien de reinitialisation.</Text>

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
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email?.message}
          />
        )}
      />

      {confirmation ? <Text style={styles.confirmation}>{confirmation}</Text> : null}
      <Button title="Envoyer le lien" onPress={onSubmit} disabled={isSubmitting} />
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
  confirmation: {
    ...typography.caption,
    color: colors.text.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
});
