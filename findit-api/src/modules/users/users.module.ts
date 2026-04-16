import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Review } from '../reviews/review.entity';
import { Report } from '../reports/report.entity';
import { RefreshToken } from '../auth/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Review, Report, RefreshToken])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
