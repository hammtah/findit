import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { uploadApi } from '../../api/upload.api';
import { Avatar } from '../../components/shared/Avatar';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useConversation } from '../../hooks/useConversation';
import { useAuthStore } from '../../store/auth.store';
import { Message } from '../../types/api.types';
import { ConversationStatusBanner } from '../../components/chat/ConversationStatusBanner';
import { MessageBubble } from '../../components/chat/MessageBubble';

type ChatRouteParams = { conversationId: string };
type ChatListItem = { type: 'date'; id: string; label: string } | { type: 'message'; id: string; message: Message };

function formatDateSeparator(dateValue: string): string {
  const date = new Date(dateValue);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((today - target) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function buildChatItems(messages: Message[]): ChatListItem[] {
  const sorted = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const items: ChatListItem[] = [];
  let lastLabel = '';

  for (const message of sorted) {
    const label = formatDateSeparator(message.created_at);
    if (label !== lastLabel) {
      items.push({ type: 'date', id: `date_${message.id}`, label });
      lastLabel = label;
    }

    items.push({ type: 'message', id: message.id, message });
  }

  return items;
}

export function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId } = route.params as ChatRouteParams;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const { conversation, messages, isLoading, canSend, isReceiverPending, sendMessage, respond } =
    useConversation(conversationId);

  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const chatItems = useMemo(() => buildChatItems(messages), [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadApi.uploadImage(result.assets[0].uri);
      await sendMessage('', uploaded.url);
    } catch (error) {
      console.error("Erreur lors de l'upload image", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text;
    setText('');
    await sendMessage(content);
  };

  const handleRespond = async (action: 'accept' | 'refuse') => {
    try {
      setIsResponding(true);
      await respond(action);
    } catch (error) {
      console.error('Erreur réponse conversation', error);
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading && !conversation) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Avatar uri={conversation?.other_user.photo_url} name={conversation?.other_user.nom} size={40} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.other_user.nom ?? 'Conversation'}
          </Text>
        </View>

        <Pressable style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.primary} />
        </Pressable>
      </View>

      {conversation ? (
        <ConversationStatusBanner
          conversation={conversation}
          isReceiverPending={isReceiverPending}
          isSubmitting={isResponding}
          onRespond={handleRespond}
        />
      ) : null}

      <FlatList
        ref={flatListRef}
        data={chatItems}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>{item.label}</Text>
              </View>
            );
          }

          const isMine = item.message.sender_id === currentUserId;
          return <MessageBubble message={item.message} isMine={isMine} />;
        }}
      />

      <View style={styles.inputBar}>
        <Pressable style={styles.iconButton} onPress={() => void handlePickImage()} disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          )}
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.text.muted}
          multiline
          maxLength={500}
          editable={canSend && !isUploading}
        />

        <Pressable
          style={[styles.sendButton, (!text.trim() || !canSend || isUploading) && styles.sendButtonDisabled]}
          onPress={() => void handleSend()}
          disabled={!text.trim() || !canSend || isUploading}
        >
          <Ionicons name="send" size={18} color={colors.text.inverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingVertical: spacing.sm,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
  },
  dateSeparatorText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    ...typography.body,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

