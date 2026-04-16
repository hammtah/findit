import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import { ReportCategorie, ReportType } from '../report.entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @MaxLength(80)
  titre: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsEnum(ReportCategorie)
  categorie: ReportCategorie;

  @IsDateString()
  date_evenement: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  heure_evenement?: string;

  @IsString()
  adresse: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl(
    { require_protocol: true },
    { each: true, message: 'Each photo must be a valid URL' },
  )
  photos?: string[];
}
