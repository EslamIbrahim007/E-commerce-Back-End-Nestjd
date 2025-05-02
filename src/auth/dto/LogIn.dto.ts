import { IsEmail } from 'class-validator';
import { IsNotEmpty, MinLength, MaxLength, IsString } from 'class-validator';

export class LogInDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at lest 8 characters' })
  @MaxLength(30, { message: 'password is too long :)' })
  password: string;
}
