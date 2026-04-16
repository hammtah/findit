import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, Repository } from 'typeorm';
import {
  Conversation,
  ConversationStatut,
} from './conversation.entity';
import { Report, ReportType } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Message } from '../messages/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RespondConversationDto } from './dto/respond-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    const [lostReport, foundReport] = await Promise.all([
      this.reportsRepository.findOne({ where: { id: dto.report_lost_id } }),
      this.reportsRepository.findOne({ where: { id: dto.report_found_id } }),
    ]);

    if (!lostReport || !foundReport) {
      throw new NotFoundException('Report not found');
    }

    if (!lostReport.is_visible || !foundReport.is_visible) {
      throw new BadRequestException('Reports must be visible');
    }

    if (lostReport.type !== ReportType.LOST || foundReport.type !== ReportType.FOUND) {
      throw new BadRequestException('Invalid report types for conversation');
    }

    if (lostReport.user_id === foundReport.user_id) {
      throw new BadRequestException({ code: 'CANNOT_CONTACT_YOURSELF' });
    }

    const existing = await this.conversationsRepository.findOne({
      where: {
        report_lost_id: dto.report_lost_id,
        report_found_id: dto.report_found_id,
      },
    });
    if (existing) {
      throw new ConflictException({ code: 'CONVERSATION_ALREADY_EXISTS' });
    }

    const initiatorOwnsLost = lostReport.user_id === userId;
    const initiatorOwnsFound = foundReport.user_id === userId;
    if (!initiatorOwnsLost && !initiatorOwnsFound) {
      throw new ForbiddenException('You must own one of the reports');
    }

    const receiverId = initiatorOwnsLost ? foundReport.user_id : lostReport.user_id;

    const conversationToCreate = this.conversationsRepository.create();
    conversationToCreate.report_lost_id = dto.report_lost_id;
    conversationToCreate.report_found_id = dto.report_found_id;
    conversationToCreate.initiator_id = userId;
    conversationToCreate.receiver_id = receiverId;
    conversationToCreate.statut = ConversationStatut.EN_ATTENTE;
    conversationToCreate.expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const conversation = await this.conversationsRepository.save(conversationToCreate);

    this.eventEmitter.emit('notification.push', {
      userId: receiverId,
      title: 'Nouvelle demande de conversation',
      body: 'Vous avez reçu une nouvelle demande de contact.',
      data: { conversation_id: conversation.id },
    });

    const complete = await this.conversationsRepository.findOneOrFail({
      where: { id: conversation.id },
      relations: ['reportLost', 'reportFound'],
    });

    return this.serializeConversationBasic(complete);
  }

  async respond(userId: string, conversationId: string, dto: RespondConversationDto) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['reportLost', 'reportFound'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.receiver_id !== userId) {
      throw new ForbiddenException();
    }

    if (conversation.statut !== ConversationStatut.EN_ATTENTE) {
      throw new BadRequestException({ code: 'CONVERSATION_NOT_PENDING' });
    }

    if (conversation.expires_at && conversation.expires_at <= new Date()) {
      throw new BadRequestException({ code: 'CONVERSATION_EXPIRED' });
    }

    if (dto.action === 'accept') {
      conversation.statut = ConversationStatut.ACTIVE;
      this.eventEmitter.emit('notification.push', {
        userId: conversation.initiator_id,
        title: 'Conversation acceptée',
        body: 'Votre demande de contact a été acceptée.',
        data: { conversation_id: conversation.id },
      });
    } else {
      conversation.statut = ConversationStatut.REFUSEE;
    }

    await this.conversationsRepository.save(conversation);

    const payload = this.serializeConversationBasic(conversation);
    this.eventEmitter.emit('conversation.updated', {
      conversation_id: conversation.id,
      conversation: payload,
    });

    return payload;
  }

  async listForUser(userId: string) {
    const conversations = await this.conversationsRepository.find({
      where: [{ initiator_id: userId }, { receiver_id: userId }],
      relations: ['reportLost', 'reportFound'],
      order: { updated_at: 'DESC' },
    });

    const otherUserIds = Array.from(
      new Set(
        conversations.map((conversation) =>
          conversation.initiator_id === userId
            ? conversation.receiver_id
            : conversation.initiator_id,
        ),
      ),
    );

    const users = otherUserIds.length
      ? await this.usersRepository.find({
          where: { id: In(otherUserIds) },
        })
      : [];
    const usersMap = new Map(users.map((user) => [user.id, user]));

    const conversationIds = conversations.map((conversation) => conversation.id);
    const lastMessages = conversationIds.length
      ? await this.messagesRepository.query(
          `SELECT DISTINCT ON (m.conversation_id)
             m.conversation_id,
             m.contenu,
             m.created_at,
             m.is_read
           FROM messages m
           WHERE m.conversation_id = ANY($1::uuid[])
           ORDER BY m.conversation_id, m.created_at DESC`,
          [conversationIds],
        )
      : [];

    const unreadRows = conversationIds.length
      ? await this.messagesRepository
          .createQueryBuilder('m')
          .select('m.conversation_id', 'conversation_id')
          .addSelect('COUNT(m.id)', 'count')
          .where('m.conversation_id IN (:...conversationIds)', { conversationIds })
          .andWhere('m.sender_id != :userId', { userId })
          .andWhere('m.is_read = false')
          .groupBy('m.conversation_id')
          .getRawMany<{ conversation_id: string; count: string }>()
      : [];

    const lastMessageMap = new Map(
      (Array.isArray(lastMessages)
        ? (lastMessages as Array<{
            conversation_id: string;
            contenu: string;
            created_at: string;
            is_read: boolean;
          }>)
        : []
      ).map((row) => [row.conversation_id, row]),
    );

    const unreadMap = new Map(
      unreadRows.map((row) => [row.conversation_id, Number.parseInt(row.count, 10)]),
    );

    return {
      data: conversations.map((conversation) => {
        const otherUserId =
          conversation.initiator_id === userId
            ? conversation.receiver_id
            : conversation.initiator_id;
        const otherUser = usersMap.get(otherUserId);
        const lastMessage = lastMessageMap.get(conversation.id);

        return {
          id: conversation.id,
          statut: conversation.statut,
          report_lost: {
            id: conversation.reportLost.id,
            titre: conversation.reportLost.titre,
          },
          report_found: {
            id: conversation.reportFound.id,
            titre: conversation.reportFound.titre,
          },
          other_user: {
            id: otherUserId,
            nom: otherUser?.nom ?? 'Utilisateur',
            photo_url: otherUser?.photo_url ?? null,
          },
          last_message: lastMessage
            ? {
                contenu: lastMessage.contenu,
                created_at: lastMessage.created_at,
                is_read: lastMessage.is_read,
              }
            : null,
          unread_count: unreadMap.get(conversation.id) ?? 0,
          expires_at: conversation.expires_at,
        };
      }),
    };
  }

  async detailForUser(userId: string, conversationId: string) {
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

    const messages = await this.messagesRepository.find({
      where: { conversation_id: conversation.id },
      order: { created_at: 'DESC' },
      take: 50,
    });

    return {
      conversation: this.serializeConversationBasic(conversation),
      messages: messages.map((message) => ({
        id: message.id,
        sender_id: message.sender_id,
        contenu: message.contenu,
        photo_url: message.photo_url,
        is_read: message.is_read,
        created_at: message.created_at,
      })),
    };
  }

  private serializeConversationBasic(conversation: Conversation) {
    return {
      id: conversation.id,
      statut: conversation.statut,
      report_lost: {
        id: conversation.report_lost_id,
        titre: conversation.reportLost?.titre,
      },
      report_found: {
        id: conversation.report_found_id,
        titre: conversation.reportFound?.titre,
      },
      initiator_id: conversation.initiator_id,
      receiver_id: conversation.receiver_id,
      expires_at: conversation.expires_at,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    };
  }
}
