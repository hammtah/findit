import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { authApi } from '../../api/auth.api';
import { Button } from '../../components/shared/Button';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.VERIFY_EMAIL>;

export function VerifyEmailScreen({ navigation, route }: Props) {
  const email = route.params?.email;
  const [countdown, setCountdown] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    try {
      setIsSending(true);
      setFeedback(null);
      await authApi.resendVerificationEmail(email);
      setCountdown(60);
      setFeedback(`Email de verification renvoye a ${email}.`);
    } catch {
      setFeedback("Impossible d'envoyer un nouvel email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.illustration}>📨</Text>
      <Text style={styles.title}>Verifiez votre email</Text>
      <Text style={styles.description}>
        Un lien de verification a ete envoye {email ? `a ${email}` : 'a votre adresse email'}. Ouvrez-le pour activer votre compte.
      </Text>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Button
        title={countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer l'email"}
        onPress={handleResend}
        disabled={countdown > 0 || isSending || !email}
      />
      <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
        <Text style={styles.link}>Revenir a la connexion</Text>
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
