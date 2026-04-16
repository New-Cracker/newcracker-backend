import { IsEnum, IsOptional } from 'class-validator';
import { Category } from '../entities/enum/category.enum';

export class NewsTrendQueryDto {
  @IsEnum(Category)
  @IsOptional()
  category?: Category;
}
