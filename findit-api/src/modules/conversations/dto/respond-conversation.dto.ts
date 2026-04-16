import { IsIn } from 'class-validator';

export class RespondConversationDto {
  @IsIn(['accept', 'refuse'])
  action: 'accept' | 'refuse';
}
