import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  Conversation,
  ConversationStatut,
} from '../conversations/conversation.entity';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(
    senderId: string,
    conversationId: string,
    dto: SendMessageDto,
    options?: { notifyRecipient?: boolean },
  ) {
    const conversation = await this.getConversationForMember(
      conversationId,
      senderId,
    );

    if (conversation.statut !== ConversationStatut.ACTIVE) {
      throw new ForbiddenException({ code: 'CONVERSATION_READONLY' });
    }

    const messageToCreate = this.messagesRepository.create();
    messageToCreate.conversation_id = conversation.id;
    messageToCreate.sender_id = senderId;
    messageToCreate.contenu = dto.contenu;
    messageToCreate.photo_url = dto.photo_url ?? null;
    messageToCreate.is_read = false;

    const message = await this.messagesRepository.save(messageToCreate);

    const recipientId =
      conversation.initiator_id === senderId
        ? conversation.receiver_id
        : conversation.initiator_id;

    if (options?.notifyRecipient ?? true) {
      this.eventEmitter.emit('notification.push', {
        userId: recipientId,
        title: 'Nouveau message',
        body: dto.contenu.slice(0, 120),
        data: { conversation_id: conversation.id, message_id: message.id },
      });
    }

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      contenu: message.contenu,
      photo_url: message.photo_url,
      is_read: message.is_read,
      created_at: message.created_at,
    };
  }

  async notifyRecipientForConversation(
    senderId: string,
    conversationId: string,
    preview: string,
  ): Promise<void> {
    const conversation = await this.getConversationForMember(
      conversationId,
      senderId,
    );

    const recipientId =
      conversation.initiator_id === senderId
        ? conversation.receiver_id
        : conversation.initiator_id;

    this.eventEmitter.emit('notification.push', {
      userId: recipientId,
      title: 'Nouveau message',
      body: preview.slice(0, 120),
      data: { conversation_id: conversation.id },
    });
  }

  async markConversationRead(conversationId: string, userId: string) {
    await this.getConversationForMember(conversationId, userId);

    await this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();

    return { message: 'Messages marked as read' };
  }

  async getConversationForMember(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['reportLost', 'reportFound'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isMember =
      conversation.initiator_id === userId || conversation.receiver_id === userId;

    if (!isMember) {
      throw new ForbiddenException();
    }

    return conversation;
  }
}
