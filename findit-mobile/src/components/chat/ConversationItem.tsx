import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '../shared/Avatar';
import { ConversationSummary } from '../../types/api.types';

interface Props {
  conversation: ConversationSummary;
  onPress: () => void;
}

function getCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function ConversationItem({ conversation, onPress }: Props) {
  const [countdown, setCountdown] = useState('');

  const statut = conversation.statut;
  const isClickable = useMemo(() => statut !== 'refusee', [statut]);

  useEffect(() => {
    if (statut !== 'en_attente' || !conversation.expires_at) return;

    const update = () => setCountdown(getCountdown(String(conversation.expires_at)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [conversation.expires_at, statut]);

  const isExpiringSoon =
    conversation.expires_at &&
    new Date(conversation.expires_at).getTime() - Date.now() < 2 * 3600 * 1000;

  const renderStatus = () => {
    switch (statut) {
      case 'en_attente':
        return (
          <Text style={[styles.status, isExpiringSoon && styles.statusUrgent]}>
            En attente de réponse · {countdown}
          </Text>
        );
      case 'refusee':
        return <Text style={styles.statusMuted}>Refusée</Text>;
      case 'archivee':
        return <Text style={styles.statusMuted}>Archivée</Text>;
      case 'lecture_seule':
        return <Text style={styles.statusMuted}>Terminée</Text>;
      default:
        return null;
    }
  };

  const lastMessage = conversation.last_message ?? null;
  const avatarName = conversation.other_user?.nom ?? '';
  const avatarUri = conversation.other_user?.photo_url ?? null;
  const reportTitle = conversation.report_lost?.titre ?? '';

  return (
    <TouchableOpacity
      style={[styles.container, !isClickable && styles.disabled]}
      onPress={isClickable ? onPress : undefined}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUri} name={avatarName} size={48} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {avatarName}
          </Text>

          {lastMessage?.created_at && (
            <Text style={styles.date}>
              {new Date(lastMessage.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
          )}
        </View>

        <Text style={styles.reportTitle} numberOfLines={1}>
          {reportTitle}
        </Text>

        <View style={styles.bottomRow}>
          {lastMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.contenu}
            </Text>
          ) : (
            renderStatus()
          )}

          {typeof conversation.unread_count === 'number' && conversation.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>

        {statut === 'en_attente' && lastMessage ? renderStatus() : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  avatarContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  reportTitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  bottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 13,
    color: '#888',
    flex: 1,
    marginRight: 10,
  },
  status: {
    fontSize: 12,
    color: '#185FA5',
    fontWeight: '500',
    marginTop: 6,
  },
  statusUrgent: {
    color: '#E07B00',
  },
  statusMuted: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#185FA5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});

