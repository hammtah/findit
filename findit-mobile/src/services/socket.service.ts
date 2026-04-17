import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  public isConnected = false;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket?.connected) return;

    if (this.socket) {
      this.socket.disconnect();
    }

  this.socket = io(`${API_BASE_URL}/chat`, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: { token },
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket connected');
      // Enregistrer les listeners après la connexion
      this.registerEventListeners();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket disconnected');
    });
  }

  private registerEventListeners(): void {
    if (!this.socket) return;

    // Supprimer les anciens listeners pour éviter les doublons
    this.socket.off('new_message');
    this.socket.off('message_read');
    this.socket.off('conversation_updated');
    this.socket.off('error');

    const chatStore = useChatStore.getState();

    this.socket.on('new_message', (message) => {
      chatStore.addMessage(message);
    });

    this.socket.on('message_read', (data: { conversationId: string; readerId: string }) => {
      chatStore.markConversationRead(data.conversationId, data.readerId);
    });

    this.socket.on('conversation_updated', (conversation) => {
      chatStore.updateConversation(conversation);
    });

this.socket.on('error', async (error: { code: string; message: string }) => {
  if (error?.code === 'UNAUTHORIZED') {
    try {
      const authStore = useAuthStore.getState();
      await authStore.loadFromStorage();

      const { getAccessToken } = await import('../utils/tokenStorage');
      const newToken = await getAccessToken();

      if (newToken) {
        this.disconnect();
        this.connect(newToken);
      } else {
        await authStore.logout(true);
      }
    } catch (e) {
      console.error('Refresh échoué, déconnexion', e);
      await useAuthStore.getState().logout(true);
    }
  } else {
    console.error('Socket error:', error);
  }
});
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  public leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  public sendMessage(conversationId: string, contenu: string, photoUrl?: string): void {
    this.socket?.emit('send_message', { conversationId, contenu, photoUrl });
  }

  public markRead(conversationId: string): void {
    this.socket?.emit('mark_read', { conversationId });
  }
}

export const socketService = SocketService.getInstance();

export default SocketService.getInstance();