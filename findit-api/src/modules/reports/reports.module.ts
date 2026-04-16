import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { User } from '../users/user.entity';
import { Match } from '../matching/match.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Review } from '../reviews/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, Match, Conversation, Review]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [TypeOrmModule, ReportsService],
})
export class ReportsModule {}
