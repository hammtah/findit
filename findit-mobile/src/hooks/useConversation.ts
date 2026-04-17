import { useCallback, useEffect, useMemo, useState } from 'react';

import { conversationsApi } from '../api/conversations.api';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import { Message } from '../types/api.types';
import { socketService } from '../services/socket.service';
import { getAccessToken } from '../utils/tokenStorage';

function createTempMessage(conversationId: string, senderId: string, contenu: string, photoUrl?: string | null): Message {
  return {
    id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: conversationId,
    sender_id: senderId,
    contenu,
    photo_url: photoUrl ?? null,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

export function useConversation(conversationId: string) {
  const conversation = useChatStore((s) => s.conversations.find((item) => item.id === conversationId));
  const messages = useChatStore((s) => s.messages[conversationId] ?? []);
  const setConversation = useChatStore((s) => s.setConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [isLoading, setIsLoading] = useState(false);

  const loadConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const [conv, msgs] = await Promise.all([
        conversationsApi.getById(conversationId),
        conversationsApi.getMessages(conversationId),
      ]);

      setConversation(conv);
      setMessages(
        conversationId,
        [...msgs].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, setConversation, setMessages]);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const token = await getAccessToken();
      if (token && !socketService.isConnected) {
        socketService.connect(token);
      }

      if (!mounted) return;

      await loadConversation();
      socketService.joinConversation(conversationId);
      socketService.markRead(conversationId);
    };

    void setup();

    return () => {
      mounted = false;
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId, loadConversation]);

  const canSend = conversation?.statut === 'active';
  const isReceiverPending =
    conversation?.statut === 'en_attente' &&
    !!currentUserId &&
    !!conversation.receiver_id &&
    currentUserId === conversation.receiver_id;

  const sendMessage = useCallback(
    async (contenu: string, photoUrl?: string | null) => {
      if (!currentUserId) return;
      if (!contenu.trim() && !photoUrl) return;

      const tempMessage = createTempMessage(conversationId, currentUserId, contenu.trim(), photoUrl);
      addMessage(tempMessage);
      socketService.sendMessage(conversationId, contenu.trim(), photoUrl ?? undefined);
    },
    [addMessage, conversationId, currentUserId]
  );

  const respond = useCallback(
    async (action: 'accept' | 'refuse') => {
      const updated = await conversationsApi.respond(conversationId, action);
      setConversation(updated);
      updateConversation({
        id: conversationId,
        statut: action === 'accept' ? 'active' : 'refusee',
      });
    },
    [conversationId, setConversation, updateConversation]
  );

  return useMemo(
    () => ({
      conversation,
      messages,
      isLoading,
      canSend,
      isReceiverPending,
      loadConversation,
      sendMessage,
      respond,
    }),
    [canSend, conversation, isLoading, isReceiverPending, loadConversation, messages, respond, sendMessage]
  );
}

