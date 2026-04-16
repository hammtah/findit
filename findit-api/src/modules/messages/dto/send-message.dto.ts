import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MaxLength(500)
  contenu: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  photo_url?: string;
}
