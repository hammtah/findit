import { IsEnum } from 'class-validator';
import { ReportStatut } from '../report.entity';

export class UpdateReportStatusDto {
  @IsEnum({ resolu: ReportStatut.RESOLU, rendu: ReportStatut.RENDU })
  statut: ReportStatut.RESOLU | ReportStatut.RENDU;
}
