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
import { ReportCategorie } from '../report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  titre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ReportCategorie)
  categorie?: ReportCategorie;

  @IsOptional()
  @IsDateString()
  date_evenement?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  heure_evenement?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({ require_protocol: true }, { each: true })
  photos?: string[];
}
