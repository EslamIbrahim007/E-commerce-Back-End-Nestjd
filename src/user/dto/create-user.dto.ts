import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'password must be at lest 8 characters' })
  @MaxLength(20, { message: 'password is too long :)' })
  name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at lest 8 characters' })
  @MaxLength(30, { message: 'password is too long :)' })
  password: string;

  @IsString()
  @IsEnum(['admin', 'user'])
  @IsOptional()
  role: string;

  @IsOptional()
  avatar: string;

  @IsNumber({}, { message: 'age must be a number' })
  @IsOptional()
  age: number;

  @IsOptional()
  @IsPhoneNumber('EG', { message: 'phoneNumber must be a number and vaild' })
  phoneNumber: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  address: string;

  @IsBoolean({ message: 'active must be true or false' })
  @IsEnum([true, false])
  @IsOptional()
  active: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(['male', 'female'])
  gender: string;
}
