import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RespondConversationDto } from './dto/respond-conversation.dto';
import { ConversationsService } from './conversations.service';
import { MessagesService } from '../messages/messages.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';

interface JwtRequest extends Request {
  user: User;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(req.user.id, dto);
  }

  @Patch(':id/respond')
  respond(
    @Req() req: JwtRequest,
    @Param('id') conversationId: string,
    @Body() dto: RespondConversationDto,
  ) {
    return this.conversationsService.respond(req.user.id, conversationId, dto);
  }

  @Get()
  list(@Req() req: JwtRequest) {
    return this.conversationsService.listForUser(req.user.id);
  }

  @Get(':id')
  detail(@Req() req: JwtRequest, @Param('id') conversationId: string) {
    return this.conversationsService.detailForUser(req.user.id, conversationId);
  }

  @Post(':id/messages')
  sendMessage(
    @Req() req: JwtRequest,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(req.user.id, conversationId, dto);
  }

  @Patch(':id/messages/read')
  markRead(@Req() req: JwtRequest, @Param('id') conversationId: string) {
    return this.messagesService.markConversationRead(conversationId, req.user.id);
  }
}
