// news/dto/save-news-request.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Category } from '../entities/enum/category.enum';

export class NewsDetailRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(Category)
  category!: Category;

  @IsString()
  @IsNotEmpty()
  thumbnailUrl!: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsDateString()
  publicationDate!: Date;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsNotEmpty()
  link!: string;
}
