import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^https:\/\/res\.cloudinary\.com\/.+/i, {
    message: 'photo_url must be a valid Cloudinary URL',
  })
  photo_url?: string;
}
