import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { authApi } from '../../api/auth.api';
import { OAuthButton } from '../../components/auth/OAuthButton';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.LOGIN>;
type ApiErrorPayload = { code?: string; message?: string };

function GoogleOAuthButton({
  onAuthStart,
  onAuthEnd,
  onAuthError,
}: {
  onAuthStart: () => void;
  onAuthEnd: () => void;
  onAuthError: (message: string) => void;
}) {
  const login = useAuthStore((state) => state.login);
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    async function handleGoogleResponse() {
      if (googleResponse?.type !== 'success') return;
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      try {
        onAuthStart();
        const payload = await authApi.googleCallback({ id_token: idToken });
        await login(payload);
      } catch {
        onAuthError('Connexion Google impossible pour le moment.');
      } finally {
        onAuthEnd();
      }
    }

    void handleGoogleResponse();
  }, [googleResponse, login, onAuthStart, onAuthEnd, onAuthError]);

  return (
    <OAuthButton
      provider="google"
      onPress={async () => {
        if (!googleRequest) return;
        await promptGoogleSignIn();
      }}
    />
  );
}

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const isGoogleConfigured = Platform.select({
    android: Boolean(googleAndroidClientId),
    ios: Boolean(googleIosClientId),
    default: Boolean(googleWebClientId),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      const response = await authApi.login(values);
      await login(response);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const status = axiosError.response?.status;
      const code = axiosError.response?.data?.code;

      if (status === 403 && code === 'ACCOUNT_SUSPENDED') {
        setSubmitError('Votre compte est suspendu. Contactez le support.');
        return;
      }
      if (status === 401 && code === 'INVALID_CREDENTIALS') {
        setSubmitError('Email ou mot de passe incorrect.');
        return;
      }
      setSubmitError('Impossible de se connecter pour le moment.');
    }
  });

  const handleApplePress = async () => {
    try {
      setIsOAuthLoading(true);
      setSubmitError(null);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      });
      if (!credential.identityToken) {
        setSubmitError('Token Apple indisponible.');
        return;
      }
      const payload = await authApi.appleCallback({ id_token: credential.identityToken });
      await login(payload);
    } catch {
      setSubmitError('Connexion Apple annulee ou indisponible.');
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const isBusy = isSubmitting || isOAuthLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo} allowFontScaling minimumFontScale={0.9}>FindIt</Text>
        <Text style={styles.tagline} allowFontScaling minimumFontScale={0.9}>Retrouvez ce qui compte, autour de vous.</Text>
      </View>

      <View style={styles.form}>
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
              autoComplete="password"
              error={errors.password?.message}
            />
          )}
        />

        {submitError ? <Text style={styles.errorText} allowFontScaling minimumFontScale={0.9}>{submitError}</Text> : null}
        <Button
          title="Se connecter"
          onPress={onSubmit}
          disabled={isBusy}
          accessibilityHint="Soumettre le formulaire de connexion"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.separator} allowFontScaling minimumFontScale={0.9}>ou</Text>
        {isGoogleConfigured ? (
          <GoogleOAuthButton
            onAuthStart={() => {
              setSubmitError(null);
              setIsOAuthLoading(true);
            }}
            onAuthEnd={() => setIsOAuthLoading(false)}
            onAuthError={(message) => setSubmitError(message)}
          />
        ) : (
          <OAuthButton
            provider="google"
            disabled
            onPress={() => setSubmitError('Connexion Google indisponible: client ID manquant.')}
          />
        )}
        {Platform.OS === 'ios' ? <OAuthButton provider="apple" onPress={handleApplePress} /> : null}
        <Pressable
          onPress={() => navigation.navigate(ROUTES.REGISTER)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aller a l'inscription"
        >
          <Text style={styles.link} allowFontScaling minimumFontScale={0.9}>Pas de compte ? Creer un compte</Text>
        </Pressable>
      </View>

      {isBusy ? <LoadingOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  logo: {
    ...typography.h1,
    color: colors.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.md,
  },
  separator: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
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
