import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(['male', 'female'])
  @IsOptional()
  gender?: string;
}
