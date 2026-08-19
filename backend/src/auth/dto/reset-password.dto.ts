import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  identifier: string; // email or phone

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
