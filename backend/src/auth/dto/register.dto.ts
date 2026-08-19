import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @Matches(/^0[0-9]{8,9}$/, {
    message: 'phone must be a valid Thai phone number (e.g. 0812345678)',
  })
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
