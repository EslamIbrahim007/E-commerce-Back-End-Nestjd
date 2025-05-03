import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at lest 8 characters' })
  @MaxLength(30, { message: 'password is too long :)' })
  password: string;
}
