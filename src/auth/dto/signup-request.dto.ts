import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Category } from 'src/news/entities/enum/category.enum';

export class SignupRequestDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력하세요.' })
  email: string;

  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력하세요.' })
  password: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: '이름은 빈 값일 수 없습니다.' })
  username?: string | null;

  @IsEnum(Category, { message: '유효하지 않은 category 값입니다' })
  @IsOptional()
  category?: Category | null;
}
