import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AppleCallbackDto } from './dto/apple-callback.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';

interface JwtRequest extends Request {
  user: User;
}

interface GoogleCallbackRequest extends Request {
  user: { redirectUrl: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: JwtRequest, @Body() dto: RefreshDto) {
    return this.authService.logout(req.user.id, dto);
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  googleAuth() {
    return;
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: GoogleCallbackRequest, @Res() res: Response) {
    return res.redirect(req.user.redirectUrl);
  }

  @Post('apple/callback')
  appleCallback(@Body() dto: AppleCallbackDto) {
    return this.authService.appleCallback(dto);
  }
}
