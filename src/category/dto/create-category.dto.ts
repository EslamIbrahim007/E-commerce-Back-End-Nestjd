import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(3, { message: 'Category name must be at least 3 characters' })
  @MaxLength(50, { message: 'Category name cannot exceed 50 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Image URL is required' })
  @IsUrl({}, { message: 'Please provide a valid image URL' })
  image: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentId?: number;
}
