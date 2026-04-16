import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { User } from '../users/user.entity';

interface SocketWithUser extends Socket {
  data: Socket['data'] & { user?: User };
}

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class MessageGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: SocketWithUser) {
    if (!client.data.user) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversation_id: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId || !payload?.conversation_id) {
        this.emitError(client, 'INVALID_PAYLOAD', 'Payload invalide');
        return;
      }

      await this.messagesService.getConversationForMember(
        payload.conversation_id,
        userId,
      );
      await client.join(payload.conversation_id);
    } catch {
      this.emitError(
        client,
        'FORBIDDEN_CONVERSATION_ACCESS',
        'Accès à la conversation refusé',
      );
    }
  }

  @SubscribeMessage('leave_conversation')
  async leaveConversation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversation_id: string },
  ) {
    if (!payload?.conversation_id) {
      this.emitError(client, 'INVALID_PAYLOAD', 'Payload invalide');
      return;
    }
    await client.leave(payload.conversation_id);
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody()
    payload: {
      conversation_id: string;
      contenu: string;
      photo_url?: string;
    },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId || !payload?.conversation_id || !payload?.contenu) {
        this.emitError(client, 'INVALID_PAYLOAD', 'Payload invalide');
        return;
      }

      const dto: SendMessageDto = {
        contenu: payload.contenu,
        photo_url: payload.photo_url,
      };

      const message = await this.messagesService.sendMessage(
        userId,
        payload.conversation_id,
        dto,
        { notifyRecipient: false },
      );

      this.server
        .to(payload.conversation_id)
        .emit('new_message', { message });

      const sockets = await this.server
        .in(payload.conversation_id)
        .fetchSockets();
      const hasOtherUserOnline = sockets.some(
        (socket) => socket.data.user?.id && socket.data.user.id !== userId,
      );

      if (!hasOtherUserOnline) {
        await this.messagesService.notifyRecipientForConversation(
          userId,
          payload.conversation_id,
          payload.contenu,
        );
      }
    } catch {
      this.emitError(client, 'MESSAGE_SEND_FAILED', 'Envoi du message impossible');
    }
  }

  @SubscribeMessage('mark_read')
  async markRead(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { conversation_id: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId || !payload?.conversation_id) {
        this.emitError(client, 'INVALID_PAYLOAD', 'Payload invalide');
        return;
      }

      await this.messagesService.markConversationRead(payload.conversation_id, userId);
      this.server.to(payload.conversation_id).emit('message_read', {
        conversation_id: payload.conversation_id,
        reader_id: userId,
      });
    } catch {
      this.emitError(client, 'MARK_READ_FAILED', 'Impossible de marquer comme lu');
    }
  }

  @OnEvent('conversation.updated')
  handleConversationUpdated(payload: {
    conversation_id: string;
    conversation: unknown;
  }) {
    this.server
      .to(payload.conversation_id)
      .emit('conversation_updated', { conversation: payload.conversation });
  }

  private emitError(client: SocketWithUser, code: string, message: string) {
    client.emit('error', { code, message });
  }
}
