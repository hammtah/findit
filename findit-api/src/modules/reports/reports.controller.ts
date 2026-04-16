import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

interface JwtRequest extends Request {
  user: User;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Req() req: JwtRequest, @Body() dto: CreateReportDto) {
    return this.reportsService.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: JwtRequest, @Query() query: ListReportsQueryDto) {
    return this.reportsService.list(req.user.id, query);
  }

  @Get(':id')
  detail(@Req() req: JwtRequest, @Param('id') reportId: string) {
    return this.reportsService.detail(req.user.id, reportId);
  }

  @Patch(':id')
  update(
    @Req() req: JwtRequest,
    @Param('id') reportId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.update(req.user.id, reportId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: JwtRequest,
    @Param('id') reportId: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(req.user.id, reportId, dto);
  }

  @Delete(':id')
  remove(@Req() req: JwtRequest, @Param('id') reportId: string) {
    return this.reportsService.remove(req.user.id, reportId);
  }
}
