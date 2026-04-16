import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { MyHistoryQueryDto } from './dto/my-history-query.dto';

interface JwtRequest extends Request {
  user: User;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: JwtRequest) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Req() req: JwtRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Patch('me/push-token')
  updatePushToken(@Req() req: JwtRequest, @Body() dto: UpdatePushTokenDto) {
    return this.usersService.updatePushToken(req.user.id, dto);
  }

  @Delete('me')
  deleteMe(@Req() req: JwtRequest) {
    return this.usersService.deleteMe(req.user.id);
  }

  @Get('me/history')
  getMyHistory(@Req() req: JwtRequest, @Query() query: MyHistoryQueryDto) {
    return this.usersService.getMyHistory(req.user.id, query);
  }

  @Get(':id/public')
  getPublicProfile(@Req() req: JwtRequest, @Param('id') userId: string) {
    return this.usersService.getPublicProfile(req.user.id, userId);
  }
}
