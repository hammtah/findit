import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { conversationsApi } from '../../api/conversations.api';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { useChatStore } from '../../store/chat.store';
import { ConversationSummary } from '../../types/api.types';
import { ROUTES } from '../../navigation/routes';
import { colors, spacing, typography } from '../../constants/theme';

type HeaderItem = { type: 'header'; title: string };
type ListItem = ConversationSummary | HeaderItem;

export function ConversationsListScreen() {
  const navigation = useNavigation<any>();
  const { conversations, setConversations } = useChatStore();

  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await conversationsApi.getAll();
      setConversations(data);
    } catch (e) {
      console.error('Erreur chargement conversations', e);
    } finally {
      setLoading(false);
    }
  }, [setConversations]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const pending = conversations.filter((c) => c.statut === 'en_attente');
  const active = conversations.filter((c) => c.statut === 'active');
  const others = conversations.filter((c) => !['en_attente', 'active'].includes(c.statut ?? ''));

  const sections: { title: string; data: ConversationSummary[] }[] = [];
  if (pending.length > 0) sections.push({ title: 'En attente de réponse', data: pending });
  if (active.length > 0) sections.push({ title: 'Actives', data: active });
  if (others.length > 0) sections.push({ title: 'Archivées', data: others });

  const flatData: ListItem[] = [];
  for (const section of sections) {
    flatData.push({ type: 'header', title: section.title });
    flatData.push(...section.data);
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if ((item as HeaderItem).type === 'header') {
      const header = item as HeaderItem;
      return <Text style={styles.sectionHeader}>{header.title}</Text>;
    }

    const conversation = item as ConversationSummary;
    return (
      <ConversationItem
        conversation={conversation}
        onPress={() => navigation.navigate(ROUTES.CHAT, { conversationId: conversation.id })}
      />
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, index) => {
          if ((item as HeaderItem).type === 'header') return `header-${index}`;
          return (item as ConversationSummary).id;
        }}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="chatbubble-ellipses-outline" size={34} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>Aucune conversation pour l'instant</Text>
            <Text style={styles.emptySubtext}>
              Vos échanges avec d'autres utilisateurs apparaîtront ici
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIllustration: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});

