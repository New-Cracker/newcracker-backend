import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category } from 'src/news/entities/enum/category.enum';

export class UpdateUserRequestDto {
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 빈 값일 수 없습니다.' })
  email?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: '이름은 빈 값일 수 없습니다.' })
  username?: string;

  @IsEnum(Category, { message: '유효하지 않은 category 값입니다' })
  @IsOptional()
  category?: Category;
}
