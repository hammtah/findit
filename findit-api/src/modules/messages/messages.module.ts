import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';
import { Conversation } from '../conversations/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Conversation])],
  providers: [MessagesService],
  exports: [TypeOrmModule, MessagesService],
})
export class MessagesModule {}
