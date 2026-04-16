import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReportCategorie, ReportStatut, ReportType } from '../report.entity';

export class ListReportsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  lat?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  manual_address?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50000)
  radius?: number;

  @IsOptional()
  @IsIn(['lost', 'found', 'all'])
  type?: ReportType | 'all';

  @IsOptional()
  @IsEnum(ReportCategorie)
  categorie?: ReportCategorie;

  @IsOptional()
  @IsIn(['today', '7days', '30days', 'all'])
  date_range?: 'today' | '7days' | '30days' | 'all';

  @IsOptional()
  @IsIn(['en_attente', 'resolu', 'rendu', 'all'])
  statut?: ReportStatut | 'all';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
