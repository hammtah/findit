import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, WsJwtGuard],
  exports: [TypeOrmModule, AuthService, WsJwtGuard, JwtModule],
})
export class AuthModule {}
