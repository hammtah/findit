import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  report_lost_id: string;

  @IsUUID()
  report_found_id: string;
}
