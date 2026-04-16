import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './conversation.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { Message } from '../messages/message.entity';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from '../auth/auth.module';
import { MessageGateway } from '../messages/message.gateway';

@Module({
  imports: [
    AuthModule,
    MessagesModule,
    TypeOrmModule.forFeature([Conversation, Report, User, Message]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, MessageGateway],
  exports: [TypeOrmModule, ConversationsService],
})
export class ConversationsModule {}
