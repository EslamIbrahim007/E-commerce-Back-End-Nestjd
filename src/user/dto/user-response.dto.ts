import { IsString, IsEnum } from 'class-validator';
import { Role } from '../enums/role.enum';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @IsString()
  id: number;

  @Expose()
  @IsString()
  email: string;

  @Expose()
  @IsEnum(Role)
  role: Role;

  // Add other fields as needed, e.g., createdAt, username, etc.
}
