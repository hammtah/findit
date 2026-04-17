import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../shared/Button';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ConversationSummary } from '../../types/api.types';

interface ConversationStatusBannerProps {
  conversation: ConversationSummary;
  isReceiverPending: boolean;
  onRespond: (action: 'accept' | 'refuse') => Promise<void>;
  isSubmitting?: boolean;
}

function getExpiryLabel(expiresAt: string | null): string {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const hours = Math.floor(diff / 3600000);
  return `${hours}h`;
}

export function ConversationStatusBanner({
  conversation,
  isReceiverPending,
  onRespond,
  isSubmitting = false,
}: ConversationStatusBannerProps) {
  if (conversation.statut === 'active') return null;

  if (conversation.statut === 'lecture_seule') {
    return (
      <View style={[styles.container, styles.readOnly]}>
        <Text style={[styles.text, styles.readOnlyText]}>Cette conversation est en lecture seule.</Text>
      </View>
    );
  }

  if (conversation.statut === 'en_attente') {
    return (
      <View style={[styles.container, styles.pending]}>
        <Text style={[styles.text, styles.pendingText]}>
          En attente de réponse{conversation.expires_at ? ` · Expire dans ${getExpiryLabel(conversation.expires_at)}` : ''}
        </Text>

        {isReceiverPending ? (
          <View style={styles.actions}>
            <Button title="Refuser" variant="ghost" disabled={isSubmitting} onPress={() => void onRespond('refuse')} />
            <Button title="Accepter" disabled={isSubmitting} onPress={() => void onRespond('accept')} />
          </View>
        ) : null}

        {isSubmitting ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.readOnly]}>
      <Text style={[styles.text, styles.readOnlyText]}>
        {conversation.statut === 'refusee' ? 'Conversation refusée.' : 'Conversation archivée.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  pending: {
    backgroundColor: '#FEF3C7',
  },
  readOnly: {
    backgroundColor: colors.background.secondary,
  },
  text: {
    ...typography.label,
  },
  pendingText: {
    color: '#92400E',
  },
  readOnlyText: {
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  loader: {
    marginTop: spacing.sm,
  },
});

