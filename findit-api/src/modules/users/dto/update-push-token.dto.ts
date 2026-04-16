import { IsOptional, IsString } from 'class-validator';

export class UpdatePushTokenDto {
  @IsOptional()
  @IsString()
  push_token?: string | null;
}
