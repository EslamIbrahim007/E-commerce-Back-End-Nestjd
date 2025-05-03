/* eslint-disable prettier/prettier */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'name must be at lest 3 characters' })
  @MaxLength(20, { message: 'name is too long :)' })
  name: string;

  @IsEmail({}, { message: 'Email must be valid' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at lest 8 characters' })
  @MaxLength(30, { message: 'password is too long :)' })
  password: string;
}
